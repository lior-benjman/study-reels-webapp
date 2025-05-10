const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/studyreels", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Video = mongoose.model("Video", new mongoose.Schema({
  title: String,
  url: String,
  subject: String,
}));

app.get("/api/videos", async (req, res) => {
  const subject = req.query.subject;
  const videos = subject
    ? await Video.find({ subject })
    : await Video.find();
  res.json(videos);
});

app.post("/api/videos", async (req, res) => {
  const video = new Video(req.body);
  await video.save();
  res.status(201).json(video);
});

app.listen(5000, () => console.log("Server started on port 5000"));
