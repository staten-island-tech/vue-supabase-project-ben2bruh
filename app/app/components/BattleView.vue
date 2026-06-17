<template>
  <div class="battle-modal">
    <div class="floor-header">Floor {{ displayFloor }}</div>

    <Transition name="reward-pop">
      <div v-if="rewardNotice" class="reward-popup">
        Found {{ rewardNotice.item_name }} x{{ rewardNotice.quantity }}
      </div>
    </Transition>

    <div class="battle-field">
      <div v-if="activeEnemy" class="battle-platform enemy-platform"></div>

      <section v-if="activeEnemy" class="pokemon-card enemy-card">
        <div class="pokemon-meta">
          <span>{{ activeEnemy.name }}</span>
          <span>Lv {{ activeEnemy.level }}</span>
        </div>
        <div class="hp-bar">
          <div
            class="hp-fill enemy-fill"
            :style="{ width: `${enemyHpPercent}%` }"
          ></div>
        </div>
        <div class="hp-text">
          {{ activeEnemy.current_hp }} / {{ activeEnemy.max_hp }}
        </div>
        <img
          class="pokemon-sprite enemy-sprite"
          :src="activeEnemy.sprite"
          :alt="activeEnemy.name"
        />
      </section>

      <div v-if="activePlayer" class="battle-platform player-platform"></div>

      <section v-if="activePlayer" class="pokemon-card player-card">
        <img
          class="pokemon-sprite player-sprite"
          :src="activePlayer.sprite"
          :alt="activePlayer.name"
        />
        <div class="pokemon-meta">
          <span>{{ activePlayer.name }}</span>
          <span>Lv {{ activePlayer.level }}</span>
        </div>
        <div class="hp-bar">
          <div
            class="hp-fill player-fill"
            :style="{ width: `${playerHpPercent}%` }"
          ></div>
        </div>
        <div class="hp-text">
          {{ activePlayer.current_hp }} / {{ activePlayer.max_hp }}
        </div>
      </section>
    </div>

    <div class="bottom-action-bar">
      <div ref="logBox" class="battle-log" aria-live="polite">
        <div class="turn-pill battle-turn-pill" :class="currentTurn">
          {{ turnLabel }}
        </div>

        <div class="log-lines">
          <p
            v-for="(message, index) in typedLog"
            :key="`${index}-${message}`"
            class="log-line"
            :data-log-index="index"
          >
            {{ message }}
          </p>
        </div>
      </div>

      <div class="action-panel">
        <template v-if="choosingReward">
          <button
            v-for="choice in rewardChoices"
            :key="choice.item_name"
            class="move-btn reward-choice-btn"
            type="button"
            @click="chooseReward(choice)"
          >
            <span>{{ choice.item_name }}</span>
            <small>x{{ choice.quantity }}</small>
          </button>
        </template>

        <template v-else-if="activeCommand === 'pokemon' || awaitingSwitch">
          <div class="pokemon-switch-grid">
            <button
              v-for="(member, index) in switchSlots"
              :key="member?.id ?? `empty-${index}`"
              class="pokemon-slot-btn"
              :class="{
                active: member && isActiveMember(member),
                fainted: member && isFaintedMember(member),
                empty: !member,
              }"
              type="button"
              :disabled="!canSwitchTo(member)"
              @click="member && switchToPokemon(member)"
            >
              <img
                v-if="member"
                class="slot-sprite"
                :src="getTeamSprite(member)"
                :alt="member.name"
              />
              <div v-else class="slot-placeholder" aria-hidden="true"></div>

              <div class="slot-copy">
                <span>{{ member ? member.name : `Empty ${index + 1}` }}</span>
                <small v-if="member">Lv {{ member.level }}</small>
              </div>

              <div v-if="member" class="slot-hp-bar">
                <div
                  class="slot-hp-fill"
                  :style="{ width: `${getTeamHpPercent(member)}%` }"
                ></div>
              </div>
            </button>
          </div>

          <button
            v-if="!awaitingSwitch"
            class="move-btn close-btn"
            type="button"
            @click="activeCommand = 'moves'"
          >
            Back
          </button>
        </template>

        <template v-else>
          <button
            v-for="move in playerMoves"
            :key="`${move.name}-${move.type}`"
            class="move-btn"
            type="button"
            :disabled="movesLocked"
            @click="handlePlayerAttack(move)"
          >
            <span>{{ move.name }}</span>
            <small>{{ move.type }} / {{ move.power }}</small>
          </button>

          <button
            class="move-btn switch-btn"
            type="button"
            :disabled="movesLocked"
            @click="activeCommand = 'pokemon'"
          >
            Pokémon
          </button>
        </template>

        <button
          class="move-btn close-btn"
          type="button"
          :disabled="!canClose"
          @click="$emit('cancel')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  type BattleMove,
  type BattlePokemon,
  useBattleEngine,
} from "../composables/useBattleEngine";
import { getMoveById, getWildMovesForSpecies } from "../utils/moves";
import {
  type Gen1Species,
  gen1Pokemon,
  getSpeciesById,
} from "../utils/gen1-pokemon";
import { typeText } from "../utils/typingLog";
import { useFloorSystem } from "../composables/useFloorSystem";
import { type ItemReward, useItemRewards } from "../composables/useItemRewards";

interface BattleEndPayload {
  result: "win" | "loss";
  player?: BattlePokemon;
  enemy?: BattlePokemon;
  reward?: ItemReward | null;
  floor?: number;
  continued?: boolean;
}

const props = defineProps<{
  player: Record<string, any> | null;
  team?: Record<string, any>[];
  enemy?: Record<string, any> | null;
  runId?: string | null;
  floorNumber?: number;
}>();

const emit = defineEmits<{
  end: [result: BattleEndPayload];
  cancel: [];
}>();

const {
  player,
  enemy,
  startBattle,
  switchPlayer,
  playerAttack,
  battleLog,
  currentTurn,
  turnLocked,
  isBattleOver,
} = useBattleEngine({
  onEnemyFainted: handleEnemyFainted,
});

const { currentFloor, startRun, advanceFloor, getCurrentEnemy } =
  useFloorSystem();
const { generateRewardChoices, saveRewardChoice } = useItemRewards();

const logBox = ref<HTMLElement | null>(null);
const typedLog = ref<string[]>([]);
const nextLogIndex = ref(0);
const logQueue = ref(Promise.resolve());
const hasEmittedEnd = ref(false);
const rewardNotice = ref<ItemReward | null>(null);
const rewardChoices = ref<Array<Omit<ItemReward, "run_id">>>([]);
const transitioningFloor = ref(false);
const choosingReward = ref(false);
const awaitingSwitch = ref(false);
const activeCommand = ref<"moves" | "pokemon">("moves");
const faintedIds = ref<Set<string>>(new Set());

const activePlayer = computed(() => player.value);
const activeEnemy = computed(() => enemy.value);
const playerMoves = computed(() => activePlayer.value?.moves ?? []);

const switchCandidates = computed(() => {
  const activeId = activePlayer.value?.id;
  return (props.team ?? []).filter((member) => {
    if (!member) return false;
    if (activeId && member.id === activeId) return false;
    if (faintedIds.value.has(member.id)) return false;
    const isFainted =
      member.status_condition === "fainted" ||
      Number(member.current_hp ?? 0) <= 0;
    return !isFainted;
  });
});

const switchSlots = computed(() => {
  const slots: Array<Record<string, any> | null> = Array(6).fill(null);
  const team = props.team ?? [];
  team.forEach((member, i) => {
    if (i < 6) slots[i] = member;
  });
  return slots;
});

const movesLocked = computed(() => {
  return (
    transitioningFloor.value ||
    choosingReward.value ||
    awaitingSwitch.value ||
    turnLocked.value ||
    currentTurn.value !== "player" ||
    isBattleOver.value
  );
});
const canClose = computed(
  () => isBattleOver.value && !awaitingSwitch.value && !choosingReward.value,
);
const turnLabel = computed(() => {
  if (choosingReward.value) return "Choose an item";
  if (awaitingSwitch.value) return "Choose next Pokémon";
  return currentTurn.value === "player" ? "Player's turn" : "Enemy's turn";
});
const playerHpPercent = computed(() => getHpPercent(activePlayer.value));
const enemyHpPercent = computed(() => getHpPercent(activeEnemy.value));
const displayFloor = computed(
  () => currentFloor.value || props.floorNumber || 1,
);
const roguelikeLoopEnabled = computed(() => Boolean(props.runId));

onMounted(async () => {
  if (!props.player) return;

  const firstEnemy = props.runId ? await startRun(props.runId) : props.enemy;

  if (!firstEnemy) return;
  beginBattle(props.player, firstEnemy);
});

watch(
  () => battleLog.value.length,
  () => {
    const newMessages = battleLog.value.slice(nextLogIndex.value);
    nextLogIndex.value = battleLog.value.length;

    for (const message of newMessages) {
      logQueue.value = logQueue.value.then(() => appendTypedMessage(message));
    }
  },
  { flush: "post" },
);

async function handlePlayerAttack(move: BattleMove) {
  if (movesLocked.value || hasEmittedEnd.value) return;

  await playerAttack(move);

  if (activePlayer.value?.current_hp === 0 && roguelikeLoopEnabled.value) {
    await handlePlayerFainted();
    return;
  }

  if (isBattleOver.value && !roguelikeLoopEnabled.value) {
    await logQueue.value;
    emitBattleEnd();
  }
}

async function handlePlayerFainted() {
  if (!activePlayer.value || !activeEnemy.value) return;

  faintedIds.value.add(activePlayer.value.id);
  await logQueue.value;
  const canContinue = switchCandidates.value.length > 0;

  if (canContinue) {
    awaitingSwitch.value = true;
    await appendTypedMessage("Choose another Pokémon!");
    emit("end", {
      result: "loss",
      player: activePlayer.value,
      enemy: activeEnemy.value,
      floor: displayFloor.value,
      continued: true,
    });
    return;
  }

  hasEmittedEnd.value = true;
  emit("end", {
    result: "loss",
    player: activePlayer.value,
    enemy: activeEnemy.value,
    floor: displayFloor.value,
    continued: false,
  });
}

async function switchToPokemon(member: Record<string, any>) {
  if (!member || !awaitingSwitch.value || !activeEnemy.value) return;
  if (faintedIds.value.has(member.id)) return;
  if (
    member.status_condition === "fainted" ||
    Number(member.current_hp ?? 0) <= 0
  )
    return;

  const carriedFaintedIds = new Set(faintedIds.value);
  const currentEnemy = activeEnemy.value;

  awaitingSwitch.value = false;
  activeCommand.value = "moves";
  hasEmittedEnd.value = false;
  faintedIds.value = carriedFaintedIds;

  startBattle(
    normalizeBattlePokemon(member, "player"),
    normalizeBattlePokemon(currentEnemy, "enemy"),
  );
}

async function handleEnemyFainted() {
  if (!roguelikeLoopEnabled.value || !activePlayer.value || !activeEnemy.value)
    return;

  transitioningFloor.value = true;
  await logQueue.value;

  rewardChoices.value = generateRewardChoices(displayFloor.value, 3);
  choosingReward.value = rewardChoices.value.length > 0;
  await appendTypedMessage("Choose one item to keep.");
}

async function chooseReward(choice: Omit<ItemReward, "run_id">) {
  if (!choosingReward.value || !activePlayer.value || !activeEnemy.value)
    return;

  choosingReward.value = false;
  const reward = await saveRewardChoice(choice);
  if (reward) {
    rewardNotice.value = reward;
    await appendTypedMessage(`You found ${reward.item_name}!`);
  }

  emit("end", {
    result: "win",
    player: activePlayer.value,
    enemy: activeEnemy.value,
    reward,
    floor: displayFloor.value,
    continued: true,
  });

  const nextEnemy = await advanceFloor();
  await wait(1200);
  rewardNotice.value = null;
  rewardChoices.value = [];

  if (props.player && nextEnemy) {
    resetTypedLog();
    beginBattle(activePlayer.value, getCurrentEnemy() ?? nextEnemy);
  }

  transitioningFloor.value = false;
}

async function appendTypedMessage(message: string) {
  typedLog.value.push("");
  await nextTick();

  const index = typedLog.value.length - 1;
  const line = logBox.value?.querySelector<HTMLElement>(
    `[data-log-index="${index}"]`,
  );

  if (line) {
    await typeText(line, message);
  }

  typedLog.value[index] = message;
  await nextTick();
  logBox.value?.scrollTo({
    top: logBox.value.scrollHeight,
    behavior: "smooth",
  });
}

function emitBattleEnd() {
  if (hasEmittedEnd.value || !activePlayer.value || !activeEnemy.value) return;

  hasEmittedEnd.value = true;
  emit("end", {
    result: activeEnemy.value.current_hp <= 0 ? "win" : "loss",
    player: activePlayer.value,
    enemy: activeEnemy.value,
  });
}

function beginBattle(
  rawPlayer: Record<string, any>,
  rawEnemy: Record<string, any>,
) {
  hasEmittedEnd.value = false;
  activeCommand.value = "moves";
  faintedIds.value = new Set();
  startBattle(
    normalizeBattlePokemon(rawPlayer, "player"),
    normalizeBattlePokemon(rawEnemy, "enemy"),
  );
}

function resetTypedLog() {
  typedLog.value = [];
  nextLogIndex.value = 0;
  logQueue.value = Promise.resolve();
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getHpPercent(pokemon: BattlePokemon | null) {
  if (!pokemon?.max_hp) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((pokemon.current_hp / pokemon.max_hp) * 100)),
  );
}

function getTeamSprite(member: Record<string, any>): string {
  const speciesId = member.species_id ?? member.pokemon_species;
  if (speciesId) {
    const species = getSpeciesById(Number(speciesId));
    if (species?.spriteUrl) return species.spriteUrl;
  }
  return member.sprite ?? member.sprite_url ?? "";
}

function getTeamHpPercent(member: Record<string, any>): number {
  const max = Number(member.max_hp ?? 1);
  const current = Number(member.current_hp ?? 0);
  if (!max) return 0;
  return Math.max(0, Math.min(100, Math.round((current / max) * 100)));
}

function isActiveMember(member: Record<string, any>): boolean {
  return member.id === activePlayer.value?.id;
}

function isFaintedMember(member: Record<string, any>): boolean {
  return (
    member.status_condition === "fainted" || Number(member.current_hp ?? 0) <= 0
  );
}

function canSwitchTo(member: Record<string, any> | null): boolean {
  if (!member) return false;
  if (isActiveMember(member)) return false;
  if (faintedIds.value.has(member.id)) return false;
  if (isFaintedMember(member)) return false;
  return true;
}

function normalizeBattlePokemon(
  rawPokemon: Record<string, any>,
  side: "player" | "enemy",
): BattlePokemon {
  const species = resolveSpecies(rawPokemon);
  const level = Math.max(1, rawPokemon.level ?? 5);
  const baseStats = resolveBaseStats(rawPokemon, species);
  const scaledMaxHp = baseStats.hp + level * 5;
  const rawMaxHp = rawPokemon.max_hp ?? rawPokemon.current_hp ?? baseStats.hp;
  const rawCurrentHp = rawPokemon.current_hp ?? rawMaxHp;
  const currentHp = Math.max(
    1,
    Math.min(
      scaledMaxHp,
      Math.round((rawCurrentHp / Math.max(1, rawMaxHp)) * scaledMaxHp),
    ),
  );
  const types = resolveTypes(rawPokemon, species);
  const moves = resolveMoves(rawPokemon, species);

  return {
    id: rawPokemon.id,
    species_id:
      rawPokemon.species_id ?? rawPokemon.pokemon_species ?? species?.id,
    pokemon_species: rawPokemon.pokemon_species,
    name: normalizeName(
      rawPokemon.name ??
        species?.name ??
        (side === "player" ? "Player" : "Wild Pokemon"),
    ),
    level,
    current_hp: currentHp,
    max_hp: scaledMaxHp,
    base_hp: baseStats.hp,
    base_attack: baseStats.attack,
    base_defense: baseStats.defense,
    attack: baseStats.attack + level * 2,
    defense: baseStats.defense + level * 2,
    sp_atk: baseStats.sp_atk + level * 2,
    sp_def: baseStats.sp_def + level * 2,
    speed: baseStats.speed + level * 2,
    type1: types[0],
    type2: types[1] ?? null,
    types,
    sprite: rawPokemon.sprite ?? rawPokemon.sprite_url ?? species?.spriteUrl,
    moves,
  };
}

function resolveSpecies(rawPokemon: Record<string, any>): Gen1Species | null {
  const speciesId =
    rawPokemon.species_id ?? rawPokemon.pokemon_species ?? rawPokemon.api_id;
  const speciesById = Number.isFinite(Number(speciesId))
    ? getSpeciesById(Number(speciesId))
    : null;

  if (speciesById) return speciesById;

  const rawName = normalizeName(rawPokemon.name ?? "");
  return (
    Object.values(gen1Pokemon).find(
      (species) => species.name.toLowerCase() === rawName.toLowerCase(),
    ) ?? null
  );
}

function resolveBaseStats(
  rawPokemon: Record<string, any>,
  species: Gen1Species | null,
) {
  const rawStats =
    rawPokemon.base_stats ??
    rawPokemon.baseStats ??
    rawPokemon.species?.base_stats;
  return {
    hp: rawStats?.hp ?? species?.baseStats.hp ?? rawPokemon.max_hp ?? 35,
    attack:
      rawStats?.attack ?? species?.baseStats.attack ?? rawPokemon.attack ?? 35,
    defense:
      rawStats?.defense ??
      species?.baseStats.defense ??
      rawPokemon.defense ??
      35,
    sp_atk:
      rawStats?.sp_atk ??
      rawStats?.spAtk ??
      species?.baseStats.spAtk ??
      rawPokemon.sp_atk ??
      35,
    sp_def:
      rawStats?.sp_def ??
      rawStats?.spDef ??
      species?.baseStats.spDef ??
      rawPokemon.sp_def ??
      35,
    speed:
      rawStats?.speed ?? species?.baseStats.speed ?? rawPokemon.speed ?? 35,
  };
}

function resolveTypes(
  rawPokemon: Record<string, any>,
  species: Gen1Species | null,
): string[] {
  const typeCandidates = [
    rawPokemon.type1,
    rawPokemon.type2,
    ...(Array.isArray(rawPokemon.types) ? rawPokemon.types : []),
    ...(species?.types ?? []),
  ];

  const types = typeCandidates
    .filter(Boolean)
    .map((type) => String(type).toLowerCase())
    .filter((type, index, allTypes) => allTypes.indexOf(type) === index);

  return types.length > 0 ? types.slice(0, 2) : ["normal"];
}

function resolveMoves(
  rawPokemon: Record<string, any>,
  species: Gen1Species | null,
): BattleMove[] {
  const rawMoves = Array.isArray(rawPokemon.moves) ? rawPokemon.moves : [];
  const moves = rawMoves
    .map((move) => ({
      id: move.id,
      name: move.name ?? "Tackle",
      type: String(move.type ?? "normal").toLowerCase(),
      power: move.power ?? 40,
      accuracy: move.accuracy ?? 100,
      pp: move.pp,
    }))
    .filter((move) => move.power > 0);

  if (moves.length > 0) return moves.slice(0, 4);

  const speciesMoves = species
    ? getWildMovesForSpecies(species.id).filter((move) => move.power > 0)
    : [];
  const typedFallback = getTypedFallbackMove(species);
  const fallbackMoves = [
    ...speciesMoves,
    ...(typedFallback ? [typedFallback] : []),
    getMoveById(1),
    getMoveById(9),
  ].filter(Boolean) as BattleMove[];

  const uniqueMoves = fallbackMoves.filter((move, index, allMoves) => {
    return (
      allMoves.findIndex((candidate) => candidate.name === move.name) === index
    );
  });

  return uniqueMoves.slice(0, 4);
}

function getTypedFallbackMove(species: Gen1Species | null): BattleMove | null {
  const primaryType = species?.types[0];
  if (primaryType === "fire") return getMoveById(5);
  if (primaryType === "water") return getMoveById(14);
  if (primaryType === "grass") return getMoveById(11);
  if (primaryType === "electric") return getMoveById(18);
  return null;
}

function normalizeName(name: string) {
  return name.replace(/^Wild\s+/i, "").trim();
}
</script>

<style scoped>
.battle-modal {
  position: fixed;
  inset: 4%;
  z-index: 40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 4px solid #24190f;
  border-radius: 8px;
  background: #7ec8e3;
  color: #24190f;
  font-family: "Fredoka One", cursive;
  box-shadow: 0 12px 0 rgba(0, 0, 0, 0.3);
}

.battle-field {
  position: relative;
  flex: 1;
  min-height: 0;
  background: linear-gradient(180deg, #7ec8e3 0 45%, #3a9e4f 45% 100%);
}

.battle-field::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    180deg,
    transparent 0,
    transparent 7px,
    rgba(255, 255, 255, 0.12) 7px,
    rgba(255, 255, 255, 0.12) 8px
  );
}

.floor-header {
  position: absolute;
  top: 14px;
  left: 50%;
  z-index: 3;
  transform: translateX(-50%);
  padding: 8px 16px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #fff7db;
  font-size: 16px;
  box-shadow: 3px 3px 0 #24190f;
}

.reward-popup {
  position: absolute;
  top: 58px;
  left: 50%;
  z-index: 4;
  transform: translateX(-50%);
  max-width: min(360px, 84vw);
  padding: 10px 16px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #f4b63f;
  text-align: center;
  font-size: 15px;
  box-shadow: 4px 4px 0 #24190f;
}

.reward-pop-enter-active,
.reward-pop-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.reward-pop-enter-from,
.reward-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

.pokemon-card {
  position: absolute;
  z-index: 1;
  width: min(340px, 42vw);
  padding: 12px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #f7f1d2;
  box-shadow: 5px 5px 0 #24190f;
}

.enemy-card {
  top: 28px;
  left: 34px;
}

.player-card {
  right: 34px;
  bottom: 34px;
}

.pokemon-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 18px;
}

.hp-bar {
  height: 14px;
  margin-top: 8px;
  overflow: hidden;
  border: 2px solid #24190f;
  border-radius: 999px;
  background: #8b4a3b;
}

.hp-fill {
  height: 100%;
  transition: width 280ms ease;
}

.player-fill {
  background: #57c85a;
}

.enemy-fill {
  background: #f2c84b;
}

.hp-text {
  margin-top: 4px;
  text-align: right;
  font-size: 13px;
}

.pokemon-sprite {
  position: absolute;
  image-rendering: pixelated;
  width: 132px;
  height: 132px;
  object-fit: contain;
}

.enemy-sprite {
  right: -148px;
  top: 38px;
}

.player-sprite {
  left: -148px;
  bottom: 8px;
}

.bottom-action-bar {
  display: grid;
  grid-template-columns: 7fr 3fr;
  min-height: 210px;
  border-top: 4px solid #24190f;
  background: #f7f1d2;
}

.battle-log {
  height: 100%;
  max-height: 230px;
  overflow-y: auto;
  padding: 18px 22px;
  border-right: 4px solid #24190f;
  background: #fff7db;
}

.log-line {
  min-height: 24px;
  margin: 0 0 10px;
  font-size: 18px;
  line-height: 1.35;
}

.action-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-content: start;
  padding: 14px;
  background: #e9d384;
}

.turn-pill {
  padding: 8px 10px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #fff7db;
  text-align: center;
  font-size: 14px;
}

.turn-pill.enemy {
  background: #f5c2a4;
}

.move-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 46px;
  padding: 8px 12px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #f4b63f;
  color: #24190f;
  cursor: pointer;
  font: inherit;
  box-shadow: 0 5px 0 #24190f;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    filter 120ms ease;
}

.move-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 7px 0 #24190f;
}

.move-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 1px 0 #24190f;
}

.move-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  filter: grayscale(0.4);
}

.move-btn small {
  font-size: 11px;
  text-transform: uppercase;
}

.panel-note {
  padding: 10px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #fff7db;
  text-align: center;
  font-size: 13px;
}

.reward-choice-btn {
  background: #7ec8e3;
}

.switch-btn {
  background: #9fcf6c;
}

.close-btn {
  background: #c96d55;
}

.pokemon-switch-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

.pokemon-slot-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #f7f1d2;
  color: #24190f;
  cursor: pointer;
  font: inherit;
  box-shadow: 0 4px 0 #24190f;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}

.pokemon-slot-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #24190f;
}

.pokemon-slot-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pokemon-slot-btn.active {
  border-color: #57c85a;
  background: #d8f5d8;
}

.pokemon-slot-btn.fainted {
  background: #f5d8d8;
  border-color: #c96d55;
}

.pokemon-slot-btn.empty {
  background: #e0d8b0;
}

.slot-sprite {
  width: 36px;
  height: 36px;
  image-rendering: pixelated;
  object-fit: contain;
}

.slot-placeholder {
  width: 36px;
  height: 36px;
  border: 2px dashed #24190f;
  border-radius: 4px;
  opacity: 0.3;
}

.slot-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.3;
}

.slot-hp-bar {
  width: 40px;
  height: 6px;
  border: 1px solid #24190f;
  border-radius: 999px;
  background: #8b4a3b;
  overflow: hidden;
}

.slot-hp-fill {
  height: 100%;
  background: #57c85a;
  transition: width 280ms ease;
}

@media (max-width: 760px) {
  .battle-modal {
    inset: 2%;
  }

  .pokemon-card {
    width: min(260px, 62vw);
  }

  .enemy-card {
    left: 14px;
  }

  .player-card {
    right: 14px;
  }

  .pokemon-sprite {
    width: 104px;
    height: 104px;
  }

  .enemy-sprite {
    right: -92px;
  }

  .player-sprite {
    left: -92px;
  }

  .bottom-action-bar {
    grid-template-columns: 1fr;
  }

  .battle-log {
    border-right: 0;
    border-bottom: 4px solid #24190f;
  }
}
</style>
