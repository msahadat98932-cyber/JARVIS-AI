# J.A.R.V.I.S. AI Assistant

A futuristic Iron Man-inspired J.A.R.V.I.S. AI Web Assistant powered by Node.js, Express, and OpenAI.

## Live Demo
- **URL**: https://jarvis-ai-lpua.onrender.com/

## System Architecture
- **Frontend**: HTML5, CSS3 (Neon Arc Reactor Dashboard), Vanilla JavaScript with Speech Recognition and Speech Synthesis.
- **Backend**: Node.js & Express REST API.
- **AI Integration**: OpenAI SDK (`/api/chat`).

## Environment Variables Required
Configure in Render Dashboard:
- `OPENAI_API_KEY`: Your official OpenAI secret key (`sk-...`).
- `OPENAI_MODEL` (Optional): Target OpenAI model (defaults to `gpt-4o-mini`).

## API Endpoints
- `GET /api/status`: System state & API connection test.
- `POST /api/chat`: JSON payload `{ "message": "string", "history": [] }`.
