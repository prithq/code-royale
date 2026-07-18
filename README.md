# Code Royale 🏆

> A real-time competitive coding platform where developers race to solve problems against each other. Compete with strangers via matchmaking or create private rooms to battle friends.

---

## What is Code Royale?

Code Royale is a full-stack real-time backend for a coding battle royale platform. Players join a match, receive the same randomly selected problems, and compete to solve them within a time limit. Every solve is broadcast to the entire room in real time — you know exactly when your opponent just finished a problem while you're still stuck on it.

**Two game modes:**
- **Quickplay** — join the queue, get matched with another player instantly (FIFO, ELO-ready for future expansion)
- **Friend Room** — host generates a 6-character room code, friends join, host controls match settings and starts when ready

**During a match:**
- All players receive the same randomly selected problems from chosen categories
- A **server-authoritative timer** counts down — clients can't manipulate it
- Every successful solve broadcasts a `problem_solved` notification to the entire room
- When the timer hits zero (or everyone finishes), `match_ended` fires with the final leaderboard

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 22 |
| Framework | Express 5 |
| Real-time | Socket.IO 4 |
| Auth | Better Auth 1.6 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6.5 |
| Code Execution | Judge0 CE (self-hosted) |
| Monorepo | Turborepo + pnpm |
| Language | TypeScript 6 |

---

## Project Structure

```
code-royale/
├── apps/
│   └── server/                        # Express + Socket.IO backend
│       └── src/
│           ├── index.ts               # Entry point
│           ├── socket/
│           │   ├── index.ts           # Socket.IO server setup
│           │   ├── middleware.ts      # Handshake session auth
│           │   └── handlers/
│           │       ├── queue.handler.ts       # Quickplay matchmaking
│           │       ├── room.handler.ts        # Friend room lifecycle
│           │       └── match.handler.ts       # Match + submissions
│           ├── services/
│           │   ├── match.service.ts           # Problem selection, leaderboard
│           │   └── judge0.service.ts          # Code execution via Judge0
│           └── routes/
│               └── match.route.ts             # REST: results, submissions
│
├── packages/
│   ├── auth/                          # Better Auth instance (shared)
│   ├── db/                            # Prisma schema + client + seed
│   │   └── prisma/schema.prisma
│   └── shared-types/                  # Socket event contracts (server + client)
│
├── turbo.json
└── pnpm-workspace.yaml
```

---

## How Auth Works

Authentication uses **Better Auth** with cookie-based sessions. The session cookie set on sign-in is automatically sent by the browser on every request — including the Socket.IO handshake.

The socket auth middleware reads the cookie from the handshake headers, calls `auth.api.getSession()` to validate it against the database, and either accepts or rejects the connection before it's established. No manual token passing needed.

```
Browser signs in → Better Auth sets session cookie
        ↓
Socket.IO handshake (HTTP) → cookie sent automatically
        ↓
io.use() middleware → auth.api.getSession() → validates session
        ↓
Connection accepted → socket.data.user available in all handlers
```

---

## Match Flow

```
Player connects (socket auth via session cookie)
        ↓
Quickplay:    join_queue → FIFO matched → match_found
Friend room:  create_room → share code → join_room → start_match
        ↓
startMatch() runs server-side:
  ├── Selects N random problems from chosen categories (Fisher-Yates shuffle)
  ├── Saves to MatchProblem table
  ├── Updates match status → ACTIVE
  ├── Emits match_started with full problem list to all players
  └── Starts server-authoritative countdown timer
        ↓
Players submit code via submit_code event:
  ├── Server fetches test cases from DB
  ├── Combines player code + problem harness → sends to Judge0
  ├── passed  → score +100, problem_solved broadcast to entire room
  └── failed  → submission_failed back to submitting player only
        ↓
Timer hits 0 OR all players solve all problems:
  ├── match_ended broadcast with final leaderboard
  └── finalRank + score saved to MatchPlayer table
        ↓
GET /api/match/:id/results → full results anytime after
```

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_queue` | — | Join quickplay matchmaking |
| `leave_queue` | — | Leave the queue |
| `create_room` | `{ categories, questionCount, durationSec }` | Host creates a friend room |
| `join_room` | `{ roomCode }` | Join a room by 6-char code |
| `leave_room` | — | Leave current room |
| `start_match` | — | Host starts the match |
| `submit_code` | `{ matchId, problemId, code, language }` | Submit a solution |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `queue_joined` | `{ position, message }` | Confirmed in queue |
| `match_found` | `{ matchId, roomCode, players, ... }` | Quickplay match ready |
| `queue_error` | `message` | Queue error |
| `room_created` | `{ matchId, roomCode, hostId }` | Room created |
| `room_joined` | `{ matchId, roomCode, players, ... }` | Joined room state |
| `player_joined` | `{ player, totalPlayers }` | Someone joined the room |
| `room_error` | `message` | Room error |
| `match_starting` | `{ matchId, players, ... }` | Host started the match |
| `match_started` | `{ matchId, problems, durationSec, startedAt }` | Problems assigned, timer running |
| `timer_tick` | `secondsLeft` | Countdown (every 10s, every 1s in last 10) |
| `problem_solved` | `{ userId, playerName, problemTitle, solvedAt }` | Someone solved a problem |
| `submission_failed` | `{ problemId, message }` | Code failed test cases |
| `match_ended` | `{ matchId, reason, leaderboard }` | Match over with final results |

---

## REST Endpoints

### Auth (Better Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email + password |
| POST | `/api/auth/sign-in/email` | Sign in, returns session cookie |
| POST | `/api/auth/sign-out` | Sign out |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/callback/github` | GitHub OAuth |
| GET | `/api/auth/callback/google` | Google OAuth |

### Match

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/match/:matchId/results` | Final leaderboard + problems |
| GET | `/api/match/:matchId/submissions` | All submissions for a match |
| GET | `/health` | Health check |

---

## Code Execution

Player code runs against hidden test cases via **Judge0 CE**. Each problem has visible test cases (shown as examples) and hidden test cases (used for grading so answers can't be hardcoded).

Players write a plain function — e.g. `function twoSum(nums, target)`. The server wraps it with a problem-specific harness that handles stdin/stdout, then sends the combined code to Judge0.

**Supported languages:**

| Language | Judge0 ID |
|----------|-----------|
| JavaScript | 63 |
| Python | 71 |
| C++ | 54 |
| Java | 62 |
| TypeScript | 74 |

> **Note:** Judge0 self-hosting requires cgroups v1. Ubuntu/Debian recommended. On Fedora/RHEL use the [hosted Judge0 API](https://rapidapi.com/judge0-official/api/judge0-ce).

---

## Seed Problems

10 problems across 6 categories and 3 difficulty levels:

| # | Title | Category | Difficulty |
|---|-------|----------|------------|
| 1 | Two Sum | arrays | Easy |
| 2 | Valid Parentheses | strings | Easy |
| 3 | Reverse Linked List | linked-list | Easy |
| 4 | Climbing Stairs | dp | Easy |
| 5 | Maximum Subarray | arrays | Medium |
| 6 | Binary Tree Level Order Traversal | trees | Medium |
| 7 | Number of Islands | graphs | Medium |
| 8 | Merge Intervals | arrays | Medium |
| 9 | Longest Common Subsequence | dp | Hard |
| 10 | Word Ladder | graphs | Hard |

---

## Testing with Postman

### 1. Sign up

```
POST http://localhost:3001/api/auth/sign-up/email
Origin: http://localhost:3000
Content-Type: application/json

{ "email": "you@email.com", "password": "yourpassword", "name": "Your Name" }
```

![signup](apps/server/screenshots/01-signup.png)

### 2. Sign in + copy session cookie

```
POST http://localhost:3001/api/auth/sign-in/email
```

Copy the full `better-auth.session_token=XXX.YYY` value from the `set-cookie` response header.

![signin](apps/server/screenshots/02-signin-cookie.png)

### 3. Connect via Socket.IO

New → Socket.IO → `http://localhost:3001`

Add header: `cookie: better-auth.session_token=YOUR_TOKEN`

Add event listeners: `queue_joined`, `match_found`, `match_started`, `timer_tick`, `problem_solved`, `match_ended`, `room_created`, `room_joined`, `player_joined`, `submission_failed`

![connected](apps/server/screenshots/03-socket-connected.png)

### 4. Quickplay — two tabs, two users

```
Tab 1 → join_queue   (no body)
Tab 2 → join_queue   (no body)
```

Both tabs receive `match_found` → `match_started` automatically.

![queue-joined](apps/server/screenshots/04-queue-joined.png)
![match-found](apps/server/screenshots/05-match-found.png)
![match-started](apps/server/screenshots/06-match-started.png)
![timer-tick](apps/server/screenshots/07-timer-tick.png)

### 5. Submit code

```
Event: submit_code
{
  "matchId": "from match_started",
  "problemId": "from match_started problems array",
  "language": "javascript",
  "code": "function twoSum(nums, target) { ... }"
}
```

![problem-solved](apps/server/screenshots/08-problem-solved.png)
![submission-failed](apps/server/screenshots/16-submission-failed.png)

### 6. Match ends

![match-ended](apps/server/screenshots/09-match-ended.png)

### 7. REST results

```
GET http://localhost:3001/api/match/:matchId/results
GET http://localhost:3001/api/match/:matchId/submissions
```

![results](apps/server/screenshots/10-results-endpoint.png)
![submissions](apps/server/screenshots/11-submissions-endpoint.png)

### 8. Friend room flow

```
Tab 1 → create_room  { "categories": ["arrays","dp"], "questionCount": 3, "durationSec": 900 }
         receives room_created with roomCode e.g. "A3K9PQ"

Tab 2 → join_room    { "roomCode": "A3K9PQ" }
         Tab 1 receives player_joined

Tab 1 → start_match  (host only)
         Both tabs receive match_starting → match_started
```

![room-created](apps/server/screenshots/12-room-created.png)
![room-joined](apps/server/screenshots/13-room-joined.png)
![player-joined](apps/server/screenshots/14-player-joined.png)
![match-starting](apps/server/screenshots/15-match-starting.png)

---

## Local Setup

### Prerequisites

- Node.js 18+
- pnpm
- [Neon](https://neon.tech) PostgreSQL database
- [Judge0 CE](https://github.com/judge0/judge0) (self-hosted via Docker, Ubuntu/Debian) or [hosted API](https://rapidapi.com/judge0-official/api/judge0-ce)
- GitHub and/or Google OAuth credentials (optional)

### 1. Clone and install

```bash
git clone https://github.com/prithq/code-royale.git
cd code-royale
pnpm install
```

### 2. Environment variables

Create `apps/server/.env`:

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require
BETTER_AUTH_SECRET=your_32_char_random_secret
PORT=3001

JUDGE0_API_URL=http://localhost:2358

# Optional — social auth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Create `packages/db/.env`:
```env
DATABASE_URL=same_neon_connection_string
```

### 3. Database setup

```bash
cd packages/db
npx prisma migrate dev
pnpm seed
```

### 4. Judge0 (self-hosted, Ubuntu/Debian recommended)

```bash
wget https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip && cd judge0-v1.13.1

# Set REDIS_PASSWORD and POSTGRES_PASSWORD in judge0.conf

docker compose up -d db redis
sleep 10
docker compose up -d
```

### 5. Run

```bash
pnpm dev
```

Server runs on `http://localhost:3001`

---


## License

MIT
