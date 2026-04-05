import axios = require("axios");
import fs = require("fs");
import path = require("path");
import FormData = require("form-data");

const clipsDir = "../clips";
const outputDir = "../outputs";

// check output folder exist
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
};

async function analyzeClip(filePath: string) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));


    try {
        const res = await axios.post("http://localhost:8000/analyze", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        return res.data;
        
    } catch (err:any) {
        console.error("error processing", filePath);
        console.error(err.message);
        return null;
    }
}

async function main() {
    const files = fs.readdirSync(clipsDir);
    const results: any[] = [];

    for (const file of files) {
        const fullPath = path.join(clipsDir, file);

        console.log(`processing ${file}`);

        const data = await analyzeClip(fullPath);

        if (!data) continue;

        console.log(`✅ Entered: ${data.total_entered}`);
        console.log(`👥 Max Queue: ${data.max_queue}`);
        console.log(`🎬 Output Video: ${data.video_output}`);
        console.log(`display data: ${data}`);

        //copy output video to output folders
        const sourcePath = path.resolve("../python", data.video_output);

        //rename output to match input file
        const outputFileName = file.replace(".mp4", "_processed.mp4");
        const destPath = path.join(outputDir, outputFileName);

        try {
            fs.copyFileSync(sourcePath,destPath);
            console.log(`save to :${destPath}`);
        } catch (err) {
            console.error("failed to copy video",err);
        }

        results.push({
            file,
            entered: data.total_entered,
            queue: data.max_queue,
            output_video: data.video_output,
        });
    }

    // save JSON
    fs.writeFileSync("results.json", JSON.stringify(results, null, 2));

    // save csv
    const csv = 
    "file,entered,queue, output_video\n" +
    results.map(r => `${r.file},${r.entered},${r.queue},${r.output_video}`).join("\n");

    fs.writeFileSync("results.csv", csv);
}

main();