import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ThumbsUp, ThumbsDown, Share2, MessageCircle, MoreVertical } from "lucide-react";


/* Helpers ------------------------------------------------------------ */
const getId = url => {
  // youtube.com/shorts/xxxxxxxx or watch?v=xxxxxxxx
  const match = url.match(/(?:shorts\/|watch\?v=)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
};

const thumb = id => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

/* Main component ----------------------------------------------------- */
export default function App() {
  const [videos, setVideos] = useState([]);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  /* 1. fetch once */
  useEffect(() => {
    axios.get("http://localhost:5000/api/videos").then(res => setVideos(res.data));
  }, []);

  /* 2. play / pause on intersection (same trick as before) */
  useEffect(() => {
    if (!videos.length) return;

    observerRef.current = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const iframe = entry.target.querySelector("iframe");
          if (!iframe) return;
          const msg = entry.isIntersecting
            ? `{"event":"command","func":"playVideo","args":""}`
            : `{"event":"command","func":"pauseVideo","args":""}`;
          iframe.contentWindow?.postMessage(msg, "*");
        });
      },
      { threshold: 0.6 }
    );

    const slides = containerRef.current.querySelectorAll(".short-slide");
    slides.forEach(s => observerRef.current.observe(s));
    return () => observerRef.current.disconnect();
  }, [videos]);

  if (!videos.length) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        Loading…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-y-scroll scroll-snap-y-mandatory touch-pan-y overscroll-y-contain"
    >
      {videos.map(v => {
        const id = getId(v.url);
        return (
          <div key={v._id} className="short-slide h-screen w-screen scroll-snap-start relative">
            {/* blurred BG */}
            <div
              className="absolute inset-0 -z-10 bg-center bg-cover blur-2xl brightness-50 scale-110"
              style={{ backgroundImage: `url(${thumb(id)})` }}
            />

            {/* centered player (9/16) */}
            <div className="h-full flex items-center justify-center">
              <iframe
                src={`https://www.youtube.com/embed/${id}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&controls=0&modestbranding=1`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-[9/16] h-full border-none rounded-lg shadow-lg"
              />
            </div>

            {/* right‑side buttons */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 text-white">
              {[ThumbsUp, ThumbsDown, MessageCircle, Share2, MoreVertical].map((Icon, i) => (
                <button key={i} className="flex flex-col items-center gap-1">
                  <Icon size={28} strokeWidth={1.8} />
                  <span className="text-xs">—</span>
                </button>
              ))}
            </div>

            {/* channel strip */}
            <div className="absolute bottom-5 left-4 flex items-center gap-3 text-white">
              <img
                src={v.channelThumb || "/placeholder-avatar.png"}
                alt=""
                className="w-10 h-10 rounded-full"
              />
              <span className="font-semibold">{v.channelName || "Channel"}</span>
              <button className="ml-4 px-4 py-1 bg-white text-black rounded-full text-sm font-bold">
                Subscribe
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
