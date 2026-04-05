# Video Analytics Demo (Passenger Flow Monitoring)

## Overview

Prototype system simulating airport passenger flow monitoring using AI video analytics.

## Features

- People detection using YOLO
- Tracking (ID-based)
- Line-crossing counting
- Zone-based queue detection

## Tech Stack

- Node.js (TypeScript)
- Python (YOLO, OpenCV)
- FastAPI

## How to Run

### Python

cd python
python -m uvicorn main:app --reload


### web page (UI)
cd video_analytic-ui
npm start
