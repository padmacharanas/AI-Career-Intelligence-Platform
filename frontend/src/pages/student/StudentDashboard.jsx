
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FileText,
  Award,
  Target,
  BriefcaseBusiness,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Upload,
  Sparkles,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import api from "../../services/api";
import StatCard from "../../components/StatCard";


function StudentDashboard() {

  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");


  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  const fetchDashboard = useCallback(async (isRefresh = false) => {

    try {

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/dashboard/");

      setDashboard(response.data);

    } catch (err) {

      if (err.response?.status === 401) {

        setError(
          "Your login session is invalid or expired. Please log in again."
        );

      } else if (err.response?.status === 403) {

        setError(
          "You do not have permission to access this dashboard."
        );

      } else {

        setError(
          err.response?.data?.detail ||
          "Unable to load dashboard. Please check your backend connection."
        );

      }

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  }, []);


  // ==========================================
  // LOAD DASHBOARD WHEN PAGE OPENS
  // ==========================================

  useEffect(() => {

    fetchDashboard();

  }, [fetchDashboard]);


  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {

    return (
      <div className="dashboard-content">

        <div className="loading">
          Loading your dashboard...
        </div>

      </div>
    );

  }


  // ==========================================
  // ERROR SCREEN
  // ==========================================

  if (error) {

    const sessionExpired = error.includes("login session");

    return (

      <div className="dashboard-content">

        <div className="panel">

          <div className="error-message">

            <p>{error}</p>

            <button
              className="primary-button"
              style={{ marginTop: "15px" }}
              onClick={() => {

                if (sessionExpired) {
                  navigate("/login");
                } else {
                  fetchDashboard();
                }

              }}
            >

              {sessionExpired ? "Go to Login" : "Try Again"}

            </button>

          </div>

        </div>

      </div>

    );

  }


  // ==========================================
  // SAFELY READ API DATA
  // ==========================================

  const statistics = dashboard?.statistics || {};

  const matches = Array.isArray(dashboard?.all_job_matches)
    ? dashboard.all_job_matches
    : [];

  const skills = Array.isArray(dashboard?.extracted_skills)
    ? dashboard.extracted_skills
    : [];

  const resumes = Array.isArray(dashboard?.recent_resumes)
    ? dashboard.recent_resumes
    : [];

  const bestMatches = Array.isArray(dashboard?.best_job_matches)
    ? dashboard.best_job_matches
    : [];

  const studentName = dashboard?.student?.full_name || "Student";


  // ==========================================
  // CHART DATA
  // ==========================================

  const chartData = matches.map((job) => ({

    role: job.role_name || "Unknown Role",

    match: Math.min(
      100,
      Math.max(0, Number(job.match_percentage) || 0)
    ),

  }));


  // ==========================================
  // AVERAGE MATCH
  // ==========================================

  const averageMatch =
    Number(statistics.average_match_percentage) || 0;


  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (

    <div className="dashboard-content">

      {/* WELCOME SECTION */}

      <section className="welcome-section">

        <div>

          <h1>
            Welcome back, {studentName}! 👋
          </h1>

          <p>
            Track your career progress and discover your next opportunity.
          </p>

        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/student/resumes")}
        >

          <FileText
            size={15}
            style={{ marginRight: "7px" }}
          />

          Manage Resumes

        </button>

      </section>


      {/* STATISTICS CARDS */}

      <section className="stats-grid">

        <StatCard
          title="Total Resumes"
          value={statistics.total_resumes ?? 0}
          subtitle="Uploaded resumes"
          icon={FileText}
          color="#6658df"
        />

        <StatCard
          title="Unique Skills"
          value={statistics.total_unique_skills ?? 0}
          subtitle="Skills identified"
          icon={Award}
          color="#169b76"
        />

        <StatCard
          title="Available Job Roles"
          value={statistics.total_job_roles ?? 0}
          subtitle="Roles available"
          icon={BriefcaseBusiness}
          color="#e69b36"
        />

        <StatCard
          title="Job Matches"
          value={matches.length}
          subtitle="Roles analysed"
          icon={Target}
          color="#df6485"
        />

        <StatCard
          title="Average Match"
          value={`${averageMatch}%`}
          subtitle="Across available roles"
          icon={TrendingUp}
          color="#3986d7"
        />

      </section>


      {/* QUICK ACTION CARDS */}

      <section className="dashboard-grid">

        {/* UPLOAD RESUME */}

        <div className="panel">

          <div className="panel-heading">

            <h3>

              <Upload
                size={18}
                style={{
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              />

              Upload Your Resume

            </h3>

          </div>

          <p>
            Upload your latest PDF resume to identify your skills and discover
            suitable career opportunities.
          </p>

          <button
            className="primary-button"
            style={{ marginTop: "15px" }}
            onClick={() => navigate("/student/resumes")}
          >

            Upload Resume

            <ArrowRight size={15} />

          </button>

        </div>


        {/* IMPROVE CAREER */}

        <div className="panel">

          <div className="panel-heading">

            <h3>

              <Sparkles
                size={18}
                style={{
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              />

              Improve Your Career

            </h3>

          </div>

          <p>
            Explore job-role matches, identify missing skills, and discover
            learning resources to improve your profile.
          </p>

          <button
            className="primary-button"
            style={{ marginTop: "15px" }}
            onClick={() => navigate("/student/job-matches")}
          >

            Explore Job Matches

            <ArrowRight size={15} />

          </button>

        </div>

      </section>


      {/* CAREER MATCH ANALYSIS AND TOP MATCHES */}

      <section className="dashboard-grid">


        {/* CAREER MATCH CHART */}

        <div className="panel">

          <div className="panel-heading">

            <h3>

              <TrendingUp
                size={18}
                style={{
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              />

              Career Match Analysis

            </h3>

            <button
              className="icon-button"
              title="Refresh dashboard"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
            >

              <RefreshCw
                size={17}
                className={refreshing ? "refresh-spinning" : ""}
              />

            </button>

          </div>


          {chartData.length > 0 ? (

            <div style={{ width: "100%", height: 280 }}>

              <ResponsiveContainer width="100%" height="100%">

                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 35,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="role"
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    unit="%"
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value}%`,
                      "Match"
                    ]}
                  />

                  <Bar
                    dataKey="match"
                    name="Career Match"
                    fill="#7264e9"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          ) : (

            <div className="empty-state">
              No job match data available. Upload a resume to get started.
            </div>

          )}


          <p style={{ fontSize: "10px", color: "#929bad" }}>

            Match percentages are based on overlap between extracted resume
            skills and required job skills. They do not measure actual job
            readiness.

          </p>

        </div>


        {/* TOP CAREER MATCHES */}

        <div className="panel">

          <div className="panel-heading">

            <h3>Top Career Matches</h3>

            <span>Best results</span>

          </div>


          {bestMatches.length > 0 ? (

            bestMatches.map((job) => {

              const missingCount = Array.isArray(job.missing_skills)
                ? job.missing_skills.length
                : 0;

              const matchPercentage = Math.min(
                100,
                Math.max(0, Number(job.match_percentage) || 0)
              );

              return (

                <div
                  className="match-item"
                  key={job.job_role_id}
                >

                  <div className="match-top">

                    <span>{job.role_name}</span>

                    <strong>
                      {matchPercentage}%
                    </strong>

                  </div>


                  <div className="progress-track">

                    <div
                      className="progress-fill"
                      style={{
                        width: `${matchPercentage}%`,
                      }}
                    />

                  </div>


                  <p
                    style={{
                      fontSize: "10px",
                      color: "#929bad",
                      marginTop: 6,
                    }}
                  >

                    {missingCount === 0
                      ? "All listed skills matched"
                      : `${missingCount} skills to learn`}

                  </p>

                </div>

              );

            })

          ) : (

            <div className="empty-state">
              No career matches yet. Upload a resume to find suitable roles.
            </div>

          )}


          <button
            className="icon-button"
            onClick={() => navigate("/student/job-matches")}
            style={{
              color: "#6658df",
              fontWeight: 600,
              marginTop: "12px",
            }}
          >

            View all matches

            <ArrowRight size={15} />

          </button>

        </div>

      </section>


      {/* EXTRACTED SKILLS */}

      <section
        className="panel"
        style={{ marginBottom: "20px" }}
      >

        <div className="panel-heading">

          <h3>Your Extracted Skills</h3>

          <span>{skills.length} skills</span>

        </div>


        {skills.length > 0 ? (

          <div className="skill-list">

            {skills.map((skill, index) => (

              <span
                className="skill-tag"
                key={`${skill}-${index}`}
              >

                {skill}

              </span>

            ))}

          </div>

        ) : (

          <div className="empty-state">
            Upload a resume and extract your skills to see them here.
          </div>

        )}

      </section>


      {/* RECENT RESUME ACTIVITY */}

      <section className="panel">

        <div className="panel-heading">

          <h3>Recent Resume Activity</h3>

          <button
            className="icon-button"
            onClick={() => navigate("/student/resumes")}
            style={{
              color: "#6658df",
              fontWeight: 600,
            }}
          >

            View all

            <ArrowRight size={15} />

          </button>

        </div>


        {resumes.length > 0 ? (

          resumes.map((resume) => (

            <div
              className="activity-row"
              key={resume.resume_id}
            >

              <div>

                <strong>{resume.file_name}</strong>

                <p>

                  {resume.uploaded_at
                    ? new Date(resume.uploaded_at).toLocaleDateString()
                    : "Date unavailable"}

                </p>

              </div>

              <span className="activity-status">
                Uploaded
              </span>

            </div>

          ))

        ) : (

          <div className="empty-state">
            You haven't uploaded a resume yet.
          </div>

        )}

      </section>

    </div>

  );

}

export default StudentDashboard;
