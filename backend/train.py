import os
from stable_baselines3 import DQN
from stable_baselines3.common.env_checker import check_env
from environment import CloudEnv
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.callbacks import EvalCallback
import numpy as np

def train_agent():
    # 1. Initialize environment
    env = CloudEnv()
    
    # Check if the environment follows Gym API
    print("Checking environment compatibility...")
    try:
        check_env(env)
        print("Environment check passed!")
    except Exception as e:
        print(f"Environment check failed: {e}")
        return

    # Wrap the environment with a Monitor to log metrics
    log_dir = "./logs/"
    os.makedirs(log_dir, exist_ok=True)
    env = Monitor(env, log_dir)
    
    # Optional: evaluation environment
    eval_env = CloudEnv()
    eval_callback = EvalCallback(eval_env, best_model_save_path='./models/',
                                 log_path='./logs/', eval_freq=2000,
                                 deterministic=True, render=False)

    # 2. Instantiate the agent
    # We use DQN since the action space is discrete (0, 1, 2)
    model = DQN("MlpPolicy", env, verbose=1, 
                learning_rate=1e-3, 
                buffer_size=50000, 
                learning_starts=1000, 
                batch_size=32, 
                gamma=0.99, 
                exploration_fraction=0.1, 
                exploration_final_eps=0.02, 
                target_update_interval=500)
    
    # 3. Train the agent
    print("Starting training...")
    total_timesteps = 20000 # Increase for better convergence, keep low for fast proto
    model.learn(total_timesteps=total_timesteps, callback=eval_callback, progress_bar=True)
    
    # 4. Save the agent
    model_path = "dqn_cloud_model"
    model.save(model_path)
    print(f"Model saved to {model_path}.zip")

    # 5. Evaluate the trained agent
    print("\n--- Evaluation of Trained Model ---")
    obs, info = eval_env.reset()
    total_rewards = 0
    sla_violations = 0
    episodes = 5
    
    for ep in range(episodes):
        obs, info = eval_env.reset()
        done = False
        ep_reward = 0
        while not done:
            action, _states = model.predict(obs, deterministic=True)
            obs, reward, terminated, truncated, info = eval_env.step(action)
            ep_reward += reward
            if info.get('sla_violation', False):
                sla_violations += 1
            done = terminated or truncated
        total_rewards += ep_reward
        print(f"Episode {ep+1} Total Reward: {ep_reward:.2f}")

    print(f"Average Reward over {episodes} episodes: {total_rewards/episodes:.2f}")
    print(f"Total SLA Violations during eval: {sla_violations}")

if __name__ == "__main__":
    train_agent()
