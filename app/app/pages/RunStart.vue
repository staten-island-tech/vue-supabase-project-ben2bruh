<template>
  <div class="scene">
    <div class="battle-shell">
      <div class="floor-header">Floor {{ displayFloor }}</div>

      <Transition name="reward-pop">
        <div v-if="rewardNotice" class="reward-popup">
          Found {{ rewardNotice.item_name }} x{{ rewardNotice.quantity }}
        </div>
      </Transition>

      <div v-if="loading" class="loading-panel">Loading battle...</div>

      <template v-else>
        <div class="sky">
          <div class="sky-lines"></div>
          <div class="logo">
            <span class="logo-text">PokéRoGue</span>
          </div>
        </div>

        <div class="grass">
          <div class="grass-lines"></div>

          <div v-if="activeEnemy" class="sand-circle enemy-sand"></div>
          <div v-if="activePlayer" class="sand-circle player-sand"></div>

          <img
            v-if="activeEnemy"
            class="pokemon-sprite enemy-sprite"
            :src="activeEnemy.sprite"
            :alt="activeEnemy.name"
          />
          <img
            v-if="activePlayer"
            class="pokemon-sprite player-sprite"
            :src="activePlayer.sprite"
            :alt="activePlayer.name"
          />

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
          </section>

          <section v-if="activePlayer" class="pokemon-card player-card">
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
            <div class="exp-bar">
              <div
                class="exp-fill"
                :style="{ width: `${playerExpPercent}%` }"
              ></div>
            </div>
            <div class="exp-text">
              EXP {{ playerExperience }} / {{ playerNextLevelExperience }}
            </div>
          </section>
        </div>

        <div class="ground-bar"></div>

        <div class="bottom-action-bar">
          <div ref="logBox" class="battle-log" aria-live="polite">
            <div class="turn-pill" :class="currentTurn">
              {{ turnLabel }}
            </div>
            <p
              v-for="(message, index) in typedLog"
              :key="`${index}-${message}`"
              class="log-line"
              :data-log-index="index"
            >
              {{ message }}
            </p>
          </div>

          <div class="command-panel">
            <div class="command-grid">
              <button
                class="command-btn"
                type="button"
                :disabled="battleLost || choosingReward"
                @click="activeCommand = 'pokemon'"
              >
                Pokémon
              </button>
              <button
                class="command-btn"
                type="button"
                :disabled="battleLost || awaitingSwitch || choosingReward"
                @click="activeCommand = 'bag'"
              >
                Bag
              </button>
              <button
                class="command-btn"
                type="button"
                :disabled="battleLost || awaitingSwitch || choosingReward"
                @click="activeCommand = 'catch'"
              >
                Catch
              </button>
              <button
                class="command-btn danger"
                type="button"
                :disabled="
                  battleLost ||
                  awaitingSwitch ||
                  choosingReward ||
                  transitioningFloor
                "
                @click="attemptRun"
              >
                Run
              </button>
              <button class="poke-btn" @click="goToEnd">End Run</button>
            </div>

            <div v-if="activeCommand === 'pokemon'" class="context-panel">
              <button
                v-for="(member, index) in partySlots"
                :key="member?.id ?? `empty-${index}`"
                class="context-row"
                type="button"
                :disabled="
                  !member ||
                  memberIsActive(member) ||
                  memberIsFainted(member) ||
                  (!awaitingSwitch && movesLocked)
                "
                @click="switchPokemon(member)"
              >
                <span>{{
                  member ? member.name : `Empty Slot ${index + 1}`
                }}</span>
                <small v-if="member"
                  >Lv {{ member.level }} · {{ member.current_hp }}/{{
                    member.max_hp
                  }}</small
                >
              </button>
            </div>

            <div v-else-if="activeCommand === 'bag'" class="context-panel">
              <button
                v-for="item in usableItems"
                :key="item.item_name"
                class="context-row"
                type="button"
                :disabled="movesLocked"
                @click="useItem(item)"
              >
                <span>{{ item.item_name }}</span>
                <small>x{{ item.quantity }}</small>
              </button>
              <div v-if="usableItems.length === 0" class="empty-context">
                No items
              </div>
            </div>

            <div v-else-if="activeCommand === 'catch'" class="context-panel">
              <button
                v-for="ball in pokeballs"
                :key="ball.name"
                class="context-row"
                type="button"
                :disabled="movesLocked"
                @click="attemptCatch(ball)"
              >
                <span>{{ ball.name }}</span>
                <small>x{{ ball.quantity }}</small>
              </button>
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
            </template>
          </div>
        </div>
      </template>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  type BattleMove,
  type BattlePokemon,
  type TurnResult,
  useBattleEngine,
} from "../composables/useBattleEngine";
import { useFloorSystem } from "../composables/useFloorSystem";
import { type ItemReward, useItemRewards } from "../composables/useItemRewards";
import { getMoveById, getWildMovesForSpecies } from "../utils/moves";
import {
  type Gen1Species,
  gen1Pokemon,
  getSpeciesById,
} from "../utils/gen1-pokemon";
import { typeText } from "../utils/typingLog";
import { useRunStore } from "../stores/runStore";

const supabase = useSupabaseClient();
const route = useRoute();
const router = useRouter();
const runStore = useRunStore();
const {
  currentFloor,
  startRun: startFloorRun,
  advanceFloor,
  getCurrentEnemy,
} = useFloorSystem();
const { generateRewardChoices, saveRewardChoice } = useItemRewards();

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

const playerPokemon = ref<Record<string, any> | null>(null);
const partyPokemon = ref<Record<string, any>[]>([]);
const runItems = ref<Array<Record<string, any>>>([]);
const loading = ref(true);
const error = ref("");
const logBox = ref<HTMLElement | null>(null);
const typedLog = ref<string[]>([]);
const nextLogIndex = ref(0);
const logQueue = ref(Promise.resolve());
const rewardNotice = ref<ItemReward | null>(null);
const rewardChoices = ref<Array<Omit<ItemReward, "run_id">>>([]);
const pendingRewardPlayer = ref<Record<string, any> | null>(null);
const transitioningFloor = ref(false);
const battleLost = ref(false);
const awaitingSwitch = ref(false);
const choosingReward = ref(false);
const activeCommand = ref<"pokemon" | "bag" | "catch" | null>(null);
const pokeballs = ref([{ name: "Poké Ball", quantity: 3, catchBonus: 1 }]);

const activePlayer = computed(() => player.value);
const activeEnemy = computed(() => enemy.value);
const playerMoves = computed(() => activePlayer.value?.moves ?? []);
const movesLocked = computed(() => {
  return (
    transitioningFloor.value ||
    battleLost.value ||
    awaitingSwitch.value ||
    choosingReward.value ||
    turnLocked.value ||
    currentTurn.value !== "player" ||
    isBattleOver.value
  );
});
const turnLabel = computed(() => {
  if (choosingReward.value) return "Choose an item";
  if (awaitingSwitch.value) return "Choose next Pokémon";
  return currentTurn.value === "player" ? "Player's turn" : "Enemy's turn";
});
const playerHpPercent = computed(() => getHpPercent(activePlayer.value));
const enemyHpPercent = computed(() => getHpPercent(activeEnemy.value));
const displayFloor = computed(
  () => currentFloor.value || runStore.currentFloor || 1,
);
const playerExperience = computed(() =>
  Math.max(
    0,
    Number(
      (activePlayer.value as any)?.experience ??
        playerPokemon.value?.experience ??
        0,
    ),
  ),
);
const playerNextLevelExperience = computed(() =>
  getExperienceForNextLevel(
    activePlayer.value?.level ?? playerPokemon.value?.level ?? 1,
  ),
);
const goToEnd = (): void => {
  router.push("/RunCompletePage");
};
const playerExpPercent = computed(() => {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (playerExperience.value / playerNextLevelExperience.value) * 100,
      ),
    ),
  );
});
const partySlots = computed(() => {
  const slots: Array<Record<string, any> | null> = Array.from(
    { length: 6 },
    () => null,
  );
  for (const member of partyPokemon.value) {
    const slot = Math.max(
      0,
      Math.min(
        5,
        Number(member.team_slot ?? slots.findIndex((item) => item === null)),
      ),
    );
    slots[slot] = member;
  }
  return slots;
});
const usableItems = computed(() => {
  const totals = new Map<string, number>();
  for (const item of runItems.value) {
    const name = String(item.item_name ?? "");
    if (!name) continue;
    totals.set(name, (totals.get(name) ?? 0) + Number(item.quantity ?? 1));
  }

  return Array.from(totals.entries()).map(([item_name, quantity]) => ({
    item_name,
    quantity,
  }));
});
const usableSwitchMembers = computed(() => {
  return partyPokemon.value.filter(
    (member) => !memberIsActive(member) && !memberIsFainted(member),
  );
});

onMounted(async () => {
  const runId = getRouteRunId();
  if (!runId) {
    error.value = "Missing run_id";
    loading.value = false;
    return;
  }

  await loadRunItems(runId);
  const loadedPlayer = await loadPartyPokemon(runId);
  if (!loadedPlayer) {
    loading.value = false;
    return;
  }

  const firstEnemy = await startFloorRun(runId);
  if (!firstEnemy) {
    error.value = "Could not generate an enemy for this floor";
    loading.value = false;
    return;
  }

  playerPokemon.value = loadedPlayer;
  beginBattle(loadedPlayer, firstEnemy);
  loading.value = false;
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

async function loadPartyPokemon(runId: string) {
  const { data, error: fetchError } = await supabase
    .from("player_pokemon")
    .select(
      `
      *,
      species:pokemon_species (
        id,
        api_id,
        name,
        sprite_url,
        base_stats
      )
    `,
    )
    .eq("run_id", runId)
    .order("team_slot", { ascending: true });

  if (fetchError) {
    error.value = "Database error loading Pokémon";
    return null;
  }

  if (!data?.length) {
    error.value = "No Pokémon found for this run";
    return null;
  }

  const normalizedParty = data.map((pokemon: any) =>
    normalizeStoredPokemon(pokemon),
  );
  partyPokemon.value = normalizedParty;
  runStore.setTeam(normalizedParty as any);

  return (
    normalizedParty.find((member) => !memberIsFainted(member)) ??
    normalizedParty[0]
  );
}

function normalizeStoredPokemon(data: Record<string, any>) {
  return {
    ...data,
    species_id: data.species?.api_id ?? data.species_id ?? data.pokemon_species,
    pokemon_species: data.species?.api_id ?? data.pokemon_species,
    name: data.species?.name ?? data.name,
    sprite: data.species?.sprite_url ?? data.sprite,
    base_stats: data.species?.base_stats ?? data.base_stats,
    status_condition:
      data.status_condition ?? (data.is_fainted ? "fainted" : "healthy"),
  };
}

async function loadRunItems(runId: string) {
  const { data, error: itemError } = await supabase
    .from("run_items")
    .select("*")
    .eq("run_id", runId);

  if (itemError) {
    console.error("Failed to load run items:", itemError);
    runItems.value = [];
    return;
  }

  runItems.value = data ?? [];
}

async function handlePlayerAttack(move: BattleMove) {
  if (movesLocked.value) return;

  await playerAttack(move);

  if (activePlayer.value && activePlayer.value.current_hp <= 0) {
    await handlePlayerFainted(activePlayer.value);
  }
}

async function handlePlayerFainted(faintedPlayer: BattlePokemon) {
  await logQueue.value;

  Object.assign(faintedPlayer, {
    current_hp: 0,
    status_condition: "fainted",
  });

  const partyMember = partyPokemon.value.find((member) =>
    memberIsActive(member),
  );
  if (partyMember) {
    partyMember.current_hp = 0;
    partyMember.status_condition = "fainted";
  }

  await persistPlayerPokemon(faintedPlayer);

  if (usableSwitchMembers.value.length > 0) {
    awaitingSwitch.value = true;
    activeCommand.value = "pokemon";
    await appendTypedMessage("Choose another Pokémon!");
    return;
  }

  battleLost.value = true;
  await markRunLost();
}

async function switchPokemon(member: Record<string, any> | null) {
  if (
    !member ||
    !activeEnemy.value ||
    (!awaitingSwitch.value && movesLocked.value) ||
    memberIsFainted(member) ||
    memberIsActive(member)
  )
    return;

  playerPokemon.value = member;
  awaitingSwitch.value = false;
  switchPlayer(normalizeBattlePokemon(member, "player"));
  activeCommand.value = null;
}

async function useItem(item: { item_name: string; quantity: number }) {
  if (!activePlayer.value || movesLocked.value) return;

  const itemName = item.item_name;
  let pokemonToPersist: Record<string, any> = activePlayer.value;
  if (itemName === "Potion") {
    healActivePokemon(20);
    await appendTypedMessage(`${activePlayer.value.name} recovered HP!`);
  } else if (itemName === "Super Potion") {
    healActivePokemon(50);
    await appendTypedMessage(
      `${activePlayer.value.name} recovered a lot of HP!`,
    );
  } else if (itemName === "X Attack") {
    activePlayer.value.attack += 10;
    await appendTypedMessage(`${activePlayer.value.name}'s Attack rose!`);
  } else if (itemName === "X Defense") {
    activePlayer.value.defense += 10;
    await appendTypedMessage(`${activePlayer.value.name}'s Defense rose!`);
  } else if (itemName === "Revive") {
    const faintedMember = partyPokemon.value.find((member) =>
      memberIsFainted(member),
    );
    if (!faintedMember) {
      await appendTypedMessage("No fainted Pokémon to revive.");
      return;
    }
    faintedMember.current_hp = Math.max(
      1,
      Math.floor((faintedMember.max_hp ?? 1) / 2),
    );
    faintedMember.status_condition = "healthy";
    pokemonToPersist = faintedMember;
    await appendTypedMessage(`${faintedMember.name} was revived!`);
  } else {
    await appendTypedMessage(`${itemName} cannot be used right now.`);
    return;
  }

  consumeRunItem(itemName);
  await persistPlayerPokemon(pokemonToPersist);
  activeCommand.value = null;
}

async function attemptCatch(ball: {
  name: string;
  quantity: number;
  catchBonus: number;
}) {
  if (
    !activeEnemy.value ||
    !activePlayer.value ||
    movesLocked.value ||
    ball.quantity <= 0
  )
    return;

  const hpFactor =
    1 - activeEnemy.value.current_hp / Math.max(1, activeEnemy.value.max_hp);
  const levelFactor = Math.max(
    -0.2,
    Math.min(0.25, (activePlayer.value.level - activeEnemy.value.level) * 0.03),
  );
  const catchChance =
    Math.max(0.15, Math.min(0.75, 0.3 + hpFactor * 0.35 + levelFactor)) *
    ball.catchBonus;
  ball.quantity = Math.max(0, ball.quantity - 1);

  if (Math.random() <= catchChance) {
    await appendTypedMessage(`Caught ${activeEnemy.value.name}!`);
    await addCaughtPokemonToParty(activeEnemy.value);
    const nextEnemy = await advanceFloor();
    if (nextEnemy && activePlayer.value) {
      resetTypedLog();
      beginBattle(activePlayer.value, getCurrentEnemy() ?? nextEnemy);
    }
  } else {
    await appendTypedMessage(`${activeEnemy.value.name} broke free!`);
  }

  activeCommand.value = null;
}

async function attemptRun() {
  if (
    !activePlayer.value ||
    !activeEnemy.value ||
    transitioningFloor.value ||
    battleLost.value
  )
    return;

  const levelDifference = activePlayer.value.level - activeEnemy.value.level;
  const escapeChance = Math.max(
    0.2,
    Math.min(0.9, 0.5 + levelDifference * 0.08),
  );

  if (Math.random() <= escapeChance) {
    await appendTypedMessage("Got away safely!");
    transitioningFloor.value = true;
    const nextEnemy = await advanceFloor();
    if (nextEnemy) {
      resetTypedLog();
      beginBattle(activePlayer.value, getCurrentEnemy() ?? nextEnemy);
    }
    transitioningFloor.value = false;
  } else {
    await appendTypedMessage("Couldn't escape!");
  }

  activeCommand.value = null;
}

async function handleEnemyFainted(
  _result: TurnResult,
  defeatedEnemy: BattlePokemon,
  winningPlayer: BattlePokemon,
) {
  transitioningFloor.value = true;
  await logQueue.value;

  const updatedPlayer = await awardExperience(winningPlayer, defeatedEnemy);

  pendingRewardPlayer.value = updatedPlayer;
  rewardChoices.value = generateRewardChoices(displayFloor.value, 3);
  choosingReward.value = rewardChoices.value.length > 0;
  await appendTypedMessage("Choose one item to keep.");
}

async function chooseReward(choice: Omit<ItemReward, "run_id">) {
  if (!choosingReward.value) return;

  choosingReward.value = false;
  const reward = await saveRewardChoice(choice);
  if (reward) {
    runItems.value.push(reward);
    rewardNotice.value = reward;
    await appendTypedMessage(`You found ${reward.item_name}!`);
  }

  const nextEnemy = await advanceFloor();
  await wait(1200);
  rewardNotice.value = null;
  rewardChoices.value = [];

  if (nextEnemy) {
    resetTypedLog();
    beginBattle(
      pendingRewardPlayer.value ?? activePlayer.value,
      getCurrentEnemy() ?? nextEnemy,
    );
  }

  pendingRewardPlayer.value = null;
  transitioningFloor.value = false;
}

async function awardExperience(
  winningPlayer: BattlePokemon,
  defeatedEnemy: BattlePokemon,
) {
  const xpGain = calculateExperienceGain(
    winningPlayer.level,
    defeatedEnemy.level,
  );
  const updatedPlayer: Record<string, any> = {
    ...winningPlayer,
    experience:
      ((winningPlayer as any).experience ??
        playerPokemon.value?.experience ??
        0) + xpGain,
  };
  const levelUps = applyExperienceLevelUps(updatedPlayer);

  if (levelUps > 0) {
    await appendTypedMessage(`${updatedPlayer.name} gained ${xpGain} EXP!`);
    await appendTypedMessage(
      `${updatedPlayer.name} grew to Lv ${updatedPlayer.level}!`,
    );
  } else {
    await appendTypedMessage(`${updatedPlayer.name} gained ${xpGain} EXP!`);
  }

  Object.assign(winningPlayer, updatedPlayer);
  playerPokemon.value = updatedPlayer;
  await persistPlayerPokemon(updatedPlayer);
  return updatedPlayer;
}

async function persistPlayerPokemon(updatedPlayer: Record<string, any>) {
  const runId = getRouteRunId();
  if (!runId) return;

  let query = supabase
    .from("player_pokemon")
    .update({
      experience:
        updatedPlayer.experience ?? playerPokemon.value?.experience ?? 0,
      level: updatedPlayer.level,
      max_hp: updatedPlayer.max_hp,
      current_hp: updatedPlayer.current_hp,
      status_condition: updatedPlayer.status_condition ?? "healthy",
    })
    .eq("run_id", runId);

  query = updatedPlayer.id
    ? query.eq("id", updatedPlayer.id)
    : query.eq("team_slot", updatedPlayer.team_slot ?? 0);

  await query;
}

function healActivePokemon(amount: number) {
  if (!activePlayer.value) return;
  activePlayer.value.current_hp = Math.min(
    activePlayer.value.max_hp,
    activePlayer.value.current_hp + amount,
  );
  const partyMember = partyPokemon.value.find((member) =>
    memberIsActive(member),
  );
  if (partyMember) {
    partyMember.current_hp = activePlayer.value.current_hp;
  }
}

function consumeRunItem(itemName: string) {
  const item = runItems.value.find(
    (candidate) =>
      candidate.item_name === itemName && Number(candidate.quantity ?? 1) > 0,
  );
  if (!item) return;
  item.quantity = Math.max(0, Number(item.quantity ?? 1) - 1);
}

async function addCaughtPokemonToParty(caughtPokemon: BattlePokemon) {
  const runId = getRouteRunId();
  if (!runId || partyPokemon.value.length >= 6) return;

  const nextSlot = firstOpenPartySlot();
  const { data, error: catchError } = await supabase
    .from("player_pokemon")
    .insert({
      run_id: runId,
      pokemon_species:
        caughtPokemon.species_id ?? caughtPokemon.pokemon_species,
      level: caughtPokemon.level,
      current_hp: caughtPokemon.current_hp,
      experience: 0,
      team_slot: nextSlot,
      is_fainted: false,
    })
    .select(
      `
      *,
      species:pokemon_species (
        id,
        api_id,
        name,
        sprite_url,
        base_stats
      )
    `,
    )
    .maybeSingle();

  if (catchError || !data) {
    console.error("Failed to add caught Pokémon:", catchError);
    return;
  }

  partyPokemon.value.push(normalizeStoredPokemon(data));
}

function firstOpenPartySlot() {
  const occupiedSlots = new Set(
    partyPokemon.value.map((member) => Number(member.team_slot ?? 0)),
  );
  for (let slot = 0; slot < 6; slot += 1) {
    if (!occupiedSlots.has(slot)) return slot;
  }
  return Math.min(5, partyPokemon.value.length);
}

function memberIsActive(member: Record<string, any> | null) {
  if (!member || !activePlayer.value) return false;
  return (
    member.id === activePlayer.value.id ||
    member.team_slot === (activePlayer.value as any).team_slot
  );
}

function memberIsFainted(member: Record<string, any> | null) {
  if (!member) return false;
  return (
    member.status_condition === "fainted" ||
    member.is_fainted ||
    Number(member.current_hp ?? 0) <= 0
  );
}

async function markRunLost() {
  const runId = getRouteRunId();
  if (!runId) return;

  await supabase
    .from("runs")
    .update({ status: "lost", current_floor: displayFloor.value })
    .eq("run_id", runId);
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

function beginBattle(
  rawPlayer: Record<string, any>,
  rawEnemy: Record<string, any>,
) {
  battleLost.value = false;
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

function getRouteRunId() {
  const rawRunId = route.query.run_id;
  return Array.isArray(rawRunId) ? rawRunId[0] : rawRunId;
}

async function escapeRun() {
  const runId = getRouteRunId();
  if (runId) {
    await supabase
      .from("runs")
      .update({ status: "completed", current_floor: displayFloor.value })
      .eq("run_id", runId);
  }

  runStore.clearRun();
  await router.push("/");
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

function getExperienceForNextLevel(level: number) {
  return Math.max(1, Math.floor(20 * Math.pow(1.1, Math.max(1, level))));
}

function calculateExperienceGain(playerLevel: number, enemyLevel: number) {
  const base = Math.max(1, enemyLevel) * 22;
  const levelRatio = Math.max(1, enemyLevel) / Math.max(1, playerLevel);
  return Math.max(1, Math.floor(base * Math.pow(levelRatio, 0.45)));
}

function applyExperienceLevelUps(pokemon: Record<string, any>) {
  let levelUps = 0;
  let nextLevelExperience = getExperienceForNextLevel(pokemon.level);

  while (pokemon.experience >= nextLevelExperience && pokemon.level < 100) {
    pokemon.experience -= nextLevelExperience;
    pokemon.level += 1;
    levelUps += 1;
    applyScaledStatsForLevel(pokemon);
    nextLevelExperience = getExperienceForNextLevel(pokemon.level);
  }

  return levelUps;
}

function applyScaledStatsForLevel(pokemon: Record<string, any>) {
  pokemon.max_hp = Math.max(1, pokemon.base_hp + pokemon.level * 5);
  pokemon.current_hp = pokemon.max_hp;
  pokemon.attack = Math.max(1, pokemon.base_attack + pokemon.level * 2);
  pokemon.defense = Math.max(1, pokemon.base_defense + pokemon.level * 2);
  pokemon.sp_atk = Math.max(
    1,
    (pokemon.base_sp_atk ?? pokemon.sp_atk ?? pokemon.base_attack) +
      pokemon.level * 2,
  );
  pokemon.sp_def = Math.max(
    1,
    (pokemon.base_sp_def ?? pokemon.sp_def ?? pokemon.base_defense) +
      pokemon.level * 2,
  );
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
    team_slot: rawPokemon.team_slot,
    status_condition: rawPokemon.status_condition,
    is_fainted: rawPokemon.is_fainted,
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
    base_sp_atk: baseStats.sp_atk,
    base_sp_def: baseStats.sp_def,
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
    ...(rawPokemon.experience !== undefined
      ? { experience: rawPokemon.experience }
      : {}),
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
    hp:
      rawStats?.hp ??
      species?.baseStats.hp ??
      rawPokemon.max_hp ??
      rawPokemon.current_hp ??
      35,
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
.scene {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #111122;
  color: #24190f;
  font-family: "Fredoka One", cursive;
  overflow: hidden;
}

.battle-shell {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #7ec8e3;
}

.loading-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #7ec8e3;
  font-size: 22px;
}

.sky {
  position: relative;
  flex: 1.15;
  min-height: 170px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #7ec8e3;
}

.sky-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 7px,
    rgba(255, 255, 255, 0.12) 7px,
    rgba(255, 255, 255, 0.12) 8px
  );
  pointer-events: none;
}

.logo {
  position: relative;
  z-index: 2;
}

.logo-text {
  color: #c0392b;
  font-size: clamp(30px, 6vw, 54px);
  letter-spacing: 2px;
  text-shadow:
    3px 3px 0 #7b1a11,
    -2px -2px 0 #2c3e7a,
    2px -2px 0 #2c3e7a,
    -2px 2px 0 #2c3e7a,
    0 4px 0 #000;
}

.grass {
  position: relative;
  flex: 2.3;
  min-height: 330px;
  background: #3a9e4f;
  overflow: hidden;
}

.grass-lines {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 5px,
    rgba(0, 0, 0, 0.08) 5px,
    rgba(0, 0, 0, 0.08) 6px
  );
  pointer-events: none;
}

.ground-bar {
  height: 18px;
  flex: 0 0 18px;
  background: #8b1a11;
  border-top: 3px solid #c0392b;
  position: relative;
}

.ground-bar::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 4px;
  background: #5a0e0e;
}

.floor-header {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 5;
  transform: translateX(-50%);
  padding: 8px 16px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #fff7db;
  font-size: 16px;
  box-shadow: 3px 3px 0 #24190f;
}

.poke-btn {
  font-family: "Fredoka One", cursive;
  font-size: 22px;
  padding: 12px 32px;
  background: #2a1a0e;
  color: #f0e6c8;
  border: 3px solid #c0392b;
  box-shadow: 0 4px 0 #8b1a11;
  cursor: pointer;
  letter-spacing: 1px;
  transition:
    transform 0.08s,
    box-shadow 0.08s;
}
.poke-btn:hover {
  background: #3a2510;
  border-color: #e74c3c;
}
.poke-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #8b1a11;
}

.reward-popup {
  position: absolute;
  top: 64px;
  left: 50%;
  z-index: 6;
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
  z-index: 3;
  width: min(430px, 32vw);
  min-width: 300px;
  padding: 14px 16px;
  border: 4px solid #c0392b;
  background: #1a1a2e;
  color: #f0e6c8;
  box-shadow:
    0 0 0 2px #000,
    inset 0 0 0 2px #000;
}

.pokemon-card::before {
  content: "";
  position: absolute;
  inset: 3px;
  border: 2px solid #8b1a11;
  pointer-events: none;
}

.enemy-card {
  top: 34px;
  left: 0;
  border-left: 0;
}

.player-card {
  right: 0;
  bottom: 28px;
  border-right: 0;
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
  border: 2px solid #000;
  background: #2a1a0e;
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

.exp-bar {
  height: 9px;
  margin-top: 8px;
  overflow: hidden;
  border: 2px solid #000;
  background: #2a1a0e;
}

.exp-fill {
  height: 100%;
  background: #4cc3ff;
  transition: width 280ms ease;
}

.exp-text {
  margin-top: 4px;
  text-align: right;
  font-size: 11px;
  color: #cdefff;
}

.pokemon-sprite {
  position: absolute;
  z-index: 2;
  image-rendering: pixelated;
  width: clamp(148px, 16vw, 230px);
  height: clamp(148px, 16vw, 230px);
  object-fit: contain;
  filter: drop-shadow(6px 8px 0 rgba(0, 0, 0, 0.18));
}

.sand-circle {
  position: absolute;
  z-index: 1;
  width: clamp(160px, 18vw, 260px);
  height: clamp(46px, 5.2vw, 72px);
  border: 4px solid #b7950b;
  border-radius: 50%;
  background: radial-gradient(
    circle at 38% 42%,
    rgba(255, 238, 139, 0.95),
    rgba(244, 208, 63, 0.95) 58%,
    rgba(183, 149, 11, 0.95) 100%
  );
  box-shadow: 0 8px 0 rgba(0, 0, 0, 0.14);
}

.enemy-sand {
  top: clamp(120px, 14vw, 186px);
  right: 10.5%;
}

.player-sand {
  left: 8.5%;
  bottom: 18px;
}

.enemy-sprite {
  top: 12px;
  right: 12%;
}

.player-sprite {
  left: 10%;
  bottom: 28px;
}

.bottom-action-bar {
  display: grid;
  grid-template-columns: minmax(260px, 3fr) minmax(240px, 2.2fr) minmax(
      280px,
      3fr
    );
  min-height: 270px;
  flex: 0 0 270px;
  border-top: 4px solid #c0392b;
  background: #1a1a2e;
  box-shadow: inset 0 0 0 2px #000;
}

.battle-log {
  height: 100%;
  max-height: 270px;
  overflow-y: auto;
  padding: 14px 18px;
  border-right: 4px solid #c0392b;
  background: #2a1a0e;
  color: #f0e6c8;
}

.log-line {
  min-height: 18px;
  margin: 0 0 7px;
  font-size: 14px;
  line-height: 1.35;
}

.command-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 18px;
  border-right: 4px solid #c0392b;
  background: #1a1a2e;
}

.command-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.command-btn,
.context-row {
  min-height: 44px;
  padding: 8px 10px;
  border: 3px solid #c0392b;
  background: #2a1a0e;
  color: #f0e6c8;
  cursor: pointer;
  font: inherit;
  box-shadow: 0 4px 0 #8b1a11;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background 120ms ease;
}

.command-btn:hover:not(:disabled),
.context-row:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #3a2510;
  border-color: #e74c3c;
  box-shadow: 0 6px 0 #8b1a11;
}

.command-btn:active:not(:disabled),
.context-row:active:not(:disabled) {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #8b1a11;
}

.command-btn:disabled,
.context-row:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  filter: grayscale(0.4);
}

.command-btn.danger {
  background: #3a1a1a;
}

.context-panel {
  display: grid;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
}

.context-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  text-align: left;
}

.context-row small {
  flex: 0 0 auto;
  font-size: 11px;
  color: #f4d03f;
}

.empty-context {
  padding: 12px;
  border: 3px solid #c0392b;
  background: #2a1a0e;
  color: #f0e6c8;
  text-align: center;
}

.action-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  align-content: start;
  padding: 18px;
  background: #1a1a2e;
}

.turn-pill {
  padding: 8px 10px;
  margin-bottom: 10px;
  border: 3px solid #c0392b;
  background: #2a1a0e;
  color: #f0e6c8;
  text-align: center;
  font-size: 14px;
  box-shadow: inset 0 0 0 2px #000;
}

.turn-pill.enemy {
  background: #3a1a1a;
}

.move-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 46px;
  padding: 8px 12px;
  border: 3px solid #c0392b;
  background: #2a1a0e;
  color: #f0e6c8;
  cursor: pointer;
  font: inherit;
  box-shadow: 0 5px 0 #8b1a11;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    filter 120ms ease;
}

.move-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: #3a2510;
  border-color: #e74c3c;
  box-shadow: 0 7px 0 #8b1a11;
}

.move-btn:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 1px 0 #8b1a11;
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

.reward-choice-btn {
  background: #1e4b5f;
}

.close-btn {
  background: #3a1a1a;
}

.error {
  position: absolute;
  right: 24px;
  bottom: 18px;
  z-index: 5;
  padding: 8px 12px;
  border: 3px solid #24190f;
  border-radius: 8px;
  background: #f5c2a4;
  color: #24190f;
}

@media (max-width: 760px) {
  .scene {
    height: 100svh;
  }

  .pokemon-card {
    width: min(280px, 70vw);
    min-width: 0;
  }

  .enemy-card {
    top: 20px;
  }

  .player-card {
    bottom: 16px;
  }

  .pokemon-sprite {
    width: 118px;
    height: 118px;
  }

  .enemy-sprite {
    right: 4%;
    top: 18px;
  }

  .player-sprite {
    left: 4%;
    bottom: 28px;
  }

  .enemy-sand {
    right: 2%;
    top: 118px;
  }

  .player-sand {
    left: 2%;
    bottom: 18px;
  }

  .bottom-action-bar {
    grid-template-columns: 1fr;
    flex-basis: 430px;
    min-height: 430px;
  }

  .battle-log {
    border-right: 0;
    border-bottom: 4px solid #c0392b;
  }

  .command-panel {
    border-right: 0;
    border-bottom: 4px solid #c0392b;
  }
}
</style>
