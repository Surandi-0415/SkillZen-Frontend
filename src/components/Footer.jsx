import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="platform-footer">
      <div className="footer-top">
        <div className="footer-grid">
          
          {/* Column 1: Brand Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="footer-logo-box">S</div>
              <span className="footer-logo-text">SkillZen</span>
            </div>
            <p className="brand-description">
              Empowering candidates to ace their technical interviews using state-of-the-art AI facial analysis, speech metrics, and content evaluations.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Twitter" className="social-icon">
                <svg fill="currentColor" viewBox="0 0 24 24" className="icon-svg">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 18.43" />
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="social-icon">
                <svg fill="currentColor" viewBox="0 0 24 24" className="icon-svg">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" aria-label="GitHub" className="social-icon">
                <svg fill="currentColor" viewBox="0 0 24 24" className="icon-svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div className="footer-col">
            <h4>Platform</h4>
            <nav className="footer-nav-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/practice">Practice Center</Link>
              <Link to="/setup">Setup Interview</Link>
              <Link to="/history">Interview History</Link>
            </nav>
          </div>

          {/* Column 3: Support Links */}
          <div className="footer-col">
            <h4>Support</h4>
            <nav className="footer-nav-links">
              <Link to="/help">Help Center</Link>
              <Link to="/profile">Profile Settings</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </nav>
          </div>

          {/* Column 4: Newsletter / Stay Connected */}
          <div className="footer-col newsletter-col">
            <h4>Stay Connected</h4>
            <p className="newsletter-text">Subscribe to our newsletter for interview prep tips and framework news.</p>
            <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); alert("Thanks for subscribing!"); }}>
              <input type="email" placeholder="Enter your email" required className="newsletter-input" />
              <button type="submit" className="newsletter-btn">Subscribe</button>
            </form>
          </div>

        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="copyright">
            © {currentYear} <strong>SkillZen</strong> — Premium AI Mock Interview Platform. All rights reserved.
          </p>
          <div className="developer-tag">
            Powered by Advanced AI Analysis Models
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;