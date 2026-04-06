import { ChangeEvent, useState, useRef } from "react";
import axios from "axios";
import "./App.css";
import Logo from "./images/eye.png";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  //handle file drop
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setVideoUrl(null);
    }
  };

  //clear uploaded video
  const handleClear = () => {
    setFile(null);
    setResult(null);
    setVideoUrl(null);
    setLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // call backend
  const handleProcess = async () => {
    if (!file) {
      alert("Please upload a video for processing");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try{
      setLoading(true);

      const res = await axios.post("http://localhost:8000/analyze",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data"},
        }
      );
      setResult(res.data);
      //assume server video via static path
      const videoPath = `http://localhost:8000/videos/${res?.data?.video_output}`;
      console.log('backend video path',videoPath);
      setVideoUrl(videoPath);

    } catch (err){
      console.log(err);
      alert("Error processing video");
    } finally {
      setLoading(false);
    }
  };

  //JSX
   return (
    <div className="app">
      <div className="card">
        <h2 style={{color:"#005b96"}}> <img src={Logo} style={{height:50, width:50}} alt="logo" /> Video Analytics Dashboard</h2>

        {/* Upload */}
        <div className="upload-box">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
          <p>Drag & drop or select a video</p>
        </div>

        {file && <p className="filename">📄 {file.name}</p>}

        {/* Buttons */}
        <div className="button-group">
          <button onClick={handleProcess} disabled={loading}>
            {loading ? "Processing..." : "Process"}
          </button>

          <button onClick={handleClear} disabled={loading}>
            Clear
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="results">
            <h3>📊 Results</h3>
            <p>Entered: {result.total_entered}</p>
            <p>Max Queue: {result.max_queue}</p>
          </div>
        )}

        {/* Video */}
        {videoUrl && (
          <div className="video-container">
            <h3>🎬 Processed Video</h3>
            <video controls>
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        )}
      </div>
    </div>
  );

}

export default App;