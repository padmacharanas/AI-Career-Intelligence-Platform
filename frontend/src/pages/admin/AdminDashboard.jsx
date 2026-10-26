
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  FileText,
  BriefcaseBusiness,
  BrainCircuit,
  RefreshCw,
  ShieldCheck,
  ArrowUpRight,
  BookOpen,
  UserPlus,
  BarChart3,
  Database,
  GraduationCap,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

function AdminDashboard() {
  const [statistics, setStatistics] = useState({
    total_users: 0,
    total_students: 0,
    total_admins: 0,
    total_resumes: 0,
    total_job_roles: 0,
    total_unique_skills: 0,
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [resourceCount, setResourceCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
      setRefreshing(true);
    }

    setError("");

    const [dashboardResult, resourceResult] = await Promise.allSettled([
      api.get("/admin/dashboard"),
      api.get("/resources/"),
    ]);

    if (dashboardResult.status === "fulfilled") {
      const data = dashboardResult.value.data;

      setStatistics((previous) => ({
        ...previous,
        ...(data.statistics || {}),
      }));

      setRecentUsers(data.recent_users || []);
    } else {
      setError(
        dashboardResult.reason?.response?.data?.detail ||
          "Unable to load dashboard information. Please try again."
      );
    }

    if (resourceResult.status === "fulfilled") {
      const data = resourceResult.value.data;

      const resources = Array.isArray(data)
        ? data
        : data.resources || data.items || [];

      setResourceCount(resources.length);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name = "") =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const statCards = [
    {
      title: "Total Students",
      value: statistics.total_students ?? statistics.total_users ?? 0,
      subtitle: "Registered student accounts",
      icon: Users,
      color: "blue",
      link: "/admin/students",
    },
    {
      title: "Resumes Uploaded",
      value: statistics.total_resumes ?? 0,
      subtitle: "Student resume documents",
      icon: FileText,
      color: "violet",
      link: "/admin/resumes",
    },
    {
      title: "Job Roles",
      value: statistics.total_job_roles ?? 0,
      subtitle: "Career opportunities",
      icon: BriefcaseBusiness,
      color: "amber",
      link: "/admin/job-roles",
    },
    {
      title: "Skills Identified",
      value: statistics.total_unique_skills ?? 0,
      subtitle: "Unique extracted skills",
      icon: BrainCircuit,
      color: "emerald",
      link: "/admin/analytics",
    },
    {
      title: "Learning Resources",
      value: resourceCount,
      subtitle: "Resources available to students",
      icon: BookOpen,
      color: "rose",
      link: "/admin/resources",
    },
    {
      title: "Administrators",
      value: statistics.total_admins ?? "—",
      subtitle: "Administrator accounts",
      icon: ShieldCheck,
      color: "slate",
      link: "/admin/students",
    },
  ];

  const quickActions = [
    {
      title: "Manage Students",
      description: "View student profiles and academic details.",
      icon: Users,
      link: "/admin/students",
      color: "blue",
    },
    {
      title: "Manage Resumes",
      description: "Review and manage uploaded resumes.",
      icon: FileText,
      link: "/admin/resumes",
      color: "violet",
    },
    {
      title: "Manage Job Roles",
      description: "Create and update career opportunities.",
      icon: BriefcaseBusiness,
      link: "/admin/job-roles",
      color: "amber",
    },
    {
      title: "Platform Analytics",
      description: "Explore platform statistics and insights.",
      icon: BarChart3,
      link: "/admin/analytics",
      color: "emerald",
    },
    {
      title: "Learning Resources",
      description: "Manage tutorials, courses and materials.",
      icon: GraduationCap,
      link: "/admin/resources",
      color: "rose",
    },
  ];

  return (
    <div className="admin-dashboard">
      {/* PAGE HEADER */}
      <header className="admin-dashboard-header">
        <div className="admin-dashboard-heading">
          <div className="admin-dashboard-breadcrumb">
            <span>Administration</span>
            <span className="admin-dashboard-breadcrumb-divider">/</span>
            <span>Dashboard</span>
          </div>

          <h1>Dashboard Overview</h1>

          <p>
            Welcome back, Administrator. Here's an overview of your
            Career Intelligence Platform.
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard-refresh"
          onClick={() => fetchDashboard()}
          disabled={refreshing}
        >
          <RefreshCw
            size={16}
            className={refreshing ? "admin-dashboard-spinning" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="admin-dashboard-error">
          <AlertCircle size={17} />
          <span>{error}</span>

          <button type="button" onClick={() => fetchDashboard()}>
            Try again
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <span className="admin-dashboard-overline">
              PLATFORM SUMMARY
            </span>

            <h2>Platform at a glance</h2>

            <p>Key figures based on your platform database.</p>
          </div>

          <span className="admin-dashboard-live-label">
            <span className="admin-dashboard-live-dot" />
            Live data
          </span>
        </div>

        <div className="admin-dashboard-stats">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                to={item.link}
                className="admin-dashboard-stat-card"
                key={item.title}
              >
                <div className="admin-dashboard-stat-top">
                  <div
                    className={`admin-dashboard-stat-icon ${item.color}`}
                  >
                    <Icon size={21} strokeWidth={2} />
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="admin-dashboard-stat-arrow"
                  />
                </div>

                <div className="admin-dashboard-stat-value">
                  {loading ? (
                    <span className="admin-dashboard-skeleton" />
                  ) : (
                    item.value
                  )}
                </div>

                <div className="admin-dashboard-stat-title">
                  {item.title}
                </div>

                <p>{item.subtitle}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* MAIN DASHBOARD GRID */}
      <section className="admin-dashboard-main-grid">
        {/* RECENT REGISTRATIONS */}
        <div className="admin-dashboard-panel admin-dashboard-registrations">
          <div className="admin-dashboard-panel-header">
            <div>
              <span className="admin-dashboard-overline">
                USER ACTIVITY
              </span>

              <h2>Recent registrations</h2>

              <p>Latest students registered on the platform.</p>
            </div>

            <div className="admin-dashboard-panel-icon blue">
              <UserPlus size={20} />
            </div>
          </div>

          {loading ? (
            <div className="admin-dashboard-empty">
              Loading recent registrations...
            </div>
          ) : recentUsers.length === 0 ? (
            <div className="admin-dashboard-empty">
              <Users size={25} />
              <strong>No registrations yet</strong>
              <span>New student registrations will appear here.</span>
            </div>
          ) : (
            <div className="admin-dashboard-table-wrap">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>

                <tbody>
                  {recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-dashboard-user">
                          <div className="admin-dashboard-avatar">
                            {getInitials(user.full_name)}
                          </div>

                          <div className="admin-dashboard-user-details">
                            <strong>{user.full_name}</strong>
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-dashboard-role ${
                            user.role === "admin" ? "admin" : "student"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="admin-dashboard-date">
                        {formatDate(user.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Link
            to="/admin/students"
            className="admin-dashboard-view-link"
          >
            View all students
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* PLATFORM SERVICES */}
        <div className="admin-dashboard-panel admin-dashboard-services">
          <div className="admin-dashboard-panel-header">
            <div>
              <span className="admin-dashboard-overline">
                SYSTEM INFORMATION
              </span>

              <h2>Platform services</h2>

              <p>Overview of available platform data.</p>
            </div>

            <div className="admin-dashboard-panel-icon green">
              <Activity size={20} />
            </div>
          </div>

          <div className="admin-dashboard-service-list">
            <div className="admin-dashboard-service">
              <div className="admin-dashboard-service-icon green">
                <Database size={18} />
              </div>

              <div className="admin-dashboard-service-info">
                <strong>Backend dashboard API</strong>
                <span>Dashboard data endpoint</span>
              </div>

              <span
                className={`admin-dashboard-service-status ${
                  error ? "unavailable" : "available"
                }`}
              >
                {error ? "Issue" : "Connected"}
              </span>
            </div>

            <div className="admin-dashboard-service">
              <div className="admin-dashboard-service-icon blue">
                <Users size={18} />
              </div>

              <div className="admin-dashboard-service-info">
                <strong>User management</strong>
                <span>
                  {loading
                    ? "Loading student data"
                    : `${
                        statistics.total_students ??
                        statistics.total_users ??
                        0
                      } registered students`}
                </span>
              </div>

              <span className="admin-dashboard-service-status available">
                Available
              </span>
            </div>

            <div className="admin-dashboard-service">
              <div className="admin-dashboard-service-icon violet">
                <BrainCircuit size={18} />
              </div>

              <div className="admin-dashboard-service-info">
                <strong>Career intelligence</strong>
                <span>
                  {loading
                    ? "Loading skill data"
                    : `${statistics.total_unique_skills ?? 0} unique skills`}
                </span>
              </div>

              <span className="admin-dashboard-service-status available">
                Available
              </span>
            </div>

            <div className="admin-dashboard-service">
              <div className="admin-dashboard-service-icon rose">
                <BookOpen size={18} />
              </div>

              <div className="admin-dashboard-service-info">
                <strong>Learning library</strong>
                <span>
                  {loading
                    ? "Loading resources"
                    : `${resourceCount} learning resources`}
                </span>
              </div>

              <span className="admin-dashboard-service-status available">
                Available
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="admin-dashboard-section">
        <div className="admin-dashboard-section-heading">
          <div>
            <span className="admin-dashboard-overline">
              MANAGEMENT
            </span>

            <h2>Quick access</h2>

            <p>
              Go directly to the tools you use to manage the platform.
            </p>
          </div>
        </div>

        <div className="admin-dashboard-actions">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                to={action.link}
                className="admin-dashboard-action-card"
                key={action.title}
              >
                <div
                  className={`admin-dashboard-action-icon ${action.color}`}
                >
                  <Icon size={21} />
                </div>

                <div className="admin-dashboard-action-content">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </div>

                <ArrowUpRight
                  size={18}
                  className="admin-dashboard-action-arrow"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="admin-dashboard-footer">
        <div className="admin-dashboard-footer-brand">
          <div className="admin-dashboard-footer-icon">
            <ShieldCheck size={17} />
          </div>

          <div>
            <strong>Career Intelligence Platform</strong>
            <span>Administration workspace</span>
          </div>
        </div>

        <span className="admin-dashboard-version">
          Administrator Portal · Version 1.0.0
        </span>
      </footer>
    </div>
  );
}

export default AdminDashboard;
