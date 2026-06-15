import { readonly, ref } from 'vue'
import { useRunStore } from '../stores/runStore'

export interface ItemReward {
  run_id: string
  item_name: string
  quantity: number
  floor_obtained: number
}

interface RewardChoice {
  item_name: string
  quantity: number
  floor_obtained: number
}

const REWARD_TABLE = [
  { category: 'healing', items: ['Potion', 'Super Potion'], weight: 60 },
  { category: 'stat', items: ['X Attack', 'X Defense'], weight: 30 },
  { category: 'rare', items: ['Revive'], weight: 10 },
]

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

function getRunSeed(run: Record<string, any> | null): string {
  return String(run?.floor_seed ?? run?.seed ?? run?.id ?? run?.run_id ?? 'run')
}

export function useItemRewards() {
  const supabase = useSupabaseClient()
  const runStore = useRunStore()
  const latestReward = ref<ItemReward | null>(null)

  function pickRewardChoice(floorNumber: number, rng: () => number): RewardChoice {
    const roll = rng() * 100
    let cumulativeWeight = 0
    const rewardGroup = REWARD_TABLE.find((entry) => {
      cumulativeWeight += entry.weight
      return roll < cumulativeWeight
    }) ?? REWARD_TABLE[0]

    const itemName = rewardGroup.items[Math.floor(rng() * rewardGroup.items.length)] ?? rewardGroup.items[0]
    return {
      item_name: itemName,
      quantity: 1,
      floor_obtained: Math.max(1, Math.floor(floorNumber || 1)),
    }
  }

  function generateRewardChoices(floorNumber: number, count = 3): RewardChoice[] {
    const rng = createRng(`${getRunSeed(runStore.activeRun)}:reward:${floorNumber}`)
    const choices: RewardChoice[] = []
    const seen = new Set<string>()
    const maxAttempts = count * 8

    for (let attempt = 0; choices.length < count && attempt < maxAttempts; attempt += 1) {
      const choice = pickRewardChoice(floorNumber, rng)
      if (seen.has(choice.item_name)) continue
      seen.add(choice.item_name)
      choices.push(choice)
    }

    const allItems = REWARD_TABLE.flatMap((entry) => entry.items)
    for (const itemName of allItems) {
      if (choices.length >= count) break
      if (seen.has(itemName)) continue
      choices.push({
        item_name: itemName,
        quantity: 1,
        floor_obtained: Math.max(1, Math.floor(floorNumber || 1)),
      })
    }

    return choices
  }

  async function saveRewardChoice(choice: RewardChoice): Promise<ItemReward | null> {
    const runId = runStore.activeRun?.run_id ?? runStore.activeRun?.id
    if (!runId) return null

    const reward: ItemReward = {
      run_id: runId,
      item_name: choice.item_name,
      quantity: choice.quantity,
      floor_obtained: choice.floor_obtained,
    }

    const { data, error } = await supabase
      .from('run_items')
      .insert(reward)
      .select()
      .single()

    if (error) {
      console.error('Failed to save item reward:', error)
      latestReward.value = reward
      return reward
    }

    latestReward.value = (data ?? reward) as ItemReward
    return latestReward.value
  }

  async function generateReward(floorNumber: number): Promise<ItemReward | null> {
    const [choice] = generateRewardChoices(floorNumber, 1)
    return choice ? saveRewardChoice(choice) : null
  }

  async function getRunItems(runId: string): Promise<ItemReward[]> {
    const { data, error } = await supabase
      .from('run_items')
      .select('*')
      .eq('run_id', runId)
      .order('floor_obtained', { ascending: true })

    if (error) {
      console.error('Failed to load run items:', error)
      return []
    }

    return (data ?? []) as ItemReward[]
  }

  return {
    latestReward: readonly(latestReward),
    generateRewardChoices,
    saveRewardChoice,
    generateReward,
    getRunItems,
  }
}
