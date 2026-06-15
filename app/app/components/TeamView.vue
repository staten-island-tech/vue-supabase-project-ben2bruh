<template>
  <div class="team-view">
    <h2>Team</h2>
    <div v-if="team.length === 0" class="empty">No Pokémon in team</div>
    <div v-else class="team-grid">
      <button
        v-for="(pokemon, idx) in team"
        :key="idx"
        class="team-slot"
        :class="{ 
          'selected': selected === idx,
          'fainted': pokemon.status_condition === 'fainted'
        }"
        @click="$emit('select', idx, pokemon)"
      >
        <img
          v-if="getSpriteUrl(pokemon.species_id)"
          :src="getSpriteUrl(pokemon.species_id)"
          :alt="pokemon.name"
          class="slot-sprite"
        />
        <div class="slot-info">
          <div class="slot-name">{{ pokemon.name }}</div>
          <div class="slot-level">Lv {{ pokemon.level }}</div>
          <div class="slot-hp">{{ pokemon.current_hp }}/{{ pokemon.max_hp }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import { getSpeciesById } from '../utils/gen1-pokemon'

interface Pokemon {
  id: string
  species_id: number
  name: string
  level: number
  current_hp: number
  max_hp: number
  status_condition: string
}

interface Props {
  team: Pokemon[]
  selected?: number
}

const props = withDefaults(defineProps<Props>(), {
  selected: -1,
})

const emit = defineEmits<{
  select: [index: number, pokemon: Pokemon]
}>()

function getSpriteUrl(speciesId: number): string {
  const species = getSpeciesById(speciesId)
  return species?.spriteUrl ?? ''
}
</script>

<style scoped>
.team-view {
  background: #2a1a0e;
  border: 2px solid #c0392b;
  border-radius: 8px;
  padding: 12px;
  color: #f0e6c8;
  font-family: 'Fredoka One', cursive;
}

.team-view h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  border-bottom: 2px solid #c0392b;
  padding-bottom: 6px;
}

.empty {
  text-align: center;
  opacity: 0.6;
  padding: 20px;
}

.team-grid {
  display: grid;
  gap: 8px;
}

.team-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1a1a2e;
  border: 2px solid #666;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #f0e6c8;
  font-family: inherit;
  font-size: 12px;
}

.team-slot:hover {
  border-color: #c0392b;
  background: #2a1a3e;
}

.team-slot.selected {
  border-color: #2ecc71;
  background: #1a3a1e;
}

.team-slot.fainted {
  opacity: 0.5;
  background: #3a1a1a;
}

.slot-sprite {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}

.slot-info {
  flex: 1;
}

.slot-name {
  font-weight: bold;
  font-size: 12px;
}

.slot-level {
  font-size: 10px;
  opacity: 0.8;
}

.slot-hp {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 2px;
}
</style>
