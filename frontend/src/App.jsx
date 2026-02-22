import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Server, Cpu, Activity, AlertTriangle, TrendingDown } from 'lucide-react';
import './index.css';

const API_URL = 'http://localhost:8000/api/metrics';

function App() {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(API_URL);
        const data = response.data;
        setMetrics(data);
        setError(false);
        setHistory(prev => {
          const newHistory = [...prev, data];
          return newHistory.length > 50 ? newHistory.slice(1) : newHistory;
        });
      } catch (err) {
        console.error("Failed to fetch metrics", err);
        setError(true);
      }
    };

    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics && !error) return <div className="loading">Loading Cloud Metrics...</div>;

  return (
    <div className="dashboard">
      <header className="header">
        <Server className="icon" size={32} />
        <h1>Intelligent Cloud Optimizer Dashboard</h1>
        {error && <span className="error-badge">API Disconnected</span>}
      </header>

      <div className="stats-grid">
        <StatCard
          title="Active Instances"
          value={metrics?.active_instances || 0}
          icon={<Server size={24} />}
          color="blue"
        />
        <StatCard
          title="CPU Utilization"
          value={`${((metrics?.cpu_utilization || 0) * 100).toFixed(1)}%`}
          icon={<Cpu size={24} />}
          color={metrics?.cpu_utilization > 0.85 ? "red" : "green"}
        />
        <StatCard
          title="SLA Violations"
          value={metrics?.sla_violations || 0}
          icon={<AlertTriangle size={24} />}
          color="orange"
        />
        <StatCard
          title="Latest Reward"
          value={(metrics?.latest_reward || 0).toFixed(2)}
          icon={<TrendingDown size={24} />}
          color="purple"
        />
        <StatCard
          title="Workload Phase"
          value={metrics?.workload_phase || "Unknown"}
          icon={<Activity size={24} />}
          color="indigo"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Instance Allocation vs Request Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="step" stroke="#888" />
              <YAxis yAxisId="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="stepAfter" dataKey="active_instances" stroke="#3b82f6" strokeWidth={2} name="Instances" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="request_rate" stroke="#10b981" strokeWidth={2} name="Request Rate" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>CPU & Memory Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="step" stroke="#888" />
              <YAxis domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="cpu_utilization" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} name="CPU" />
              <Area type="monotone" dataKey="memory_usage" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Memory" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <div className={`stat-card border-${color}`}>
    <div className={`stat-icon bg-${color}`}>{icon}</div>
    <div className="stat-content">
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  </div>
);

export default App;
