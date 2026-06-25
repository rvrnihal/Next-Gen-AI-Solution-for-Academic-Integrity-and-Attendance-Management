import io
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

app = FastAPI(title="Academic Integrity AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8 Model (will download yolov8n.pt automatically if not present, but we have it in the folder!)
try:
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Error loading YOLOv8 model: {e}. Attempting to fallback.")
    model = None

class PlagiarismRequest(BaseModel):
    doc_a: str
    doc_b: str

@app.get("/health")
def health_check():
    return {"status": "OK", "model_loaded": model is not None}

@app.post("/ai/detect-malpractice")
async def detect_malpractice(file: UploadFile = File(...)):
    if model is None:
        return {"error": "AI model not loaded", "malpractice": False}

    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Invalid image file", "malpractice": False}

    results = model(frame)
    detected_items = []
    malpractice_detected = False
    highest_confidence = 0.0
    risk_score = 0.0

    for r in results:
        for box in r.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            detected_items.append({
                "class": class_name,
                "confidence": conf,
                "box": [x1, y1, x2, y2]
            })

            # Check for mobile phones or anomalous student counts
            if class_name.lower() in ["cell phone", "mobile"]:
                malpractice_detected = True
                highest_confidence = max(highest_confidence, conf)
                risk_score = max(risk_score, 0.95)
            elif class_name.lower() == "person":
                # If there are multiple persons in the frame, flag potential group cheating
                person_count = sum(1 for item in detected_items if item["class"].lower() == "person")
                if person_count > 1:
                    malpractice_detected = True
                    highest_confidence = max(highest_confidence, conf)
                    risk_score = max(risk_score, 0.6)

    return {
        "malpractice": malpractice_detected,
        "risk_score": risk_score,
        "highest_confidence": highest_confidence,
        "detections": detected_items
    }

@app.post("/ai/detect-plagiarism")
def detect_plagiarism(req: PlagiarismRequest):
    if not req.doc_a.strip() or not req.doc_b.strip():
        return {"similarity": 0.0, "status": "Empty documents"}

    try:
        vectorizer = TfidfVectorizer()
        tfidf = vectorizer.fit_transform([req.doc_a, req.doc_b])
        similarity = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        similarity_percentage = round(float(similarity) * 100, 2)
        
        status = "Clean"
        if similarity_percentage > 50.0:
            status = "High Similarity"
        elif similarity_percentage > 20.0:
            status = "Moderate Similarity"

        return {
            "similarity": similarity_percentage,
            "status": status
        }
    except Exception as e:
        return {"error": str(e), "similarity": 0.0}

@app.post("/ai/verify-face")
async def verify_face(reference: UploadFile = File(...), scan: UploadFile = File(...)):
    # Face recognition verification wrapper using ORB descriptor matching as a lightweight, robust alternative to heavy library compilation.
    try:
        ref_bytes = await reference.read()
        scan_bytes = await scan.read()

        ref_arr = np.frombuffer(ref_bytes, np.uint8)
        scan_arr = np.frombuffer(scan_bytes, np.uint8)

        img1 = cv2.imdecode(ref_arr, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imdecode(scan_arr, cv2.IMREAD_GRAYSCALE)

        if img1 is None or img2 is None:
            return {"verified": False, "confidence": 0.0, "error": "Invalid image files"}

        # Initialize ORB detector
        orb = cv2.ORB_create()
        kp1, des1 = orb.detectAndCompute(img1, None)
        kp2, des2 = orb.detectAndCompute(img2, None)

        if des1 is None or des2 is None:
            return {"verified": False, "confidence": 0.0, "reason": "No facial keypoints detected"}

        # Create BFMatcher object
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des1, des2)
        matches = sorted(matches, key=lambda x: x.distance)

        # Basic confidence calculation based on match count
        match_ratio = len(matches) / max(len(kp1), len(kp2), 1)
        confidence = min(match_ratio * 2.0, 1.0)
        verified = confidence > 0.45

        return {
            "verified": bool(verified),
            "confidence": round(float(confidence) * 100, 2)
        }
    except Exception as e:
        return {"verified": False, "confidence": 0.0, "error": str(e)}

@app.websocket("/ai/stream-malpractice")
async def stream_malpractice(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Receive image frame as bytes
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None or model is None:
                continue

            results = model(frame)
            alert = False
            reason = ""

            for r in results:
                for box in r.boxes:
                    class_name = model.names[int(box.cls[0])]
                    conf = float(box.conf[0])
                    if class_name.lower() in ["cell phone", "mobile"]:
                        alert = True
                        reason = f"Mobile phone detected with {conf:.2f} confidence"
                        break

            if alert:
                await websocket.send_json({"alert": True, "reason": reason})
            else:
                await websocket.send_json({"alert": False})
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
