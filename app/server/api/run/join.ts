import { createClient } from '@supabase/supabase-js'
import { getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const run_id = q.run_id as string
  if (!run_id) throw createError({ statusCode: 400, statusMessage: 'run_id required' })

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    throw createError({ statusCode: 500, statusMessage: 'Supabase env not configured' })

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Join player_pokemon with pokemon_species via foreign key
  const { data, error } = await client
    .from('player_pokemon')
    .select('*, pokemon_species(*)')
    .eq('run_id', run_id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
