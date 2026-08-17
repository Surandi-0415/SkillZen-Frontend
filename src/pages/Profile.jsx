// src/pages/Profile.jsx

import {
  useState,
  useEffect,
  useRef
} from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";

import { getProfile, updateProfile } from "../api/authApi";

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
  const fileInputRef = useRef(null);

  // LOAD USER DATA FROM API
  useEffect(() => {
    fetchUserProfile();
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
      // Fallback to localStorage if API fails
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
      // Prepare update data
      const updateData = {
        name: userData.name,
        email: userData.email,
        profile: {
          role: userData.role
        }
      };

      // If password is provided, include it
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

      // Refresh profile data
      await fetchUserProfile();

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

  // TRIGGER FILE INPUT
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // HANDLE FILE UPLOAD
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // TODO: Implement avatar upload
    alert("Avatar upload coming soon!");
  };

  if (loadingProfile) {
    return (
      <div className="platform-page">
        <Header />
        <main className="profile-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile...</p>
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
        {/* PAGE HEADER */}
        <header className="profile-header">
          <div>
            <h1 className="page-title">User Profile</h1>
            <p className="page-subtitle">
              Manage your personal information and preferences.
            </p>
          </div>
        </header>

        <div className="profile-content-grid">
          {/* PROFILE CARD */}
          <section className="profile-main-card">
            {/* AVATAR */}
            <div className="avatar-section">
              <div className="avatar-display">
                {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
              </div>

              <h3 className="avatar-name">{userData.name || "User"}</h3>
              <p className="avatar-role">{userData.role || "Candidate"}</p>

              {/* HIDDEN FILE INPUT */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*"
                onChange={handleFileUpload}
              />

              <button
                className="btn-secondary btn-upload"
                onClick={triggerFileUpload}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Upload Photo
              </button>
            </div>

            {/* FORM */}
            <form className="profile-form" onSubmit={handleSave}>
              <h3 className="section-title">Basic Details</h3>

              {saveStatus && (
                <div className={`alert-${saveStatus.includes("✅") ? "success" : "error"}`}>
                  {saveStatus}
                </div>
              )}

              <div className="form-grid">
                {/* NAME */}
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

                {/* EMAIL */}
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

                {/* ROLE */}
                <div className="input-group">
                  <label htmlFor="role">Current Role</label>
                  <input
                    id="role"
                    name="role"
                    type="text"
                    value={userData.role}
                    onChange={handleInputChange}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                {/* PASSWORD */}
                <div className="input-group">
                  <label htmlFor="password">Update Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </section>

          {/* STATS */}
          <section className="profile-stats-grid">
            {/* INTERVIEWS */}
            <div className="stat-card">
              <div className="stat-icon blue-bg">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="stat-data">
                <h4>Total Interviews</h4>
                <h2>12</h2>
              </div>
            </div>

            {/* SCORE */}
            <div className="stat-card">
              <div className="stat-icon green-bg">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="stat-data">
                <h4>Average Score</h4>
                <h2>78<span className="unit">%</span></h2>
              </div>
            </div>

            {/* HOURS */}
            <div className="stat-card">
              <div className="stat-icon purple-bg">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="stat-data">
                <h4>Hours Practiced</h4>
                <h2>4.5<span className="unit">h</span></h2>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Profile;