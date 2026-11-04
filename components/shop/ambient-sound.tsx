"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Mysore Studio Ambient Soundscape
 * Synthesizes warm monsoon rain on clay tiles + resonant wood chisel taps
 * via Web Audio API. 0 network requests, 0 Blob storage, 0 bandwidth.
 */
export function AmbientSound({ className }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAudio = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const ctx = audioCtxRef.current;
    const gain = rainGainRef.current;
    if (ctx && gain && ctx.state === "running") {
      try {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        setTimeout(() => {
          if (ctx.state === "running") {
            ctx.suspend().catch(() => {});
          }
        }, 360);
      } catch {
        ctx.suspend().catch(() => {});
      }
    }
    setIsPlaying(false);
  };

  const startAudio = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      // Generate 2 seconds of warm pink noise buffer (Mysore rain)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.153852;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(920, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.001, ctx.currentTime);
      rainGain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.2);

      whiteNoise.connect(lowpass);
      lowpass.connect(rainGain);
      rainGain.connect(ctx.destination);
      whiteNoise.start(0);

      rainGainRef.current = rainGain;

      // Subtle mallet / chisel tap resonance every ~3.6s
      intervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
        try {
          const osc = ctx.createOscillator();
          const tapGain = ctx.createGain();
          osc.type = "triangle";
          const startFreq = 185 + Math.random() * 40;
          osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.08);

          tapGain.gain.setValueAtTime(0.045, ctx.currentTime);
          tapGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

          osc.connect(tapGain);
          tapGain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        } catch {
          // ignore transient osc errors
        }
      }, 3600);

      setIsPlaying(true);
    } catch (err) {
      console.warn("Ambient audio unavailable:", err);
    }
  };

  const toggle = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "group inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs tracking-wide transition-all duration-200 cursor-pointer",
        isPlaying
          ? "border-pour bg-pour/10 text-ink shadow-[0_0_12px_rgba(42,68,196,0.18)]"
          : "border-line bg-gesso/60 text-ink-soft hover:border-line-strong hover:text-ink",
        className,
      )}
      aria-label={isPlaying ? "Mute Mysore atelier ambient sound" : "Listen to Mysore atelier ambient sound"}
      title="Synthesized warm studio monsoon rain & chisel resonance (0 bandwidth)"
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
        <span
          className={cn(
            "w-[2px] rounded-full bg-current transition-all",
            isPlaying ? "eq-bar h-3" : "h-1.5 opacity-60",
          )}
        />
        <span
          className={cn(
            "w-[2px] rounded-full bg-current transition-all",
            isPlaying ? "eq-bar h-3" : "h-2.5 opacity-60",
          )}
        />
        <span
          className={cn(
            "w-[2px] rounded-full bg-current transition-all",
            isPlaying ? "eq-bar h-3" : "h-1 opacity-60",
          )}
        />
      </span>
      <span className="caption font-medium tracking-tight">
        {isPlaying ? "Studio audio on" : "Studio sound"}
      </span>
    </button>
  );
}

