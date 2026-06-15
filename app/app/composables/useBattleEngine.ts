import { computed, readonly, ref } from 'vue'

export type BattleTurn = 'player' | 'enemy'

export interface BattleMove {
  id?: number
  name: string
  type: string
  power: number
  accuracy?: number
  pp?: number
}

export interface BattlePokemon {
  id?: string
  species_id?: number
  pokemon_species?: number
  name: string
  level: number
  current_hp: number
  max_hp: number
  base_hp: number
  base_attack: number
  base_defense: number
  attack: number
  defense: number
  sp_atk?: number
  sp_def?: number
  speed?: number
  type1: string
  type2?: string | null
  types: string[]
  sprite?: string
  moves: BattleMove[]
}

export interface DamageResult {
  damage: number
  effectiveness: number
  stab: number
}

export interface TurnResult extends DamageResult {
  fainted: boolean
  missed: boolean
}

export interface RunResult {
  success: boolean
}

export interface SwitchResult {
  switched: boolean
}

export interface BattleEngineOptions {
  onEnemyFainted?: (result: TurnResult, enemy: BattlePokemon, player: BattlePokemon) => Promise<void> | void
}

const STAB_MULTIPLIER = 1.5
const DEFAULT_MULTIPLIER = 1
const IMMUNE_MULTIPLIER = 0
const MIN_DAMAGE = 1
const PLAYER_TURN_DELAY_MS = 550
const ENEMY_TURN_DELAY_MS = 700
const ATTACK_LEVEL_SCALE = 2
const DEFENSE_LEVEL_SCALE = 2
const HP_LEVEL_SCALE = 5
const DEFAULT_MOVE_TYPE = 'normal'
const DAMAGE_SPEED_MULTIPLIER = 0.85
const PLAYER_DAMAGE_MULTIPLIER = 1.75

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, bug: 2, rock: 0.5, ghost: 0.5 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 2, flying: 0.5, psychic: 2, ghost: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2 },
  ghost: { normal: 0, psychic: 0, ghost: 2 },
  dragon: { dragon: 2 },
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function normalizeType(type?: string | null): string {
  return type?.trim().toLowerCase() || DEFAULT_MOVE_TYPE
}

function getPokemonTypes(pokemon: Pick<BattlePokemon, 'type1' | 'type2' | 'types'>): string[] {
  const types = Array.isArray(pokemon.types) ? pokemon.types : []
  return [pokemon.type1, pokemon.type2, ...types]
    .map((type) => normalizeType(type))
    .filter((type, index, allTypes) => type && allTypes.indexOf(type) === index)
}

export function getTypeEffectiveness(moveType: string, defenderTypes: Array<string | null | undefined> = []): number {
  const normalizedMoveType = normalizeType(moveType)
  const matchup = TYPE_CHART[normalizedMoveType] ?? {}

  return defenderTypes.reduce((multiplier, defenderType) => {
    const normalizedDefenderType = normalizeType(defenderType)
    return multiplier * (matchup[normalizedDefenderType] ?? DEFAULT_MULTIPLIER)
  }, DEFAULT_MULTIPLIER)
}

export function getScaledAttack(pokemon: Pick<BattlePokemon, 'base_attack' | 'attack' | 'level'>): number {
  return Math.max(1, (pokemon.base_attack ?? pokemon.attack ?? 1) + pokemon.level * ATTACK_LEVEL_SCALE)
}

export function getScaledDefense(pokemon: Pick<BattlePokemon, 'base_defense' | 'defense' | 'level'>): number {
  return Math.max(1, (pokemon.base_defense ?? pokemon.defense ?? 1) + pokemon.level * DEFENSE_LEVEL_SCALE)
}

export function getScaledHp(pokemon: Pick<BattlePokemon, 'base_hp' | 'max_hp' | 'level'>): number {
  return Math.max(1, (pokemon.base_hp ?? pokemon.max_hp ?? 1) + pokemon.level * HP_LEVEL_SCALE)
}

export function calculateDamage(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  damageMultiplier = DAMAGE_SPEED_MULTIPLIER
): DamageResult {
  const normalizedMove = {
    ...move,
    type: normalizeType(move.type),
    power: Math.max(0, move.power ?? 0),
  }

  if (normalizedMove.power <= 0) {
    return { damage: 0, effectiveness: DEFAULT_MULTIPLIER, stab: DEFAULT_MULTIPLIER }
  }

  const attackerTypes = getPokemonTypes(attacker)
  const defenderTypes = getPokemonTypes(defender)
  const scaledAttack = getScaledAttack(attacker)
  const scaledDefense = getScaledDefense(defender)
  const stab = attackerTypes.includes(normalizedMove.type) ? STAB_MULTIPLIER : DEFAULT_MULTIPLIER
  const effectiveness = getTypeEffectiveness(normalizedMove.type, defenderTypes)
  const baseDamage = Math.floor(
    (((2 * attacker.level / 5 + 2) * normalizedMove.power * (scaledAttack / scaledDefense)) / 50 + 2)
    * stab
    * effectiveness
    * damageMultiplier
  )

  return {
    damage: effectiveness === IMMUNE_MULTIPLIER ? 0 : Math.max(MIN_DAMAGE, baseDamage),
    effectiveness,
    stab,
  }
}

function getAccuracy(move: BattleMove): number {
  return move.accuracy === 0 ? 100 : move.accuracy ?? 100
}

function chooseEnemyMove(enemy: BattlePokemon): BattleMove {
  const usableMoves = enemy.moves.filter((move) => move.power > 0)
  return usableMoves[Math.floor(Math.random() * usableMoves.length)] ?? {
    name: 'Tackle',
    type: DEFAULT_MOVE_TYPE,
    power: 40,
    accuracy: 100,
  }
}

function effectivenessMessage(effectiveness: number): string | null {
  if (effectiveness === IMMUNE_MULTIPLIER) return 'It had no effect!'
  if (effectiveness > DEFAULT_MULTIPLIER) return "It's super effective!"
  if (effectiveness < DEFAULT_MULTIPLIER) return "It's not very effective..."
  return null
}

function applyMove(
  attacker: BattlePokemon,
  defender: BattlePokemon,
  move: BattleMove,
  damageMultiplier = DAMAGE_SPEED_MULTIPLIER
): TurnResult {
  const normalizedMove = {
    ...move,
    type: normalizeType(move.type),
  }

  if (Math.random() * 100 > getAccuracy(normalizedMove)) {
    return {
      damage: 0,
      effectiveness: DEFAULT_MULTIPLIER,
      stab: DEFAULT_MULTIPLIER,
      fainted: false,
      missed: true,
    }
  }

  const result = calculateDamage(attacker, defender, normalizedMove, damageMultiplier)
  defender.current_hp = Math.max(0, defender.current_hp - result.damage)

  return {
    ...result,
    fainted: defender.current_hp <= 0,
    missed: false,
  }
}

function normalizeBattlePokemon(pokemon: BattlePokemon): BattlePokemon {
  return {
    ...pokemon,
    type1: normalizeType(pokemon.type1),
    type2: pokemon.type2 ? normalizeType(pokemon.type2) : null,
    types: getPokemonTypes(pokemon),
    max_hp: getScaledHp(pokemon),
    current_hp: Math.min(pokemon.current_hp, getScaledHp(pokemon)),
    moves: pokemon.moves.map((move) => ({ ...move, type: normalizeType(move.type) })),
  }
}

export function useBattleEngine(options: BattleEngineOptions = {}) {
  const player = ref<BattlePokemon | null>(null)
  const enemy = ref<BattlePokemon | null>(null)
  const battleLog = ref<string[]>([])
  const currentTurn = ref<BattleTurn>('player')
  const turnLocked = ref(false)

  const isBattleOver = computed(() => {
    return Boolean(
      player.value &&
      enemy.value &&
      (player.value.current_hp <= 0 || enemy.value.current_hp <= 0)
    )
  })

  function addLog(message: string) {
    battleLog.value.push(message)
  }

  function startBattle(playerMon: BattlePokemon, enemyMon: BattlePokemon) {
    player.value = normalizeBattlePokemon(playerMon)
    enemy.value = normalizeBattlePokemon(enemyMon)

    battleLog.value = [`Wild ${enemy.value.name} appeared!`, "Player's turn"]
    currentTurn.value = 'player'
    turnLocked.value = false
  }

  async function passTurnToEnemy() {
    if (!player.value || !enemy.value || enemy.value.current_hp <= 0 || player.value.current_hp <= 0) {
      return
    }

    currentTurn.value = 'enemy'
    addLog("Enemy's turn")
    await wait(ENEMY_TURN_DELAY_MS)
    await enemyAttack()
  }

  async function switchPlayer(playerMon: BattlePokemon, consumesTurn = true): Promise<SwitchResult | null> {
    if (!enemy.value || enemy.value.current_hp <= 0) return null
    if (consumesTurn && (!player.value || currentTurn.value !== 'player' || turnLocked.value || isBattleOver.value)) {
      return null
    }

    if (consumesTurn) {
      turnLocked.value = true
    }

    player.value = normalizeBattlePokemon(playerMon)
    addLog(`Go, ${player.value.name}!`)

    if (!consumesTurn) {
      currentTurn.value = 'player'
      turnLocked.value = false
      addLog("Player's turn")
      return { switched: true }
    }

    await wait(PLAYER_TURN_DELAY_MS)
    await passTurnToEnemy()
    return { switched: true }
  }

  async function playerRun(successChance = 1): Promise<RunResult | null> {
    if (!player.value || !enemy.value || currentTurn.value !== 'player' || turnLocked.value || isBattleOver.value) {
      return null
    }

    turnLocked.value = true
    addLog('Player tried to run!')
    const success = Math.random() <= successChance
    addLog(success ? 'Got away safely!' : "Couldn't escape!")

    await wait(PLAYER_TURN_DELAY_MS)
    await passTurnToEnemy()

    return { success }
  }

  async function playerAttack(move: BattleMove) {
    if (!player.value || !enemy.value || currentTurn.value !== 'player' || turnLocked.value || isBattleOver.value) {
      return null
    }

    turnLocked.value = true
    addLog(`Player used ${move.name}!`)
    const result = applyMove(player.value, enemy.value, move, DAMAGE_SPEED_MULTIPLIER * PLAYER_DAMAGE_MULTIPLIER)

    if (result.missed) {
      addLog('The attack missed!')
    } else {
      addLog(`Enemy took ${result.damage} damage!`)
      const message = effectivenessMessage(result.effectiveness)
      if (message) addLog(message)
    }

    await wait(PLAYER_TURN_DELAY_MS)

    if (result.fainted) {
      addLog(`${enemy.value.name} fainted!`)
      await options.onEnemyFainted?.(result, enemy.value, player.value)
      return result
    }

    await passTurnToEnemy()

    return result
  }

  async function enemyAttack() {
    if (!player.value || !enemy.value || currentTurn.value !== 'enemy' || isBattleOver.value) {
      return null
    }

    const move = chooseEnemyMove(enemy.value)
    addLog(`Enemy used ${move.name}!`)
    const result = applyMove(enemy.value, player.value, move)

    if (result.missed) {
      addLog('The attack missed!')
    } else {
      addLog(`Player took ${result.damage} damage!`)
      const message = effectivenessMessage(result.effectiveness)
      if (message) addLog(message)
    }

    await wait(PLAYER_TURN_DELAY_MS)

    if (result.fainted) {
      addLog(`${player.value.name} fainted!`)
      turnLocked.value = true
      return result
    }

    currentTurn.value = 'player'
    addLog("Player's turn")
    turnLocked.value = false
    return result
  }

  return {
    player,
    enemy,
    startBattle,
    switchPlayer,
    playerRun,
    playerAttack,
    enemyAttack,
    calculateDamage,
    isBattleOver,
    battleLog: readonly(battleLog),
    currentTurn,
    turnLocked: readonly(turnLocked),
  }
}

export function takeTurn(attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove) {
  const result = applyMove(attacker, defender, move)
  return { damage: result.damage, fainted: result.fainted }
}
