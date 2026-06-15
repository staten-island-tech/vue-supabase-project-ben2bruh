<template>
  <div class="starter-selection-container">
    <h2>Choose Your Starter</h2>
    <p>Select a Pokémon to begin your roguelike adventure!</p>
    
    <div class="starters-grid">
      <button
        v-for="starter in starters"
        :key="starter.id"
        class="starter-card"
        :disabled="isLoading"
        @click="selectStarter(starter)"
      >
        <img :src="starter.spriteUrl" :alt="starter.name" />
        <h3>{{ starter.name }}</h3>
        <div class="type-badges">
          <span v-for="type in starter.types" :key="type" class="type-badge" :class="`type-${type}`">
            {{ type }}
          </span>
        </div>
        <div class="base-stats">
          <div>HP: {{ starter.baseStats.hp }}</div>
          <div>ATK: {{ starter.baseStats.attack }}</div>
          <div>DEF: {{ starter.baseStats.defense }}</div>
        </div>
      </button>
    </div>
    
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { starters } from '../utils/gen1-pokemon'

const emit = defineEmits<{
  select: [starter: typeof starters[0]]
}>()

const isLoading = ref(false)
const error = ref('')

onMounted(() => {
  // starters are already loaded from the utility
})

async function selectStarter(starter: typeof starters[0]) {
  isLoading.value = true
  error.value = ''
  
  try {
    // Emit the selected starter to parent component
    emit('select', starter)
  } catch (err: any) {
    error.value = err?.message ?? 'Failed to select starter'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.starter-selection-container {
  padding: 20px;
  text-align: center;
  color: #f0e6c8;
  font-family: 'Fredoka One', cursive;
}

.starter-selection-container h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #c0392b;
  text-shadow: 2px 2px 0 #7b1a11;
}

.starter-selection-container p {
  margin: 0 0 20px 0;
  opacity: 0.9;
}

.starters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.starter-card {
  background: #2a1a0e;
  border: 3px solid #c0392b;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: #f0e6c8;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.starter-card:hover:not(:disabled) {
  background: #3a2a1e;
  border-color: #e74c3c;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(192, 57, 43, 0.3);
}

.starter-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.starter-card img {
  width: 96px;
  height: 96px;
  image-rendering: pixelated;
  display: block;
}

.starter-card h3 {
  margin: 0;
  font-size: 16px;
}

.type-badges {
  display: flex;
  gap: 4px;
  justify-content: center;
  flex-wrap: wrap;
}

.type-badge {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: bold;
  text-transform: uppercase;
  display: inline-block;
}

.type-fire { background: #f08030; color: #000; }
.type-water { background: #6890f0; color: #fff; }
.type-grass { background: #78c850; color: #000; }
.type-electric { background: #f8d030; color: #000; }
.type-poison { background: #a040a0; color: #fff; }

.base-stats {
  font-size: 11px;
  opacity: 0.8;
  display: grid;
  gap: 2px;
}

.error-message {
  color: #e74c3c;
  margin-top: 16px;
  padding: 12px;
  background: rgba(231, 76, 60, 0.2);
  border-radius: 4px;
}
</style>

