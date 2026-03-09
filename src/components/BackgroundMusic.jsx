import React, { useState, useRef, useEffect } from 'react';
import { 
  MusicalNoteIcon, 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';
import './BackgroundMusic.css';
import musicFile from '../assets/music.mp3';

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                setIsPlaying(true);
            }).catch(e => console.error("Playback failed:", e));
        }
      }
    }
  };

  return (
    <div 
      className="music-player-container"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div 
        className={`music-toggle-btn ${isPlaying ? 'playing' : ''}`}
        title="Background Music"
      >
        <MusicalNoteIcon className="icon-svg" />
      </div>

      <div className={`music-controls-panel ${showControls ? 'visible' : ''}`}>
        <div className="music-header">
          <h3>Background Music</h3>
        </div>
          
        <div className="track-info">
          <span className="track-name">
            Now Playing: Background Track
          </span>
        </div>

        <div className="controls-row">
          <button 
            className="control-btn play-pause" 
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon className="icon-sm" /> : <PlayIcon className="icon-sm" />}
          </button>

          <div className="volume-control">
              <button className="control-btn mute-btn" onClick={() => setIsMuted(!isMuted)} title={isMuted ? "Unmute" : "Mute"}>
                {isMuted || volume === 0 ? <SpeakerXMarkIcon className="icon-sm" /> : <SpeakerWaveIcon className="icon-sm" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    if(parseFloat(e.target.value) > 0) setIsMuted(false);
                }}
                className="volume-slider"
                title="Volume"
              />
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={musicFile}
        loop 
        onEnded={() => {}}
      />
    </div>
  );
};

export default BackgroundMusic;
