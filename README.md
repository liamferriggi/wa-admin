# Wapilot Admin Dashboard (wa-admin)

React admin dashboard for the [whatsapp-agent](https://github.com/liamferriggi/whatsapp-agent) backend. Staff use it to manage agents, review WhatsApp conversations, and approve/reject requests.

> **Taking over this project?** Read the full handover doc in the backend repo: `whatsapp-agent/docs/HANDOVER.md`.

**Production:** https://wa-admin.infinite-fusion.com · API: https://wa.infinite-fusion.com

## Stack

- Vite + React 18 + TypeScript, react-router, lucide-react icons
- Infinite Fusion branding (light theme, navy sidebar, logos in `public/brand/`)
- Served by nginx in Docker behind Traefik (TLS via Let's Encrypt)

## Structure

| Path | What |
|---|---|
| `src/api.ts` | API client — attaches `Authorization: Bearer <ift_token>`, redirects to `/login` on 401 |
| `src/context/AuthContext.tsx` | Central IFT auth: login via `https://auth.infinite-fusion.com`, JWT in localStorage (`ift_token`) |
| `src/pages/Dashboard.tsx` | Stats + recent conversations |
| `src/pages/Agents.tsx` | Agent CRUD (keywords, prompt, required fields, integration URL) |
| `src/pages/Conversations.tsx` | Conversation list/detail, approve / reject |
| `src/pages/ApiKeys.tsx` | Programmatic API key management |
| `src/pages/Login.tsx` | Email/password login against auth-service |

## Authentication

Users live in the central IFT **auth-service** (not in this app). Login returns a platform JWT which the backend verifies with the shared `JWT_SECRET`. To add a staff user, register them in auth-service (`POST /api/auth/register`, admin only).

## Local development

```bash
npm install
npm run dev        # http://localhost:5173 (backend must allow this origin via CORS)
```

## Deploy

```bash
ssh -i ~/.ssh/infinite_fusion_vps -J root@158.220.105.29 root@37.60.251.49
cd /opt/apps/wa-admin && git pull && docker compose build --no-cache && docker compose up -d
```

The build is fully static — API and auth URLs are hard-coded in `src/api.ts` and `src/context/AuthContext.tsx`.

See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for full server setup.
