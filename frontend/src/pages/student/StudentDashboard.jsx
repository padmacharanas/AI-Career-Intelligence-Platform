
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Award,
  BriefcaseBusiness,
  Target,
  RefreshCw,
  ArrowRight,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  Code2,
  Activity,
  BookOpen,
  AlertCircle,
  BarChart3,
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

function StudentDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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
        setError("Your login session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to access this dashboard.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load your dashboard. Please check your backend connection."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  const averageMatch =
    Number(statistics.average_match_percentage) || 0;

  const chartData = useMemo(
    () =>
      matches.slice(0, 8).map((job) => ({
        role: job.role_name || "Unknown Role",
        match: Math.min(
          100,
          Math.max(0, Number(job.match_percentage) || 0)
        ),
      })),
    [matches]
  );

  const strongestMatch = bestMatches.length
    ? bestMatches.reduce((best, current) =>
        Number(current.match_percentage || 0) >
        Number(best.match_percentage || 0)
          ? current
          : best
      )
    : null;

  const strongestPercentage = strongestMatch
    ? Math.min(
        100,
        Math.max(0, Number(strongestMatch.match_percentage) || 0)
      )
    : 0;

  const skillGapInsights = bestMatches
    .flatMap((job) =>
      (Array.isArray(job.missing_skills) ? job.missing_skills : [])
        .filter((skill) => typeof skill === "string" && skill.trim())
        .map((skill) => skill.trim())
    )
    .filter(
      (skill, index, array) =>
        array.findIndex(
          (item) => item.toLowerCase() === skill.toLowerCase()
        ) === index
    )
    .slice(0, 8);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const statItems = [
    {
      title: "Total Resumes",
      value: statistics.total_resumes ?? 0,
      description: "Documents uploaded",
      icon: FileText,
      color: "blue",
    },
    {
      title: "Skills Identified",
      value: statistics.total_unique_skills ?? skills.length,
      description: "In your profile",
      icon: Award,
      color: "green",
    },
    {
      title: "Available Roles",
      value: statistics.total_job_roles ?? 0,
      description: "Career opportunities",
      icon: BriefcaseBusiness,
      color: "purple",
    },
    {
      title: "Job Matches",
      value: matches.length,
      description: "Roles analysed",
      icon: Target,
      color: "orange",
    },
  ];

  if (loading) {
    return (
      <div className="student-dashboard-state">
        <RefreshCw className="student-dashboard-spinner" size={26} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    const sessionExpired = error.toLowerCase().includes("session");

    return (
      <div className="student-dashboard-state student-dashboard-error">
        <div className="student-dashboard-error-icon">
          <AlertCircle size={28} />
        </div>
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>
        <button
          className="sd-btn sd-btn-primary"
          onClick={() =>
            sessionExpired ? navigate("/login") : fetchDashboard()
          }
        >
          {sessionExpired ? "Go to Login" : "Try Again"}
        </button>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Welcome section */}
      <section className="sd-welcome">
        <div className="sd-welcome-content">
          <span className="sd-overline">STUDENT OVERVIEW</span>

          <h1>
            Welcome back, <span>{studentName}</span>
          </h1>

          <p>
            Manage your career profile, review your skills, and discover
            opportunities that match your goals.
          </p>
        </div>

        <div className="sd-welcome-side">
          <div className="sd-welcome-side-icon">
            <GraduationCap size={36} />
          </div>
          <div>
            <strong>Your career workspace</strong>
            <span>Learn · Analyse · Grow</span>
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="sd-section">
        <div className="sd-section-heading">
          <div>
            <span className="sd-overline">AT A GLANCE</span>
            <h2>Dashboard Overview</h2>
            <p>A quick summary of your career profile.</p>
          </div>

          <button
            className="sd-btn sd-btn-light sd-refresh-button"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={refreshing ? "student-dashboard-spinner" : ""}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="sd-stats-grid">
          {statItems.map((item) => {
            const Icon = item.icon;

            return (
              <article className="sd-stat-card" key={item.title}>
                <div className={`sd-stat-icon sd-${item.color}`}>
                  <Icon size={21} />
                </div>

                <div className="sd-stat-copy">
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <small>{item.description}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Career development */}
      <section className="sd-section">
        <div className="sd-section-heading">
          <div>
            <span className="sd-overline">CAREER DEVELOPMENT</span>
            <h2>Your Next Steps</h2>
            <p>Use these insights to plan your next learning goals.</p>
          </div>
        </div>

        <div className="sd-development-grid">
          <article className="sd-content-card">
            <div className="sd-card-title">
              <div className="sd-card-icon sd-icon-amber">
                <Lightbulb size={21} />
              </div>
              <div>
                <h3>Skills to Improve</h3>
                <p>Skills missing from your career matches</p>
              </div>
            </div>

            {skillGapInsights.length > 0 ? (
              <>
                <div className="sd-skill-gap-list">
                  {skillGapInsights.map((skill, index) => (
                    <span key={`${skill}-${index}`}>{skill}</span>
                  ))}
                </div>

                <p className="sd-card-helper">
                  Review these skills and consider adding them to your
                  learning plan.
                </p>
              </>
            ) : (
              <div className="sd-empty-inline">
                <CheckCircle2 size={20} />
                <span>
                  No missing skills are reported in your current top matches.
                </span>
              </div>
            )}

            <button
              className="sd-text-button"
              onClick={() => navigate("/student/job-matches")}
            >
              Review skill gaps <ArrowRight size={16} />
            </button>
          </article>

          <article className="sd-content-card">
            <div className="sd-card-title">
              <div className="sd-card-icon sd-icon-blue">
                <Target size={21} />
              </div>
              <div>
                <h3>Strongest Career Match</h3>
                <p>Your highest current skill overlap</p>
              </div>
            </div>

            {strongestMatch ? (
              <>
                <div className="sd-best-match">
                  <div>
                    <span className="sd-mini-label">TOP MATCH</span>
                    <h3>{strongestMatch.role_name || "Career Role"}</h3>
                  </div>
                  <strong>{strongestPercentage}%</strong>
                </div>

                <div className="sd-progress-track">
                  <div
                    className="sd-progress-fill"
                    style={{ width: `${strongestPercentage}%` }}
                  />
                </div>

                <p className="sd-card-helper">
                  This is your highest skill-overlap result among the current
                  career matches.
                </p>
              </>
            ) : (
              <div className="sd-empty-inline">
                <BriefcaseBusiness size={20} />
                <span>
                  Upload and analyse a resume to view your career matches.
                </span>
              </div>
            )}

            <button
              className="sd-text-button"
              onClick={() => navigate("/student/job-matches")}
            >
              View career matches <ArrowRight size={16} />
            </button>
          </article>
        </div>
      </section>

      {/* Analytics and top matches */}
      <section className="sd-main-grid">
        <article className="sd-content-card sd-analytics-card">
          <div className="sd-panel-heading">
            <div>
              <span className="sd-overline">PROFILE ANALYSIS</span>
              <h2>
                <BarChart3 size={21} />
                Career Match Analysis
              </h2>
              <p>Skill-overlap percentages across your matched roles.</p>
            </div>

            <div className="sd-average-indicator">
              <span>Average</span>
              <strong>{averageMatch.toFixed(1)}%</strong>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="sd-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 12,
                    left: -18,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid
                    stroke="#edf0f5"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="role"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 11, fill: "#68758a" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    tick={{ fontSize: 11, fill: "#68758a" }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [`${value}%`, "Skill overlap"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e3e8f0",
                      fontSize: "12px",
                    }}
                  />

                  <Bar
                    dataKey="match"
                    name="Career Match"
                    fill="#315b9a"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="sd-empty-state">
              No career match data is available yet.
            </div>
          )}

          <div className="sd-chart-note">
            <Lightbulb size={15} />
            <span>
              Match percentages show overlap between extracted resume skills
              and required job skills. They do not measure actual job readiness.
            </span>
          </div>
        </article>

        <article className="sd-content-card sd-top-matches-card">
          <div className="sd-panel-heading">
            <div>
              <span className="sd-overline">OPPORTUNITIES</span>
              <h2>
                <BriefcaseBusiness size={21} />
                Top Career Matches
              </h2>
              <p>Your strongest matching job roles.</p>
            </div>

            <span className="sd-count-badge">{bestMatches.length}</span>
          </div>

          {bestMatches.length > 0 ? (
            <div className="sd-match-list">
              {bestMatches.slice(0, 4).map((job, index) => {
                const percentage = Math.min(
                  100,
                  Math.max(0, Number(job.match_percentage) || 0)
                );

                const missingCount = Array.isArray(job.missing_skills)
                  ? job.missing_skills.length
                  : 0;

                return (
                  <div
                    className="sd-match-item"
                    key={job.job_role_id ?? `${job.role_name}-${index}`}
                  >
                    <div className="sd-match-heading">
                      <div className="sd-match-icon">
                        <Code2 size={17} />
                      </div>

                      <div className="sd-match-name">
                        <strong>{job.role_name || "Unknown Role"}</strong>
                        <span>
                          {missingCount === 0
                            ? "All listed skills matched"
                            : `${missingCount} skills to develop`}
                        </span>
                      </div>

                      <strong className="sd-match-score">
                        {percentage}%
                      </strong>
                    </div>

                    <div className="sd-progress-track sd-match-progress">
                      <div
                        className="sd-progress-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="sd-empty-state">
              No career matches are available yet.
            </div>
          )}

          <button
            className="sd-btn sd-btn-outline sd-full-button"
            onClick={() => navigate("/student/job-matches")}
          >
            View All Matches <ArrowRight size={16} />
          </button>
        </article>
      </section>

      {/* Technical skills */}
      <section className="sd-section">
        <article className="sd-content-card sd-skills-card">
          <div className="sd-panel-heading">
            <div>
              <span className="sd-overline">YOUR PROFILE</span>
              <h2>
                <Code2 size={21} />
                Technical Skills
              </h2>
              <p>Skills identified from your uploaded resumes.</p>
            </div>

            <span className="sd-count-badge">{skills.length} skills</span>
          </div>

          {skills.length > 0 ? (
            <div className="sd-skills-list">
              {skills.map((skill, index) => (
                <span key={`${skill}-${index}`}>
                  <CheckCircle2 size={14} />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="sd-empty-state">
              Upload a resume to identify your technical skills.
            </div>
          )}
        </article>
      </section>

      {/* Recent resume activity */}
      <section className="sd-section">
        <article className="sd-content-card sd-activity-card">
          <div className="sd-panel-heading">
            <div>
              <span className="sd-overline">DOCUMENT HISTORY</span>
              <h2>
                <Activity size={21} />
                Recent Resume Activity
              </h2>
              <p>Review your recently uploaded resumes.</p>
            </div>

            <button
              className="sd-text-button"
              onClick={() => navigate("/student/resumes")}
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          {resumes.length > 0 ? (
            <div className="sd-resume-list">
              {resumes.map((resume, index) => (
                <div
                  className="sd-resume-row"
                  key={resume.resume_id ?? `${resume.file_name}-${index}`}
                >
                  <div className="sd-resume-file-icon">
                    <FileText size={21} />
                  </div>

                  <div className="sd-resume-info">
                    <strong>{resume.file_name || "Resume"}</strong>
                    <span>
                      Uploaded on {formatDate(resume.uploaded_at)}
                    </span>
                  </div>

                  <span className="sd-upload-status">
                    <CheckCircle2 size={14} />
                    Uploaded
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="sd-empty-state">
              No resume activity is available yet.
            </div>
          )}
        </article>
      </section>

      {/* Footer */}
      <footer className="sd-dashboard-footer">
        <div>
          <BookOpen size={17} />
          <span>Keep learning. Keep building. Keep growing.</span>
        </div>
        <span>AI Career Intelligence Platform</span>
      </footer>
    </div>
  );
}

export default StudentDashboard;
