import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Volume2, VolumeX, ChevronDown } from 'lucide-react';

const Hero = () => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <header className="hero-section hero-section--video-bg">
      {/* Full-screen background video */}
      <div className="hero-video-bg">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="hero-video-bg__video"
        >
          <source src="/videos/No-video-title-fdown.net.mp4" type="video/mp4" />
          Your browser does not support HTML5 video.
        </video>
        <div className="hero-video-bg__overlay" />
      </div>

      {/* Floating content */}
      <div className="hero-content hero-content--centered">
        <h1 className="hero-title hero-title--light">
          The Complete Educational Platform 
        </h1>
        <p className="hero-desc hero-desc--light">
          Streamline your entire academic journey from a single, secure cloud platform.
        </p>
        <div className="hero-cta">
          <Link to="/login" className="btn btn-primary">
            Sign In to Portal
          </Link>
          <a href="#solutions" className="btn btn-secondary-outline hero-btn--glass">
            Explore Features
          </a>
        </div>
      </div>

      {/* Video controls (bottom-left) */}
      <div className="hero-video-controls">
        <button
          type="button"
          onClick={togglePlay}
          className="video-ctrl-btn video-ctrl-btn--glass"
          title={isPlaying ? "Pause video" : "Play video"}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="video-ctrl-btn video-ctrl-btn--glass"
          title={isMuted ? "Unmute audio" : "Mute audio"}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-indicator">
        <ChevronDown size={20} />
      </div>
    </header>
  );
};

export default Hero;
