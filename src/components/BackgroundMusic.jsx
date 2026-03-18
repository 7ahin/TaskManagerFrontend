import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { 
  MusicalNoteIcon, 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from "react-i18next";
import './BackgroundMusic.css';

const BackgroundMusic = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const [trackId, setTrackId] = useState('track1');
  const [isLooping, setIsLooping] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const audioRef = useRef(null);
  const containerRef = useRef(null);
  const seekValueRef = useRef(0);
  const lastNonZeroVolumeRef = useRef(0.2);

  const tracks = useMemo(
    () => [
      {
        id: 'track1',
        name: t("music.tracks.track1.name"),
        artist: t("music.tracks.track1.artist"),
        src: '/music/track1.mp3',
        cover: '/music/track1.jpg',
      },
      {
        id: 'track2',
        name: t("music.tracks.track2.name"),
        artist: t("music.tracks.track2.artist"),
        src: '/music/track2.mp3',
        cover: '/music/track2.jpg',
      },
    ],
    [t]
  );

  const activeTrack = useMemo(() => tracks.find((t) => t.id === trackId) || tracks[0], [tracks, trackId]);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    if (Number.isFinite(volume) && volume > 0) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = isLooping;
  }, [isLooping]);

  const safePlay = useCallback((audio) => {
    try {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => undefined);
      }
    } catch {
      return;
    }
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    safePlay(audio);
  }, [safePlay]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        if (volume > 0) lastNonZeroVolumeRef.current = volume;
        setVolume(0);
      } else {
        const restore = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : 0.2;
        setVolume(restore);
      }
      return next;
    });
  }, [volume]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsTrackMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTrackChange = useCallback((nextId, options = {}) => {
    const audio = audioRef.current;
    const nextTrack = tracks.find((t) => t.id === nextId);
    const shouldAutoPlay = options?.autoPlay ?? (audio ? !audio.paused : false);

    setDuration(0);
    setCurrentTime(0);
    setSeekValue(0);
    seekValueRef.current = 0;
    setTrackId(nextId);
    setIsTrackMenuOpen(false);

    if (!audio || !nextTrack?.src) return;
    audio.pause();
    audio.currentTime = 0;
    audio.src = nextTrack.src;
    audio.volume = volume;
    audio.muted = isMuted;
    audio.loop = isLooping;
    audio.load();
    if (shouldAutoPlay) {
      let didRequestPlay = false;
      const requestPlay = () => {
        if (didRequestPlay) return;
        didRequestPlay = true;
        safePlay(audio);
      };
      audio.addEventListener("canplay", requestPlay, { once: true });
      if (audio.readyState >= 3) requestPlay();
    }
  }, [isLooping, isMuted, safePlay, tracks, volume]);

  const goToTrackRelative = useCallback(
    (delta, options = {}) => {
      if (!tracks?.length) return;
      const currentIndex = Math.max(0, tracks.findIndex((t) => t.id === trackId));
      const nextIndex = (currentIndex + delta + tracks.length) % tracks.length;
      const nextId = tracks[nextIndex]?.id;
      if (nextId) handleTrackChange(nextId, options);
    },
    [handleTrackChange, trackId, tracks]
  );

  const handlePrev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setSeekValue(0);
      seekValueRef.current = 0;
      return;
    }
    goToTrackRelative(-1);
  }, [goToTrackRelative]);

  const handleNext = useCallback(() => {
    goToTrackRelative(1);
  }, [goToTrackRelative]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);
      if (!isSeeking) setCurrentTime(audio.currentTime || 0);
    };

    const handleTimeUpdate = () => {
      if (isSeeking) return;
      setCurrentTime(audio.currentTime || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      if (isLooping) {
        setIsPlaying(false);
        return;
      }
      goToTrackRelative(1, { autoPlay: true });
    };
    const handleDurationChange = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextDuration);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('durationchange', handleDurationChange);

    handleLoadedMetadata();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('durationchange', handleDurationChange);
    };
  }, [goToTrackRelative, isLooping, isSeeking]);

  const commitSeek = useCallback(
    (nextSeconds) => {
      const audio = audioRef.current;
      if (!audio) return;
      const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
      const clamped = Math.max(0, Math.min(max, nextSeconds));
      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration]
  );

  useEffect(() => {
    if (!isSeeking) return;

    const finalize = () => {
      setIsSeeking(false);
      commitSeek(seekValueRef.current);
    };

    window.addEventListener('pointerup', finalize, { once: true });
    window.addEventListener('pointercancel', finalize, { once: true });

    return () => {
      window.removeEventListener('pointerup', finalize);
      window.removeEventListener('pointercancel', finalize);
    };
  }, [commitSeek, isSeeking]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e) => {
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(e.target)) return;
      setIsOpen(false);
      setIsTrackMenuOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsTrackMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const formatTime = useCallback((seconds) => {
    const s = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  }, []);

  const coverStyle = useMemo(() => {
    const cover = activeTrack?.cover;
    if (!cover) return undefined;
    return {
      backgroundImage: `url(${cover}), radial-gradient(circle at 30% 30%, rgba(129, 140, 248, 0.9), rgba(2, 6, 23, 0.2))`,
    };
  }, [activeTrack?.cover]);

  return (
    <div 
      className="music-player-container"
      ref={containerRef}
    >
      <div 
        className={`music-toggle-btn ${isPlaying ? 'playing' : ''}`}
        data-tooltip={t("music.ui.player")}
        title={t("music.ui.player")}
        role="button"
        tabIndex={0}
        onClick={() =>
          setIsOpen((v) => {
            const next = !v;
            if (!next) setIsTrackMenuOpen(false);
            return next;
          })
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen((v) => {
              const next = !v;
              if (!next) setIsTrackMenuOpen(false);
              return next;
            });
          }
        }}
      >
        <MusicalNoteIcon className="icon-svg" />
      </div>

      <div className={`music-controls-panel ${isOpen ? 'visible' : ''}`}>
        <div className="music-card">
          <div className={`music-album ${activeTrack?.cover ? "has-cover" : ""} ${isPlaying ? "spinning" : ""}`} style={coverStyle} aria-hidden="true" />

          <div className="music-body">
            <div className="music-meta-row">
              <div className="music-meta">
                <div className="music-track-dropdown">
                  <button
                    type="button"
                    className="music-track-trigger"
                    onClick={() => setIsTrackMenuOpen((v) => !v)}
                    aria-haspopup="listbox"
                    aria-expanded={isTrackMenuOpen}
                    data-tooltip={t("music.ui.changeTrack")}
                  >
                    <span className="music-track-title">{activeTrack?.name}</span>
                    <ChevronDownIcon className={`music-track-chevron ${isTrackMenuOpen ? "open" : ""}`} aria-hidden="true" />
                  </button>

                  {isTrackMenuOpen ? (
                    <>
                      <div className="music-dropdown-capture" onClick={() => setIsTrackMenuOpen(false)} aria-hidden="true" />
                      <div className="music-dropdown-menu" role="listbox" aria-label={t("music.ui.selectTrack")}>
                        {tracks.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            role="option"
                            aria-selected={t.id === trackId}
                            className={`music-dropdown-item ${t.id === trackId ? "selected" : ""}`}
                            onClick={() => handleTrackChange(t.id)}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="music-track-artist">{activeTrack?.artist}</div>
              </div>

              <div className="music-volume-popover">
                <button
                  className="music-control-btn"
                  onClick={toggleMute}
                  title={isMuted ? t("music.controls.unmute") : t("music.controls.mute")}
                  aria-label={isMuted ? t("music.controls.unmute") : t("music.controls.mute")}
                  data-tooltip={isMuted ? t("music.controls.unmute") : t("music.controls.mute")}
                >
                  {isMuted ? <SpeakerXMarkIcon className="icon-sm" /> : <SpeakerWaveIcon className="icon-sm" />}
                </button>
                <div className="music-volume-panel" role="group" aria-label={t("music.controls.volume")}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    style={{
                      "--vol-percent": `${Math.min(100, Math.max(0, volume * 100))}%`,
                    }}
                    onChange={(e) => {
                      const next = parseFloat(e.target.value);
                      setVolume(next);
                      if (next <= 0) setIsMuted(true);
                      else if (isMuted) setIsMuted(false);
                    }}
                    className="volume-slider volume-slider-horizontal"
                    title={t("music.controls.volume")}
                    aria-label={t("music.controls.volume")}
                  />
                </div>
              </div>
            </div>

            <div className="music-progress-area">
              <div className="music-progress-bar">
                <div className="music-wave-preview" aria-hidden="true">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <span key={i} className="music-wave-bar" />
                  ))}
                </div>
                <input
                  className="music-progress-slider"
                  type="range"
                  min="0"
                  max={duration > 0 ? duration : 1}
                  step="0.01"
                  value={isSeeking ? seekValue : currentTime}
                  style={{
                    "--seek-percent": `${Math.min(
                      100,
                      Math.max(0, duration > 0 ? ((isSeeking ? seekValue : currentTime) / duration) * 100 : 0)
                    )}%`,
                  }}
                  disabled={duration <= 0}
                  onPointerDown={() => {
                    seekValueRef.current = currentTime;
                    setSeekValue(currentTime);
                    setIsSeeking(true);
                  }}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    seekValueRef.current = next;
                    setSeekValue(next);
                  }}
                  aria-label={t("music.controls.seek")}
                />
              </div>
              <div className="music-time">
                <span>{formatTime(isSeeking ? seekValue : currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="music-controls-row">
              <button
                className="music-control-btn"
                onClick={handlePrev}
                title={t("music.controls.previous")}
                aria-label={t("music.controls.previous")}
                data-tooltip={t("music.controls.previous")}
              >
                <ChevronLeftIcon className="icon-sm" />
              </button>

              <button
                className="music-control-btn play-pause"
                onClick={togglePlay}
                title={isPlaying ? t("music.controls.pause") : t("music.controls.play")}
                aria-label={isPlaying ? t("music.controls.pause") : t("music.controls.play")}
                data-tooltip={isPlaying ? t("music.controls.pause") : t("music.controls.play")}
              >
                {isPlaying ? <PauseIcon className="icon-sm" /> : <PlayIcon className="icon-sm" />}
              </button>

              <button
                className="music-control-btn"
                onClick={handleNext}
                title={t("music.controls.next")}
                aria-label={t("music.controls.next")}
                data-tooltip={t("music.controls.next")}
              >
                <ChevronRightIcon className="icon-sm" />
              </button>

              <button
                className={`music-control-btn loop-toggle ${isLooping ? "is-active" : ""}`}
                onClick={() => setIsLooping((v) => !v)}
                title={isLooping ? t("music.controls.loopOn") : t("music.controls.loopOff")}
                aria-label={isLooping ? t("music.controls.loopOn") : t("music.controls.loopOff")}
                aria-pressed={isLooping}
                data-tooltip={isLooping ? t("music.controls.loopOn") : t("music.controls.loopOff")}
              >
                <ArrowPathIcon className="icon-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={activeTrack?.src}
        loop={isLooping}
        preload="metadata"
      />
    </div>
  );
};

export default BackgroundMusic;
