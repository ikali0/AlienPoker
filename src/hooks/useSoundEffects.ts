import { useCallback, useRef } from 'react';

type SoundType = 'deal' | 'flip' | 'hold' | 'win' | 'lose' | 'bust' | 'click' | 'coins';

// Simple Web Audio API sound generator
class SoundGenerator {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  playNoise(duration: number, volume = 0.1) {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  // Card dealing sound - quick swoosh
  playDeal() {
    this.playNoise(0.08, 0.15);
  }

  // Card flip sound
  playFlip() {
    this.playTone(800, 0.05, 'sine', 0.2);
    setTimeout(() => this.playTone(1200, 0.05, 'sine', 0.15), 30);
  }

  // Hold selection sound
  playHold() {
    this.playTone(600, 0.08, 'sine', 0.2);
  }

  // Win sound - ascending arpeggio
  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.25), i * 80);
    });
  }

  // Lose sound - descending tone
  playLose() {
    this.playTone(400, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(300, 0.3, 'sawtooth', 0.1), 100);
  }

  // Bust sound - harsh buzz
  playBust() {
    this.playTone(150, 0.4, 'sawtooth', 0.3);
    this.playTone(155, 0.4, 'sawtooth', 0.3);
    setTimeout(() => {
      this.playTone(100, 0.3, 'sawtooth', 0.2);
    }, 200);
  }

  // Click sound
  playClick() {
    this.playTone(1000, 0.03, 'sine', 0.15);
  }

  // Coins/payout sound
  playCoins() {
    const times = [0, 50, 100, 180, 280];
    times.forEach(delay => {
      setTimeout(() => {
        this.playTone(2000 + Math.random() * 500, 0.05, 'sine', 0.15);
      }, delay);
    });
  }
}

export function useSoundEffects(enabled: boolean) {
  const soundGen = useRef<SoundGenerator>(new SoundGenerator());

  const playSound = useCallback((type: SoundType) => {
    if (!enabled) return;

    switch (type) {
      case 'deal':
        soundGen.current.playDeal();
        break;
      case 'flip':
        soundGen.current.playFlip();
        break;
      case 'hold':
        soundGen.current.playHold();
        break;
      case 'win':
        soundGen.current.playWin();
        break;
      case 'lose':
        soundGen.current.playLose();
        break;
      case 'bust':
        soundGen.current.playBust();
        break;
      case 'click':
        soundGen.current.playClick();
        break;
      case 'coins':
        soundGen.current.playCoins();
        break;
    }
  }, [enabled]);

  return { playSound };
}
