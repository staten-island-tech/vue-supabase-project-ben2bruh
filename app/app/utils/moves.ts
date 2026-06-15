/**
 * Gen 1 Move data and move pool definition for core Pokémon
 * Focus only on damage-dealing moves (no status, stat changes, etc.)
 */

export interface Move {
  id: number
  name: string
  type: string
  power: number
  accuracy: number
  pp: number
}

// Simple move pool for Gen 1 (damage moves only)
export const gen1Moves: Record<number, Move> = {
  1: { id: 1, name: 'Pound', type: 'normal', power: 40, accuracy: 100, pp: 35 },
  4: { id: 4, name: 'Growl', type: 'normal', power: 0, accuracy: 100, pp: 40 }, // stat buff - exclude
  5: { id: 5, name: 'Ember', type: 'fire', power: 40, accuracy: 100, pp: 25 },
  9: { id: 9, name: 'Scratch', type: 'normal', power: 40, accuracy: 100, pp: 35 },
  10: { id: 10, name: 'Cut', type: 'normal', power: 50, accuracy: 95, pp: 30 },
  11: { id: 11, name: 'Vine Whip', type: 'grass', power: 45, accuracy: 100, pp: 25 },
  13: { id: 13, name: 'Razor Leaf', type: 'grass', power: 55, accuracy: 95, pp: 25 },
  14: { id: 14, name: 'Water Gun', type: 'water', power: 40, accuracy: 100, pp: 25 },
  15: { id: 15, name: 'Clamp', type: 'water', power: 35, accuracy: 85, pp: 15 },
  18: { id: 18, name: 'Thunder Shock', type: 'electric', power: 40, accuracy: 100, pp: 30 },
  20: { id: 20, name: 'Bite', type: 'normal', power: 60, accuracy: 100, pp: 25 },
  21: { id: 21, name: 'Peck', type: 'flying', power: 35, accuracy: 100, pp: 35 },
  22: { id: 22, name: 'Drill Peck', type: 'flying', power: 80, accuracy: 100, pp: 20 },
  24: { id: 24, name: 'Rage', type: 'normal', power: 20, accuracy: 100, pp: 20 },
  25: { id: 25, name: 'Pin Missile', type: 'bug', power: 25, accuracy: 95, pp: 20 },
  28: { id: 28, name: 'Mega Punch', type: 'normal', power: 80, accuracy: 85, pp: 20 },
  29: { id: 29, name: 'Mega Kick', type: 'normal', power: 120, accuracy: 75, pp: 5 },
  30: { id: 30, name: 'Pay Day', type: 'normal', power: 40, accuracy: 100, pp: 20 },
  31: { id: 31, name: 'Fire Punch', type: 'fire', power: 75, accuracy: 100, pp: 15 },
  32: { id: 32, name: 'Ice Punch', type: 'ice', power: 75, accuracy: 100, pp: 15 },
  33: { id: 33, name: 'Thunder Punch', type: 'electric', power: 75, accuracy: 100, pp: 15 },
  36: { id: 36, name: 'Double Slap', type: 'normal', power: 15, accuracy: 85, pp: 10 },
  37: { id: 37, name: 'Curl', type: 'normal', power: 0, accuracy: 0, pp: 40 }, // stat buff - exclude
  38: { id: 38, name: 'Wrap', type: 'normal', power: 15, accuracy: 85, pp: 20 },
  40: { id: 40, name: 'Acid', type: 'poison', power: 40, accuracy: 100, pp: 30 },
  42: { id: 42, name: 'Acid Spray', type: 'poison', power: 40, accuracy: 100, pp: 20 },
  43: { id: 43, name: 'Crabhammer', type: 'water', power: 100, accuracy: 90, pp: 10 },
  44: { id: 44, name: 'Stomp', type: 'normal', power: 65, accuracy: 100, pp: 20 },
  45: { id: 45, name: 'Double Kick', type: 'fighting', power: 30, accuracy: 100, pp: 30 },
  46: { id: 46, name: 'Counter', type: 'fighting', power: 0, accuracy: 100, pp: 20 }, // reflective - complex
  47: { id: 47, name: 'Seismic Toss', type: 'fighting', power: 0, accuracy: 100, pp: 20 }, // level-based - complex
  49: { id: 49, name: 'Barrage', type: 'normal', power: 15, accuracy: 85, pp: 20 },
  50: { id: 50, name: 'Leech Seed', type: 'grass', power: 0, accuracy: 90, pp: 10 }, // status - exclude
  51: { id: 51, name: 'Growth', type: 'normal', power: 0, accuracy: 0, pp: 20 }, // stat buff - exclude
  52: { id: 52, name: 'Razor Wind', type: 'normal', power: 80, accuracy: 100, pp: 10 },
  54: { id: 54, name: 'Sludge Bomb', type: 'poison', power: 90, accuracy: 100, pp: 10 },
  55: { id: 55, name: 'Sludge Wave', type: 'poison', power: 95, accuracy: 100, pp: 10 },
  56: { id: 56, name: 'Flame Burst', type: 'fire', power: 70, accuracy: 100, pp: 15 },
  57: { id: 57, name: 'Flame Charge', type: 'fire', power: 50, accuracy: 100, pp: 20 },
  60: { id: 60, name: 'Hydro Pump', type: 'water', power: 110, accuracy: 80, pp: 5 },
  61: { id: 61, name: 'Surf', type: 'water', power: 90, accuracy: 100, pp: 15 },
  62: { id: 62, name: 'Ice Beam', type: 'ice', power: 90, accuracy: 100, pp: 10 },
  63: { id: 63, name: 'Blizzard', type: 'ice', power: 110, accuracy: 70, pp: 5 },
  64: { id: 64, name: 'Psybeam', type: 'psychic', power: 65, accuracy: 100, pp: 20 },
  65: { id: 65, name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15 },
  66: { id: 66, name: 'Thunder', type: 'electric', power: 110, accuracy: 70, pp: 10 },
  67: { id: 67, name: 'Rock Throw', type: 'rock', power: 50, accuracy: 90, pp: 15 },
  69: { id: 69, name: 'Rock Slide', type: 'rock', power: 75, accuracy: 90, pp: 10 },
  71: { id: 71, name: 'Bubble', type: 'water', power: 40, accuracy: 100, pp: 30 },
  72: { id: 72, name: 'Bubblebeam', type: 'water', power: 65, accuracy: 100, pp: 20 },
  73: { id: 73, name: 'Aurora Beam', type: 'ice', power: 65, accuracy: 100, pp: 20 },
  75: { id: 75, name: 'Psychic', type: 'psychic', power: 90, accuracy: 100, pp: 10 },
  77: { id: 77, name: 'Struggle', type: 'normal', power: 50, accuracy: 0, pp: 1 }, // backup
  81: { id: 81, name: 'Aerial Ace', type: 'flying', power: 60, accuracy: 0, pp: 20 }, // always hits
  84: { id: 84, name: 'Earthquake', type: 'ground', power: 100, accuracy: 100, pp: 10 },
  85: { id: 85, name: 'Fissure', type: 'ground', power: 0, accuracy: 30, pp: 5 }, // OHKO - exclude
  86: { id: 86, name: 'Dig', type: 'ground', power: 80, accuracy: 100, pp: 10 },
  87: { id: 87, name: 'Toxic', type: 'poison', power: 0, accuracy: 90, pp: 10 }, // status - exclude
  88: { id: 88, name: 'Confusion', type: 'psychic', power: 50, accuracy: 100, pp: 25 },
  89: { id: 89, name: 'Psycho Cut', type: 'psychic', power: 70, accuracy: 100, pp: 20 },
  90: { id: 90, name: 'Hyper Beam', type: 'normal', power: 150, accuracy: 90, pp: 5 },
}

// Starter movepool (simple - just learn by level)
export const starterMovePool: Record<number, Array<{ level: number; moveId: number }>> = {
  1: [ // Bulbasaur
    { level: 1, moveId: 1 }, // Pound
    { level: 3, moveId: 11 }, // Vine Whip
    { level: 9, moveId: 40 }, // Acid
  ],
  4: [ // Charmander
    { level: 1, moveId: 1 }, // Pound
    { level: 1, moveId: 9 }, // Scratch
    { level: 7, moveId: 5 }, // Ember
  ],
  7: [ // Squirtle
    { level: 1, moveId: 1 }, // Pound
    { level: 1, moveId: 9 }, // Scratch
    { level: 8, moveId: 14 }, // Water Gun
  ],
}

// Common wild movepool (sampled moves for variety)
export const commonWildMovePool = [
  { moveId: 1, name: 'Pound' },
  { moveId: 9, name: 'Scratch' },
  { moveId: 20, name: 'Bite' },
  { moveId: 21, name: 'Peck' },
  { moveId: 24, name: 'Rage' },
  { moveId: 40, name: 'Acid' },
  { moveId: 44, name: 'Stomp' },
  { moveId: 49, name: 'Barrage' },
]

export function getMoveById(id: number): Move | null {
  return gen1Moves[id] ?? null
}

// Get all damage moves (filter out status, stat changes, OHKO moves)
export function getAllDamageMoves(): Move[] {
  return Object.values(gen1Moves).filter(m => m.power > 0 && m.id !== 85) // exclude Fissure (OHKO)
}

// Get typical moves for a wild Pokémon
export function getWildMovesForSpecies(speciesId: number): Move[] {
  const moves: Move[] = []
  const pool = starterMovePool[speciesId]
  
  if (pool) {
    pool.forEach(ml => {
      const move = getMoveById(ml.moveId)
      if (move) moves.push(move)
    })
  }
  
  if (moves.length === 0) {
    // Fallback to random common moves
    const commonMoves = [1, 9, 20, 21, 40, 44].map(id => getMoveById(id)).filter(Boolean) as Move[]
    moves.push(...commonMoves.slice(0, 4))
  }
  
  return moves.slice(0, 4) // Max 4 moves per Pokémon
}
