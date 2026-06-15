/**
 * POST /api/battle/result
 * Handles post-battle persistence: XP gain, level ups, evolution checks
 */
import { createClient } from '@supabase/supabase-js'
import { createError } from 'h3'

interface BattleResult {
  run_id: string
  player_pokemon_id: string
  result: 'win' | 'loss'
  xp_gained?: number
  level?: number
  current_hp?: number
  max_hp?: number
  experience?: number
  evolved_to?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BattleResult>(event)
  
  if (!body.run_id || !body.player_pokemon_id || !body.result) {
    throw createError({
      statusCode: 400,
      statusMessage: 'run_id, player_pokemon_id, and result required',
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
    if (body.result === 'loss') {
      // Update Pokémon to fainted status, keep current state
      const { error } = await client
        .from('player_pokemon')
        .update({
          status_condition: 'fainted',
          current_hp: 0,
        })
        .eq('id', body.player_pokemon_id)
      
      if (error) throw error
      
      return { success: true, fainted: true }
    }
    
    // Handle win: apply XP and level ups
    const updates: any = {
      status_condition: 'healthy',
    }
    
    if (body.xp_gained !== undefined) {
      updates.experience = body.experience ?? 0
    }
    if (body.level !== undefined) {
      updates.level = body.level
    }
    if (body.current_hp !== undefined) {
      updates.current_hp = body.current_hp
    }
    if (body.max_hp !== undefined) {
      updates.max_hp = body.max_hp
    }
    if (body.evolved_to !== undefined) {
      updates.species_id = body.evolved_to
    }
    
    const { error } = await client
      .from('player_pokemon')
      .update(updates)
      .eq('id', body.player_pokemon_id)
    
    if (error) throw error
    
    return { success: true, updated: updates }
  } catch (err: any) {
    console.error('Battle result error:', err)
    throw createError({
      statusCode: 500,
      statusMessage: err?.message ?? 'Failed to save battle result',
    })
  }
})
