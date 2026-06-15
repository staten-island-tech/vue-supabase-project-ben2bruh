import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PlayerPokemon {
  id: string
  species_id: number
  name: string
  level: number
  experience: number
  max_hp: number
  current_hp: number
  attack: number
  defense: number
  sp_atk: number
  sp_def: number
  speed: number
  team_slot: number
  status_condition: 'healthy' | 'fainted'
}

export interface Run {
  id?: string
  run_id?: string
  account_id: string
  current_floor: number
  floor_seed?: string | null
  money: number
  status: 'active' | 'completed' | 'lost'
  seed?: string | null
  created_at?: string
}

export const useRunStore = defineStore('run', () => {
  const activeRun = ref<Run | null>(null)
  const team = ref<PlayerPokemon[]>([])
  const currentFloor = ref<number>(1)
  const money = ref<number>(0)
  const activeEncounter = ref<any>(null)
  const inBattle = ref(false)
  
  // Computed
  const teamSize = computed(() => team.value.length)
  const activeTeamPokemon = computed(() => 
    team.value.filter(p => p.status_condition === 'healthy')
  )
  const hasActivePokemon = computed(() => activeTeamPokemon.value.length > 0)
  
  // Actions
  function setRun(run: Run) {
    activeRun.value = {
      ...run,
      id: run.id ?? run.run_id,
      run_id: run.run_id ?? run.id,
    }
    currentFloor.value = run.current_floor ?? 1
    money.value = run.money ?? 0
  }
  
  function setTeam(pokemon: PlayerPokemon[]) {
    team.value = pokemon
  }
  
  function addToTeam(pokemon: PlayerPokemon) {
    if (team.value.length >= 6) return false
    team.value.push(pokemon)
    return true
  }
  
  function updatePokemon(id: string, updates: Partial<PlayerPokemon>) {
    const idx = team.value.findIndex(p => p.id === id)
    if (idx >= 0) {
      team.value[idx] = { ...team.value[idx], ...updates }
    }
  }
  
  function setEncounter(encounter: any) {
    activeEncounter.value = encounter
  }
  
  function setInBattle(value: boolean) {
    inBattle.value = value
  }
  
  function advanceFloor() {
    currentFloor.value += 1
    if (activeRun.value) {
      activeRun.value.current_floor = currentFloor.value
    }
  }
  
  function addMoney(amount: number) {
    money.value += amount
    if (activeRun.value) {
      activeRun.value.money = money.value
    }
  }
  
  function clearRun() {
    activeRun.value = null
    team.value = []
    currentFloor.value = 1
    money.value = 0
    activeEncounter.value = null
    inBattle.value = false
  }
  
  return {
    activeRun,
    team,
    currentFloor,
    money,
    activeEncounter,
    inBattle,
    teamSize,
    activeTeamPokemon,
    hasActivePokemon,
    setRun,
    setTeam,
    addToTeam,
    updatePokemon,
    setEncounter,
    setInBattle,
    advanceFloor,
    addMoney,
    clearRun,
  }
})
