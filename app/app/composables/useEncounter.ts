/**
 * Encounter generation composable
 * Calls server API to generate deterministic encounters
 */

export interface GeneratedEncounter {
  species_id: number
  name: string
  level: number
  max_hp: number
  current_hp: number
  attack: number
  defense: number
  sp_atk: number
  sp_def: number
  speed: number
  types: string[]
  sprite: string
  moves: Array<{ name: string; type: string; power: number }>
}

/**
 * Fetch encounter from server (generates deterministic encounter based on run seed + floor)
 */
export async function fetchEncounter(runId: string): Promise<GeneratedEncounter | null> {
  try {
    const response = await fetch(`/api/encounter/generate?run_id=${runId}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return data
  } catch (err) {
    console.error('Failed to fetch encounter:', err)
    return null
  }
}

/**
 * Get list of encounter possibilities for a floor (for UI display)
 */
export function getFloorEncounterPossibilities(floor: number): string[] {
  // This would be handled server-side or provided by API
  // For now, return empty list
  return []
}
