import { readonly, ref } from 'vue'
import { useRunStore, type Run } from '../stores/runStore'
import { useEncounterGenerator, type EncounterPokemon } from './useEncounterGenerator'

interface RunWithFloorSeed extends Run {
  floor_seed?: string | null
  seed?: string | null
}

function getRunSeed(run: RunWithFloorSeed | null): string {
  return String(run?.floor_seed ?? run?.seed ?? run?.id ?? run?.run_id ?? 'run')
}

export function useFloorSystem() {
  const supabase = useSupabaseClient()
  const runStore = useRunStore()
  const { generateRandomEnemy } = useEncounterGenerator()
  const currentFloor = ref(runStore.currentFloor || 1)
  const currentEnemy = ref<EncounterPokemon | null>(null)
  const isLoadingFloor = ref(false)

  async function loadEnemyForFloor(floorNumber: number) {
    const run = runStore.activeRun as RunWithFloorSeed | null
    const seed = `${getRunSeed(run)}:floor:${floorNumber}`
    currentEnemy.value = await generateRandomEnemy(floorNumber, seed)
    runStore.setEncounter(currentEnemy.value)
    return currentEnemy.value
  }

  async function startRun(runId?: string) {
    isLoadingFloor.value = true
    try {
      if (runId) {
        const { data, error } = await supabase
          .from('runs')
          .select('*')
          .eq('run_id', runId)
          .single()

        if (error) throw error
        if (data) runStore.setRun(data as RunWithFloorSeed)
      }

      currentFloor.value = runStore.currentFloor || 1
      return await loadEnemyForFloor(currentFloor.value)
    } catch (error) {
      console.error('Failed to start floor system:', error)
      return null
    } finally {
      isLoadingFloor.value = false
    }
  }

  async function advanceFloor() {
    const nextFloor = Math.max(1, (runStore.currentFloor || currentFloor.value || 1) + 1)
    currentFloor.value = nextFloor
    runStore.advanceFloor()

    const runId = runStore.activeRun?.run_id ?? runStore.activeRun?.id
    if (runId) {
      const { error } = await supabase
        .from('runs')
        .update({ current_floor: nextFloor })
        .eq('run_id', runId)

      if (error) {
        console.error('Failed to update run floor:', error)
      }
    }

    return await loadEnemyForFloor(nextFloor)
  }

  function getCurrentEnemy() {
    return currentEnemy.value
  }

  function resetRun() {
    currentFloor.value = 1
    currentEnemy.value = null
    runStore.clearRun()
  }

  return {
    currentFloor: readonly(currentFloor),
    currentEnemy: readonly(currentEnemy),
    isLoadingFloor: readonly(isLoadingFloor),
    startRun,
    advanceFloor,
    getCurrentEnemy,
    resetRun,
  }
}
