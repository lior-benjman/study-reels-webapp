import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [videos, setVideos] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    axios.get("http://localhost:5000/api/videos").then((res) => {
      setVideos(res.data);
    });
  }, []);

  const nextVideo = () => {
    setIndex((prev) => (prev + 1) % videos.length);
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      {videos.length > 0 && (
        <div className="w-full h-full flex flex-col items-center">
          <iframe
            width="360"
            height="640"
            src={videos[index].url}
            title={videos[index].title}
            className="rounded-xl shadow-xl"
            allowFullScreen
          ></iframe>
          <button
            onClick={nextVideo}
            className="mt-4 px-6 py-2 bg-white text-black rounded-lg"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default App;