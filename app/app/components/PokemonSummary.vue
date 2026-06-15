<template>
  <div class="pokemon-card">
    <div class="card-header">
      <h3>{{ pokemon.name }}</h3>
      <span class="level-badge">Lv {{ pokemon.level }}</span>
    </div>

    <img v-if="spriteUrl" :src="spriteUrl" :alt="pokemon.name" class="sprite" />

    <div class="types">
      <span v-for="type in pokemon.types" :key="type" class="type-badge" :class="`type-${type}`">
        {{ type }}
      </span>
    </div>

    <div class="stats">
      <div class="stat-row">
        <span>HP:</span>
        <div class="stat-bar">
          <div class="stat-fill hp-fill" :style="{ width: hpPercent + '%' }"></div>
        </div>
        <span>{{ pokemon.current_hp }}/{{ pokemon.max_hp }}</span>
      </div>

      <div class="stat-row">
        <span>ATK:</span>
        <span class="stat-value">{{ pokemon.attack }}</span>
      </div>

      <div class="stat-row">
        <span>DEF:</span>
        <span class="stat-value">{{ pokemon.defense }}</span>
      </div>

      <div class="stat-row">
        <span>SP.ATK:</span>
        <span class="stat-value">{{ pokemon.sp_atk }}</span>
      </div>

      <div class="stat-row">
        <span>SP.DEF:</span>
        <span class="stat-value">{{ pokemon.sp_def }}</span>
      </div>

      <div class="stat-row">
        <span>SPD:</span>
        <span class="stat-value">{{ pokemon.speed }}</span>
      </div>
    </div>

    <div class="exp-info">
      <span>Experience: {{ pokemon.experience }}</span>
      <span>Status: {{ pokemon.status_condition }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getSpeciesById } from '../utils/gen1-pokemon'

interface Props {
  pokemon: {
    id?: string
    species_id?: number
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
    types?: string[]
    status_condition: string
  }
}

const props = defineProps<Props>()

const species = computed(() => getSpeciesById(props.pokemon.species_id ?? 0))

const spriteUrl = computed(() => species.value?.spriteUrl)

const hpPercent = computed(() => 
  Math.max(0, Math.floor((props.pokemon.current_hp / props.pokemon.max_hp) * 100))
)
</script>

<style scoped>
.pokemon-card {
  background: #2a1a0e;
  border: 3px solid #c0392b;
  border-radius: 8px;
  padding: 12px;
  max-width: 280px;
  color: #f0e6c8;
  font-family: 'Fredoka One', cursive;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 2px solid #c0392b;
  padding-bottom: 8px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.level-badge {
  background: #c0392b;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.sprite {
  width: 96px;
  height: 96px;
  display: block;
  margin: 8px auto;
  image-rendering: pixelated;
}

.types {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  justify-content: center;
}

.type-badge {
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
  text-transform: uppercase;
}

.type-fire { background: #f08030; color: #000; }
.type-water { background: #6890f0; color: #fff; }
.type-grass { background: #78c850; color: #000; }
.type-electric { background: #f8d030; color: #000; }
.type-ice { background: #98d8d8; color: #000; }
.type-fighting { background: #c03028; color: #fff; }
.type-poison { background: #a040a0; color: #fff; }
.type-ground { background: #e0c068; color: #000; }
.type-flying { background: #a890f0; color: #000; }
.type-psychic { background: #f85888; color: #fff; }
.type-bug { background: #a8b820; color: #000; }
.type-rock { background: #b8a038; color: #000; }
.type-ghost { background: #705898; color: #fff; }
.type-dragon { background: #7038f8; color: #fff; }
.type-dark { background: #705848; color: #fff; }
.type-steel { background: #b8b8d0; color: #000; }
.type-fairy { background: #ee99ac; color: #000; }
.type-normal { background: #a8a878; color: #000; }

.stats {
  background: #1a1a2e;
  border: 1px solid #c0392b;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.stat-row:last-child {
  margin-bottom: 0;
}

.stat-row span:first-child {
  width: 60px;
  min-width: 60px;
}

.stat-bar {
  flex: 1;
  height: 8px;
  background: #000;
  border: 1px solid #666;
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  background: #2ecc71;
}

.hp-fill {
  background: #e74c3c;
}

.stat-value {
  text-align: right;
  width: 30px;
}

.exp-info {
  font-size: 11px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  opacity: 0.8;
}
</style>
