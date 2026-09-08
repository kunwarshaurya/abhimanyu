import { useEffect, useRef } from 'react';

const ALARM_SRC = '/sounds/critical-alarm.mp3';
const PULSE_DURATION = 1.5;   // seconds of audio to play per pulse
const SILENCE_GAP = 2500;     // ms of silence between pulses
const CYCLE_INTERVAL = (PULSE_DURATION * 1000) + SILENCE_GAP; // total cycle ~4000ms

/**
 * Plays a repeating short alarm pulse from the supplied MP3.
 * 
 * @param {boolean} active  — true while the Critical stop state is active
 * @param {boolean} muted   — true when the operator has muted the alarm
 */
export default function useAlarm(active, muted) {
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Create Audio element once
    if (!audioRef.current) {
      audioRef.current = new Audio(ALARM_SRC);
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;

    const playPulse = () => {
      if (muted) return;
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Browser may block autoplay until user interaction — silently ignore
      });
      // Stop the audio after PULSE_DURATION
      timeoutRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, PULSE_DURATION * 1000);
    };

    if (active && !muted) {
      // Play first pulse immediately
      playPulse();
      // Schedule repeating pulses
      intervalRef.current = setInterval(playPulse, CYCLE_INTERVAL);
    }

    return () => {
      // Cleanup: stop audio and clear timers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [active, muted]);
}
