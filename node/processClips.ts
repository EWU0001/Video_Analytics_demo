import axios = require("axios");
import fs = require("fs");
import path = require("path");
import FormData = require("form-data");

const clipsDir = "../clips";

async function analyzeClip(filePath: string) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const res = await axios.post("http://localhost:8000/analyze", form, {
        headers: form.getHeaders(),
    });

    return res.data;
}

async function main() {
    const files = fs.readdirSync(clipsDir);
    const results: any[] = [];

    for (const file of files) {
        const fullPath = path.join(clipsDir, file);

        console.log(`processing ${file}`);

        const data = await analyzeClip(fullPath);

        console.log(`display data: ${data}`);

        results.push({
            file,
            entered: data.total_entered,
            queue: data.max_queue,
        })
    }

    // save csv

    const csv = 
    "file,entered,queue\n" +
    results.map(r => `${r.file},${r.entered},${r.queue}`).join("\n");

    fs.writeFileSync("results.csv", csv);
}

main();