# Game Ops Dashboard

**GCP-native internal admin dashboard for live game operations**  
Simulates millions of game events/day via Pub/Sub → Cloud Run → Cloud SQL & MemoryStore → Next.js UI.

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
