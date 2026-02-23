from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from stable_baselines3 import DQN
from environment import CloudEnv
from real_environment import RealCloudEnv
from adapters.k8s_manager import K8sManager
from adapters.aws_manager import AWSCloudManager
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cloud RL Optimizer API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state to hold environment metrics
class GlobalMetrics(BaseModel):
    step: int = 0
    cpu_utilization: float = 0.0
    memory_usage: float = 0.0
    request_rate: float = 0.0
    active_instances: int = 0
    total_reward: float = 0.0
    sla_violations: int = 0
    latest_reward: float = 0.0
    workload_phase: str = "sustained"

global_state = GlobalMetrics()

# RL Model and Environment
env = None
model = None
sim_task = None

def load_sim():
    global env, model
    try:
        # Check if we are running in production (Real Cloud) or Simulation
        is_production = os.getenv("PRODUCTION", "false").lower() == "true"
        cloud_provider = os.getenv("CLOUD_PROVIDER", "k8s").lower()
        
        if is_production:
            if cloud_provider == "aws":
                logger.info("Initializing REAL AWS Cloud Environment")
                aws_manager = AWSCloudManager(
                    region_name=os.getenv("AWS_REGION", "us-east-1"),
                    asg_name=os.getenv("AWS_ASG_NAME", "cloud-rl-asg")
                )
                env = RealCloudEnv(aws_manager)
            else:
                logger.info("Initializing REAL Kubernetes Cloud Environment")
                k8s_manager = K8sManager(
                    prometheus_url=os.getenv("PROMETHEUS_URL", "http://prometheus:9090"),
                    namespace=os.getenv("K8S_NAMESPACE", "default"),
                    deployment_name=os.getenv("K8S_DEPLOYMENT", "app-backend")
                )
                env = RealCloudEnv(k8s_manager)
        else:
            logger.info("Initializing SIMULATED Cloud Environment")
            env = CloudEnv()
            
        model = DQN.load("dqn_cloud_model.zip")
        logger.info("Environment and Model loaded successfully.")
    except Exception as e:
        logger.error(f"Error loading model: {e}")

async def run_simulation_loop():
    global env, model, global_state
    obs, info = env.reset()
    
    # Update initial state
    global_state.active_instances = env.active_instances
    global_state.cpu_utilization = env.cpu_utilization
    global_state.memory_usage = env.memory_usage
    global_state.request_rate = env.request_rate
    global_state.workload_phase = env.workload_phase
    
    while True:
        try:
            # RL Agent predicts the action
            action, _states = model.predict(obs, deterministic=True)
            
            # Take step in the environment
            obs, reward, terminated, truncated, info = env.step(action)
            
            # Update global state
            global_state.step += 1
            global_state.active_instances = env.active_instances
            global_state.cpu_utilization = env.cpu_utilization
            global_state.memory_usage = env.memory_usage
            global_state.request_rate = env.request_rate
            global_state.latest_reward = float(reward)
            global_state.total_reward += float(reward)
            global_state.workload_phase = env.workload_phase
            
            if info.get('sla_violation', False):
                global_state.sla_violations += 1
                
            if terminated or truncated:
                obs, info = env.reset()
                # Optionally don't reset total rewards and SLA to see cumulative over time
                logger.info(f"Episode completed at step {global_state.step}")
                
            await asyncio.sleep(1.0) # Step every 1 second
            
        except Exception as e:
            logger.error(f"Simulation loop error: {e}")
            await asyncio.sleep(5) # Pause on error

@app.on_event("startup")
async def startup_event():
    load_sim()
    global sim_task
    # Start the simulation loop in the background
    sim_task = asyncio.create_task(run_simulation_loop())

@app.get("/")
async def root():
    """
    Root endpoint providing a friendly welcome and link to docs.
    """
    return {
        "message": "Welcome to OptiStack API!",
        "docs_url": "/docs",
        "status": "Running"
    }

@app.get("/api/metrics", response_model=GlobalMetrics)
async def get_metrics():
    """
    Returns the real-time state of the cloud environment.
    """
    return global_state

@app.post("/api/reset")
async def reset_simulation():
    """
    Resets the environment and cumulative metrics.
    """
    global env, global_state
    obs, info = env.reset()
    global_state = GlobalMetrics() # Reset state
    global_state.active_instances = env.active_instances
    global_state.cpu_utilization = env.cpu_utilization
    global_state.memory_usage = env.memory_usage
    global_state.request_rate = env.request_rate
    global_state.workload_phase = env.workload_phase
    return {"status": "reset successful"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
