# Chat Application - Architecture & Design Document

## 1. System Overview
This project is a high-performance, real-time messaging platform built using:
- **Backend**: FastAPI (Python 3.10+ async), SQLAlchemy (Async), SQLite/PostgreSQL, Redis (optional pub/sub), Jose (JWT auth), Pydantic v2.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v3, Zustand (state management), Lucide React (icons).
- **Protocol**: REST APIs for resource management, persistent WebSockets for bidirectional real-time events.

---

## 2. Directory Structure

```
Chat - Application/
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/ # Auth and DB injection dependencies
│   │   │   └── routes/       # Auth, Users, Conversations, Messages, Attachments, WS
│   │   ├── auth/             # Password hashing (bcrypt) & JWT token handling
│   │   ├── core/             # Configuration & Async database session factory
│   │   ├── models/           # SQLAlchemy models (User, Conversation, Message, etc.)
│   │   ├── schemas/          # Pydantic request & response models
│   │   └── websocket/        # ConnectionManager for connection lifecycles & presence
│   ├── tests/                # Automated pytest suite
│   └── uploads/              # Stored image and file attachments
│
├── frontend/
│   ├── src/
│   │   ├── api/              # Axios HTTP client configured with environment URLs
│   │   ├── features/
│   │   │   ├── auth/         # Login & Register views
│   │   │   ├── chat/         # Sidebar, ChatWindow, CreateGroupModal, GroupDetailsModal
│   │   │   ├── settings/     # Profile Settings modal
│   │   │   └── users/        # User profile view modal
│   │   ├── layouts/          # ChatLayout with centralized WebSocket connection
│   │   └── store/            # authStore, chatStore, websocketStore
│   ├── .env                  # Environment variables
│   └── package.json
│
└── docs/                     # Architecture & API specifications
```

---

## 3. Real-Time WebSocket Architecture

1. **Connection Lifecycle**:
   - Connection URL: `ws://<host>:<port>/api/v1/ws?token=<jwt_token>`
   - Authenticated on handshake using the bearer JWT token in query parameters.
   - Handled centrally by [`websocketStore.ts`](../frontend/src/store/websocketStore.ts) at the `ChatLayout` level.
   - Singleton socket prevents redundant connections and message duplication.

2. **WebSocket Events**:

| Event Type | Direction | Payload Description |
| :--- | :--- | :--- |
| `message:send` | Client -> Server | `{ "conversation_id": int, "content": str }` |
| `message:new` | Server -> Client | Full serialized message object with sender info |
| `message:edited` | Server -> Client | `{ "conversation_id": int, "message_id": int, "content": str, "edited_at": str }` |
| `message:deleted` | Server -> Client | `{ "conversation_id": int, "message_id": int, "deleted_at": str }` |
| `message:read` | Server -> Client | `{ "conversation_id": int, "message_id": int, "user_id": int }` |
| `typing:start` | Client <-> Server | `{ "conversation_id": int }` (server adds `user_id`) |
| `typing:stop` | Client <-> Server | `{ "conversation_id": int }` (server adds `user_id`) |
| `presence:update` | Server -> Client | `{ "user_id": int, "is_online": bool }` |
| `conversation:new` | Server -> Client | `{ "id": int, "type": str, "name": str, ... }` |

---

## 4. Security & Authentication
- Password storage utilizes `bcrypt` salted hashing.
- Token authentication uses HS256 signed JSON Web Tokens with expiration.
- Conversation access is strictly verified on every endpoint using membership join constraints.
