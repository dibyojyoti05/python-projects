# REST API Documentation

Base URL: `/api/v1`

## 1. Authentication (`/auth`)
* `POST /auth/register` — Register a new account (`username`, `email`, `password`, `display_name`, `bio`).
* `POST /auth/login` — OAuth2 password flow (`username`, `password`), returns `{ "access_token": "...", "token_type": "bearer" }`.
* `GET /auth/me` — Returns the authenticated user's profile.

## 2. Users (`/users`)
* `GET /users/me` — Returns authenticated user details.
* `PATCH /users/me` — Update profile (`display_name`, `bio`, `profile_photo`).
* `GET /users/search?query=...` — Search other registered users by username or display name.

## 3. Conversations (`/conversations`)
* `GET /conversations/` — List all conversations for the authenticated user, ordered by most recent activity.
* `POST /conversations/` — Create or retrieve an existing 1-on-1 private conversation (`participant_id`).
* `POST /conversations/group` — Create a group conversation (`name`, `participant_ids`).
* `GET /conversations/{conversation_id}/members` — List all members of a conversation and their roles (`OWNER`, `ADMIN`, `MEMBER`).
* `POST /conversations/{conversation_id}/members` — Add a user to a group conversation (`user_id`).
* `DELETE /conversations/{conversation_id}/members/{user_id}` — Remove a member from a group conversation or leave group.

## 4. Messages (`/conversations`)
* `GET /conversations/{conversation_id}/messages` — Paginated message history for a conversation.
* `POST /conversations/{message_id}/read` — Mark a message (and preceding messages) as read.
* `PATCH /conversations/{message_id}` — Edit message content.
* `DELETE /conversations/{message_id}` — Soft-delete message.

## 5. Attachments (`/attachments`)
* `POST /attachments/upload` — Upload multipart file or image (`file`), returns relative URL and metadata.
* `GET /attachments/{filename}` — Serve uploaded file.
