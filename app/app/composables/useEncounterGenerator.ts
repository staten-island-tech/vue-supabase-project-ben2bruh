import { getAllDamageMoves, getWildMovesForSpecies, type Move } from '../utils/moves'
import { gen1Pokemon, getWildPokemonPool, type Gen1Species } from '../utils/gen1-pokemon'
import type { BattleMove, BattlePokemon } from './useBattleEngine'

export interface EncounterPokemon extends BattlePokemon {
  base_stats: {
    hp: number
    attack: number
    defense: number
    sp_atk: number
    sp_def: number
    speed: number
  }
  scaled_stats: {
    hp: number
    attack: number
    defense: number
    sp_atk: number
    sp_def: number
    speed: number
  }
}

interface PokemonSpeciesRow {
  id?: number
  species_id?: number
  api_id?: number
  name?: string
  type1?: string | null
  type2?: string | null
  types?: string[] | string | null
  base_stats?: Record<string, number> | null
  base_hp?: number | null
  base_attack?: number | null
  base_defense?: number | null
  base_sp_atk?: number | null
  base_sp_def?: number | null
  base_speed?: number | null
  hp?: number | null
  attack?: number | null
  defense?: number | null
  sp_atk?: number | null
  sp_def?: number | null
  speed?: number | null
  sprite?: string | null
  sprite_url?: string | null
  min_level?: number | null
  minimum_level?: number | null
  evolution_level?: number | null
  evolves_from_species_id?: number | null
  evolves_from_api_id?: number | null
}

const DEFAULT_LEVEL = 1
const DEFAULT_TYPE = 'normal'
const DEFAULT_STATS = {
  hp: 35,
  attack: 35,
  defense: 35,
  sp_atk: 35,
  sp_def: 35,
  speed: 35,
}

function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed: string) {
  let state = hashSeed(seed)
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function pickOne<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)] ?? items[0]
}

function normalizeType(type?: string | null): string {
  return type?.trim().toLowerCase() || DEFAULT_TYPE
}

function parseTypes(row: PokemonSpeciesRow, localSpecies: Gen1Species | null): string[] {
  const rowTypes = Array.isArray(row.types)
    ? row.types
    : typeof row.types === 'string'
      ? row.types.split(',').map((type) => type.trim())
      : []

  const types = [row.type1, row.type2, ...rowTypes, ...(localSpecies?.types ?? [])]
    .filter(Boolean)
    .map((type) => normalizeType(String(type)))
    .filter((type, index, allTypes) => allTypes.indexOf(type) === index)

  return types.length > 0 ? types.slice(0, 2) : [DEFAULT_TYPE]
}

function normalizeBaseStats(row: PokemonSpeciesRow, localSpecies: Gen1Species | null) {
  const rawStats = row.base_stats ?? {}
  return {
    hp: rawStats.hp ?? row.base_hp ?? row.hp ?? localSpecies?.baseStats.hp ?? DEFAULT_STATS.hp,
    attack: rawStats.attack ?? row.base_attack ?? row.attack ?? localSpecies?.baseStats.attack ?? DEFAULT_STATS.attack,
    defense: rawStats.defense ?? row.base_defense ?? row.defense ?? localSpecies?.baseStats.defense ?? DEFAULT_STATS.defense,
    sp_atk: rawStats.sp_atk ?? rawStats.spAtk ?? row.base_sp_atk ?? row.sp_atk ?? localSpecies?.baseStats.spAtk ?? DEFAULT_STATS.sp_atk,
    sp_def: rawStats.sp_def ?? rawStats.spDef ?? row.base_sp_def ?? row.sp_def ?? localSpecies?.baseStats.spDef ?? DEFAULT_STATS.sp_def,
    speed: rawStats.speed ?? row.base_speed ?? row.speed ?? localSpecies?.baseStats.speed ?? DEFAULT_STATS.speed,
  }
}

function getScaledStats(baseStats: ReturnType<typeof normalizeBaseStats>, level: number) {
  return {
    hp: baseStats.hp + level * 5,
    attack: baseStats.attack + level * 2,
    defense: baseStats.defense + level * 2,
    sp_atk: baseStats.sp_atk + level * 2,
    sp_def: baseStats.sp_def + level * 2,
    speed: baseStats.speed + level * 2,
  }
}

function toSpeciesRow(species: Gen1Species): PokemonSpeciesRow {
  return {
    id: species.id,
    name: species.name,
    type1: species.types[0],
    type2: species.types[1] ?? null,
    base_stats: {
      hp: species.baseStats.hp,
      attack: species.baseStats.attack,
      defense: species.baseStats.defense,
      sp_atk: species.baseStats.spAtk,
      sp_def: species.baseStats.spDef,
      speed: species.baseStats.speed,
    },
    sprite_url: species.spriteUrl,
  }
}

function getLocalMinimumLevel(speciesId: number): number {
  let minimumLevel = DEFAULT_LEVEL
  let currentSpeciesId = speciesId

  while (true) {
    const previousSpecies = Object.values(gen1Pokemon).find((species) => species.evolvesInto === currentSpeciesId)
    if (!previousSpecies) return minimumLevel

    minimumLevel = Math.max(minimumLevel, previousSpecies.evolutionLevel || DEFAULT_LEVEL)
    currentSpeciesId = previousSpecies.id
  }
}

function getMinimumEncounterLevel(row: PokemonSpeciesRow, localSpecies: Gen1Species | null): number {
  const explicitMinimum = row.min_level ?? row.minimum_level
  if (explicitMinimum && explicitMinimum > DEFAULT_LEVEL) return explicitMinimum

  if (localSpecies) {
    return getLocalMinimumLevel(localSpecies.id)
  }

  return DEFAULT_LEVEL
}

function floorEligibleRows(rows: PokemonSpeciesRow[], floorNumber: number, enemyLevel: number): PokemonSpeciesRow[] {
  const levelEligible = rows.filter((row) => {
    const speciesId = Number(row.api_id ?? row.species_id ?? row.id)
    const localSpecies = Number.isFinite(speciesId) ? gen1Pokemon[speciesId] ?? null : null
    return getMinimumEncounterLevel(row, localSpecies) <= enemyLevel
  })
  const levelSafeRows = levelEligible.length > 0 ? levelEligible : rows

  const eligible = levelSafeRows.filter((row) => {
    const speciesId = Number(row.api_id ?? row.species_id ?? row.id)
    const localSpecies = Number.isFinite(speciesId) ? gen1Pokemon[speciesId] ?? null : null
    const stats = normalizeBaseStats(row, localSpecies)
    const earlyPower = stats.hp + stats.attack + stats.defense

    if (floorNumber <= 5) return earlyPower <= 150
    if (floorNumber <= 10) return earlyPower <= 250
    return true
  })

  return eligible.length > 0 ? eligible : levelSafeRows
}

function getDamagingMovesForSpecies(speciesId: number, types: string[], rng: () => number): BattleMove[] {
  const speciesMoves = getWildMovesForSpecies(speciesId).filter((move) => move.power > 0)
  const typedMoves = getAllDamageMoves().filter((move) => types.includes(move.type.toLowerCase()))
  const commonMoves = getAllDamageMoves().filter((move) => move.type === DEFAULT_TYPE)
  const pool = [...speciesMoves, ...typedMoves, ...commonMoves]
  const uniqueMoves = pool.filter((move, index, allMoves) => {
    return allMoves.findIndex((candidate) => candidate.id === move.id) === index
  })

  const selected: Move[] = []
  const mutablePool = [...uniqueMoves]
  while (selected.length < 4 && mutablePool.length > 0) {
    const move = pickOne(mutablePool, rng)
    selected.push(move)
    mutablePool.splice(mutablePool.indexOf(move), 1)
  }

  return selected.length > 0
    ? selected.map((move) => ({ ...move, type: normalizeType(move.type) }))
    : [{ id: 1, name: 'Pound', type: DEFAULT_TYPE, power: 40, accuracy: 100, pp: 35 }]
}

export function useEncounterGenerator() {
  const supabase = useSupabaseClient()

  async function loadSpeciesRows(floorNumber: number): Promise<PokemonSpeciesRow[]> {
    const { data, error } = await supabase
      .from('pokemon_species')
      .select('*')

    if (error) {
      console.error('Failed to load pokemon_species; using local Gen 1 fallback:', error)
      return getWildPokemonPool(floorNumber).map(toSpeciesRow)
    }

    return (data?.length ? data : getWildPokemonPool(floorNumber).map(toSpeciesRow)) as PokemonSpeciesRow[]
  }

  async function generateRandomEnemy(floorNumber: number, seed = `floor-${floorNumber}`): Promise<EncounterPokemon> {
    const safeFloor = Math.max(1, Math.floor(floorNumber || 1))
    const rng = createRng(seed)
    const enemyLevel = Math.floor(DEFAULT_LEVEL + safeFloor * 0.75)
    const rows = floorEligibleRows(await loadSpeciesRows(safeFloor), safeFloor, enemyLevel)
    const row = pickOne(rows, rng)
    const speciesId = Number(row.api_id ?? row.species_id ?? row.id ?? 1)
    const localSpecies = gen1Pokemon[speciesId] ?? null
    const name = row.name ?? localSpecies?.name ?? 'Wild Pokemon'
    const types = parseTypes(row, localSpecies)
    const baseStats = normalizeBaseStats(row, localSpecies)
    const scaledStats = getScaledStats(baseStats, enemyLevel)
    const moves = getDamagingMovesForSpecies(speciesId, types, rng)

    return {
      species_id: speciesId,
      pokemon_species: speciesId,
      name,
      level: enemyLevel,
      type1: types[0] ?? DEFAULT_TYPE,
      type2: types[1] ?? null,
      types,
      base_stats: baseStats,
      scaled_stats: scaledStats,
      base_hp: baseStats.hp,
      base_attack: baseStats.attack,
      base_defense: baseStats.defense,
      attack: scaledStats.attack,
      defense: scaledStats.defense,
      sp_atk: scaledStats.sp_atk,
      sp_def: scaledStats.sp_def,
      speed: scaledStats.speed,
      max_hp: scaledStats.hp,
      current_hp: scaledStats.hp,
      sprite: row.sprite ?? row.sprite_url ?? localSpecies?.spriteUrl,
      moves,
    }
  }

  return {
    generateRandomEnemy,
  }
}
