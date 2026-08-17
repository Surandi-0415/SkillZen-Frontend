// src/pages/Dashboard.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getInterviewHistory, getInterviewAnalytics } from "../api/interviewApi";
import { getCurrentUser } from "../api/client";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Candidate");
  const [analytics, setAnalytics] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    confidenceLevels: {
      Excellent: 0,
      High: 0,
      Moderate: 0,
      Fair: 0,
      Low: 0
    }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const name = parsed.user?.name || parsed.name || "Candidate";
        setUserName(name);
      } catch (error) {
        console.error("Failed to parse user payload from storage", error);
      }
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics and history in parallel
      const [analyticsRes, historyRes] = await Promise.all([
        getInterviewAnalytics(),
        getInterviewHistory(1, 3) // Get 3 most recent
      ]);
      
      const analyticsData = analyticsRes.data || {};
      const historyData = historyRes.data?.data || [];
      
      setAnalytics(analyticsData);
      setRecentInterviews(historyData);
      
      // Extract stats from analytics
      setStats({
        totalInterviews: analyticsData.totalInterviews || 0,
        averageScore: analyticsData.averageScore || 0,
        bestScore: historyData.length > 0 
          ? Math.max(...historyData.map(i => i.overallScore || 0))
          : 0,
        confidenceLevels: analyticsData.confidenceLevels || {
          Excellent: 0,
          High: 0,
          Moderate: 0,
          Fair: 0,
          Low: 0
        }
      });
      
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceLevelColor = (level) => {
    const colors = {
      'Excellent': '#10b981',
      'High': '#22c55e',
      'Moderate': '#f59e0b',
      'Fair': '#f97316',
      'Low': '#ef4444'
    };
    return colors[level] || '#94a3b8';
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'score-high';
    if (score >= 5) return 'score-mid';
    return 'score-low';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="sz-vibrant-dashboard">
        <Header />
        <main className="sz-dashboard-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="sz-vibrant-dashboard">
      <Header />
      
      <main className="sz-dashboard-container">
        
        {/* HERO GRADIENT BANNER */}
        <header className="sz-hero-banner">
          <div className="sz-hero-overlay"></div>
          <div className="sz-hero-content">
            <span className="sz-glow-badge">
              {stats.totalInterviews > 0 ? 'ACTIVE SYSTEM' : 'READY FOR FIRST RUN'}
            </span>
            <h1 className="sz-hero-title">Welcome, {userName}!</h1>
            <p className="sz-hero-subtitle">
              {stats.totalInterviews > 0 
                ? `You've completed ${stats.totalInterviews} interviews with an average score of ${stats.averageScore}/10.`
                : 'Start your first interview to begin tracking your progress.'}
            </p>
          </div>
          <div className="sz-hero-actions">
            <button className="sz-btn-glass" onClick={() => navigate("/history")}>
              View System Logs
            </button>
            <button className="sz-btn-neon" onClick={() => navigate("/practice")}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Start Practice Session
            </button>
          </div>
        </header>

        {/* GLOWING METRIC CARDS */}
        <section className="sz-vibrant-metrics">
          <div className="sz-vibrant-card metric-blue">
            <div className="sz-card-glow"></div>
            <div className="sz-vibrant-card-inner">
              <span className="sz-card-label">TOTAL EVALUATIONS</span>
              <div className="sz-card-main">
                <span className="sz-card-value">{stats.totalInterviews}</span>
                <span className="sz-card-badge status-up">
                  {stats.totalInterviews > 0 ? 'Active' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="sz-vibrant-card metric-emerald">
            <div className="sz-card-glow"></div>
            <div className="sz-vibrant-card-inner">
              <span className="sz-card-label">AVERAGE SCORE</span>
              <div className="sz-card-main">
                <span className="sz-card-value">
                  {stats.averageScore || 0}
                  <span className="sz-card-unit">/10</span>
                </span>
                <span className={`sz-card-badge ${stats.averageScore >= 7 ? 'status-up' : 'status-stable'}`}>
                  {stats.averageScore >= 7 ? '↑ Good' : 'Needs Practice'}
                </span>
              </div>
            </div>
          </div>

          <div className="sz-vibrant-card metric-indigo">
            <div className="sz-card-glow"></div>
            <div className="sz-vibrant-card-inner">
              <span className="sz-card-label">BEST SCORE</span>
              <div className="sz-card-main">
                <span className="sz-card-value">
                  {stats.bestScore || 0}
                  <span className="sz-card-unit">/10</span>
                </span>
                <span className="sz-card-badge status-stable">Best</span>
              </div>
            </div>
          </div>

  
        </section>

        {/* WORKSPACE OPERATIONS GRID */}
        <section className="sz-operations-layout">
          
          {/* PRIMARY LOG MONITOR */}
          <div className="sz-ops-panel monitor-panel">
            <div className="sz-panel-header">
              <div>
                <h3 className="sz-panel-title">Recent Interview Sessions</h3>
                <p className="sz-panel-subtitle">
                  {recentInterviews.length > 0 
                    ? `Last ${recentInterviews.length} completed sessions`
                    : 'No interviews completed yet'}
                </p>
              </div>
              <span className="sz-live-dot">
                {recentInterviews.length > 0 ? 'LIVE FEED' : 'EMPTY'}
              </span>
            </div>

            <div className="sz-vibrant-list">
              {recentInterviews.length > 0 ? (
                recentInterviews.map((interview, index) => (
                  <article 
                    key={interview._id || index} 
                    className="sz-vibrant-row" 
                    onClick={() => navigate(`/results/${interview._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="sz-row-left">
                      <div className={`sz-avatar ${interview.overallScore >= 7 ? 'gradient-cyan' : 'gradient-purple'}`}>
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="sz-row-title">
                          {interview.jobTitle || 'Interview Session'}
                        </h4>
                        <span className="sz-row-id">
                          {formatDate(interview.createdAt)} • 
                          {interview.answers?.length || 0} questions
                        </span>
                      </div>
                    </div>
                    <div className="sz-row-right">
                      <span className="sz-row-runtime">
                        {interview.status || 'completed'}
                      </span>
                      <div className={`sz-score-pill ${getScoreColor(interview.overallScore)}`}>
                        {interview.overallScore || 0} / 10
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state-message">
                  <p>No interviews completed yet.</p>
                  <button 
                    className="sz-btn-neon" 
                    onClick={() => navigate("/practice")}
                    style={{ marginTop: '12px' }}
                  >
                    Start Your First Interview
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SIDE DATA VISUALIZATIONS */}
          <aside className="sz-ops-panel stats-panel">
            <h3 className="sz-panel-title">Confidence Distribution</h3>
            <p className="sz-panel-subtitle">Breakdown of confidence levels across all interviews.</p>
            
            {Object.entries(stats.confidenceLevels).map(([level, count]) => (
              <div key={level} className="sz-progress-group">
                <div className="sz-progress-info">
                  <span className="sz-progress-label">
                    <span 
                      className="level-dot" 
                      style={{ backgroundColor: getConfidenceLevelColor(level) }}
                    />
                    {level.toUpperCase()}
                  </span>
                  <span 
                    className="sz-progress-value"
                    style={{ color: getConfidenceLevelColor(level) }}
                  >
                    {count}
                  </span>
                </div>
                <div className="sz-progress-track">
                  <div 
                    className="sz-progress-fill"
                    style={{ 
                      width: `${stats.totalInterviews > 0 ? (count / stats.totalInterviews) * 100 : 0}%`,
                      backgroundColor: getConfidenceLevelColor(level)
                    }}
                  />
                </div>
              </div>
            ))}

            {/* INTEGRATED ALERTS */}
            <div className="sz-vibrant-alert">
              <div className="sz-alert-icon">✨</div>
              <div className="sz-alert-body">
                <h4>AI Engine Status: {stats.totalInterviews > 0 ? 'Active' : 'Ready'}</h4>
                <p>
                  {stats.totalInterviews > 0 
                    ? `${stats.totalInterviews} interviews analyzed. ${stats.averageScore >= 7 ? 'Great progress!' : 'Keep practicing to improve your scores.'}`
                    : 'Complete your first interview to activate full AI analytics.'}
                </p>
              </div>
            </div>
          </aside>

        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Dashboard;