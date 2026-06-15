import { getSpeciesById, getPokemonStats } from '../utils/gen1-pokemon'

/**
 * Calculate XP gain based on opponent level difference
 * Higher level opponents give more XP
 */
export function calculateXpGain(playerLevel: number, wildLevel: number): number {
  // Base reward: wild Pokémon's level * 5
  const base = (wildLevel ?? 1) * 5
  
  // Level difference multiplier
  // If player is lower level, get more XP (incentivizes fighting stronger Pokémon)
  // If player is higher level, get less XP (diminishing returns)
  const levelRatio = (wildLevel ?? 1) / Math.max(1, playerLevel ?? 1)
  
  const xp = Math.max(1, Math.floor(base * Math.pow(levelRatio, 0.4)))
  return xp
}

/**
 * Apply XP to a Pokémon and handle level ups
 */
export function applyXp(pokemon: any, xp: number) {
  pokemon.experience = (pokemon.experience ?? 0) + xp
  
  // Level up threshold: exponential curve (each level requires ~10% more XP)
  // Simplified: threshold = 20 * 1.1^level
  let currentLevel = pokemon.level ?? 1
  let threshold = Math.floor(20 * Math.pow(1.1, currentLevel))
  
  while (pokemon.experience >= threshold && currentLevel < 100) {
    pokemon.experience -= threshold
    currentLevel += 1
    
    // Recalculate stats for new level
    updatePokemonStats(pokemon, currentLevel)
    
    threshold = Math.floor(20 * Math.pow(1.1, currentLevel))
  }
  
  pokemon.level = currentLevel
  return pokemon
}

/**
 * Recalculate Pokémon stats based on level and species base stats
 */
export function updatePokemonStats(pokemon: any, level: number) {
  const species = getSpeciesById(pokemon.species_id)
  if (!species) return pokemon
  
  const stats = getPokemonStats(species, level)
  
  // Update max HP and restore health on level up
  pokemon.max_hp = stats.hp
  pokemon.current_hp = stats.hp
  pokemon.attack = stats.attack
  pokemon.defense = stats.defense
  pokemon.sp_atk = stats.spAtk
  pokemon.sp_def = stats.spDef
  pokemon.speed = stats.speed
  
  return pokemon
}

/**
 * Legacy function for backward compatibility
 */
export function applyXpLegacy(pokemon: any, xp: number) {
  pokemon.experience = (pokemon.experience ?? 0) + xp
  let threshold = Math.floor(20 * Math.pow(1.1, pokemon.level ?? 1))
  while (pokemon.experience >= threshold) {
    pokemon.experience -= threshold
    pokemon.level = (pokemon.level ?? 1) + 1
    pokemon.max_hp = Math.max(1, Math.floor((pokemon.max_hp ?? 10) * 1.06))
    pokemon.current_hp = pokemon.max_hp
    threshold = Math.floor(20 * Math.pow(1.1, pokemon.level))
  }
  return pokemon
}
