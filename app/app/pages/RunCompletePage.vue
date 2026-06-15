<template>
  <div class="run-complete-container">
    <div class="result-panel">
      <h1>Run Complete!</h1>

      <div class="stats-display">
        <div class="stat-group">
          <span class="stat-label">Final Floor:</span>
          <span class="stat-value">{{ finalFloor }}</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">Total Money:</span>
          <span class="stat-value">{{ totalMoney }} 💰</span>
        </div>
        <div class="stat-group">
          <span class="stat-label">Team Size:</span>
          <span class="stat-value">{{ teamSize }} / 6</span>
        </div>
      </div>

      <div class="team-summary">
        <h2>Final Team</h2>
        <div class="summary-grid">
          <div v-for="pokemon in team" :key="pokemon.id" class="team-summary-card">
            <img
              :src="getSpeciesSprite(pokemon.species_id)"
              :alt="pokemon.name"
              class="summary-sprite"
            />
            <div class="summary-name">{{ pokemon.name }}</div>
            <div class="summary-level">Lv {{ pokemon.level }}</div>
            <div class="summary-status" :class="pokemon.status_condition">
              {{ pokemon.status_condition }}
            </div>
          </div>
        </div>
      </div>

      <div class="buttons-group">
        <button class="return-btn primary" @click="returnHome">Return to Home</button>
        <button class="return-btn secondary" @click="startNewRun">Start New Run</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getSpeciesById } from '../utils/gen1-pokemon'

const router = useRouter()
const route = useRoute()

interface Pokemon {
  id: string
  species_id: number
  name: string
  level: number
  status_condition: string
}

const finalFloor = ref(1)
const totalMoney = ref(0)
const team = ref<Pokemon[]>([])

const teamSize = computed(() => team.value.length)

onMounted(() => {
  // Get data from route params or query
  finalFloor.value = parseInt(route.query.floor as string) || 1
  totalMoney.value = parseInt(route.query.money as string) || 0

  // Team data would be passed or fetched from the run state
  // For now, we just display what we have
})

function getSpeciesSprite(speciesId: number): string {
  const species = getSpeciesById(speciesId)
  return species?.spriteUrl ?? ''
}

function returnHome() {
  router.push('/')
}

function startNewRun() {
  router.push('/StartPage')
}
</script>

<style scoped>
.run-complete-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3a9e4f 0%, #1a5a2f 100%);
  font-family: 'Fredoka One', cursive;
  color: #f0e6c8;
  padding: 20px;
}

.result-panel {
  background: #2a1a0e;
  border: 4px solid #c0392b;
  border-radius: 12px;
  padding: 40px;
  max-width: 800px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.result-panel h1 {
  margin: 0 0 20px 0;
  font-size: 36px;
  text-align: center;
  color: #2ecc71;
  text-shadow: 2px 2px 0 #000;
}

.stats-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  background: #1a1a2e;
  padding: 20px;
  border-radius: 8px;
}

.stat-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.7;
  text-transform: uppercase;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2ecc71;
}

.team-summary {
  margin-bottom: 32px;
}

.team-summary h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  border-bottom: 2px solid #c0392b;
  padding-bottom: 8px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
}

.team-summary-card {
  background: #1a1a2e;
  border: 2px solid #666;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-sprite {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
}

.summary-name {
  font-size: 12px;
  font-weight: bold;
}

.summary-level {
  font-size: 10px;
  opacity: 0.8;
}

.summary-status {
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 2px;
  background: #2ecc71;
  color: #000;
  text-transform: uppercase;
}

.summary-status.fainted {
  background: #e74c3c;
  color: #fff;
}

.buttons-group {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.return-btn {
  padding: 12px 24px;
  border: 2px solid #c0392b;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
  text-transform: uppercase;
}

.return-btn.primary {
  background: #2ecc71;
  color: #000;
}

.return-btn.primary:hover {
  background: #27ae60;
  border-color: #2ecc71;
}

.return-btn.secondary {
  background: #c0392b;
  color: #f0e6c8;
}

.return-btn.secondary:hover {
  background: #e74c3c;
  border-color: #2ecc71;
}
</style>
