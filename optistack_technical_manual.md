# OptiStack: Technical Architecture & Product Manual

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Frontend-Backend Communication](#2-frontend-backend-communication)
3. [Data Flow & RL Logic](#3-data-flow--rl-logic)
4. [Local Execution (Manual Setup)](#4-local-execution-manual-setup)
5. [Project Structure](#5-project-structure)
6. [Advisory Mode vs. Automation Mode](#6-advisory-mode-vs-automation-mode)
7. [Cloud Integration Process](#7-cloud-integration-process)
8. [Deployment (Kubernetes)](#8-deployment-kubernetes)

---

## 1. System Architecture Overview
OptiStack is an autonomous cloud infrastructure rightsizing platform. Traditional auto-scaling relies on reactive, hard-coded heuristics (e.g., "if CPU > 80% for 5 mins, add 1 node"). This leads to delayed scaling and inherent resource waste. 

OptiStack replaces this with a **Reinforcement Learning (RL) Engine** powered by a Deep Q-Network (DQN). The architecture consists of three primary layers:
- **Frontend:** A React/Vite SaaS dashboard for real-time telemetry rendering.
- **Backend:** A FastAPI server containing the DQN models and the control loop.
- **Adapters:** Native execution layer for AWS ASGs and Kubernetes APIs.

---

## 2. Frontend-Backend Communication
The system uses a **RESTful API** architecture. All communication happens over HTTP/HTTPS using JSON as the data exchange format.

- **Telemetry Polling:** The Frontend sends a `GET` request to `/api/metrics` every 1 second.
- **State Synchronization:** The Backend responds with a JSON object containing CPU, memory, request rates, and the agent's current reward status.
- **Control Commands:** When a user switches modes or resets the simulation, the Frontend sends `POST` requests to the respective endpoints (`/api/reset`, etc.).

---

## 3. Data Flow & RL Logic
1.  **Ingestion:** The Backend pulls metrics from the cloud environment (or simulator).
2.  **Inference:** The **DQN Agent** processes these metrics (the "State"). It selects an **Action** (Scale Up, Down, or Maintain) based on its trained neural network.
3.  **Execution:** 
    - **Automation Mode:** The action is executed immediately via the Cloud Adapters.
    - **Advisory Mode:** The action is logged and displayed in the UI as a recommendation.
4.  **Feedback:** The system calculates a **Reward**. High rewards are given for high resource utilization without SLA breaches.

---

## 4. Local Execution (Manual Setup)
If you are not using Docker, follow these steps to run the system manually in two separate terminals.

### Terminal 1: The Backend (Python)
1.  **Navigate to directory:** `cd backend`
2.  **Activate Virtual Environment:** `.\venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
3.  **Run Server:** `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
    *   *What it does:* Starts the FastAPI app on port 8000. `--reload` ensures the server restarts when you save code.
4.  **Verify:** Visit `http://localhost:8000/api/metrics` to see raw JSON data.

### Terminal 2: The Frontend (React)
1.  **Navigate to directory:** `cd frontend`
2.  **Install Dependencies:** `npm install` (Only needed once).
3.  **Run Dev Server:** `npm run dev`
    *   *What it does:* Compiles the React code and hosts it at `http://localhost:5173`.
4.  **Verify:** Open the URL provided in the terminal to view the dashboard.

### Commands to Stop/Restart
- **Stop:** Press `Ctrl + C` in the respective terminal.
- **Restart:** Press the `Up Arrow` and hit `Enter` to re-run the previous command.

---

## 5. Project Structure
```text
cloud-rl-optimizer/
├── frontend/                     # React UI (Vite, Recharts, Lucide)
├── backend/                      # Python API (FastAPI, PyTorch, SB3)
├── k8s_manifests/                # Kubernetes deployment configurations
└── docker-compose.yml            # Local orchestration setup
```

---

## 6. Advisory Mode vs. Automation Mode
To ensure operational safety and establish trust, OptiStack operates in two user-configured execution modes.

### Automation Mode (Active Execution)
When activated, the RL models bypass human intervention. The FastAPI backend opens direct communication with the cloud execution adapters. When the DQN predicts a `Scale Down` action, it directly executes the destructive call to the AWS/K8s APIs in real time to rightsize infrastructure immediately.

### Advisory Mode (Read-Only)
Designed for onboarding and safety compliance. The RL agent consumes real production metrics and outputs actions, but the *execution layer is disabled*. 
- The React application UI disables all "Auto-Apply" buttons.
- The UI explicitly renders orange "Read-Only" bounding boxes tracking the system state.
- Administrators review the generated recommendations in the Dashboard and manually execute them if they agree with the AI's logic.

---

## 7. Cloud Integration Process
OptiStack uses an Adapter Pattern (`adapters/aws_manager.py` and `adapters/k8s_manager.py`) to interface with various clouds, allowing horizontal scalability across providers.

**Kubernetes Integration (`CLOUD_PROVIDER=k8s`):**
- **Metrics:** Queries `Prometheus` natively via PromQL for CPU/Memory at the Pod and Node level.
- **Execution:** Uses the official Kubernetes Python Client to patch `--replicas` dynamically on Target Deployments based on the RL prediction.
- **RBAC:** Deployed internally to the cluster utilizing strictly scoped RoleBindings via `rbac-config.yaml` to securely govern its execution limits.

**AWS Integration (`CLOUD_PROVIDER=aws`):**
- **Metrics:** Communicates with `Boto3 CloudWatch` client to pull real-time Application Load Balancer (ALB) request metrics and standard EC2 ASG telemetry.
- **Execution:** Executes Boto3 `set_desired_capacity` directly against Auto Scaling Groups.

---

├── frontend/                     # React User Interface
│   ├── src/                     
│   │   ├── components/           # Reusable UI widgets (Charts, Metrics)
│   │   ├── views/                # Full page layouts (Landing, Dashboard, Settings)
│   │   ├── App.jsx               # Application routing and state management
│   │   └── index.css             # Global SaaS Design System CSS
│   └── Dockerfile                # Nginx/Vite build instructions
├── backend/                      # Python RL API
│   ├── adapters/                 # Execution code for K8s and AWS
│   ├── main.py                   # FastAPI Routing & Background Event Loop
│   ├── environment.py            # Simulated Gymnasium MDP Code
│   ├── real_environment.py       # Production execution Gymnasium hook
│   ├── train.py                  # Offline DQN Model training scripts
│   └── Dockerfile                # FastAPI/Uvicorn deployment container
├── k8s_manifests/                # Kubernetes deploy files (RBAC, Deployments)
└── docker-compose.yml            # Local orchestration setup
```

---

## 7. Local Setup & Deployment

### Running Locally (Docker Compose)
The fastest way to run the full OptiStack stack locally for development or testing is via Docker. Ensure Docker Desktop is installed and running.

1. Navigate to the root directory `cloud-rl-optimizer/`.
2. Run the orchestrator:
   ```bash
   docker-compose up --build
   ```
3. The API will spin up at `http://localhost:8000`.
4. The React application will spin up at `http://localhost:5173`. 
5. *Note:* By default, the `docker-compose.yml` sets `PRODUCTION=false`, forcing the system to run the offline simulator for safe UI testing.

### Deployment (Kubernetes)
To deploy OptiStack into a production cluster to natively control replica sets:

1. Build the Docker images and push them to your registry (e.g., DockerHub, AWS ECR):
   ```bash
   docker build -t your-registry/optistack-backend ./backend
   docker build -t your-registry/optistack-frontend ./frontend
   docker push your-registry/optistack-backend
   ```
2. Navigate to the `k8s_manifests/` folder.
3. Ensure you apply the RBAC rules so the backend has permission to read metrics and scale deployments:
   ```bash
   kubectl apply -f rbac-config.yaml
   ```
4. Deploy the backend and frontend services:
   ```bash
   kubectl apply -f backend-deployment.yaml
   kubectl apply -f frontend-deployment.yaml
   ```
5. Ensure the Environment Variables in `backend-deployment.yaml` are correctly targeting your Prometheus service URL and the target deployment name you wish to scale.
