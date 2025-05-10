import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Share2,
  MoreVertical,
} from "lucide-react";

/*****************************************************
 * Helper: extract YouTube 11‑char ID from a URL or raw ID
 *****************************************************/
function extractId(input = "") {
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  const m = input.match(
    /(?:shorts\/|watch\?v=|embed\/|v\/|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/*****************************************************
 * Control rail (play/pause, mute/unmute, icons)
 *****************************************************/
function ControlRail({ frameRef }) {
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  const post = (msg) =>
    frameRef.current?.contentWindow?.postMessage(msg, "*");

  const togglePlay = () => {
    post(
      paused
        ? '{"event":"command","func":"playVideo","args":""}'
        : '{"event":"command","func":"pauseVideo","args":""}'
    );
    setPaused((p) => !p);
  };

  const toggleMute = () => {
    post(
      muted
        ? '{"event":"command","func":"unMute","args":""}'
        : '{"event":"command","func":"mute","args":""}'
    );
    setMuted((m) => !m);
  };

  const IconBtn = ({ onClick, children }) => (
    <button onClick={onClick} className="active:scale-95">
      {children}
    </button>
  );

  return (
    <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 text-white drop-shadow">
      <IconBtn onClick={togglePlay}>{paused ? "▶️" : "⏸️"}</IconBtn>
      <IconBtn onClick={toggleMute}>{muted ? "🔈" : "🔇"}</IconBtn>
      {[ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical].map(
        (I, idx) => (
          <IconBtn key={idx} onClick={() => {}}>
            <I size={30} strokeWidth={1.5} />
          </IconBtn>
        )
      )}
    </div>
  );
}

/*****************************************************
 * Single Short card component (own hooks allowed)
 *****************************************************/
function ShortCard({ video }) {
  const id = extractId(video.videoId || video.url || "");
  if (!id) return null;

  const origin = encodeURIComponent(window.location.origin);
  const src = `https://www.youtube.com/embed/${id}?playlist=${id}&loop=1&playsinline=1&autoplay=1&mute=1&controls=0&enablejsapi=1&origin=${origin}&modestbranding=1&rel=0`;

  const frameRef = useRef(null);

  return (
    <div className="short-card relative h-screen w-screen flex-shrink-0 snap-start overflow-hidden">
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

      {/* gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent" />

      {/* controls */}
      <ControlRail frameRef={frameRef} />

      {/* metadata */}
      <div className="absolute bottom-5 left-4 right-24 flex items-center gap-3 text-white">
        <img
          src={video.channelThumb || "/placeholder-avatar.png"}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="font-semibold leading-tight truncate max-w-[180px]">
            {video.channelName || "Channel"}
          </div>
          <div className="text-sm opacity-90 leading-tight truncate max-w-[180px]">
            {video.title || "Untitled"}
          </div>
        </div>
        <button className="ml-2 px-4 py-1 bg-white text-black rounded-full text-sm font-semibold active:scale-95">
          Subscribe
        </button>
      </div>
    </div>
  );
}

/*****************************************************
 * Main feed component
 *****************************************************/
export default function App() {
  const [videos, setVideos] = useState([]);
  const listRef = useRef(null);
  const ioRef = useRef(null);

  // fetch list
  useEffect(() => {
    const apiHost = process.env.REACT_APP_API_HOST || window.location.hostname;
    axios
      .get(`http://${apiHost}:5000/api/videos`)
      .then((r) => setVideos(r.data || []))
      .catch(console.error);
  }, []);

  // intersection observer for play/pause
  useEffect(() => {
    if (!videos.length) return;

    ioRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const frame = entry.target.querySelector("iframe");
          if (!frame) return;
          const msg = entry.isIntersecting
            ? '{"event":"command","func":"playVideo","args":""}'
            : '{"event":"command","func":"pauseVideo","args":""}';
          frame.contentWindow?.postMessage(msg, "*");
        });
      },
      { threshold: 0.6 }
    );

    listRef.current
      ?.querySelectorAll(".short-card")
      .forEach((el) => ioRef.current.observe(el));

    return () => ioRef.current.disconnect();
  }, [videos]);

  if (!videos.length) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white">
        Loading…
      </div>
    );
  }

  /* ------------------ UI ------------------ */
  return (
    <div
      ref={listRef}
      className="flex flex-col snap-y snap-mandatory overflow-y-scroll h-screen min-h-[100dvh] w-screen bg-black"
    >
      {videos.map((v, idx) => (
        <ShortCard key={v._id || idx} video={v} />
      ))}
    </div>
  );
}
