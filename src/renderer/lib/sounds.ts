let currentAudio: HTMLAudioElement | null = null

export function playSound(path: string): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  currentAudio = new Audio(path)
  currentAudio.volume = 0.5
  currentAudio.play().catch(console.error)
}

export function stopSound(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}
