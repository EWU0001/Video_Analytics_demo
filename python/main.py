from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import cv2
import numpy as np
import tempfile
from tracker import SimpleTracker

app = FastAPI()
model = YOLO("yolov8n.pt")
tracker = SimpleTracker()

LINE_Y = 200  # virtual line
ZONE = (100, 100, 400, 400)  # x1, y1, x2, y2

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    temp.write(await file.read())
    temp.close()

    cap = cv2.VideoCapture(temp.name)

    counted_ids = set()
    total_count = 0
    max_zone = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame)[0]

        detections = []
        for box in results.boxes:
            if int(box.cls[0]) == 0:  # person
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append([x1, y1, x2, y2])

        tracked = tracker.update(detections)

        zone_count = 0

        for obj_id, (cx, cy) in tracked.items():

            # Line crossing
            if cy > LINE_Y and obj_id not in counted_ids:
                counted_ids.add(obj_id)
                total_count += 1

            # Zone counting
            zx1, zy1, zx2, zy2 = ZONE
            if zx1 < cx < zx2 and zy1 < cy < zy2:
                zone_count += 1

        max_zone = max(max_zone, zone_count)

    cap.release()

    return {
        "total_entered": total_count,
        "max_queue": max_zone
    }