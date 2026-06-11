/**
 * Sound Manager Architecture for UNO Real.
 * Exposes hooks for card games sound effects, prepared for future audio files.
 */

export type SoundEvent = 
  | 'card_play'
  | 'card_draw'
  | 'uno_call'
  | 'player_join'
  | 'player_leave'
  | 'victory'
  | 'reaction';

class SoundManager {
  private enabled: boolean = true;

  /**
   * Plays the sound effect associated with the gameplay event.
   * Currently logs to console, ready for HTML5 Audio integration.
   */
  public play(event: SoundEvent) {
    if (!this.enabled) return;
    console.log(`[SoundManager] Playing sound effect for event: "${event}"`);

    // Future implementation detail:
    // try {
    //   const audio = new Audio(`/sounds/${event}.mp3`);
    //   audio.volume = 0.5;
    //   audio.play().catch(() => {});
    // } catch (e) {}
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
export default soundManager;
