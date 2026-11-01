"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, ExternalLink, AlertCircle } from "lucide-react";

interface CallAudioPlayerProps {
  src: string;
  callId?: string;
  contactName?: string;
  duration?: number | null;
  durationFormatted?: string | null;
  className?: string;
  compact?: boolean;
}

export function CallAudioPlayer({
  src,
  callId,
  contactName,
  duration,
  durationFormatted,
  className = "",
  compact = false,
}: CallAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Determine playback source URL
  const audioSource = fallbackUrl || src;

  useEffect(() => {
    // Reset state when src changes
    setIsPlaying(false);
    setCurrentTime(0);
    setLoadError(false);
    setFallbackUrl(null);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio play failed, trying internal proxy fallback:", err);
        // If external origin failed, try the internal streaming proxy
        if (callId && !fallbackUrl) {
          setFallbackUrl(`/api/calls/recording/${callId}`);
        } else {
          setLoadError(true);
        }
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleAudioError = () => {
    if (callId && !fallbackUrl) {
      // Automatically retry via internal proxy endpoint
      setFallbackUrl(`/api/calls/recording/${callId}`);
    } else {
      setLoadError(true);
      setIsPlaying(false);
    }
  };

  if (loadError) {
    return (
      <div className={`p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Could not stream audio directly.</span>
        </div>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1 text-[11px] shrink-0"
        >
          Open Link <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
        <audio
          ref={audioRef}
          src={audioSource}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleAudioError}
        />
        <button
          type="button"
          onClick={togglePlay}
          className={`h-7 w-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            isPlaying
              ? "bg-primary text-white scale-105 ring-2 ring-primary/40"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
          title={isPlaying ? "Pause" : "Play call recording"}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
        </button>

        <span className="font-mono text-[10px] font-bold text-foreground/70">
          {isPlaying ? formatSeconds(currentTime) : (durationFormatted || formatSeconds(audioDuration))}
        </span>

        {/* Animated equalizer bars when playing */}
        {isPlaying && (
          <div className="flex items-end gap-0.5 h-3.5 px-1">
            <span className="w-0.5 bg-primary rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
            <span className="w-0.5 bg-primary rounded-full animate-bounce h-3.5" style={{ animationDelay: "150ms" }} />
            <span className="w-0.5 bg-primary rounded-full animate-bounce h-2.5" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>
    );
  }

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div
      className={`p-3.5 rounded-2xl bg-linear-to-br from-primary/5 via-accent/30 to-background border border-primary/20 shadow-xs space-y-2.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={audioSource}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      {/* Header with status and equalizer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? "bg-emerald-500" : "bg-foreground/30"}`} />
          </span>
          <span className="font-bold text-[11px] text-foreground/80">
            {isPlaying ? "Playing Audio Recording" : "Call Audio Recording"}
          </span>
          {contactName && (
            <span className="text-[10px] text-foreground/40 font-medium">· {contactName}</span>
          )}
        </div>

        {/* Animated soundwaves */}
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-4 px-1.5 py-0.5 rounded-md bg-emerald-500/10">
            <span className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
            <span className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: "150ms" }} />
            <span className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-2" style={{ animationDelay: "300ms" }} />
            <span className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-3" style={{ animationDelay: "75ms" }} />
            <span className="w-0.5 bg-emerald-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: "220ms" }} />
          </div>
        ) : (
          <span className="font-mono text-[10px] text-foreground/50 font-semibold">
            {durationFormatted || formatSeconds(audioDuration)}
          </span>
        )}
      </div>

      {/* Scrubbable Seek Bar */}
      <div className="space-y-1">
        <div className="relative w-full h-2 bg-foreground/10 rounded-full overflow-hidden cursor-pointer">
          <div
            className="h-full bg-primary transition-all duration-75 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={audioDuration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </div>

        {/* Timestamps */}
        <div className="flex justify-between items-center text-[10px] font-mono text-foreground/50">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(audioDuration)}</span>
        </div>
      </div>

      {/* Playback Controls Toolbar */}
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`h-8 px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isPlaying
                ? "bg-primary text-white hover:bg-primary/90 ring-2 ring-primary/30"
                : "bg-primary text-white hover:opacity-95"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" /> Play Call
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTime(0);
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-colors"
            title="Restart audio from beginning"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Playback Speed Pill */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="h-8 px-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/70 font-mono text-[11px] font-bold cursor-pointer transition-colors"
            title="Change playback speed"
          >
            {playbackRate}x
          </button>

          {/* Mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5 cursor-pointer transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-amber-500" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Download Audio Button */}
        <a
          href={audioSource}
          download={`call-recording-${callId || "wcm"}.mp3`}
          target="_blank"
          rel="noreferrer"
          className="h-8 px-2.5 rounded-xl border border-border/50 bg-background/80 hover:bg-accent text-foreground/70 hover:text-foreground text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          title="Download MP3 recording file"
        >
          <Download className="h-3 w-3" />
          <span>MP3</span>
        </a>
      </div>
    </div>
  );
}
