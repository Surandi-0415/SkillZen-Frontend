import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { getInterviewHistory } from "../api/interviewApi";

import "./History.css";

function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 1
  });

  // Client-side search and filtering states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getInterviewHistory(page, 20); // fetch items for local filtering

      let data = [];
      let meta = {};

      if (response.data && response.data.data) {
        data = response.data.data;
        meta = response.data.pagination || {};
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && typeof response.data === 'object') {
        data = response.data.data || response.data || [];
      }

      setSessions(Array.isArray(data) ? data : []);
      setPagination({
        page: meta.page || 1,
        total: meta.total || data.length,
        pages: meta.pages || 1
      });

    } catch (error) {
      console.error("Failed to fetch history:", error);
      setError(error.response?.data?.message || "Failed to load interview history");
    } finally {
      setLoading(false);
    }
  };

  const viewReport = (session) => {
    navigate("/results", {
      state: {
        answers: session.answers || [],
        report: session.report || "",
        interviewId: session._id
      }
    });
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Invalid Date";
    }
  };

  // --------------------------------------------------------
  // Inline aggregation helpers
  // --------------------------------------------------------
  const getSessionFacialScore = (session) => {
    const answers = session.answers || [];
    const answersWithFacial = answers.filter(a => 
      a.facial_analysis && 
      (typeof a.facial_analysis.confidence === 'number' || typeof a.facial_analysis.confidence_score === 'number') &&
      a.facial_analysis.frames_analyzed > 0
    );
    if (answersWithFacial.length === 0) return null;
    const total = answersWithFacial.reduce((sum, a) => {
      const conf = (a.facial_analysis.confidence !== undefined && a.facial_analysis.confidence > 0) ? a.facial_analysis.confidence : (a.facial_analysis.confidence_score || 0);
      return sum + conf;
    }, 0);
    return (total / answersWithFacial.length) * 100;
  };

  const getSessionSpeechScore = (session) => {
    const answers = session.answers || [];
    const answersWithSpeech = answers.filter(a => 
      a.speech_analysis && 
      typeof a.speech_analysis.confidence_score === 'number' &&
      a.speech_analysis.predicted_emotion !== 'unknown' &&
      a.speech_analysis.confidence_score > 0
    );
    if (answersWithSpeech.length === 0) return null;
    const total = answersWithSpeech.reduce((sum, a) => sum + a.speech_analysis.confidence_score, 0);
    return (total / answersWithSpeech.length) * 100;
  };

  // --------------------------------------------------------
  // Filter logic
  // --------------------------------------------------------
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Search by job title
      const title = (session.jobTitle || "Interview Session").toLowerCase();
      const matchesSearch = title.includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus = statusFilter === "all" || session.status === statusFilter;

      // Filter by score
      const score = session.overallScore || 0;
      let matchesScore = true;
      if (scoreFilter === "excellent") matchesScore = score >= 8;
      else if (scoreFilter === "average") matchesScore = score >= 5 && score < 8;
      else if (scoreFilter === "needs-work") matchesScore = score < 5;

      return matchesSearch && matchesStatus && matchesScore;
    });
  }, [sessions, searchTerm, statusFilter, scoreFilter]);

  // --------------------------------------------------------
  // Dashboard statistics computation
  // --------------------------------------------------------
  const dashboardStats = useMemo(() => {
    if (sessions.length === 0) return null;

    const completed = sessions.filter(s => s.status === "completed");
    
    // Average Content Score
    const totalContent = completed.reduce((sum, s) => sum + (s.overallScore || 0), 0);
    const avgScore = completed.length > 0 ? (totalContent / completed.length).toFixed(1) : "0.0";

    // Average Facial Score
    const facialScores = completed.map(getSessionFacialScore).filter(s => s !== null);
    const avgFacial = facialScores.length > 0 ? (facialScores.reduce((sum, s) => sum + s, 0) / facialScores.length).toFixed(0) + "%" : "N/A";

    // Average Speech Score
    const speechScores = completed.map(getSessionSpeechScore).filter(s => s !== null);
    const avgSpeech = speechScores.length > 0 ? (speechScores.reduce((sum, s) => sum + s, 0) / speechScores.length).toFixed(0) + "%" : "N/A";

    return {
      totalInterviews: sessions.length,
      averageScore: avgScore,
      avgFacialConfidence: avgFacial,
      avgSpeechConfidence: avgSpeech
    };
  }, [sessions]);

  const getScoreBadgeClass = (score) => {
    if (score >= 8) return "score-badge excellent";
    if (score >= 5) return "score-badge average";
    return "score-badge needs-work";
  };

  return (
    <div className="platform-page">
      <Header />

      <main className="history-container">
        <div className="history-header">
          <h1>Interview History</h1>
          <p>Review your performance, confidence scores, and past analytical feedback.</p>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading your mock history...</p>
          </div>
        ) : error ? (
          <div className="error-box">
            <h2>Error Loading History</h2>
            <p>❌ {error}</p>
            <button className="btn-primary" onClick={() => fetchHistory()}>
              Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-box">
            <span className="empty-icon">📂</span>
            <h2>No Practice Sessions Found</h2>
            <p>Ready to build your confidence? Set up your first AI interview now.</p>
            <button className="btn-primary" onClick={() => navigate("/practice")}>
              Start AI Mock Interview
            </button>
          </div>
        ) : (
          <>
            {/* Dashboard Stats */}
            {dashboardStats && (
              <section className="history-stats-dashboard">
                <div className="history-stat-card">
                  <div className="stat-icon-box blue">
                    <img src="https://img.icons8.com/fluency/96/help.png" alt="Practices" />
                  </div>
                  <div className="stat-info">
                    <span>Total Practices</span>
                    <h3>{dashboardStats.totalInterviews}</h3>
                  </div>
                </div>
                <div className="history-stat-card">
                  <div className="stat-icon-box green">
                    <img src="https://img.icons8.com/fluency/96/trophy.png" alt="Average Score" />
                  </div>
                  <div className="stat-info">
                    <span>Average Score</span>
                    <h3>{dashboardStats.averageScore}<span>/10</span></h3>
                  </div>
                </div>
                <div className="history-stat-card">
                  <div className="stat-icon-box purple">
                    <img src="https://img.icons8.com/fluency/96/happy.png" alt="Facial Confidence" />
                  </div>
                  <div className="stat-info">
                    <span>Facial Confidence</span>
                    <h3>{dashboardStats.avgFacialConfidence}</h3>
                  </div>
                </div>
                <div className="history-stat-card">
                  <div className="stat-icon-box orange">
                    <img src="https://img.icons8.com/fluency/96/microphone.png" alt="Voice Confidence" />
                  </div>
                  <div className="stat-info">
                    <span>Voice Confidence</span>
                    <h3>{dashboardStats.avgSpeechConfidence}</h3>
                  </div>
                </div>
              </section>
            )}

            {/* Filter controls */}
            <section className="history-filter-bar">
              <div className="search-input-wrapper">
                <span className="search-icon"></span>
                <input 
                  type="text" 
                  placeholder="Search by job title or role..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select 
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>

              <select 
                className="filter-select"
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
              >
                <option value="all">All Scores</option>
                <option value="excellent">Excellent (>= 8.0)</option>
                <option value="average">Average (5.0 - 7.9)</option>
                <option value="needs-work">Needs Work (&lt; 5.0)</option>
              </select>

              {(searchTerm || statusFilter !== "all" || scoreFilter !== "all") && (
                <button 
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setScoreFilter("all");
                  }}
                >
                  Clear Filters
                </button>
              )}
            </section>

            {/* History Cards Grid */}
            {filteredSessions.length === 0 ? (
              <div className="empty-box" style={{ maxWidth: '400px', padding: '40px 20px' }}>
                <span className="empty-icon" style={{ fontSize: '32px' }}>🔍</span>
                <h2>No matches found</h2>
                <p>Try refining your search terms or filter selections.</p>
              </div>
            ) : (
              <div className="history-grid">
                {filteredSessions.map((session) => {
                  const facial = getSessionFacialScore(session);
                  const speech = getSessionSpeechScore(session);

                  return (
                    <div key={session._id} className="history-card">
                      <div className="history-top">
                        <div>
                          <h3>{session.jobTitle || "Interview Session"}</h3>
                          <p>{formatDate(session.createdAt)}</p>
                        </div>
                        <div className={getScoreBadgeClass(session.overallScore || 0)}>
                          {session.overallScore || 0}/10
                        </div>
                      </div>

                      <div className="history-body">
                        <div className="history-item">
                          <span>Questions answered:</span>
                          <strong>{session.answers?.length || 0}</strong>
                        </div>
                        
                        <div className="history-item">
                          <span>Evaluation Score:</span>
                          <strong>{session.overallScore || 0} / 10</strong>
                        </div>

                        {/* Facial confidence with progress bar */}
                        <div className="history-item">
                          <span>Facial Confidence:</span>
                          {facial !== null ? (
                            <div className="confidence-bar-wrapper">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}>
                                <span style={{ color: '#16a34a' }}>{facial.toFixed(0)}%</span>
                              </div>
                              <div className="confidence-bar-track">
                                <div className="confidence-bar-fill green" style={{ width: `${facial}%` }} />
                              </div>
                            </div>
                          ) : (
                            <strong>N/A</strong>
                          )}
                        </div>

                        {/* Speech confidence with progress bar */}
                        <div className="history-item">
                          <span>Speech Confidence:</span>
                          {speech !== null ? (
                            <div className="confidence-bar-wrapper">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700' }}>
                                <span style={{ color: '#2563eb' }}>{speech.toFixed(0)}%</span>
                              </div>
                              <div className="confidence-bar-track">
                                <div className="confidence-bar-fill blue" style={{ width: `${speech}%` }} />
                              </div>
                            </div>
                          ) : (
                            <strong>N/A</strong>
                          )}
                        </div>

                        {session.status && (
                          <div className="history-item">
                            <span>Status:</span>
                            <span className={`status-indicator ${session.status}`}>
                              {session.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="history-footer">
                        <button
                          className="btn-primary"
                          onClick={() => viewReport(session)}
                        >
                          View Analytical Report
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn-secondary"
                  onClick={() => fetchHistory(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  ← Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => fetchHistory(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default History;