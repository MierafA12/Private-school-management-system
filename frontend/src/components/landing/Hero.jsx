import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, ChevronDown } from 'lucide-react';

const Hero = () => {
  const videoRef  = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [muted,   setMuted]   = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play();  setPlaying(true);  }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(m => !m);
  };

  return (
    <header className="hero-section hero-section--video-bg">
      {/* Background video */}
      <div className="hero-video-bg">
        <video
          ref={videoRef}
          autoPlay loop muted={muted} playsInline
          className="hero-video-bg__video"
        >
          <source src="/videos/No-video-title-fdown.net.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-bg__overlay" />
      </div>

      {/* Centred content */}
      <div className="hero-content hero-content--centered">
        <h1 className="hero-title hero-title--light">
          One Platform.<br />Every Scholar. Every Term.
        </h1>
        <p className="hero-desc--light">
          Manage admissions, academics, fees, and parent communication —
          all from a single secure portal built for private schools.
        </p>
        <div className="hero-cta" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" className="btn btn-primary">
            Sign In to Portal
          </Link>
          <a href="#solutions" className="btn btn-secondary-outline hero-btn--glass">
            Explore Solutions
          </a>
        </div>
      </div>

      {/* Video controls */}
      <div className="hero-video-controls">
        <button type="button" onClick={togglePlay} className="video-ctrl-btn video-ctrl-btn--glass"
          title={playing ? 'Pause' : 'Play'} aria-label={playing ? 'Pause video' : 'Play video'}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button type="button" onClick={toggleMute} className="video-ctrl-btn video-ctrl-btn--glass"
          title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute audio' : 'Mute audio'}>
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator" aria-hidden="true">
        <ChevronDown size={20} />
      </div>
    </header>
  );
};

export default Hero;
