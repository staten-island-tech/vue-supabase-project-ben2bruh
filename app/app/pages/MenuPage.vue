<template>
  <div class="scene">
    <div class="sky">
      <div class="sky-lines"></div>
      <div class="logo">
        <span class="logo-text">PokéRoGue</span>
      </div>
    </div>
    <div class="grass">
      <div class="grass-lines"></div>
      <div class="panel">
        <button class="poke-btn" @click="goToLogin">Start Run</button>
        <button class="poke-btn" @click="goToRegister">Load Run</button>
        <button class="poke-btn" @click="goToRegister"></button>
      </div>
    </div>

    <div class="ground-bar"></div>

    <div class="footer-bar"></div>
    <div class="footer-bar-bottom"></div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();

const goToLogin = (): void => {
  router.push("/LoginPage");
};

const goToRegister = (): void => {
  router.push("/RegisterPage");
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap");

.scene {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: "Fredoka One", cursive;
  overflow: hidden;
}
.sky {
  flex: 2;
  background: #7ec8e3;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sky-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 7px,
    rgba(255, 255, 255, 0.12) 7px,
    rgba(255, 255, 255, 0.12) 8px
  );
  pointer-events: none;
}
.logo {
  position: relative;
  z-index: 2;
}
.logo-text {
  font-size: clamp(36px, 8vw, 64px);
  color: #c0392b;
  text-shadow:
    3px 3px 0 #7b1a11,
    -2px -2px 0 #2c3e7a,
    2px -2px 0 #2c3e7a,
    -2px 2px 0 #2c3e7a,
    0 4px 0 #000;
  letter-spacing: 2px;
}
.grass {
  flex: 3;
  position: relative;
  background: #3a9e4f;
  display: flex;
  align-items: center;
  justify-content: center;
}
.grass-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    180deg,
    transparent 0px,
    transparent 5px,
    rgba(0, 0, 0, 0.08) 5px,
    rgba(0, 0, 0, 0.08) 6px
  );
  pointer-events: none;
}
.panel {
  position: relative;
  z-index: 2;
  background: #1a1a2e;
  border: 4px solid #c0392b;
  box-shadow:
    0 0 0 2px #000,
    inset 0 0 0 2px #000;
  padding: 1.5rem 2rem;
  display: flex;
  gap: 1.25rem;
}
.panel::before {
  content: "";
  position: absolute;
  inset: 3px;
  border: 2px solid #8b1a11;
  pointer-events: none;
}
.poke-btn {
  font-family: "Fredoka One", cursive;
  font-size: 22px;
  padding: 12px 32px;
  background: #2a1a0e;
  color: #f0e6c8;
  border: 3px solid #c0392b;
  box-shadow: 0 4px 0 #8b1a11;
  cursor: pointer;
  letter-spacing: 1px;
  transition:
    transform 0.08s,
    box-shadow 0.08s;
}
.poke-btn:hover {
  background: #3a2510;
  border-color: #e74c3c;
}
.poke-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #8b1a11;
}
.ground-bar {
  height: 18px;
  background: #8b1a11;
  border-top: 3px solid #c0392b;
  position: relative;
}
.ground-bar::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #5a0e0e;
}
.footer-bar {
  background: #111122;
  padding: 1rem 2rem;
  text-align: center;
}
.footer-text {
  color: #e0e0e0;
  font-size: clamp(14px, 2vw, 20px);
  letter-spacing: 1px;
}
.footer-bar-bottom {
  height: 8px;
  background: #8b1a11;
  border-top: 2px solid #c0392b;
}
</style>
