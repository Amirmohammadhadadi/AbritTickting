# 🤖 Abrit AI Ticketing System

Hey there! This project was built to streamline customer support operations for **Abrit**, automating repetitive ticketing workflows using an AI-powered Telegram bot, a real-time web dashboard, and a RAG (Retrieval-Augmented Generation) knowledge base.

Here is a breakdown of what this system brings together:
1. **Telegram Bot:** Users send messages, the bot automatically creates/manages tickets, chats via an AI Agent, or seamlessly routes the conversation to human support agents when requested.
2. **AI Agent & RAG:** Connected to OpenRouter and a company knowledge base, allowing the AI to provide accurate, context-aware answers based on official documentation.
3. **Web Dashboard (React):** A clean management interface where admins can track tickets, change statuses, receive real-time notifications, and chat directly with users.
4. **Proxy & Censorship Bypass:** Since Telegram and OpenRouter APIs can be restricted in certain environments, a built-in SOCKS5 proxy (`127.0.0.1:10808`) keeps everything connected without TLS or socket disconnection errors.

---

## 🛠 Tech Stack
* **Backend:** Node.js, Express, LangChain, Telegraf (Telegram Bot API), pg (PostgreSQL driver)
* **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons
* **Database:** PostgreSQL (The only service running inside Docker for clean, isolated state management)
* **Real-time Updates:** SSE (Server-Sent Events) for instant, lightweight notification push and UI syncing without heavy socket bloat.

---

## 🚀 How to Run the Project Locally

Since the application source code runs natively and only the database lives inside Docker, getting it up and running is straightforward:

### Step 1: Fire up PostgreSQL via Docker
Make sure Docker is running on your machine. In the root of your project directory, create a `docker-compose.yml` file with the following configuration:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: abrit_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: abrit_ticketing
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run the container in the background:
```bash
docker compose up -d
```

### Step 2: Set up and Run the Backend
Navigate into the `backend` directory, install dependencies, and configure your environment:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder (notice we map the database port to `5433` to avoid local conflicts):
```env
PORT=5000

DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5433/abrit_ticketing

TELEGRAM_BOT_TOKEN=8640152797:AAGqLUy4U-P9RvBqaYzF_eRZi2DzsYlH_II

OPENROUTER_API_KEY=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

SOCKS_PROXY=socks5h://127.0.0.1:10808
```

Start the backend server:
```bash
npm start
```

### Step 3: Run the Frontend Dashboard
Open a new terminal window, navigate into the `frontend` directory, and spin up the development server:

```bash
cd frontend
npm install
npm run dev
```

The management panel will be live at `http://localhost:5173`, and the API server runs on port `5173`.

---

## 💡 Key Architectural Notes & Challenges Solved:
* **The Proxy & TLS Fix:** During long AI agent execution steps (tool calls / RAG searches), standard proxy connections tend to drop. We configured `SocksProxyAgent` with `keepAlive: false` and wrapped outbound calls with a robust retry mechanism (`safeTelegramCall`) to ensure messages never get lost due to micro-fluctuations.
* **Instant Real-Time Sync:** Instead of setting up complex WebSockets, we used a lightweight SSE endpoint (`/api/events`) combined with custom browser events. Whenever a user drops a message in Telegram or the AI replies, the admin dashboard updates instantly with an audio cue and badge counter.

Enjoy building and scaling your support system! If you run into any edge cases, the server logs clear English outputs for quick debugging. 

🌐 Why Do We Need SOCKS Proxy Configuration?
If you look at the .env file, you'll notice a SOCKS5 proxy configuration (SOCKS_PROXY=socks5h://127.0.0.1:10808). Here is why it's critical for this project:

Bypassing Network Restrictions:
Both the Telegram Bot API (api.telegram.org) and the OpenRouter AI API are restricted or heavily filtered in our development environment (Iran). Without a proxy, any outbound request from the Node.js backend to Telegram or the AI model would fail with connection timeouts or network errors.

Preventing Connection Drops during AI Execution:
When the AI Agent processes complex user queries, it occasionally takes a few seconds to generate tool calls and responses. Standard TCP connections over restricted networks often drop or encounter TLS handshake issues during these waiting periods. To solve this, we configured our Telegram bot wrapper and OpenRouter fetch calls with a SocksProxyAgent (disabling keepAlive and adding safe retry wrappers) ensuring stable, uninterrupted communication even under unstable network conditions. 

