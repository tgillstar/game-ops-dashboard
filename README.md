# Game Ops Dashboard

**GCP-native internal admin dashboard for live game operations**
Simulates millions of game events/day via Pub/Sub → Cloud Run → Cloud SQL & MemoryStore → Next.js UI.

---

## 🎉 Milestone: Generator Service Completed

We've built and containerized the **Event Generator** service, which:

* Simulates game events (login, match\_start, match\_end, chat, purchase, error) with weighted probabilities.
* Publishes JSON events to a Pub/Sub topic (`game-events`) at a configurable rate (`EVENT_INTERVAL_MS`).
* Implements exponential back-off and graceful shutdown (SIGINT/SIGTERM).
* Proven locally via Node.js and in Docker:

  * Simplified `docker run --env-file .env -v ~/.gcp:/root/.gcp:ro game-ops-generator`
  * Verified mount and credentials loading inside container.


---

## Architecture

Below is the high-level system diagram. To view it, either:

- Open `diagrams/architecture.mmd` in VS Code with the “Mermaid Preview” extension  
- Paste the contents into [Mermaid Live Editor](https://mermaid.live)

```mermaid
flowchart LR
  subgraph Generation & Ingestion
    A[Cloud Run Job<br>Event Generator] 
    A -->|Publishes JSON| B[Pub/Sub Topic<br>game-events]
    B --> C[Cloud Run Service<br>Ingestion Processor]
    C -->|Writes raw events| D[Cloud SQL<br>game_events]
    C -->|Updates counters| E[MemoryStore<br>Redis]
    C -->|For chat events| F[Cloud Function<br>Moderation Processor]
    F -->|Writes flagged| G[Cloud SQL<br>moderation_events]
  end

  subgraph Back-end API
    H[Cloud Run Service<br>REST & SSE API]
    H -->|Query| D
    H -->|Query| E
    H -->|Query| G
  end

  subgraph Front-End Dashboard
    I[Next.js App<br>Firebase Hosting / Cloud Run]
    I -->|REST & SSE| H
  end

  subgraph Ad-Hoc Reporting
    J[Cloud Run Service<br>Query Builder]
    J -->|Executes safe SQL| D
    I -->|UI for reports| J
  end

  subgraph CI/CD & Infra
    K[GitHub → Cloud Build]
    K -->|Build & Deploy| A
    K -->|Build & Deploy| C
    K -->|Build & Deploy| H
    K -->|Build & Deploy| I
    K -->|Manage| D & E & Pub/Sub
  end

  subgraph Monitoring & Alerts
    L[Cloud Monitoring & Logging]
    L -->|Metrics & Logs| A & C & H
    L --> M[Budget & Error Alerts]
  end
```
---

## 🛠 Getting Started (Local)

### Prerequisites

* Node.js v18+
* Docker Desktop (daemon running)
* A GCP project with Pub/Sub enabled and a service account key at `~/.gcp/game-ops-demo-sa.json`

### 1. Clone the Repo

```bash
gh repo clone your-org/game-ops-dashboard
cd game-ops-dashboard
```

### 2. Environment

1. Copy & fill the template:

   ```bash
   cp .env.example .env
   ```
2. In `.env`, set:

   ```ini
   PROJECT_ID=your-gcp-project-id
   PUBSUB_TOPIC=game-events
   GOOGLE_APPLICATION_CREDENTIALS=/root/.gcp/game-ops-demo/game-ops-demo-sa.json
   EVENT_INTERVAL_MS=100
   ```

### 3. Run Generator Locally

```bash
cd services/generator
npm install
node index.js
```

You should see logs:

```
Published login (...)
Published chat (...)
...
```

Press Ctrl+C to stop (graceful shutdown).

### 4. Dockerize Generator

```bash
cd services/generator
docker build -t game-ops-generator .
docker run --rm \
  --env-file ../../.env \
  -v C:/Users/xxxx/.gcp:/root/.gcp:ro \
  game-ops-generator
```

Check logs, then Ctrl+C to exit.

---

## ✨ Next Steps

1. **Ingestion Processor**: subscribe to `game-events-sub`, write into Cloud SQL.
2. Containerize ingestion service and deploy both services to Cloud Run.
3. Develop Next.js dashboard and API service.
4. Automate infra provisioning with Terraform & Cloud Build.

---

## ⚡ Credits
* Built with ❤️ by Tiffany Gill