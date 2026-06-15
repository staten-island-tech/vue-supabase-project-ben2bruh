import { gsap } from 'gsap'

const DEFAULT_CHARS_PER_SECOND = 42

export function typeText(
  element: HTMLElement,
  message: string,
  charsPerSecond = DEFAULT_CHARS_PER_SECOND
): Promise<void> {
  return new Promise((resolve) => {
    const state = { count: 0 }
    const duration = Math.max(0.15, message.length / charsPerSecond)

    element.textContent = ''

    gsap.to(state, {
      count: message.length,
      duration,
      ease: 'none',
      onUpdate: () => {
        element.textContent = message.slice(0, Math.floor(state.count))
      },
      onComplete: () => {
        element.textContent = message
        resolve()
      },
    })
  })
}
