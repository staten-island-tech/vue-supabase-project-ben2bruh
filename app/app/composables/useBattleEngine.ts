import { computed, readonly, ref } from "vue";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BattleTurn = "player" | "enemy";

export interface BattleMove {
  id?: number;
  name: string;
  type: string;
  power: number;
  accuracy?: number;
  pp?: number;
}

export interface BattlePokemon {
  id?: string;
  species_id?: number;
  pokemon_species?: number;
  name: string;
  level: number;
  current_hp: number;
  max_hp: number;
  base_hp: number;
  base_attack: number;
  base_defense: number;
  attack: number;
  defense: number;
  sp_atk?: number;
  sp_def?: number;
  speed?: number;
  type1: string;
  type2?: string | null;
  types: string[];
  sprite?: string;
  moves: BattleMove[];
}

export interface DamageResult {
  damage: number;
  effectiveness: number;
  stab: number;
}

export interface TurnResult extends DamageResult {
  fainted: boolean;
  missed: boolean;
}

export interface RunResult {
  success: boolean;
}

export interface SwitchResult {
  switched: boolean;
}

export interface BattleEngineOptions {
  onEnemyFainted?: (
    result: TurnResult,
    enemy: BattlePokemon,
    player: BattlePokemon,
  ) => Promise<void> | void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAB_MULTIPLIER = 1.5;
const DEFAULT_MULTIPLIER = 1;
const IMMUNE_MULTIPLIER = 0;
const MIN_DAMAGE = 1;
const PLAYER_TURN_DELAY_MS = 550;
const ENEMY_TURN_DELAY_MS = 700;
const ATTACK_LEVEL_SCALE = 2;
const DEFENSE_LEVEL_SCALE = 2;
const HP_LEVEL_SCALE = 5;
const DEFAULT_MOVE_TYPE = "normal";

/**
 * A flat damage roll factor (replaces the misleadingly named
 * DAMAGE_SPEED_MULTIPLIER — speed is not involved in this calculation).
 */
const DAMAGE_ROLL_FACTOR = 0.85;

/**
 * Additional multiplier applied only to the player's attacks to keep
 * wild-encounter battles feeling fair.
 */
const PLAYER_DAMAGE_BONUS = 1.75;

const FALLBACK_MOVE: BattleMove = {
  name: "Tackle",
  type: DEFAULT_MOVE_TYPE,
  power: 40,
  accuracy: 100,
};

// ---------------------------------------------------------------------------
// Type chart
// ---------------------------------------------------------------------------

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    bug: 2,
    rock: 0.5,
    ghost: 0.5,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
  },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 2,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
  ghost: { normal: 0, psychic: 0, ghost: 2 },
  dragon: { dragon: 2 },
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeType(type?: string | null): string {
  return type?.trim().toLowerCase() || DEFAULT_MOVE_TYPE;
}

/**
 * Returns a deduplicated list of a Pokémon's types derived solely from
 * `type1` and `type2`, ignoring the redundant `types` array so the source
 * of truth is unambiguous.
 */
function getPokemonTypes(
  pokemon: Pick<BattlePokemon, "type1" | "type2">,
): string[] {
  return [pokemon.type1, pokemon.type2]
    .map(normalizeType)
    .filter((t, i, arr) => Boolean(t) && arr.indexOf(t) === i);
}

export function getTypeEffectiveness(
  moveType: string,
  defenderTypes: Array<string | null | undefined> = [],
): number {
  const normalizedMoveType = normalizeType(moveType);
  const matchup = TYPE_CHART[normalizedMoveType] ?? {};

  return defenderTypes.reduce<number>((multiplier, defenderType) => {
    const normalizedDefenderType = normalizeType(defenderType);
    return multiplier * (matchup[normalizedDefenderType] ?? DEFAULT_MULTIPLIER);
  }, DEFAULT_MULTIPLIER);
}

export function getScaledAttack(
  pokemon: Pick<BattlePokemon, "base_attack" | "attack" | "level">,
): number {
  return Math.max(
    1,
    (pokemon.base_attack ?? pokemon.attack ?? 1) +
      pokemon.level * ATTACK_LEVEL_SCALE,
  );
}

export function getScaledDefense(
  pokemon: Pick<BattlePokemon, "base_defense" | "defense" | "level">,
): number {
  return Math.max(
    1,
    (pokemon.base_defense ?? pokemon.defense ?? 1) +
      pokemon.level * DEFENSE_LEVEL_SCALE,
  );
}

export function getScaledHp(
  pokemon: Pick<BattlePokemon, "base_hp" | "level">,
): number {
  return Math.max(1, pokemon.base_hp + pokemon.level * HP_LEVEL_SCALE);
}

export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  damageRollFactor = DAMAGE_ROLL_FACTOR,
): DamageResult {
  const moveType = normalizeType(move.type);
  const power = Math.max(0, move.power ?? 0);

  if (power <= 0) {
    return {
      damage: 0,
      effectiveness: DEFAULT_MULTIPLIER,
      stab: DEFAULT_MULTIPLIER,
    };
  }

  const attackerTypes = getPokemonTypes(attacker);
  const defenderTypes = getPokemonTypes(defender);
  const scaledAttack = getScaledAttack(attacker);
  const scaledDefense = getScaledDefense(defender);
  const stab = attackerTypes.includes(moveType)
    ? STAB_MULTIPLIER
    : DEFAULT_MULTIPLIER;
  const effectiveness = getTypeEffectiveness(moveType, defenderTypes);

  if (effectiveness === IMMUNE_MULTIPLIER) {
    return { damage: 0, effectiveness, stab };
  }

  const baseDamage = Math.floor(
    ((((2 * attacker.level) / 5 + 2) * power * (scaledAttack / scaledDefense)) /
      50 +
      2) *
      stab *
      effectiveness *
      damageRollFactor,
  );

  return {
    damage: Math.max(MIN_DAMAGE, baseDamage),
    effectiveness,
    stab,
  };
}

function getAccuracy(move: BattleMove): number {
  // accuracy === 0 is treated as "never misses" (e.g. Swift)
  return move.accuracy === 0 ? 100 : (move.accuracy ?? 100);
}

function chooseEnemyMove(enemy: BattlePokemon): BattleMove {
  const usableMoves = enemy.moves.filter((m) => m.power > 0);
  if (usableMoves.length === 0) return FALLBACK_MOVE;
  return usableMoves[Math.floor(Math.random() * usableMoves.length)];
}

function effectivenessMessage(effectiveness: number): string | null {
  if (effectiveness === IMMUNE_MULTIPLIER) return "It had no effect!";
  if (effectiveness > DEFAULT_MULTIPLIER) return "It's super effective!";
  if (effectiveness < DEFAULT_MULTIPLIER) return "It's not very effective...";
  return null;
}

function applyMove(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  damageRollFactor = DAMAGE_ROLL_FACTOR,
): TurnResult {
  const normalizedMove = { ...move, type: normalizeType(move.type) };

  if (Math.random() * 100 > getAccuracy(normalizedMove)) {
    return {
      damage: 0,
      effectiveness: DEFAULT_MULTIPLIER,
      stab: DEFAULT_MULTIPLIER,
      fainted: false,
      missed: true,
    };
  }

  const result = calculateDamage(
    attacker,
    defender,
    normalizedMove,
    damageRollFactor,
  );
  defender.current_hp = Math.max(0, defender.current_hp - result.damage);

  return { ...result, fainted: defender.current_hp <= 0, missed: false };
}

/**
 * Normalizes incoming Pokémon data so the engine works from a consistent
 * internal representation.
 *
 * Key fix: `max_hp` is always derived from `base_hp` (not the raw `max_hp`
 * field, which may be pre-scaling). `current_hp` is clamped to the new
 * `max_hp` so a full-health Pokémon stays full-health after normalization.
 */
function normalizeBattlePokemon(pokemon: BattlePokemon): BattlePokemon {
  const scaledMaxHp = getScaledHp(pokemon);
  // Preserve the HP ratio so a wounded Pokémon stays proportionally wounded.
  const hpRatio = pokemon.max_hp > 0 ? pokemon.current_hp / pokemon.max_hp : 1;
  const normalizedCurrentHp = Math.min(
    scaledMaxHp,
    Math.max(0, Math.round(hpRatio * scaledMaxHp)),
  );

  return {
    ...pokemon,
    type1: normalizeType(pokemon.type1),
    type2: pokemon.type2 ? normalizeType(pokemon.type2) : null,
    // Keep `types` in sync but derive it from type1/type2 only.
    types: getPokemonTypes({
      type1: normalizeType(pokemon.type1),
      type2: pokemon.type2 ? normalizeType(pokemon.type2) : null,
    }),
    max_hp: scaledMaxHp,
    current_hp: normalizedCurrentHp,
    moves: pokemon.moves.map((move) => ({
      ...move,
      type: normalizeType(move.type),
    })),
  };
}

// ---------------------------------------------------------------------------
// Battle engine composable
// ---------------------------------------------------------------------------

export function useBattleEngine(options: BattleEngineOptions = {}) {
  const player = ref<BattlePokemon | null>(null);
  const enemy = ref<BattlePokemon | null>(null);
  const battleLog = ref<string[]>([]);
  const currentTurn = ref<BattleTurn>("player");
  const turnLocked = ref(false);
  /**
   * Dedicated flag for a successful run so we don't have to corrupt
   * `enemy.current_hp` just to signal that the battle ended this way.
   */
  const ranAway = ref(false);

  const isBattleOver = computed(
    () =>
      ranAway.value ||
      Boolean(
        player.value &&
        enemy.value &&
        (player.value.current_hp <= 0 || enemy.value.current_hp <= 0),
      ),
  );

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  function addLog(message: string) {
    battleLog.value.push(message);
  }

  /**
   * Safely releases the turn lock and hands control back to the player.
   * Called at the end of every enemy attack or whenever we need to recover
   * from an early-exit path that would otherwise leave `turnLocked` stuck.
   */
  function beginPlayerTurn() {
    currentTurn.value = "player";
    turnLocked.value = false;
    addLog("Player's turn");
  }

  async function passTurnToEnemy() {
    if (
      !player.value ||
      !enemy.value ||
      enemy.value.current_hp <= 0 ||
      player.value.current_hp <= 0 ||
      ranAway.value
    ) {
      // Battle is already over; make sure we don't leave the lock engaged.
      turnLocked.value = false;
      return;
    }

    currentTurn.value = "enemy";
    addLog("Enemy's turn");
    await wait(ENEMY_TURN_DELAY_MS);
    await enemyAttack();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  function startBattle(playerMon: BattlePokemon, enemyMon: BattlePokemon) {
    player.value = normalizeBattlePokemon(playerMon);
    enemy.value = normalizeBattlePokemon(enemyMon);
    battleLog.value = [`Wild ${enemy.value.name} appeared!`, "Player's turn"];
    currentTurn.value = "player";
    turnLocked.value = false;
    ranAway.value = false;
  }

  async function switchPlayer(
    playerMon: BattlePokemon,
    consumesTurn = true,
  ): Promise<SwitchResult | null> {
    if (!enemy.value || enemy.value.current_hp <= 0) return null;
    if (
      consumesTurn &&
      (!player.value ||
        currentTurn.value !== "player" ||
        turnLocked.value ||
        isBattleOver.value)
    ) {
      return null;
    }

    if (consumesTurn) turnLocked.value = true;

    player.value = normalizeBattlePokemon(playerMon);
    addLog(`Go, ${player.value.name}!`);

    if (!consumesTurn) {
      beginPlayerTurn();
      return { switched: true };
    }

    await wait(PLAYER_TURN_DELAY_MS);
    await passTurnToEnemy();
    return { switched: true };
  }

  async function playerUseItem(itemName: string): Promise<void | null> {
    if (
      !player.value ||
      !enemy.value ||
      currentTurn.value !== "player" ||
      turnLocked.value ||
      isBattleOver.value
    ) {
      return null;
    }

    turnLocked.value = true;
    addLog(`Player used ${itemName}!`);
    addLog("But it didn't affect the battle...");

    await wait(PLAYER_TURN_DELAY_MS);
    await passTurnToEnemy();
  }

  async function playerRun(successChance = 1): Promise<RunResult | null> {
    if (
      !player.value ||
      !enemy.value ||
      currentTurn.value !== "player" ||
      turnLocked.value ||
      isBattleOver.value
    ) {
      return null;
    }

    turnLocked.value = true;
    addLog("Player tried to run!");

    const success = Math.random() <= successChance;

    if (success) {
      addLog("Got away safely!");
      ranAway.value = true;
      turnLocked.value = false;
      return { success: true };
    }

    addLog("Couldn't escape!");
    await wait(PLAYER_TURN_DELAY_MS);
    await passTurnToEnemy();
    return { success: false };
  }

  async function playerAttack(move: BattleMove): Promise<TurnResult | null> {
    if (
      !player.value ||
      !enemy.value ||
      currentTurn.value !== "player" ||
      turnLocked.value ||
      isBattleOver.value
    ) {
      return null;
    }

    turnLocked.value = true;
    addLog(`Player used ${move.name}!`);

    const result = applyMove(
      player.value,
      enemy.value,
      move,
      DAMAGE_ROLL_FACTOR * PLAYER_DAMAGE_BONUS,
    );

    if (result.missed) {
      addLog("The attack missed!");
    } else {
      addLog(`Enemy took ${result.damage} damage!`);
      const msg = effectivenessMessage(result.effectiveness);
      if (msg) addLog(msg);
    }

    await wait(PLAYER_TURN_DELAY_MS);

    if (result.fainted) {
      addLog(`${enemy.value.name} fainted!`);
      turnLocked.value = false;
      await options.onEnemyFainted?.(result, enemy.value, player.value);
      return result;
    }

    await passTurnToEnemy();
    return result;
  }

  async function enemyAttack(): Promise<TurnResult | null> {
    if (
      !player.value ||
      !enemy.value ||
      currentTurn.value !== "enemy" ||
      isBattleOver.value
    ) {
      // Unlock so the caller isn't left frozen on an unexpected early exit.
      turnLocked.value = false;
      return null;
    }

    const move = chooseEnemyMove(enemy.value);
    addLog(`Enemy used ${move.name}!`);

    const result = applyMove(enemy.value, player.value, move);

    if (result.missed) {
      addLog("The attack missed!");
    } else {
      addLog(`Player took ${result.damage} damage!`);
      const msg = effectivenessMessage(result.effectiveness);
      if (msg) addLog(msg);
    }

    await wait(PLAYER_TURN_DELAY_MS);

    if (result.fainted) {
      addLog(`${player.value.name} fainted!`);
      turnLocked.value = true; // Stay locked; battle is over for the player.
      return result;
    }

    beginPlayerTurn();
    return result;
  }

  return {
    // State (read-only where mutation should be engine-only)
    player,
    enemy,
    battleLog: readonly(battleLog),
    currentTurn,
    turnLocked: readonly(turnLocked),
    isBattleOver,
    ranAway: readonly(ranAway),

    // Actions
    startBattle,
    switchPlayer,
    playerUseItem,
    playerRun,
    playerAttack,
    enemyAttack,

    calculateDamage,
  };
}

export function takeTurn(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
): Pick<TurnResult, "damage" | "fainted" | "missed"> {
  const result = applyMove(attacker, defender, move);
  return {
    damage: result.damage,
    fainted: result.fainted,
    missed: result.missed,
  };
}
