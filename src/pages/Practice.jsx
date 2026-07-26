import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./Practice.css";

function Practice() {
  const navigate = useNavigate();

  return (
    <div className="platform-page">
      <Header />
      
      <main className="practice-container">
        {/* Modern Stepper Navigation */}
        <nav className="stepper-nav" aria-label="Progress">
          <ol className="stepper-list">
            <li className="stepper-item current" aria-current="step">
              <span className="stepper-text">1. Overview</span>
            </li>
            <li className="stepper-separator">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </li>
            <li className="stepper-item pending">
              <span className="stepper-text">2. Setup Role</span>
            </li>
            <li className="stepper-separator">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </li>
            <li className="stepper-item pending">
              <span className="stepper-text">3. Interview</span>
            </li>
            <li className="stepper-separator">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </li>
            <li className="stepper-item pending">
              <span className="stepper-text">4. Results</span>
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            New: Enhanced AI Feedback Engine
          </div>
          
          <h1 className="hero-title">
            Master your next interview with <br/>
            <span className="text-gradient">AI precision</span>
          </h1>
          
          <p className="hero-description">
            MockHire simulates professional interview environments, analyzing your technical responses and delivery to provide actionable, data-driven feedback tailored to your target role.
          </p>
          
          <button className="btn-hero-primary" onClick={() => navigate("/setup")}>
            Start Practice Session
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </section>

        {/* Feature Cards Grid */}
        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper blue-bg">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <h3>AI Question Generation</h3>
            <p>Tailored technical and behavioral questions based on your specific job description and industry.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper purple-bg">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <h3>Real-time Environment</h3>
            <p>Experience the pressure of a real interview with timed responses and realistic AI interaction.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper green-bg">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3>Detailed Scoring</h3>
            <p>Receive comprehensive performance metrics, confidence analysis, and actionable feedback.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Practice;