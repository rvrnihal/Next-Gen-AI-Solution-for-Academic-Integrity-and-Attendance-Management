# Only for the webcam
# from ultralytics import YOLO

# model = YOLO("yolov8n.pt")  # Load YOLOv8n model
# model.predict(source=0, show=True)  # Use webcam (source=0)


from ultralytics import YOLO
import cv2

# Load YOLOv8 model
model = YOLO("yolov8n.pt")

# Start capturing video from webcam
cap = cv2.VideoCapture(0)  # Use 0 for default webcam

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    # Run YOLOv8 detection on the frame
    results = model(frame)

    # Annotate the frame with bounding boxes
    for r in results:
        frame = r.plot()  # Draw detected objects on frame

        # Iterate through detections
        for box in r.boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]  # Get class name
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # Bounding box coordinates

            # Check for malpractice items
            if class_name.lower() in ["cell phone", "mobile", "person"]:
                print(f"🚨 Malpractice detected: {class_name}")  # Print alert in terminal
                cv2.putText(frame, f"Malpractice: {class_name}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)  # On-screen alert

    # Display the output frame
    cv2.imshow("Malpractice Detection", frame)

    # Press 'q' to exit the loop
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
