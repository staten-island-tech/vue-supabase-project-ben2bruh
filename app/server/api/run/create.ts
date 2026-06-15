/**
 * POST /api/run/create
 * Creates a new run for a player with a selected starter Pokémon
 */
import { createClient } from '@supabase/supabase-js'
import { H3Error, createError } from 'h3'

interface CreateRunRequest {
  starter_species_id: number
  account_id: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateRunRequest>(event)
  
  if (!body.starter_species_id || !body.account_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'starter_species_id and account_id required',
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
    // Generate deterministic run seed from account_id + timestamp
    const runId = crypto.randomUUID()
    const seed = runId
    
    // Create run
    const { data: runData, error: runError } = await client
      .from('runs')
      .insert({
        id: runId,
        account_id: body.account_id,
        current_floor: 1,
        money: 0,
        status: 'active',
        seed,
      })
      .select()
      .single()
    
    if (runError || !runData) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create run: ${runError?.message}`,
      })
    }
    
    // Create starter Pokémon in team_slot 0
    const { data: pokemonData, error: pokemonError } = await client
      .from('player_pokemon')
      .insert({
        run_id: runId,
        species_id: body.starter_species_id,
        level: 1,
        experience: 0,
        max_hp: 45, // simplified starter HP; actual should come from base stats
        current_hp: 45,
        attack: 49,
        defense: 49,
        sp_atk: 65,
        sp_def: 65,
        speed: 45,
        team_slot: 0,
        status_condition: 'healthy',
      })
      .select()
      .single()
    
    if (pokemonError) {
      console.error('Failed to create starter:', pokemonError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create starter Pokémon',
      })
    }
    
    return {
      run_id: runData.id,
      seed: runData.seed,
      starter: pokemonData,
    }
  } catch (err: any) {
    console.error('Create run error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message ?? 'Failed to create run',
    })
  }
})
