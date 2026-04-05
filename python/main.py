from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import cv2
import numpy as np
import tempfile
from sort import Sort
import os
import uuid

# OUTPUT_PATH = "output.mp4"
# output unique video id
OUTPUT_PATH = f"output_{uuid.uuid4().hex}.mp4"

app = FastAPI()
model = YOLO("yolov8n.pt")
track = Sort()

LINE_Y = 200
ZONE = (100, 100, 400, 400)

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    temp.write(await file.read())
    temp.close()

    cap = cv2.VideoCapture(temp.name)

    counted_ids = set()
    total_count = 0
    max_zone = 0

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = None

    # ✅ LOOP MUST BE INSIDE FUNCTION
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if out is None:
            h, w, _ = frame.shape
            out = cv2.VideoWriter(OUTPUT_PATH, fourcc, 10, (w, h))

        results = model(frame)[0]

        detections = []
        for box in results.boxes:
            if int(box.cls[0]) == 0:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                detections.append([x1, y1, x2, y2, conf])

        # SORT expects numpy array
        if len(detections) > 0:
            tracked = track.update(np.array(detections))
        else:
            tracked = []

        zone_count = 0

        # Draw line
        cv2.line(frame, (0, LINE_Y), (frame.shape[1], LINE_Y), (0, 255, 255), 2)

        # Draw zone
        zx1, zy1, zx2, zy2 = ZONE
        cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), (255, 0, 0), 2)

        # ✅ SORT returns array, NOT dict
        for obj in tracked:
            x1, y1, x2, y2, obj_id = obj
            cx = int((x1 + x2) / 2)
            cy = int((y1 + y2) / 2)

            # Draw center + ID
            cv2.circle(frame, (cx, cy), 5, (0, 255, 0), -1)
            cv2.putText(frame, f"ID {int(obj_id)}", (cx, cy - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # Line crossing
            if cy > LINE_Y and obj_id not in counted_ids:
                counted_ids.add(obj_id)
                total_count += 1

            # Zone counting
            if zx1 < cx < zx2 and zy1 < cy < zy2:
                zone_count += 1

        max_zone = max(max_zone, zone_count)

        # Overlay stats
        cv2.putText(frame, f"Entered: {total_count}", (20, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

        cv2.putText(frame, f"Queue: {zone_count}", (20, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)

        out.write(frame)

    cap.release()
    if out:
        out.release()

    return {
        "total_entered": total_count,
        "max_queue": max_zone,
        "video_output": OUTPUT_PATH
    }