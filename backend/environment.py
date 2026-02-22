import gymnasium as gym
from gymnasium import spaces
import numpy as np
import random

class CloudEnv(gym.Env):
    """
    Cloud Environment simulating resource scaling under varying workloads.
    """
    metadata = {"render_modes": ["human"]}

    def __init__(self):
        super(CloudEnv, self).__init__()

        # Max values for normalization and limits
        self.MAX_INSTANCES = 10
        self.MIN_INSTANCES = 1
        self.MAX_REQUEST_RATE = 1000.0
        
        # Action Space: 0 = Scale Down, 1 = Maintain, 2 = Scale Up
        self.action_space = spaces.Discrete(3)

        # Observation Space:
        # [CPU Utilization, Memory Usage, Request Rate (normalized), Active Instances (normalized)]
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0]),
            high=np.array([1.0, 1.0, 1.0, 1.0]),
            dtype=np.float32
        )

        # Environment parameters
        self.cpu_per_request = 0.005 # Each request per second adds 0.5% CPU
        self.base_cpu = 0.05         # Base OS/overhead CPU 5%
        self.sla_threshold = 0.85    # SLA violation if CPU > 85%
        
        # Reward weights
        self.cost_penalty_weight = 0.1
        self.sla_penalty_weight = 1.0
        self.efficiency_reward_weight = 0.5

        # Workload generation state
        self.current_step = 0
        self.max_steps = 200
        self.workload_phase = 'sustained' # 'sustained', 'burst', 'low'
        self.phase_duration = 0

        self.reset()

    def _generate_workload(self):
        """Generates realistic workload with bursts and sustained phases."""
        if self.phase_duration <= 0:
            # Change phase
            phases = ['sustained', 'burst', 'low']
            self.workload_phase = random.choices(phases, weights=[0.6, 0.2, 0.2])[0]
            self.phase_duration = random.randint(10, 30)

        self.phase_duration -= 1

        if self.workload_phase == 'burst':
            return min(self.MAX_REQUEST_RATE, random.normalvariate(800, 100))
        elif self.workload_phase == 'sustained':
            return random.normalvariate(400, 50)
        else:
            return max(0, random.normalvariate(100, 30))

    def _get_obs(self):
        return np.array([
            self.cpu_utilization,
            self.memory_usage,
            self.request_rate / self.MAX_REQUEST_RATE,
            self.active_instances / self.MAX_INSTANCES
        ], dtype=np.float32)

    def step(self, action):
        self.current_step += 1

        # Apply action
        if action == 0 and self.active_instances > self.MIN_INSTANCES:
            self.active_instances -= 1
        elif action == 2 and self.active_instances < self.MAX_INSTANCES:
            self.active_instances += 1

        # Generate new workload
        self.request_rate = self._generate_workload()

        # Calculate metrics
        # Requests are distributed across instances
        req_per_instance = self.request_rate / self.active_instances
        
        self.cpu_utilization = min(1.0, self.base_cpu + (req_per_instance * self.cpu_per_request))
        self.memory_usage = min(1.0, 0.2 + (req_per_instance * 0.001)) # Simplified memory model

        # Calculate Reward
        reward = 0.0
        
        # 1. Cost Penalty (more instances = higher cost)
        cost_penalty = self.active_instances / self.MAX_INSTANCES
        reward -= self.cost_penalty_weight * cost_penalty

        # 2. SLA Penalty (CPU overload)
        sla_violation = 0.0
        if self.cpu_utilization > self.sla_threshold:
            # Exponentiate penalty for severe violations
            sla_violation = (self.cpu_utilization - self.sla_threshold) * 10
            reward -= self.sla_penalty_weight * sla_violation
        
        # 3. Efficiency Reward (keeping CPU nicely engaged but safe, e.g., 60-80%)
        if 0.5 <= self.cpu_utilization <= self.sla_threshold:
            reward += self.efficiency_reward_weight

        # Oscillatory penalty (Optional, implicit in cost/SLA if tuned well)

        terminated = bool(self.current_step >= self.max_steps)
        truncated = False
        info = {
            "request_rate": self.request_rate,
            "cpu_utilization": self.cpu_utilization,
            "instances": self.active_instances,
            "sla_violation": sla_violation > 0,
            "reward": reward
        }

        return self._get_obs(), float(reward), terminated, truncated, info

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0
        self.active_instances = 2
        self.workload_phase = 'sustained'
        self.phase_duration = random.randint(10, 30)
        self.request_rate = self._generate_workload()
        
        req_per_instance = self.request_rate / self.active_instances
        self.cpu_utilization = min(1.0, self.base_cpu + (req_per_instance * self.cpu_per_request))
        self.memory_usage = min(1.0, 0.2 + (req_per_instance * 0.001))
        
        return self._get_obs(), {}

    def render(self):
        print(f"Step: {self.current_step} | Instances: {self.active_instances} | "
              f"Req Rate: {self.request_rate:.2f} | CPU: {self.cpu_utilization:.2%} | "
              f"Phase: {self.workload_phase}")
