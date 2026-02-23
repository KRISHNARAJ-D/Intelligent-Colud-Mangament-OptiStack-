import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Activity, Settings, CloudRain, Shield, Zap, TrendingDown, LayoutDashboard, Database,
  AlertTriangle, CreditCard, ChevronRight, Moon, Sun, Bell, CheckCircle, PlayCircle, Network, Code, Server
} from 'lucide-react';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://intelligent-colud-mangament-optistack.onrender.com/api/metrics';

// Shared Colors
const COLORS = ['#0ea5e9', '#14b8a6', '#6366f1', '#8b5cf6'];
const PIE_DATA = [
  { name: 'Compute (EC2)', value: 4500 },
  { name: 'Database (RDS)', value: 2500 },
  { name: 'Storage (S3)', value: 1200 },
  { name: 'Network', value: 800 },
];

export default function AppWrapper() {
  const [theme, setTheme] = useState(() => localStorage.getItem('optistackTheme') || 'system');
  const [rlMode, setRlMode] = useState(() => localStorage.getItem('optistack_rl_mode') || 'autonomous');
  const [view, setView] = useState('landing'); // 'landing' | 'app'

  useEffect(() => {
    let activeTheme = theme;
    if (theme === 'system') {
      activeTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem('optistackTheme', theme);
  }, [theme]);

  // Handle system theme changes dynamically
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('optistack_rl_mode', rlMode);
  }, [rlMode]);

  if (view === 'landing') return <LandingPage setView={setView} theme={theme} setTheme={setTheme} />;
  return <DashboardApp setView={setView} theme={theme} setTheme={setTheme} rlMode={rlMode} setRlMode={setRlMode} />;
}

/* =========================================
   1. LANDING PAGE
=========================================== */
const K8sLogo = ({ size = 32 }) => (
  <svg role="img" viewBox="0 0 24 24" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <path fill="#326ce5" d="M11.956 0 1.258 4.093l.363 11.458 10.335 8.449 10.785-8.449-.364-11.458ZM6.892 10.999l-2.09-.908 1.636-3.832 2.052.88-1.598 3.86Zm8.04 4.053l-3.327 2.072-1.071-1.688 3.325-2.071 1.073 1.687Zm2.043-4.148-1.654-.863 2.158-3.784 1.656.863-2.16 3.784Zm-4.991.684a2.278 2.278 0 0 1-2.278-2.278c0-1.257 1.021-2.278 2.278-2.278s2.278 1.021 2.278 2.278-1.021 2.278-2.278 2.278ZM11.42 6.841h1.996v3.831H11.42Z" />
  </svg>
);

const RadarLogo = ({ size = 24 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} stroke="var(--blue, #0ea5e9)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12l5.5-5.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="7" stroke="var(--blue, #0ea5e9)" opacity="0.4" />
  </svg>
);

function BlogModal({ blog, onClose }) {
  if (!blog) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content animate-scale-up" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <div className="modal-hero-image" style={{ backgroundImage: `url(${blog.image})` }} />
        <div className="modal-body">
          <span className="blog-tag">{blog.tag}</span>
          <h2 className="modal-title">{blog.title}</h2>
          <div className="modal-text">
            {blog.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage({ setView, theme, setTheme }) {
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeBlog, setActiveBlog] = useState(null);

  const BLOG_ARTICLES = [
    {
      id: 1,
      tag: 'Engineering',
      title: 'How Deep Q-Learning is Replacing Traditional HPA',
      excerpt: 'Explore the mathematical foundations behind OptiStack’s autonomous scaling policy and why reactive heuristics are dead.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
      content: 'In modern cloud architectures, the Horizontal Pod Autoscaler (HPA) has long been the gold standard for adjusting resources based on CPU or memory thresholds. However, HPAs inherently suffer from hysteresis—they scale up too late during sudden spikes, and scale down too slowly, resulting in either dropped requests or wasted idle spend.\n\nAt OptiStack, we are replacing this reactive heuristic with a Deep Q-Network (DQN). By observing thousands of state transitions—incorporating request rates, queue depths, and historical diurnal patterns—the RL agent learns to accurately predict when to pre-warm nodes before traffic hits, and when to confidently scale back. This shift from reactive rules to predictive intelligence reduces compute waste by an average of 41% across enterprise workloads.'
    },
    {
      id: 2,
      tag: 'Case Study',
      title: 'Saving $500k/mo on AWS EKS with RL',
      excerpt: 'How Acme Corp reduced their monthly cloud spend by 41% after migrating to our AI orchestrator.',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600',
      content: 'Acme Corp, a global e-commerce giant, was struggling with an AWS EKS bill that exceeded $1.2M per month. Their microservices were heavily over-provisioned to handle flash sales, leading to massive idle clusters during off-peak hours.\n\nWithin 48 hours of deploying OptiStack in "Advisory Mode", the engine identified $500k in monthly inefficiencies. Upon switching to "Autonomous Mode", the RL Agent dynamically adjusted node groups in real-time, matching compute strictly to live queue demands. The result was a seamless 41% cost reduction with absolutely zero impact on P99 latency.'
    },
    {
      id: 3,
      tag: 'Product',
      title: 'OptiStack v2.4: Out of the Box Azure VMSS Adapters',
      excerpt: 'We are thrilled to announce native support for Azure VMSS, allowing complete multi-cloud optimization.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
      content: 'Multi-cloud strategy is no longer a luxury; it is an enterprise requirement. Today, we are proud to launch OptiStack v2.4, featuring out-of-the-box adapters for Microsoft Azure Virtual Machine Scale Sets (VMSS).\n\nThis update allows cross-cloud RL models to deploy policies seamlessly across both AWS and Azure simultaneously. Leveraging Managed Identities for secure access, the engine now pulls native Azure Monitor metrics directly into the Q-learning pipeline. Whether you are running .NET workloads on Windows Server or containers in AKS, OptiStack can now fully automate your entire footprint.'
    }
  ];

  const [backendStatus, setBackendStatus] = useState('idle'); // idle | checking | ok | error

  const handleStartOptimizing = async () => {
    setIsNavigating(true);
    setBackendStatus('checking');
    try {
      await axios.get(API_URL, { timeout: 5000 });
      setBackendStatus('ok');
      setTimeout(() => {
        setView('app');
        setIsNavigating(false);
      }, 600);
    } catch (err) {
      setBackendStatus('error');
      setIsNavigating(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-wrapper modern-landing">
      {activeBlog && <BlogModal blog={activeBlog} onClose={() => setActiveBlog(null)} />}
      <nav className={`landing-nav ${isNavScrolled ? 'scrolled glass-nav' : ''}`}>
        <div className="brand-logo" style={{ cursor: 'pointer' }}>
          <Zap size={28} color="var(--primary)" className="spin-slow" />
          <span className="brand-text gradient-text-brand">OptiStack</span>
        </div>
        <div className="nav-links hidden-mobile">
          <a href="#features">Features</a>
          <a href="#process">How it Works</a>
          <a href="#integrations">Integrations</a>
          <a href="#blog">Blog</a>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="primary-btn glass-btn" onClick={() => setView('app')}>Dashboard Login</button>
        </div>
      </nav>

      <section className="hero-section modern-hero">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>

        <div className="hero-content">
          <div className="tagline glass-pill">
            <Zap size={14} color="var(--orange)" /> Enterprise-Grade RL Optimizer
          </div>
          <h1 className="hero-title">
            <span className="gradient-text">OptiStack</span> autonomously rightsizes <br />
            your infrastructure in real time.
          </h1>
          <p className="hero-subtext">
            Reduce cloud waste by <span className="gradient-highlight">up to 40%</span> — without downtime.
          </p>

          {backendStatus === 'error' && (
            <div className="hero-error-banner" style={{ display: 'inline-flex', margin: '0 auto 1.5rem' }}>
              <AlertTriangle size={16} />
              <span>Backend offline — start FastAPI on port 8000.</span>
            </div>
          )}
          {backendStatus === 'ok' && (
            <div className="hero-success-banner" style={{ display: 'inline-flex', margin: '0 auto 1.5rem' }}>
              <CheckCircle size={16} />
              <span>Connected! Launching dashboard...</span>
            </div>
          )}

          <div className="hero-actions-grid">
            <button className="cta-gradient-btn huge-btn" onClick={handleStartOptimizing} disabled={isNavigating}>
              {isNavigating && backendStatus === 'checking' ? (
                <><div className="spinner-small" /> Connecting...</>
              ) : (
                <>Start Optimizing Now <ChevronRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="stats-bar-section">
        <div className="stats-bar-inner">
          <div className="stats-bar-item">
            <span className="stats-bar-num">40%</span>
            <span className="stats-bar-label">Avg. Cost Reduction</span>
          </div>
          <div className="stats-bar-divider"></div>
          <div className="stats-bar-item">
            <span className="stats-bar-num">5ms</span>
            <span className="stats-bar-label">Decision Latency</span>
          </div>
          <div className="stats-bar-divider"></div>
          <div className="stats-bar-item">
            <span className="stats-bar-num">99.9%</span>
            <span className="stats-bar-label">SLA Uptime</span>
          </div>
          <div className="stats-bar-divider"></div>
          <div className="stats-bar-item">
            <span className="stats-bar-num">4+</span>
            <span className="stats-bar-label">Cloud Providers</span>
          </div>
        </div>
      </section>

      <section className="power-section" id="features">
        <div className="power-inner">
          <div className="section-header" style={{ position: 'relative', zIndex: 2 }}>
            <div className="tagline glass-pill" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', marginBottom: '1.5rem' }}>
              <Zap size={14} color="var(--orange)" /> Built on Deep Q-Networks
            </div>
            <h2 className="section-title" style={{ color: '#fff' }}>The Power of <span className="gradient-text">OptiStack</span></h2>
            <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.1rem' }}>Six capabilities. One platform. Zero waste.</p>
          </div>

          <div className="power-grid">
            <FeatureCard dark icon={<RadarLogo />} title="Real-Time Tracking" text="Monitor global multi-cloud spend down to the microsecond." delay="0s" />
            <FeatureCard dark icon={<Zap color="var(--orange)" />} title="Smart Scaling" text="RL Agents deploy autonomous bounding logic to prevent idle loss." delay="0.05s" />
            <FeatureCard dark icon={<Database color="var(--purple)" />} title="Idle Detection" text="Identifies unattached EBS volumes, empty databases, and stale IPs." delay="0.1s" />
            <FeatureCard dark icon={<Activity color="var(--primary)" />} title="Cost Anomaly Detection" text="AI automatically detects unusual spending spikes with real-time alerting." delay="0.15s" />
            <FeatureCard dark icon={<Shield color="var(--green)" />} title="Compliance Guardrails" text="Enforce budget policies and role-based optimization controls seamlessly." delay="0.2s" />
            <FeatureCard dark icon={<CloudRain color="var(--teal)" />} title="Multi-Cloud" text="Native adapters for AWS ASGs, Kubernetes, GCP, and Azure." delay="0.25s" />
          </div>
        </div>
      </section>

      <section className="process-section" id="process">
        <div className="section-header">
          <h2 className="section-title">How OptiStack Works</h2>
          <p className="section-subtitle">Five steps from connection to continuous savings.</p>
        </div>
        <div className="stepper-wrapper">
          <div className="stepper-line"></div>

          <div className="stepper-item">
            <div className="stepper-icon-box glass-box"><Network size={24} color="var(--primary)" /></div>
            <div className="stepper-content">
              <h4>Connect</h4>
              <p>Zero-trust onboarding across AWS, GCP, Azure &amp; K8s.</p>
            </div>
          </div>

          <div className="stepper-item">
            <div className="stepper-icon-box glass-box"><Activity size={24} color="var(--purple)" /></div>
            <div className="stepper-content">
              <h4>Observe</h4>
              <p>RL agent tracks CPU, memory &amp; request telemetry live.</p>
            </div>
          </div>

          <div className="stepper-item">
            <div className="stepper-icon-box glass-box"><TrendingDown size={24} color="var(--teal)" /></div>
            <div className="stepper-content">
              <h4>Predict</h4>
              <p>Detects waste &amp; forecasts monthly spend trajectories.</p>
            </div>
          </div>

          <div className="stepper-item">
            <div className="stepper-icon-box glass-box"><CheckCircle size={24} color="var(--green)" /></div>
            <div className="stepper-content">
              <h4>Optimize</h4>
              <p>Advisory suggestions or live automated rightsizing.</p>
            </div>
          </div>

          <div className="stepper-item">
            <div className="stepper-icon-box glass-box"><Zap size={24} color="var(--orange)" /></div>
            <div className="stepper-content">
              <h4>Improve</h4>
              <p>DQN feedback loop adapts to workload shifts over time.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-section" id="blog">
        <div className="section-header">
          <h2 className="section-title">Latest & <span className="gradient-text">Greatest</span></h2>
          <p className="section-subtitle">Insights from our engineering team on scaling workloads with AI.</p>
        </div>
        <div className="blog-grid premium-grid">
          <div className="blog-card glass-card featured-blog">
            <div className="blog-image-wrapper">
              <div className="blog-image-placeholder gradient-1" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600)', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            </div>
            <div className="blog-content">
              <span className="blog-tag">Engineering</span>
              <h3 className="blog-title">How Deep Q-Learning is Replacing Traditional HPA</h3>
              <p className="blog-excerpt">Explore the mathematical foundations behind OptiStack’s autonomous scaling policy and why reactive heuristics are dead.</p>
              <button className="read-more-btn" onClick={() => setActiveBlog(BLOG_ARTICLES[0])}>
                Read Article <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="blog-card glass-card">
            <div className="blog-image-wrapper">
              <div className="blog-image-placeholder gradient-2" style={{ backgroundImage: `url(${BLOG_ARTICLES[1].image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            </div>
            <div className="blog-content">
              <span className="blog-tag">Case Study</span>
              <h3 className="blog-title">Saving $500k/mo on AWS EKS with RL</h3>
              <p className="blog-excerpt">How Acme Corp reduced their monthly cloud spend by 41% after migrating to our AI orchestrator.</p>
              <button className="read-more-btn" onClick={() => setActiveBlog(BLOG_ARTICLES[1])}>
                Read Article <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="blog-card glass-card">
            <div className="blog-image-wrapper">
              <div className="blog-image-placeholder gradient-3" style={{ backgroundImage: `url(${BLOG_ARTICLES[2].image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            </div>
            <div className="blog-content">
              <span className="blog-tag">Product</span>
              <h3 className="blog-title">OptiStack v2.4: Out of the Box Azure VMSS Adapters</h3>
              <p className="blog-excerpt">We are thrilled to announce native support for Azure VMSS, allowing complete multi-cloud optimization.</p>
              <button className="read-more-btn" onClick={() => setActiveBlog(BLOG_ARTICLES[2])}>
                Read Article <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="integrations-section" id="integrations">
        <div className="section-header">
          <h2 className="section-title">Seamless <span className="gradient-text">Integrations</span></h2>
          <p className="section-subtitle">Plug OptiStack into your existing cloud ecosystem in minutes — zero agent installation required.</p>
        </div>
        <div className="integrations-logo-grid">
          <div className="integration-tile">
            <div className="integration-tile-icon" style={{ color: '#FF9900' }}><Server size={36} /></div>
            <span className="integration-tile-name">Amazon Web Services</span>
            <span className="integration-tile-sub">EC2 · ASG · CloudWatch</span>
          </div>
          <div className="integration-tile">
            <div className="integration-tile-icon" style={{ color: '#326CE5' }}><K8sLogo size={36} /></div>
            <span className="integration-tile-name">Kubernetes</span>
            <span className="integration-tile-sub">ReplicaSets · Prometheus · RBAC</span>
          </div>
          <div className="integration-tile">
            <div className="integration-tile-icon" style={{ color: '#EA4335' }}><CloudRain size={36} /></div>
            <span className="integration-tile-name">Google Cloud</span>
            <span className="integration-tile-sub">Cloud Run · GKE · Cloud Monitoring</span>
          </div>
          <div className="integration-tile">
            <div className="integration-tile-icon" style={{ color: '#0078D4' }}><Database size={36} /></div>
            <span className="integration-tile-name">Microsoft Azure</span>
            <span className="integration-tile-sub">VMSS · Azure Monitor · Managed ID</span>
          </div>
          <div className="integration-tile">
            <div className="integration-tile-icon" style={{ color: 'var(--green)' }}><Activity size={36} /></div>
            <span className="integration-tile-name">Gymnasium</span>
            <span className="integration-tile-sub">MDP · Offline Simulator · Gym API</span>
          </div>
          <div className="integration-tile">
            <div className="integration-tile-icon" style={{ color: 'var(--purple)' }}><Code size={36} /></div>
            <span className="integration-tile-name">FastAPI + React</span>
            <span className="integration-tile-sub">REST · WebSocket · Vite</span>
          </div>
        </div>
      </section>

      <section className="company-section" id="company" style={{ padding: '8rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-header">
          <h2 className="section-title">Why Choose <span className="gradient-text">OptiStack?</span></h2>
          <p className="section-subtitle">We are engineers building the autonomous future of cloud infrastructure.</p>
        </div>

        <div className="premium-grid" style={{ marginBottom: '4rem' }}>
          <div className="glass-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}><Activity size={24} /> Our Mission</h3>
            <p>To fundamentally eliminate cloud waste by replacing reactive scaling heuristics with predictive, agentic AI systems that learn your infrastructure.</p>
          </div>
          <div className="glass-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--purple)' }}><Network size={24} /> Our Vision</h3>
            <p>A zero-touch cloud ecosystem where compute resources automatically expand and contract in perfect synchronicity with global user demand.</p>
          </div>
          <div className="glass-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)' }}><Shield size={24} /> Core Values</h3>
            <ul style={{ color: 'var(--text-muted)', lineHeight: 1.8, margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
              <li>Security & Trust First</li>
              <li>Data-Driven Execution</li>
              <li>Relentless Efficiency</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="modern-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="brand-logo">
              <Zap size={24} color="var(--primary)" />
              <span className="brand-text">OptiStack</span>
            </div>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Next-generation reinforcement learning for cloud optimization.</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#process">How it Works</a>
              <a href="#integrations">Integrations</a>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <a href="#blog">Blog</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 OptiStack Inc. Enterprise SaaS Infrastructure.</p>
        </div>
      </footer>
    </div>
  )
}

const FeatureCard = ({ icon, title, text, delay, dark }) => (
  <div className={`feature-card glass-card${dark ? ' feature-card-dark' : ''}`} style={{ animationDelay: delay }}>
    <div className="feature-icon-wrapper glow-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const IntegrationCard = ({ icon, title, text, color }) => (
  <div className="integration-card align-top glass-card" style={{ '--accent-color': color }}>
    <div className="integration-header">
      <div className="integration-icon glow-icon">{icon}</div>
      <h3 className="integration-title">{title}</h3>
    </div>
    <p>{text}</p>
  </div>
);

/* =========================================
   2. DASHBOARD APP
=========================================== */
function DashboardApp({ setView, theme, setTheme, rlMode, setRlMode }) {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedResource, setSelectedResource] = useState(null); // For detailed view
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(API_URL);
        const data = response.data;
        // Synthesize Cloud Cost from Instances (Assume $10.50/hr per instance)
        data.synthetic_spend = (data.active_instances * 10.5);
        setMetrics(data);
        setError(false);
        setHistory(prev => {
          const newH = [...prev, data];
          return newH.length > 30 ? newH.slice(1) : newH;
        });
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('home'); setSelectedResource(null); }}>
          <Zap size={24} color="var(--primary)" />
          <span className="brand-text">OptiStack</span>
        </div>
        <div className="sidebar-links">
          <SideLink icon={<LayoutDashboard size={18} />} label="Home" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); setSelectedResource(null); }} />
          <SideLink icon={<Activity size={18} />} label="Analytics" active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setSelectedResource(null); }} />
          <SideLink icon={<Server size={18} />} label="Resources" active={activeTab === 'resources'} onClick={() => { setActiveTab('resources'); setSelectedResource(null); }} />
          <SideLink icon={<CreditCard size={18} />} label="Costs" active={activeTab === 'costs'} onClick={() => { setActiveTab('costs'); setSelectedResource(null); }} />
          <SideLink icon={<TrendingDown size={18} />} label="Suggestions" active={activeTab === 'suggestions'} onClick={() => { setActiveTab('suggestions'); setSelectedResource(null); }} />
          <SideLink icon={<AlertTriangle size={18} />} label="Budgets" active={activeTab === 'alerts'} onClick={() => { setActiveTab('alerts'); setSelectedResource(null); }} />
          <SideLink icon={<Settings size={18} />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setSelectedResource(null); }} />
        </div>
      </aside>

      {/* Main Container */}
      <div className="main-view">
        {/* Top Navbar */}
        <header className="top-nav">
          <div className="nav-controls">
            <select className="dropdown-select">
              <option>AWS Production</option>
              <option>AWS Staging</option>
              <option>Kubernetes (EKS)</option>
              <option>GCP Backup</option>
            </select>
            <select className="dropdown-select hidden-mobile">
              <option>Last 30 Days</option>
              <option>This Month</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="nav-controls">
            {rlMode === 'advisory' && (
              <span className="glass-pill hide-mobile" style={{ color: 'var(--orange)', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                <AlertTriangle size={14} /> Advisory Mode
              </span>
            )}
            <button className="secondary-btn" onClick={() => setView('landing')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              Back to Landing
            </button>
            <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="icon-btn"><Bell size={18} /></button>
            <div className="user-profile">JD</div>
          </div>
        </header>

        {/* Workspace */}
        <div className="workspace">
          {error ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' }}>
              <AlertTriangle size={64} color="var(--red)" style={{ marginBottom: '1.5rem' }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>Connection Failed</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '2rem' }}>Unable to connect to the OptiStack backend. Please ensure the Python FastAPI service is running on port 8000.</p>
              <button className="primary-btn" onClick={() => setView('landing')}>Return to Landing</button>
            </div>
          ) : !metrics ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div className="spinner" style={{ marginBottom: '2rem' }}></div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Initializing AI Engine</h2>
              <p style={{ color: 'var(--text-muted)' }}>Establishing secure connection to cloud infrastructure...</p>
            </div>
          ) : selectedResource ? (
            <DetailedResourceView resource={selectedResource} onBack={() => setSelectedResource(null)} history={history} />
          ) : (
            <div className="workspace-content animate-fade-in">
              {activeTab === 'home' && <DashboardHome metrics={metrics} setActiveTab={setActiveTab} rlMode={rlMode} />}
              {activeTab === 'analytics' && <DashboardOverview metrics={metrics} history={history} onSelectRes={() => { setActiveTab('resources'); setSelectedResource('production-asg'); }} />}
              {activeTab === 'costs' && <CostAnalytics history={history} />}
              {activeTab === 'suggestions' && <OptimizationSuggestions rlMode={rlMode} />}
              {activeTab === 'resources' && <ResourcesList onSelect={() => setSelectedResource('aws-prod-asg-1')} />}
              {activeTab === 'alerts' && <BudgetsAndAlerts />}
              {activeTab === 'settings' && <SystemSettings theme={theme} setTheme={setTheme} rlMode={rlMode} setRlMode={setRlMode} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SideLink = ({ icon, label, active, onClick }) => (
  <div className={`sidebar-link ${active ? 'active' : ''}`} onClick={onClick}>
    {icon} {label}
  </div>
);

/* =========================================
   VIEWS
=========================================== */
function DashboardHome({ metrics, setActiveTab, rlMode }) {
  return (
    <div className="home-dashboard">
      <div className="welcome-section" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome back, JD! 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', margin: 0 }}>Here's what your RL agent has been up to today.</p>
        </div>

        <div className="ui-card mode-status-card" style={{ padding: '1.25rem', minWidth: '320px', flex: 'none', background: rlMode === 'advisory' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)', borderColor: rlMode === 'advisory' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: 700, fontSize: '1.1rem', color: rlMode === 'advisory' ? 'var(--orange)' : 'var(--green)' }}>
            {rlMode === 'advisory' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            {rlMode === 'advisory' ? 'Advisory Mode Active' : 'Automation Mode Active'}
          </div>
          <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {rlMode === 'advisory' ? 'Auto-scaling is disabled. Providing recommendations only.' : 'Agent is actively managing scaling operations.'}
          </p>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--inner-border)', paddingTop: '0.75rem' }}>
            <span>Engine: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{rlMode === 'advisory' ? 'Read-only' : 'Active'}</span></span>
            <span>Last Saved: <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Just now</span></span>
          </div>
        </div>
      </div>

      <div className="util-grid" style={{ marginBottom: '2rem' }}>
        <div className="ui-card">
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>Active Resources</h4>
          <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{metrics.active_instances} Nodes</h2>
        </div>
        <div className="ui-card">
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>Est. Monthly Savings</h4>
          <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--green)', fontWeight: 800, letterSpacing: '-0.02em' }}>${((metrics.total_reward * 10) || 5204).toLocaleString()}</h2>
        </div>
        <div className="ui-card">
          <h4 style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>SLA Violations</h4>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '2.5rem', color: metrics.sla_violations > 0 ? 'var(--red)' : 'var(--text-main)', fontWeight: 800, letterSpacing: '-0.02em' }}>{metrics.sla_violations}</h2>
          {metrics.sla_violations === 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--green)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '99px', padding: '0.3rem 0.75rem' }}>
              <CheckCircle size={12} /> No Violations Detected
            </span>
          )}
        </div>
      </div>

      <div className="ui-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Recent Activity</h3>
        <div className="rec-list">
          <div className="rec-item">
            <div><strong style={{ color: 'var(--primary)' }}>Scale Down Event:</strong> db-main-cluster scaled from 4 to 2 instances.</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>2 mins ago</div>
          </div>
          <div className="rec-item">
            <div><strong style={{ color: 'var(--teal)' }}>System:</strong> New Model Checkpoint saved `dqn_cloud_model_v4.zip`.</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>1 hr ago</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button className="primary-btn" onClick={() => setActiveTab('analytics')}>View Detailed Analytics</button>
        <button className="secondary-btn" onClick={() => setActiveTab('suggestions')}>Review Suggestions</button>
      </div>
    </div>
  )
}

function DashboardOverview({ metrics, history, onSelectRes }) {
  // Synthesized cost values for the UI
  const totalSpend = 42850.00;
  const costChange = -12.4; // Negative is good (reduction)
  const totalSavings = (metrics?.total_reward * 10) || 5204.00; // Map RL reward to savings metric for fun

  return (
    <>
      {/* Total Spend Banner */}
      <div className="spend-card">
        <div className="spend-info">
          <h2>Total Cloud Spend (MTD)</h2>
          <div className="amount">
            ${totalSpend.toLocaleString()}
            <span className={`change ${costChange < 0 ? 'negative' : ''}`}>
              {costChange < 0 ? <TrendingDown size={16} /> : <Activity size={16} />} {Math.abs(costChange)}%
            </span>
          </div>
        </div>
        <div className="savings">
          <p>Total Savings Achieved (RL Agent)</p>
          <h3>${totalSavings.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</h3>
        </div>
      </div>

      <div className="chart-grid">
        {/* Cost Breakdown */}
        <div className="ui-card">
          <h3>Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {PIE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Real-time Dynamic Allocation Bar */}
        <div className="ui-card">
          <h3>Fleet Auto-Scaling Rate (Live)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="step" hide />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="active_instances" fill="var(--primary)" radius={[4, 4, 0, 0]} name="EC2 Instances" />
              <Bar dataKey="synthetic_spend" fill="var(--teal)" radius={[4, 4, 0, 0]} name="Hourly Burn ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Suggestions Panel */}
        <div className="ui-card">
          <h3>Top Optimization Opportunities</h3>
          <div className="rec-list">
            <div className="rec-item">
              <div className="rec-meta">
                <h4>Idle Production RDS</h4>
                <p>db-user-staging-1 has 0 connections for 14 days.</p>
              </div>
              <div className="rec-action">
                <span className="rec-saving">Est. $450/mo</span>
                <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Apply</button>
              </div>
            </div>
            <div className="rec-item">
              <div className="rec-meta">
                <h4>Rightsize worker-node-group</h4>
                <p>CPU avg &lt; 15%. Downsize from m5.xlarge to m5.large.</p>
              </div>
              <div className="rec-action">
                <span className="rec-saving">Est. $1,200/mo</span>
                <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Apply</button>
              </div>
            </div>
          </div>
        </div>

        {/* Utilization Map */}
        <div className="ui-card" onClick={onSelectRes} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Live Utilization (ASG)</h3>
            <span style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>View Details <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /></span>
          </div>
          <div className="util-grid">
            <div className="util-box">
              <div className="label">Avg CPU</div>
              <div className="val" style={{ color: metrics?.cpu_utilization > 0.85 ? 'var(--red)' : 'var(--text-main)' }}>
                {metrics ? (metrics.cpu_utilization * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div className="util-box">
              <div className="label">Memory</div>
              <div className="val">{metrics ? (metrics.memory_usage * 100).toFixed(1) : 0}%</div>
            </div>
            <div className="util-box">
              <div className="label">Req / Sec</div>
              <div className="val">{metrics ? (metrics.request_rate).toFixed(0) : 0}</div>
            </div>
            <div className="util-box">
              <div className="label">Violations</div>
              <div className="val" style={{ color: 'var(--orange)' }}>{metrics?.sla_violations || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CostAnalytics({ history }) {
  // Synthesize a month forecast chart using the live data mapped linearly
  return (
    <div className="ui-card">
      <h3>Monthly Forecast & Trend</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="step" />
          <YAxis />
          <Tooltip contentStyle={{ background: 'var(--card-bg)' }} />
          <Legend />
          <Line type="monotone" dataKey="total_reward" stroke="var(--teal)" strokeWidth={3} name="Cumulative RL Efficiency" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function OptimizationSuggestions({ rlMode }) {
  const [applied, setApplied] = useState({});

  const handleApply = (id) => {
    setApplied({ ...applied, [id]: true });
  };

  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>All Recommendations</h3>
        {rlMode === 'advisory' && (
          <span className="glass-pill" style={{ color: 'var(--orange)', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            <AlertTriangle size={12} /> Auto-apply Disabled
          </span>
        )}
      </div>
      <p style={{ color: 'var(--text-muted)' }}>The RL Agent has identified these optimizations based on recent workloads.</p>

      <div className="rec-list" style={{ marginTop: '2rem' }}>
        <div className="rec-item">
          <div className="rec-meta">
            <h4>Rightsize Database Instance</h4>
            <p>db-main-cluster CPU avg &lt; 20%. Downsize from db.r6g.xlarge to db.r6g.large.</p>
          </div>
          <div className="rec-action">
            <span className="rec-saving">Est. $1,450/mo</span>
            {rlMode === 'advisory' ? (
              <button className="secondary-btn" disabled style={{ padding: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Disabled in Advisory</button>
            ) : (
              <button className="primary-btn" disabled={applied[1]} onClick={() => handleApply(1)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', opacity: applied[1] ? 0.5 : 1 }}>
                {applied[1] ? 'Applied' : 'Apply'}
              </button>
            )}
          </div>
        </div>

        <div className="rec-item">
          <div className="rec-meta">
            <h4>Delete Unused EBS Volumes</h4>
            <p>Found 14 unattached gp3 volumes in us-east-1.</p>
          </div>
          <div className="rec-action">
            <span className="rec-saving">Est. $320/mo</span>
            {rlMode === 'advisory' ? (
              <button className="secondary-btn" disabled style={{ padding: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Disabled in Advisory</button>
            ) : (
              <button className="primary-btn" disabled={applied[2]} onClick={() => handleApply(2)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', opacity: applied[2] ? 0.5 : 1 }}>
                {applied[2] ? 'Applied' : 'Apply'}
              </button>
            )}
          </div>
        </div>

        <div className="rec-item">
          <div className="rec-meta">
            <h4>Release Idle Elastic IPs</h4>
            <p>Found 5 unassociated Elastic IPs.</p>
          </div>
          <div className="rec-action">
            <span className="rec-saving">Est. $18/mo</span>
            {rlMode === 'advisory' ? (
              <button className="secondary-btn" disabled style={{ padding: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>Disabled in Advisory</button>
            ) : (
              <button className="primary-btn" disabled={applied[3]} onClick={() => handleApply(3)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', opacity: applied[3] ? 0.5 : 1 }}>
                {applied[3] ? 'Applied' : 'Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ResourcesList({ onSelect }) {
  return (
    <div className="ui-card">
      <h3>Active Managed Resources</h3>
      <div className="rec-list">
        <div className="rec-item" onClick={onSelect} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'} onMouseOut={e => e.currentTarget.style.background = ''}>
          <div className="rec-meta"><h4>aws-prod-asg-1</h4><p>EC2 Auto Scaling Group. Managed by RL Agent.</p></div>
          <ChevronRight color="var(--text-muted)" />
        </div>
        <div className="rec-item" onClick={onSelect} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'} onMouseOut={e => e.currentTarget.style.background = ''}>
          <div className="rec-meta"><h4>k8s-backend-deployment</h4><p>Kubernetes Deployment in 'default' namespace.</p></div>
          <ChevronRight color="var(--text-muted)" />
        </div>
        <div className="rec-item" onClick={onSelect} style={{ cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.05)'} onMouseOut={e => e.currentTarget.style.background = ''}>
          <div className="rec-meta"><h4>db-main-cluster</h4><p>Amazon Aurora PostgreSQL Serverless.</p></div>
          <ChevronRight color="var(--text-muted)" />
        </div>
      </div>
    </div>
  )
}

function BudgetsAndAlerts() {
  return (
    <div className="ui-card">
      <h3>Budgets & Active Alerts</h3>
      <div className="spend-card" style={{ marginTop: '2rem', marginBottom: '2rem', padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
        <div>
          <h2 style={{ color: 'var(--orange)', margin: '0 0 0.5rem' }}>Approaching Budget Limit</h2>
          <p style={{ margin: 0, color: 'var(--text-main)' }}>Your monthly spend on AWS Production is projected to hit $50,000.</p>
        </div>
        <div>
          <h1 style={{ margin: 0, color: 'var(--orange)' }}>92%</h1>
        </div>
      </div>

      <div className="rec-list">
        <div className="rec-item">
          <div className="rec-meta">
            <h4><AlertTriangle size={16} color="var(--red)" /> SLA Violation Risk</h4>
            <p>Kubernetes cluster CPU utilization exceeded 95% for 3 minutes yesterday.</p>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Acknowledged</div>
        </div>
      </div>
    </div>
  )
}

function SystemSettings({ theme, setTheme, rlMode, setRlMode }) {
  const [localRlMode, setLocalRlMode] = useState(rlMode);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setRlMode(localRlMode);
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  return (
    <div className="ui-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>System & Agent Configuration</h3>
        <button
          className="cta-gradient-btn"
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', width: 'auto' }}
          onClick={handleSave}
          disabled={isSaving || localRlMode === rlMode}
        >
          {isSaving ? <><div className="spinner-small" /> Saving...</> : 'Save Changes'}
        </button>
      </div>

      {showToast && (
        <div className="animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} /> Settings successfully applied and synchronized across clusters!
        </div>
      )}

      <div style={{ padding: '1.5rem', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 1rem' }}>RL Execution Mode</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={localRlMode === 'autonomous' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setLocalRlMode('autonomous')}
          >
            Autonomous (Auto-Scale)
          </button>
          <button
            className={localRlMode === 'advisory' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setLocalRlMode('advisory')}
          >
            Advisory Only (Metrics)
          </button>
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {localRlMode === 'autonomous' ? 'The agent has full IAM permissions to proactively scale instances.' : 'The agent will only read metrics and provide suggestions in the dashboard.'}
        </p>

        {localRlMode === 'advisory' && (
          <div className="animate-fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--orange)', fontWeight: 600, marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} />
              Advisory Mode Active
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
              In Advisory Mode, the RL Agent will not perform any automated scaling actions. It will only simulate policy decisions and log recommendations.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--orange)', width: '16px', height: '16px' }} /> Enable Recommendation Logging
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--orange)', width: '16px', height: '16px' }} /> Alert on High Confidence Insights
              </label>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 1rem' }}>Cloud Provider Adapter</h4>
        <select className="dropdown-select" style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-color)' }}>
          <option>Kubernetes Provider (default)</option>
          <option>AWS Boto3 Provider</option>
          <option>Local Gym Simulation</option>
        </select>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 1rem' }}>UI Preferences</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={theme === 'dark' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setTheme('dark')}
          >
            Dark Mode
          </button>
          <button
            className={theme === 'light' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setTheme('light')}
          >
            Light Mode
          </button>
          <button
            className={theme === 'system' ? 'primary-btn' : 'secondary-btn'}
            onClick={() => setTheme('system')}
          >
            System Match
          </button>
        </div>
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Your theme setting is saved globally to your browser session. Transition animations applied.
        </p>
      </div>

    </div>
  )
}

function DetailedResourceView({ resource, onBack, history }) {
  return (
    <div className="detailed-view">
      <button className="secondary-btn" onClick={onBack} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
        &larr; Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem' }}>Resource: {resource}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Instance: AWS Auto Scaling Group (m5.large instances)</p>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--green)', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600 }}>
          Healthy (RL Managed)
        </div>
      </div>

      <div className="chart-grid">
        <div className="ui-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Aggregated Telemetry (CPU & Memory)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="step" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)' }} />
              <Legend iconType="circle" />
              <Area type="monotone" dataKey="cpu_utilization" stroke="var(--primary)" fillOpacity={1} fill="url(#colorCpu)" name="Avg CPU" />
              <Area type="monotone" dataKey="memory_usage" stroke="var(--purple)" fillOpacity={1} fill="url(#colorMem)" name="Avg Mem" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
