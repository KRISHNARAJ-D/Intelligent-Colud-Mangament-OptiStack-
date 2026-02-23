# OptiStack: Technical Architecture & Product Manual

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [How OptiStack Works (End-to-End Flow)](#2-how-optistack-works-end-to-end-flow)
3. [Reinforcement Learning Workflow](#3-reinforcement-learning-workflow)
4. [Advisory Mode vs. Automation Mode](#4-advisory-mode-vs-automation-mode)
5. [Cloud Integration Process](#5-cloud-integration-process)
6. [Project Structure & Tech Stack](#6-project-structure--tech-stack)
7. [Local Setup & Deployment](#7-local-setup--deployment)

---

## 1. System Architecture Overview
OptiStack is an autonomous cloud infrastructure rightsizing platform. Traditional auto-scaling relies on reactive, hard-coded heuristics (e.g., "if CPU > 80% for 5 mins, add 1 node"). This leads to delayed scaling and inherent resource waste. 

OptiStack replaces this with a **Reinforcement Learning (RL) Engine** powered by a Deep Q-Network (DQN). The AI continuously learns the underlying telemetry patterns of your cloud environment, predicting when to scale up to prevent SLA violations, and aggressively scaling down to prevent idle waste.

**The architecture consists of three primary layers:**
- **Frontend (Presentation & Control):** A modern React/Vite SaaS dashboard providing real-time telemetry rendering and configuration options for the RL engine.
- **Backend (Python FastAPI):** The central nervous system containing the Stable Baselines 3 DQN models, the OpenAPI endpoints, and the simulated cloud environment.
- **Adapters (Execution Layer):** Native integrations leveraging Boto3 for AWS Auto Scaling Groups (ASGs) and Kubernetes Native APIs for replica modifications.

---

## 2. How OptiStack Works (End-to-End Flow)
1. **Telemetry Ingestion:** The backend consumes global workload data (CPU utilization, memory usage, current active instances, and request rates per second) from providers like Prometheus or AWS CloudWatch.
2. **State Formation (MDP):** The telemetry is normalized and assembled into an observation array, forming the Markov Decision Process (MDP) state representation for the AI.
3. **AI Inference & Prediction:** The DQN agent processes the state through its neural network and immediately outputs an action: `Scale Down`, `Maintain`, or `Scale Up`.
4. **Action Routing:** Depending on user settings (Advisory vs. Automation), the backend either routes the action securely to the Cloud Provider via Adapters to instantly alter infrastructure, or simply logs the suggestion for human review.
5. **Reward Feedback Loop:** The environment calculates a reward based on cost efficiency and SLA integrity. The RL agent receives this reward, allowing continuous online learning.

---

## 3. Reinforcement Learning Workflow
The AI agent is trained using the **Gymnasium** API environment (`CloudEnv`). 

**State (Observation Space):**
A normalized array matrix tracking four floating-point values: `[CPU Utilization, Memory Usage, Request Rate, Active Instances]`.

**Action Space:**
A discrete space where the agent can select:
- `0`: Scale Down (Remove capacity)
- `1`: Maintain (Do nothing)
- `2`: Scale Up (Deploy capacity)

**Reward Function:**
The AI seeks to maximize its score across three vectors:
- **Cost Penalty:** A negative reward scalar mapping to the number of active instances. The agent is strictly incentivized to run with the *fewest nodes possible*.
- **SLA Penalty:** A steep exponential negative reward applied if `cpu_utilization > 0.85` (85%). This forces the agent to prevent crashes.
- **Efficiency Reward:** A positive micro-reward if the CPU sits comfortably between 50% and 85%.

---

## 4. Advisory Mode vs. Automation Mode
To ensure operational safety and establish trust, OptiStack operates in two user-configured execution modes.

### Automation Mode (Active Execution)
When activated, the RL models bypass human intervention. The FastAPI backend opens direct communication with the cloud execution adapters. When the DQN predicts a `Scale Down` action, it directly executes the destructive call to the AWS/K8s APIs in real time to rightsize infrastructure immediately.

### Advisory Mode (Read-Only)
Designed for onboarding and safety compliance. The RL agent consumes real production metrics and outputs actions, but the *execution layer is disabled*. 
- The React application UI disables all "Auto-Apply" buttons.
- The UI explicitly renders orange "Read-Only" bounding boxes tracking the system state.
- Administrators review the generated recommendations in the Dashboard and manually execute them if they agree with the AI's logic.

---

## 5. Cloud Integration Process
OptiStack uses an Adapter Pattern (`adapters/aws_manager.py` and `adapters/k8s_manager.py`) to interface with various clouds, allowing horizontal scalability across providers.

**Kubernetes Integration (`CLOUD_PROVIDER=k8s`):**
- **Metrics:** Queries `Prometheus` natively via PromQL for CPU/Memory at the Pod and Node level.
- **Execution:** Uses the official Kubernetes Python Client to patch `--replicas` dynamically on Target Deployments based on the RL prediction.
- **RBAC:** Deployed internally to the cluster utilizing strictly scoped RoleBindings via `rbac-config.yaml` to securely govern its execution limits.

**AWS Integration (`CLOUD_PROVIDER=aws`):**
- **Metrics:** Communicates with `Boto3 CloudWatch` client to pull real-time Application Load Balancer (ALB) request metrics and standard EC2 ASG telemetry.
- **Execution:** Executes Boto3 `set_desired_capacity` directly against Auto Scaling Groups.

---

## 6. Project Structure & Tech Stack

**Tech Stack:**
- **Frontend:** React.js 18, Vite, Recharts, Lucide Icons, Vanilla CSS (Glassmorphism + SaaS Design).
- **Backend:** Python 3, FastAPI, Uvicorn, Stable Baselines 3 (PyTorch), Gymnasium.
- **Infrastructure:** Docker Compose, Kubernetes Manifests.

**Folder Outline:**
```text
cloud-rl-optimizer/
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
