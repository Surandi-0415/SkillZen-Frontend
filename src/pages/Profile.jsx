// src/pages/Profile.jsx

import {
  useState,
  useEffect,
  useRef
} from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { getProfile, updateProfile } from "../api/authApi";
import { getInterviewHistory } from "../api/interviewApi";

import "./Profile.css";

function Profile() {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    role: ""
  });

  const [password, setPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Tab State: 'profile' | 'security' | 'insights'
  const [activeTab, setActiveTab] = useState("profile");

  // Dynamic stats calculated from user history
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    facialConfidence: 0,
    speechConfidence: 0
  });

  // LOAD USER DATA & STATS
  useEffect(() => {
    fetchUserProfile();
    fetchStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const response = await getProfile();
      const user = response.data;
      
      setUserData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "Candidate"
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUserData({
            name: parsed.user?.name || parsed.name || "",
            email: parsed.user?.email || parsed.email || "",
            role: parsed.user?.role || "Candidate"
          });
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getInterviewHistory(1, 100); // fetch up to 100 entries for aggregate stats
      let data = [];
      if (response.data && response.data.data) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }

      const completed = data.filter(s => s.status === "completed");
      if (completed.length === 0) return;

      // Calculate Average Content Score (as percentage)
      const totalContent = completed.reduce((sum, s) => sum + (s.overallScore || 0), 0);
      const avgScore = (totalContent / completed.length) * 10;

      // Calculate Facial Confidence Score
      const facialScores = completed.map(s => {
        const answers = s.answers || [];
        const answersWithFacial = answers.filter(a => 
          a.facial_analysis && 
          (typeof a.facial_analysis.confidence === 'number' || typeof a.facial_analysis.confidence_score === 'number') &&
          a.facial_analysis.frames_analyzed > 0
        );
        if (answersWithFacial.length === 0) return null;
        return answersWithFacial.reduce((sum, a) => {
          const conf = (a.facial_analysis.confidence !== undefined && a.facial_analysis.confidence > 0) ? a.facial_analysis.confidence : (a.facial_analysis.confidence_score || 0);
          return sum + conf;
        }, 0) / answersWithFacial.length;
      }).filter(s => s !== null);
      const avgFacial = facialScores.length > 0 ? (facialScores.reduce((sum, s) => sum + s, 0) / facialScores.length) * 100 : 0;

      // Calculate Speech Confidence Score
      const speechScores = completed.map(s => {
        const answers = s.answers || [];
        const answersWithSpeech = answers.filter(a => 
          a.speech_analysis && 
          typeof a.speech_analysis.confidence_score === 'number' &&
          a.speech_analysis.predicted_emotion !== 'unknown' &&
          a.speech_analysis.confidence_score > 0
        );
        if (answersWithSpeech.length === 0) return null;
        return answersWithSpeech.reduce((sum, a) => sum + a.speech_analysis.confidence_score, 0) / answersWithSpeech.length;
      }).filter(s => s !== null);
      const avgSpeech = speechScores.length > 0 ? (speechScores.reduce((sum, s) => sum + s, 0) / speechScores.length) * 100 : 0;

      setStats({
        totalInterviews: completed.length,
        averageScore: Math.round(avgScore),
        facialConfidence: Math.round(avgFacial),
        speechConfidence: Math.round(avgSpeech)
      });
    } catch (err) {
      console.warn("Failed to fetch aggregate profile stats:", err);
    }
  };

  // HANDLE INPUT CHANGE
  const handleInputChange = (e) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  // HANDLE SAVE
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus("");

    try {
      const updateData = {
        name: userData.name,
        email: userData.email,
        profile: {
          role: userData.role
        }
      };

      if (password) {
        updateData.password = password;
      }

      const response = await updateProfile(updateData);

      // Update localStorage
      const oldUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({
        ...oldUser,
        user: response.data,
        name: response.data.name,
        email: response.data.email,
        role: response.data.role
      }));

      setSaveStatus("✅ Profile updated successfully!");
      setPassword("");

      // Dispatch user status change event to update Header layout immediately
      window.dispatchEvent(new Event("userLoginStatusChanged"));
      
      // Refresh profile details and stats
      await fetchUserProfile();
      await fetchStats();

      setTimeout(() => {
        setSaveStatus("");
      }, 3000);

    } catch (error) {
      console.error("Update error:", error);
      setSaveStatus("❌ Failed to update profile: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // PASSWORD STRENGTH METER
  const getPasswordStrength = () => {
    if (!password) return "";
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return "strong";
    if (password.length >= 6) return "medium";
    return "weak";
  };

  if (loadingProfile) {
    return (
      <div className="platform-page">
        <Header />
        <main className="profile-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="platform-page">
      <Header />

      <main className="profile-container">
        <header className="profile-header">
          <h1 className="page-title">Candidate Profile</h1>
          <p className="page-subtitle">Configure your mock profile, view performance stats, and manage account security.</p>
        </header>

        <div className="profile-content-grid">
          
          {/* LEFT SIDEBAR PANEL */}
          <aside className="profile-sidebar-card">
            <div className="avatar-display">
              {userData.name ? userData.name.charAt(0).toUpperCase() : "C"}
            </div>
            <h3 className="avatar-name">{userData.name || "Candidate"}</h3>
            <p className="avatar-role">{userData.role || "Target Role"}</p>

            <nav className="profile-nav-tabs">
              <button 
                className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                <span className="profile-tab-icon">👤</span> Basic Details
              </button>
              <button 
                className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <span className="profile-tab-icon">🔒</span> Account Security
              </button>
              <button 
                className={`profile-tab-btn ${activeTab === "insights" ? "active" : ""}`}
                onClick={() => setActiveTab("insights")}
              >
                <span className="profile-tab-icon">📈</span> AI Insights
              </button>
            </nav>
          </aside>

          {/* MAIN FORMS PANEL */}
          <section className="profile-main-panel">
            
            {saveStatus && (
              <div className={`alert-chip ${saveStatus.includes("✅") ? "success" : "error"}`}>
                {saveStatus}
              </div>
            )}

            {/* TAB 1: BASIC PROFILE */}
            {activeTab === "profile" && (
              <form className="profile-form" onSubmit={handleSave}>
                <div className="panel-header">
                  <h2>Basic Profile Details</h2>
                  <p>Edit your primary contact info and desired corporate target role.</p>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={userData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={userData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="role">Desired Target Role</label>
                    <input
                      id="role"
                      name="role"
                      type="text"
                      value={userData.role}
                      onChange={handleInputChange}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ACCOUNT SECURITY */}
            {activeTab === "security" && (
              <form className="profile-form" onSubmit={handleSave}>
                <div className="panel-header">
                  <h2>Account Security</h2>
                  <p>Update your credential settings to maintain secure platform access.</p>
                </div>

                <div className="input-group" style={{ maxWidth: '400px' }}>
                  <label htmlFor="password">Change Account Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {password && (
                    <>
                      <div className="password-strength-bar">
                        <div className={`password-strength-fill ${getPasswordStrength()}`} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', color: getPasswordStrength() === 'strong' ? '#16a34a' : getPasswordStrength() === 'medium' ? '#f59e0b' : '#ef4444' }}>
                        Password Strength: {getPasswordStrength()}
                      </span>
                    </>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading || (password && password.length < 6)}>
                    {loading ? "Saving..." : "Update Security"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: PERFORMANCE INSIGHTS */}
            {activeTab === "insights" && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="panel-header">
                  <h2>AI Analytics Dashboard</h2>
                  <p>Aggregated metrics calculated across your mock practice sessions.</p>
                </div>

                {stats.totalInterviews === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                    <p>No completed interviews found. Stats will populate here once you complete a practice run.</p>
                  </div>
                ) : (
                  <>
                    <div className="insights-grid">
                      {/* Overall Content score */}
                      <div className="insight-metric-card">
                        <h4>Average Evaluation</h4>
                        <div className="insight-value-block">
                          <h2>{stats.averageScore}</h2>
                          <span>%</span>
                        </div>
                        <div className="insight-progress-track">
                          <div className="insight-progress-fill purple" style={{ width: `${stats.averageScore}%` }} />
                        </div>
                      </div>

                      {/* Overall Facial score */}
                      <div className="insight-metric-card">
                        <h4>Facial Confidence</h4>
                        <div className="insight-value-block">
                          <h2>{stats.facialConfidence}</h2>
                          <span>%</span>
                        </div>
                        <div className="insight-progress-track">
                          <div className="insight-progress-fill green" style={{ width: `${stats.facialConfidence}%` }} />
                        </div>
                      </div>

                      {/* Overall Speech score */}
                      <div className="insight-metric-card">
                        <h4>Vocal Confidence</h4>
                        <div className="insight-value-block">
                          <h2>{stats.speechConfidence}</h2>
                          <span>%</span>
                        </div>
                        <div className="insight-progress-track">
                          <div className="insight-progress-fill blue" style={{ width: `${stats.speechConfidence}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="insights-tips-box">
                      <h4>💡 Coaching Insights & Recommendations</h4>
                      <ul>
                        <li>Your average evaluation score is <strong>{stats.averageScore}%</strong>. Focus on standard answer structures to improve formatting.</li>
                        {stats.facialConfidence < 70 && (
                          <li>Your facial confidence score is on the lower side (<strong>{stats.facialConfidence}%</strong>). Try maintaining steady eye contact with the camera and keeping a neutral, friendly posture.</li>
                        )}
                        {stats.speechConfidence < 70 && (
                          <li>Your voice confidence score is at <strong>{stats.speechConfidence}%</strong>. Rehearse speaking at a steady pace and reduce filler words like "um" or "like".</li>
                        )}
                        {stats.facialConfidence >= 70 && stats.speechConfidence >= 70 && (
                          <li>Great job! Both your visual and vocal confidence are above the 70% benchmark. Maintain this poise during live calls!</li>
                        )}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Profile;