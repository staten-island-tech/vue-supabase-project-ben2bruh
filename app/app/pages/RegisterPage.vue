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
        <h2 class="panel-title">Register</h2>

        <div class="field">
          <label class="field-label">Username or Email</label>
          <input
            v-model="email"
            type="text"
            class="poke-input"
            placeholder="ash@pokemon.com"
            autocomplete="off"
          />
        </div>

        <div class="field">
          <label class="field-label">Password</label>
          <input
            v-model="password"
            type="password"
            class="poke-input"
            placeholder="••••••••"
          />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <div class="btn-row">
          <button class="poke-btn btn-back" @click="router.push('HomePage')">
            Back
          </button>
          <button
            class="poke-btn btn-login"
            :disabled="loading"
            @click="register"
          >
            {{ loading ? "Loading..." : "Register" }}
          </button>
        </div>
      </div>
    </div>

    <div class="ground-bar"></div>

    <div class="footer-bar">
      <p class="footer-text">Please Register An Account And Login To Play!</p>
    </div>
    <div class="footer-bar-bottom"></div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref<string>("");
const password = ref<string>("");
const errorMsg = ref<string>("");
const loading = ref<boolean>(false);

const register = async (): Promise<void> => {
  errorMsg.value = "";
  loading.value = true;

  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (error) {
    errorMsg.value = error.message;
  } else {
    router.push("/LoginPage");
  }
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
  flex: 1;
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
  font-size: clamp(28px, 5vw, 48px);
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
  flex: 4;
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
  box-shadow: 0 0 0 2px #000;
  padding: 2rem;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.panel::before {
  content: "";
  position: absolute;
  inset: 3px;
  border: 2px solid #8b1a11;
  pointer-events: none;
}
.panel-title {
  color: #f0e6c8;
  font-size: 26px;
  text-align: center;
  margin: 0;
  letter-spacing: 1px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-label {
  color: #7ec8e3;
  font-size: 14px;
  letter-spacing: 1px;
}
.poke-input {
  background: #0a0a1a;
  border: 2px solid #3a3a6e;
  color: #e0e0ff;
  font-family: "Fredoka One", cursive;
  font-size: 18px;
  padding: 8px 12px;
  outline: none;
  transition: border-color 0.1s;
  caret-color: #e63946;
}
.poke-input:focus {
  border-color: #e63946;
}
.poke-input::placeholder {
  color: #3a3a6e;
}
.error-msg {
  color: #e63946;
  font-size: 13px;
  text-align: center;
  margin: 0;
}
.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 0.5rem;
}
.poke-btn {
  flex: 1;
  font-family: "Fredoka One", cursive;
  font-size: 20px;
  padding: 10px;
  border: 3px solid #c0392b;
  box-shadow: 0 4px 0 #8b1a11;
  cursor: pointer;
  letter-spacing: 1px;
  transition:
    transform 0.08s,
    box-shadow 0.08s;
}
.poke-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #8b1a11;
}
.poke-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-login {
  background: #2a1a0e;
  color: #f0e6c8;
}
.btn-login:hover:not(:disabled) {
  background: #3a2510;
  border-color: #e74c3c;
}
.btn-back {
  background: #1a1a2e;
  color: #7ec8e3;
  border-color: #3a3a6e;
}
.btn-back:hover {
  border-color: #7ec8e3;
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
