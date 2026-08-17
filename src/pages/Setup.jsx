import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getMeetGreetQuestions } from "../api/interviewApi";
import {
  startQuestionGeneration,
  resetQuestionGeneration
} from "../services/questionGeneration";
import "./Setup.css";

// Number of warm-up (meet & greet) questions to show instantly at the start.
const WARMUP_COUNT = 3;

function Setup() {
  const navigate = useNavigate();
  const [duration, setDuration] = useState(30);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);

  const durations = [15, 20, 30];

  const handleGenerate = async () => {
    if (!jd.trim()) {
      alert("Please paste a job description.");
      return;
    }

    setLoading(true);
    try {
      // 1) Kick off the slow AI question generation IN THE BACKGROUND.
      //    We do NOT await it here — the candidate should not wait behind it.
      resetQuestionGeneration();
      startQuestionGeneration(jd, duration);

      // 2) Fetch a few instant warm-up questions from MongoDB (fast).
      //    If this fails for any reason, fall back to a built-in set so the
      //    interview can still begin immediately.
      let meetGreetQuestions = [];
      try {
        const res = await getMeetGreetQuestions(WARMUP_COUNT);
        meetGreetQuestions = res?.data?.questions || [];
      } catch (err) {
        console.warn("Meet & greet fetch failed, using fallback warm-ups.", err);
      }
      if (!meetGreetQuestions.length) {
        meetGreetQuestions = [
          "To get us started, please give a brief introduction about yourself.",
          "What made you interested in this position?",
          "Tell me about something you are proud of."
        ].slice(0, WARMUP_COUNT);
      }

      // 3) Proceed instantly — AI questions keep generating in the background.
      navigate("/generating", {
        state: { meetGreetQuestions, duration, jobDescription: jd }
      });
    } catch (error) {
      console.error("Failed to start interview", error);
      alert("Error starting the interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadExampleJD = (e) => {
    e.preventDefault();
    setJd("We are looking for a Senior React Developer with 5+ years of experience building scalable web applications. The ideal candidate will have strong proficiency in JavaScript, React.js, Redux, and modern CSS frameworks like Tailwind. Experience with Node.js and API integration is a plus. You will be responsible for architecting frontend solutions and mentoring junior developers.");
  };

  return (
    <div className="platform-page">
      <Header />
      
      <main className="setup-container">
        {/* Modern Stepper Navigation */}


        <div className="setup-content-grid">
          {/* Left Column: Settings */}
          <section className="setup-sidebar">
            <div className="setup-card">
              <div className="card-header">
                <h2>Target Role Details</h2>
                <p className="subtitle">Configure your interview parameters</p>
              </div>
              
              <div className="config-section">
                <h3 className="section-label">Interview Duration</h3>
                <div className="duration-options">
                  {durations.map((time) => (
                    <div
                      key={time}
                      className={`duration-card ${duration === time ? "active" : ""}`}
                      onClick={() => setDuration(time)}
                    >
                      <div className="duration-value">{time}</div>
                      <div className="duration-label">minutes</div>
                      
                      {/* Active Checkmark */}
                      {duration === time && (
                        <div className="active-icon">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="info-box">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Generates ~{duration === 15 ? 5 : duration === 20 ? 7 : 10} targeted questions</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Job Description */}
          <section className="setup-main">
            <div className="description-card">
              <div className="card-header">
                <h3 className="section-label">Job Description</h3>
                <button className="btn-link" onClick={loadExampleJD}>
                  Use example description
                </button>
              </div>
              
              <textarea
                className="jd-textarea"
                placeholder="Paste the full job description here. Include tech stack, responsibilities, and requirements so the AI can tailor your questions..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              ></textarea>
              
              <div className="action-footer">
                <button 
                  className="btn-primary-large" 
                  onClick={handleGenerate} 
                  disabled={loading || !jd.trim()}
                >
                  {loading ? (
                    <>
                      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path></svg>
                      Analyzing Role...
                    </>
                  ) : (
                    <>
                      Generate Questions
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Setup;