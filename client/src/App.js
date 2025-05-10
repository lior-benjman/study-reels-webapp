/* App.jsx -------------------------------------------------------------- */
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaHeart, FaRegHeart, FaCommentDots, FaShare, FaEllipsisV } from "react-icons/fa";

export default function App() {
  const [videos, setVideos] = useState([]);
  const observerRef = useRef(null);
  const listRef = useRef(null);

  /* 1. fetch list once ------------------------------------------------- */
  useEffect(() => {
    axios.get("http://localhost:5000/api/videos").then(res => setVideos(res.data));
  }, []);

  /* 2. play/pause on visibility --------------------------------------- */
  useEffect(() => {
    if (!videos.length) return;
    observerRef.current = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          const iframe = entry.target.querySelector("iframe");
          if (!iframe) return;
          const play  = '{"event":"command","func":"playVideo","args":""}';
          const pause = '{"event":"command","func":"pauseVideo","args":""}';
          iframe.contentWindow?.postMessage(entry.isIntersecting ? play : pause, "*");
        }),
      { threshold: 0.65 }
    );
    listRef.current
      .querySelectorAll(".short-card")
      .forEach(card => observerRef.current.observe(card));
    return () => observerRef.current.disconnect();
  }, [videos]);

  if (!videos.length) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black text-white">
        Loading…
      </div>
    );
  }

  /* 3. UI -------------------------------------------------------------- */
  return (
    <div
      ref={listRef}
      className="
        h-screen w-screen overflow-y-scroll
        scroll-snap-y-mandatory touch-pan-y overscroll-y-contain
        bg-black
      "
    >
      {videos.map(v => (
        <ShortCard key={v._id} v={v} />
      ))}
    </div>
  );
}

/* --------------------------------------------------------------------- */
/* One full‑screen “slide”                                               */
/* --------------------------------------------------------------------- */
function ShortCard({ v }) {
  return (
    <div className="short-card relative h-screen w-screen flex-shrink-0 scroll-snap-start">
      {/* video ---------------------------------------------------------- */}
      <iframe
        src={`${v.url}?autoplay=1&mute=1&controls=0&enablejsapi=1&playsinline=1&modestbranding=1`}
        title={v.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full object-cover"
      />

      {/* gradient overlays (top + bottom for readability) --------------- */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent" />

      {/* action rail (right) ------------------------------------------- */}
      <div className="absolute right-2 top-1/3 flex flex-col items-center gap-5 text-white text-xl">
        <ActionButton icon={FaRegHeart} label="Like" />
        <ActionButton icon={FaHeart} label="Dislike" />
        <ActionButton icon={FaCommentDots} label="Comments" />
        <ActionButton icon={FaShare} label="Share" />
        <ActionButton icon={FaEllipsisV} label="More" />
      </div>

      {/* bottom metadata bar ------------------------------------------- */}
      <div className="absolute bottom-4 left-4 right-20 text-white flex items-center gap-3">
        <img
          src={v.channelAvatar || '/avatar.png'}
          alt={v.channel}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="font-semibold">{v.channel}</div>
          <div className="text-sm opacity-90">{v.title}</div>
          <div className="text-xs opacity-70 mt-1">🎵 {v.track || "original sound"}</div>
        </div>
        <button className="px-4 py-1 bg-red-600 rounded-full font-semibold text-sm">
          Subscribe
        </button>
      </div>
    </div>
  );
}

/* tiny helper --------------------------------------------------------- */
function ActionButton({ icon: Icon, label }) {
  return (
    <button className="flex flex-col items-center gap-1">
      <Icon className="text-3xl drop-shadow" />
      <span className="text-xs">{label}</span>
    </button>
  );
}
