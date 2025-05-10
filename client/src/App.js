import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreVertical,
} from "lucide-react";

/************************ utils ************************/
const extractId = (input = "") => {
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  const m = input.match(/(?:shorts\/|watch\?v=|embed\/|v\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
};

/******************** control rail *********************/
const ControlRail = ({ paused, muted, onTogglePlay, onToggleMute }) => {
  const Btn = ({ onClick, children }) => (
    <button onClick={onClick} className="active:scale-95 select-none">
      {children}
    </button>
  );
  return (
    <div className="z-20 pointer-events-auto absolute right-3 bottom-28 flex flex-col items-center gap-5 text-white drop-shadow">
      <Btn onClick={onTogglePlay}>{paused ? "▶️" : "⏸️"}</Btn>
      <Btn onClick={onToggleMute}>{muted ? "🔈" : "🔇"}</Btn>
      {[ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical].map((I, i) => (
        <Btn key={i} onClick={() => {}}>
          <I size={30} strokeWidth={1.5} />
        </Btn>
      ))}
    </div>
  );
};

/******************** single card **********************/
const ShortCard = ({ video, observer }) => {
  const id = extractId(video.videoId || video.url || "");
  if (!id) return null;

  const origin = encodeURIComponent(window.location.origin);
  const src = `https://www.youtube.com/embed/${id}?playlist=${id}&loop=1&playsinline=1&autoplay=1&mute=1&controls=0&enablejsapi=1&origin=${origin}&modestbranding=1&rel=0`;

  const frameRef = useRef(null);
  const cardRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  /* observer hook */
  useEffect(() => {
    if (cardRef.current && observer) observer.observe(cardRef.current);
    return () => {
      if (cardRef.current && observer) observer.unobserve(cardRef.current);
    };
  }, [observer]);

  /* helper to post commands */
  const post = useCallback((cmd) => {
    frameRef.current?.contentWindow?.postMessage(cmd, "*");
  }, []);

  const playCmd = '{"event":"command","func":"playVideo","args":""}';
  const pauseCmd = '{"event":"command","func":"pauseVideo","args":""}';
  const unMuteCmd = '{"event":"command","func":"unMute","args":""}';
  const muteCmd = '{"event":"command","func":"mute","args":""}';

  const togglePlay = () => {
    post(paused ? playCmd : pauseCmd);
    setPaused((p) => !p);
  };

  const toggleMute = () => {
    post(muted ? unMuteCmd : muteCmd);
    setMuted((m) => !m);
  };

  /* tap overlay */
  const handleTap = () => {
    if (paused) {
      post(playCmd);
      setPaused(false);
    } else {
      post(pauseCmd);
      setPaused(true);
    }
    if (muted) {
      post(unMuteCmd);
      setMuted(false);
    }
  };

  return (
    <div ref={cardRef} className="short-card relative h-screen w-screen flex-shrink-0 snap-start overflow-hidden">
      {/* tap overlay */}
      <div className="absolute inset-0 z-10" onClick={handleTap} />

      <iframe
        ref={frameRef}
        src={src}
        title={video.title || "Short"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          height: "100vh",
          width: "calc(100vh * 0.5625)",
          pointerEvents: "none",
        }}
      />

      {/* readability gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent" />

      <ControlRail paused={paused} muted={muted} onTogglePlay={togglePlay} onToggleMute={toggleMute} />

      {/* metadata */}
      <div className="pointer-events-none z-20 absolute bottom-5 left-4 right-24 flex items-center gap-3 text-white">
        <img src={video.channelThumb || "/placeholder-avatar.png"} alt="avatar" className="pointer-events-auto w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <div className="font-semibold leading-tight truncate max-w-[180px]">{video.channelName || "Channel"}</div>
          <div className="text-sm opacity-90 leading-tight truncate max-w-[180px]">{video.title || "Untitled"}</div>
        </div>
        <button className="pointer-events-auto ml-2 px-4 py-1 bg-white text-black rounded-full text-sm font-semibold active:scale-95">Subscribe</button>
      </div>
    </div>
  );
};

/******************** main feed ***********************/
export default function App() {
  const [videos, setVideos] = useState([]);
  const observerRef = useRef(null);

  /* fetch videos */
  useEffect(() => {
    const apiHost = process.env.REACT_APP_API_HOST || window.location.hostname;
    axios.get(`http://${apiHost}:5000/api/videos`).then(r => setVideos(r.data || [])).catch(console.error);
  }, []);

  /* create observer once */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const frame = entry.target.querySelector("iframe");
        if (!frame) return;
        const play = '{"event":"command","func":"playVideo","args":""}';
        const pause = '{"event":"command","func":"pauseVideo","args":""}';
        frame.contentWindow?.postMessage(entry.isIntersecting ? play : pause, "*");
      });
    }, { threshold: 0.6 });
    return () => observerRef.current.disconnect();
  }, []);

  if (!videos.length) return <div className="flex items-center justify-center w-screen h-screen bg-black text-white">Loading…</div>;

  return (
    <div className="flex flex-col snap-y snap-mandatory overflow-y-scroll touch-pan-y overscroll-y-contain h-screen w-screen bg-black">
      {videos.map((v, i) => <ShortCard key={v._id || i} video={v} observer={observerRef.current} />)}
    </div>
  );
}
