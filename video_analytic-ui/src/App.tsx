import { ChangeEvent, useState, useRef } from "react";
import axios from "axios";

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
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2>🎥 Video Analytics Demo</h2>
      
      {/* Upload */}
      <div
        style={{
          border: "2px dashed gray",
          padding: 20,
          marginBottom: 20,
        }}
      >
        <input type="file" accept="video/*" onChange={handleFileChange} ref={fileInputRef} />
      </div>
      <button onClick={handleClear} disabled={loading || (!file && !result && !videoUrl)}>
        Clear
      </button>

      <br /><br />
      

      {/* Button */}
      <button onClick={handleProcess} disabled={loading}>
        {loading ? "Processing..." : "Process"}
      </button>

      <br /><br />
  
      {/* Result */}
      {result && (
        <div>
          <h3>📊 Results</h3>
          <p>Entered: {result.total_entered}</p>
          <p>Max Queue: {result.max_queue}</p>
        </div>
      )}

      {/* Video Output */}
      {videoUrl && (
        <div>
          <h3>🎬 Processed Video</h3>
          <video width="600" controls>
            <source src={videoUrl} type="video/mp4" />
          </video>
        </div>
      )}
    </div>
  );

}

export default App;