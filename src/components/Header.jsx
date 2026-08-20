import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ name: "Guest User", email: "" });

  const loadUserData = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Safely handles both { name } and nested { user: { name } } structures
        const userObj = parsed.user || parsed; 
        
        setUserData({
          name: userObj.name || "Guest User",
          email: userObj.email || "",
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    } else {
      setUserData({ name: "Guest User", email: "" });
    }
  };

  useEffect(() => {
    // Initial load
    loadUserData();

    // Listen for changes from login or profile updates
    window.addEventListener("userLoginStatusChanged", loadUserData);

    return () => {
      window.removeEventListener("userLoginStatusChanged", loadUserData);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("remember");
    // Notify app components that user status is cleared
    window.dispatchEvent(new Event("userLoginStatusChanged"));
    navigate("/");
  };

  return (
    <header className="platform-header">
      <div className="header-container">
        
        {/* REBRANDED INTERACTIVE LOGO */}
        <div className="brand-logo" onClick={() => navigate("/dashboard")}>
          <div className="logo-icon">S</div>
          <span className="logo-text">Skill<span>Zen</span></span>
        </div>

        {/* INTEGRATED DARK INTERFACE PILL NAVIGATION */}
        <nav className="header-nav-pill">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Dashboard
          </NavLink>
          <NavLink to="/practice" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Practice
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            History
          </NavLink>
        </nav>

        {/* WORKSPACE PROFILE SECTIONS */}
        <div className="header-actions">
          <div className="user-profile-card" onClick={() => navigate("/profile")}>
            <div className="user-info-text">
              <span className="user-display-name">{userData.name}</span>
              <span className="user-membership-tag">Candidate</span>
            </div>
            <div className="user-avatar-circle">
              <img 
                src="/default_avatar.png" 
                alt="Avatar" 
                className="user-avatar-img" 
                onError={(e) => { e.target.style.display = 'none'; }} 
              />
              <span className="user-avatar-fallback">
                {userData.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <button className="logout-icon-btn" onClick={handleLogout} title="Logout">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;