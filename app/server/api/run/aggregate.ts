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

  const { data, error } = await client.from('player_pokemon').select('level,current_hp')
    .eq('run_id', run_id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Server-side aggregation: count, avg level, total HP
  const count = data?.length ?? 0
  const totalHp = (data ?? []).reduce((s: number, p: any) => s + (p.current_hp ?? 0), 0)
  const avgLevel = (data ?? []).reduce((s: number, p: any) => s + (p.level ?? 0), 0) / Math.max(1, count)

  return { count, totalHp, avgLevel }
})
