/**
 * Sound Manager for UNO Real.
 * Uses the Web Audio API to synthesize clean, organic card game sound effects
 * directly in the browser, removing the need for external asset downloads.
 */

export type SoundEvent = 
  | 'card_play'
  | 'card_place'
  | 'card_draw'
  | 'shuffle'
  | 'uno'
  | 'uno_call'
  | 'victory'
  | 'win'
  | 'join'
  | 'player_join'
  | 'leave'
  | 'player_leave'
  | 'reaction'
  | 'turn_start';

class SoundManager {
  private enabled: boolean = true;
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  /**
   * Plays the synthesized audio associated with the gameplay event.
   */
  public play(event: SoundEvent) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    
    // Resume context if suspended (browser security autoplay policies)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime;
      switch (event) {
        case 'card_play':
        case 'card_place': {
          // Soft physical felt thud (card landing on table felt)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);
          
          gain.gain.setValueAtTime(0.24, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.14);
          break;
        }
        case 'card_draw': {
          // Soft swoop friction slide (drawing a card)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(290, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
          
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        }
        case 'shuffle': {
          // Repeating cards rustling tick sequence
          for (let i = 0; i < 7; i++) {
            const time = now + i * 0.075;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(110 + Math.random() * 90, time);
            
            gain.gain.setValueAtTime(0.04, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.06);
          }
          break;
        }
        case 'uno':
        case 'uno_call': {
          // Friendly chime arpeggio
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, idx) => {
            const time = now + idx * 0.08;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.35);
          });
          break;
        }
        case 'win':
        case 'victory': {
          // Clean major scale chime fanfare
          const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          chords.forEach((freq, idx) => {
            const time = now + idx * 0.09;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.09, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.42);
          });
          break;
        }
        case 'join':
        case 'player_join': {
          // Warm ascending invite chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(261.63, now); // C4
          osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.22); // C5
          
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.24);
          break;
        }
        case 'leave':
        case 'player_leave': {
          // Soft descending chime
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.22); // C4
          
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.24);
          break;
        }
        case 'reaction': {
          // Cute bubble pop sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(390, now);
          osc.frequency.exponentialRampToValueAtTime(850, now + 0.08);
          
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.09);
          break;
        }
        case 'turn_start': {
          // Subtle organic wood-click tick tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
          
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
      }
    } catch (e) {
      console.warn('[SoundManager] Web Audio playback failed:', e);
    }
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
