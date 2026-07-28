// src/pages/History.jsx

import { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchHistory();
  }, []);



  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await getInterviewHistory(page, 10);

      // Handle different response structures
      let data = [];
      let meta = {};

      if (response.data && response.data.data) {
        // Paginated response
        data = response.data.data;
        meta = response.data.pagination || {};
      } else if (Array.isArray(response.data)) {
        // Direct array response
        data = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Object with data property
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
    // Navigate to results with session data
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
      return new Date(date).toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  return (
    <div className="platform-page">
      <Header />

      <main className="history-container">
        <div className="history-header">
          <h1>Interview History</h1>
          <p>Review your previous interview performances</p>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading history...</p>
          </div>
        ) : error ? (
          <div className="error-box">
            <p> {error}</p>
            <button
              className="btn-primary"
              onClick={() => fetchHistory()}
            >
              Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="empty-box">
            <h2>No Interviews Found</h2>
            <p>Start your first mock interview</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/practice")}
            >
              Start Interview
            </button>
          </div>
        ) : (
          <>
            <div className="history-grid">
              {sessions.map((session) => (
                <div key={session._id} className="history-card">
                  <div className="history-top">
                    <div>
                      <h3>{session.jobTitle || "Interview Session"}</h3>
                      <p>{formatDate(session.createdAt)}</p>
                    </div>
                    <div className="score-badge">
                      {session.overallScore || 0}/10
                    </div>
                  </div>

                  <div className="history-body">
                    <div className="history-item">
                      <span>Questions:</span>
                      <strong>{session.answers?.length || 0}</strong>
                    </div>
                    <div className="history-item">
                      <span>Average Score:</span>
                      <strong>{session.overallScore || 0}</strong>
                    </div>
                    {session.confidenceScore && (
                      <div className="history-item">
                        <span>Confidence:</span>
                        <strong>{(session.confidenceScore * 100).toFixed(0)}%</strong>
                      </div>
                    )}
                    {session.status && (
                      <div className="history-item">
                        <span>Status:</span>
                        <strong className={`status-${session.status}`}>
                          {session.status}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="history-footer">
                    <button
                      className="btn-primary"
                      onClick={() => viewReport(session)}
                    >
                      View Report
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/*  Pagination (if more than 1 page) */}
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