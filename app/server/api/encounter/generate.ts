/**
 * GET /api/encounter/generate
 * Generates a deterministic wild Pokémon encounter based on run seed and floor
 */
import { createClient } from '@supabase/supabase-js'
import { createError, getQuery } from 'h3'
import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const run_id = q.run_id as string
  
  if (!run_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'run_id required',
    })
  }
  
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase env not configured',
    })
  }
  
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  try {
    // Get run data to fetch seed and current floor
    const { data: runData, error: runError } = await client
      .from('runs')
      .select('id, seed, current_floor')
      .eq('id', run_id)
      .single()
    
    if (runError || !runData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Run not found',
      })
    }
    
    const { seed, current_floor } = runData
    const floor = current_floor ?? 1
    
    // Generate deterministic encounter
    // Use seed + floor to pick species and level
    const h = createHash('sha256')
    h.update(seed + '|' + floor + '|species')
    const speciesHash = h.digest('hex')
    
    // Simplified: pick from a limited pool based on floor
    const poolIndices = [
      [1, 4, 7, 25, 27, 29, 33, 37, 39, 41], // floor 1-5
      [1, 4, 7, 25, 27, 28, 29, 30, 33, 34, 37, 38, 39, 41, 42], // floor 6-10
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 25, 26], // floor 11+
    ]
    
    let pool = poolIndices[0]
    if (floor > 10) pool = poolIndices[2]
    else if (floor > 5) pool = poolIndices[1]
    
    const speciesNum = parseInt(speciesHash.slice(0, 8), 16)
    const speciesIdx = speciesNum % pool.length
    const species_id = pool[speciesIdx]
    
    // Generate level
    const h2 = createHash('sha256')
    h2.update(seed + '|' + floor + '|level')
    const levelHash = h2.digest('hex')
    const levelNum = parseInt(levelHash.slice(0, 4), 16)
    const level = Math.max(1, Math.min(100, floor + (levelNum % 5) - 2))
    
    return {
      species_id,
      level,
      seed,
      floor,
    }
  } catch (err: any) {
    console.error('Encounter generation error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message ?? 'Failed to generate encounter',
    })
  }
})
