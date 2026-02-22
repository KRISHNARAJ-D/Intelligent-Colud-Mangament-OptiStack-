import gymnasium as gym
from gymnasium import spaces
import numpy as np
import time
from adapters.k8s_manager import K8sManager

class RealCloudEnv(gym.Env):
    """
    A real Cloud Environment that uses K8sManager to fetch actual Prometheus metrics
    and apply action decisions (scale up/down) to a real Kubernetes Deployment.
    """
    def __init__(self, k8s_manager: K8sManager):
        super(RealCloudEnv, self).__init__()
        
        self.k8s = k8s_manager
        
        # Max values for normalization
        self.MAX_INSTANCES = 20
        self.MIN_INSTANCES = 1
        self.MAX_REQUEST_RATE = 2000.0
        
        # Action Space: 0 = Scale Down, 1 = Maintain, 2 = Scale Up
        self.action_space = spaces.Discrete(3)

        # Observation Space: [CPU, Memory, Request Rate, Active Instances]
        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0]),
            high=np.array([1.0, 1.0, 1.0, 1.0]),
            dtype=np.float32
        )

        self.sla_threshold = 0.85
        
        # Current Real State
        self.active_instances = self.k8s.get_active_instances()
        self.cpu_utilization = 0.0
        self.memory_usage = 0.0
        self.request_rate = 0.0
        
        self.workload_phase = "real-production"
        self.current_step = 0

    def _get_obs(self):
        return np.array([
            self.cpu_utilization,
            self.memory_usage,
            min(1.0, self.request_rate / self.MAX_REQUEST_RATE),
            self.active_instances / self.MAX_INSTANCES
        ], dtype=np.float32)

    def step(self, action):
        self.current_step += 1
        
        # 1. Update intended instances based on RL action
        target_instances = self.active_instances
        
        if action == 0 and self.active_instances > self.MIN_INSTANCES:
            target_instances -= 1
        elif action == 2 and self.active_instances < self.MAX_INSTANCES:
            target_instances += 1
            
        # 2. Apply to Real Cloud if changed
        if target_instances != self.active_instances:
            success = self.k8s.scale_deployment(target_instances)
            if success:
                self.active_instances = target_instances

        # Allow time for cluster to react or just fetch latest metrics
        real_metrics = self.k8s.get_real_metrics()
        self.cpu_utilization = real_metrics.get('cpu_utilization', 0.0)
        self.memory_usage = real_metrics.get('memory_usage', 0.0)
        self.request_rate = real_metrics.get('request_rate', 0.0)
        
        # In the real world, the actual replica count might fluctuate due to crashes, 
        # so sync it with the source of truth
        self.active_instances = self.k8s.get_active_instances()

        # 3. Calculate Reward
        reward = 0.0
        
        # Cost Penalty (Linear with instance count)
        cost_penalty = self.active_instances / self.MAX_INSTANCES
        reward -= 0.1 * cost_penalty

        # SLA Penalty
        sla_violation = 0.0
        if self.cpu_utilization > self.sla_threshold:
            sla_violation = (self.cpu_utilization - self.sla_threshold) * 10
            reward -= 1.0 * sla_violation
            
        # Efficiency Reward
        if 0.5 <= self.cpu_utilization <= self.sla_threshold:
            reward += 0.5

        info = {
            "request_rate": self.request_rate,
            "cpu_utilization": self.cpu_utilization,
            "instances": self.active_instances,
            "sla_violation": sla_violation > 0,
            "reward": reward
        }

        # Real environments don't terminate inherently like a game 
        # So we just run continuously
        return self._get_obs(), float(reward), False, False, info

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        # Fetch actual initial state
        self.active_instances = self.k8s.get_active_instances()
        real_metrics = self.k8s.get_real_metrics()
        
        self.cpu_utilization = real_metrics.get('cpu_utilization', 0.0)
        self.memory_usage = real_metrics.get('memory_usage', 0.0)
        self.request_rate = real_metrics.get('request_rate', 0.0)
        
        return self._get_obs(), {}
