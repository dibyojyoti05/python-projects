# Enterprise AI Vision Platform - API Reference

Base URL: `http://localhost:8000/api/v1`
Interactive Swagger Docs: `http://localhost:8000/docs`

## 1. Authentication (`/auth`)
- `POST /auth/login`: Form data (`username`, `password`) -> Returns `{ access_token, token_type, user }`
- `POST /auth/register`: Create a new user profile
- `GET /auth/me`: Get current authenticated user profile
- `GET /auth/users`: List registered system users

## 2. Cameras Fleet (`/cameras`)
- `GET /cameras/`: List all registered cameras
- `POST /cameras/`: Register a new camera node (`name`, `location`, `rtsp_url`, `ai_enabled`)
- `GET /cameras/{id}`: Retrieve single camera details
- `PUT /cameras/{id}`: Update camera properties
- `DELETE /cameras/{id}`: Delete a camera
- `POST /cameras/{id}/toggle-ai`: Toggle AI object detection on/off

## 3. Real-Time Streams (`/streams`)
- `GET /streams/active`: List camera IDs with active running streams
- `POST /streams/{camera_id}/start`: Initialize RTSP capture
- `POST /streams/{camera_id}/stop`: Terminate stream capture
- `GET /streams/{camera_id}/stream`: Live MJPEG multipart video feed (Accepts Bearer auth header or `?token=<jwt>`)
- `GET /streams/{camera_id}/snapshot`: Single JPEG snapshot frame

## 4. Detection Events & Analytics (`/events`)
- `GET /events/`: List events with optional filters (`camera_id`, `object_class`, `min_confidence`, `search`, `limit`, `skip`)
- `GET /events/stats/summary`: High-level KPI metrics (total detections, 24h count, active cameras, alert counts)
- `GET /events/stats/hourly`: 24-hour hourly detections timeline for charts
- `GET /events/stats/classes`: Class breakdown with counts and average confidence
- `POST /events/`: Insert or trigger a detection event
- `DELETE /events/{event_id}`: Remove an event record

## 5. System Health (`/system`)
- `GET /system/health`: Verify PostgreSQL port 5433, server time, and model status
