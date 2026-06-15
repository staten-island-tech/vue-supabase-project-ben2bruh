import { getSpeciesById, eeveeSpecies, eeveeEvolutions } from '../utils/gen1-pokemon'

export interface EvolutionCheck {
  canEvolve: boolean
  evolvesInto?: number
  eeveeChoice?: boolean
}

/**
 * Check if a Pokémon should evolve based on level
 */
export function checkEvolution(pokemon: any, speciesId: number): EvolutionCheck {
  const species = getSpeciesById(speciesId)
  if (!species) return { canEvolve: false }
  
  // Eevee special case: manual choice at level 1+ (simplified)
  if (speciesId === 133 && pokemon.level >= 1) {
    return { canEvolve: true, eeveeChoice: true }
  }
  
  // Standard level-based evolution
  if (species.evolutionLevel && pokemon.level >= species.evolutionLevel && species.evolvesInto) {
    return { canEvolve: true, evolvesInto: species.evolvesInto }
  }
  
  return { canEvolve: false }
}

/**
 * Apply evolution to a Pokémon
 */
export function evolveToSpecies(pokemon: any, targetSpeciesId: number) {
  const targetSpecies = getSpeciesById(targetSpeciesId)
  if (!targetSpecies) return pokemon
  
  pokemon.species_id = targetSpeciesId
  pokemon.name = targetSpecies.name
  // Stats recalculate on next level or battle
  return pokemon
}

/**
 * Handle Eevee evolution choice
 */
export function evolveEevee(pokemon: any, evolutionName: 'vaporeon' | 'jolteon' | 'flareon') {
  const targetSpecies = eeveeEvolutions[evolutionName]
  if (!targetSpecies) return pokemon
  
  pokemon.species_id = targetSpecies.id
  pokemon.name = targetSpecies.name
  return pokemon
}
