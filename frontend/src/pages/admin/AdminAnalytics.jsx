
import { useCallback, useEffect, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import {
  Users,
  FileText,
  BrainCircuit,
  BriefcaseBusiness,
  Target,
  RefreshCw,
  AlertCircle
} from "lucide-react";

import api from "../../services/api";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Find an array inside an API response.
// Supports common response-key names.

const extractArray = (data, keys) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(data[key])) {
      return data[key];
    }
  }

  return [];
};

// Safely convert values into numbers.

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

// ==========================================
// STAT CARD
// ==========================================

function AnalyticsStatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="aa-stat-card">

      <div className="aa-stat-content">

        <p>{title}</p>

        <h2>{value}</h2>

      </div>

      <div
        className="aa-stat-icon"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon size={25} />
      </div>

    </div>
  );
}

// ==========================================
// CHART CARD
// ==========================================

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="aa-chart-card">

      <div className="aa-chart-header">

        <h3>{title}</h3>

        <p>{subtitle}</p>

      </div>

      {children}

    </div>
  );
}

// ==========================================
// ADMIN ANALYTICS COMPONENT
// ==========================================

function AdminAnalytics() {

  const [registrations, setRegistrations] = useState([]);
  const [resumeUploads, setResumeUploads] = useState([]);
  const [popularSkills, setPopularSkills] = useState([]);
  const [jobRoleDemand, setJobRoleDemand] = useState([]);
  const [skillGaps, setSkillGaps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH ANALYTICS DATA
  // ========================================

  const fetchAnalytics = useCallback(async () => {

    try {

      setLoading(true);
      setError("");

      const [
        registrationResponse,
        resumeResponse,
        skillsResponse,
        demandResponse,
        gapsResponse
      ] = await Promise.all([

        api.get("/admin/analytics/registrations"),

        api.get("/admin/analytics/resume-uploads"),

        api.get("/admin/analytics/popular-skills"),

        api.get("/admin/analytics/job-role-demand"),

        api.get("/admin/analytics/skill-gaps")

      ]);

      // ------------------------------------
      // STUDENT REGISTRATIONS
      // ------------------------------------

      const registrationData = extractArray(
        registrationResponse.data,
        ["registrations", "monthly_registrations", "data", "results"]
      );

      setRegistrations(
        registrationData.map((item) => ({
          month: item.month ?? item.period ?? item.date ?? "Unknown",
          students: toNumber(
            item.total_students ??
            item.student_count ??
            item.count ??
            item.total ??
            item.registrations
          )
        }))
      );

      // ------------------------------------
      // RESUME UPLOADS
      // ------------------------------------

      const resumeData = extractArray(
        resumeResponse.data,
        ["resume_uploads", "uploads", "monthly_uploads", "data", "results"]
      );

      setResumeUploads(
        resumeData.map((item) => ({
          month: item.month ?? item.period ?? item.date ?? "Unknown",
          uploads: toNumber(
            item.total_uploads ??
            item.upload_count ??
            item.count ??
            item.total ??
            item.uploads
          )
        }))
      );

      // ------------------------------------
      // POPULAR SKILLS
      // ------------------------------------

      const skillsData = extractArray(
        skillsResponse.data,
        ["popular_skills", "skills", "data", "results"]
      );

      setPopularSkills(
        skillsData.map((item) => ({
          skill: item.skill_name ?? item.skill ?? item.name ?? "Unknown",
          students: toNumber(
            item.student_count ??
            item.total_students ??
            item.count ??
            item.total
          )
        }))
      );

      // ------------------------------------
      // JOB ROLE DEMAND
      // ------------------------------------

      const demandData = extractArray(
        demandResponse.data,
        ["job_roles", "roles", "job_role_demand", "data", "results"]
      );

      const demandChartData = [];

      demandData.forEach((role) => {

        const skills = Array.isArray(role.required_skills)
          ? role.required_skills
          : Array.isArray(role.skills)
            ? role.skills
            : [];

        if (skills.length > 0) {

          demandChartData.push({
            role: role.role_name ?? role.name ?? "Unknown",
            requiredSkills: skills.length
          });

        } else {

          demandChartData.push({
            role: role.role_name ?? role.name ?? "Unknown",
            requiredSkills: toNumber(
              role.total_required_skills ??
              role.required_skill_count ??
              role.skill_count
            )
          });

        }

      });

      setJobRoleDemand(demandChartData);

      // ------------------------------------
      // SKILL GAP ANALYSIS
      // ------------------------------------

      const gapsData = extractArray(
        gapsResponse.data,
        ["skill_gaps", "gaps", "data", "results"]
      );

      setSkillGaps(
        gapsData.map((item) => ({
          skill: item.skill_name ?? item.skill ?? item.name ?? "Unknown",
          demand: toNumber(
            item.role_count ??
            item.required_count ??
            item.demand
          ),
          availability: toNumber(
            item.student_count ??
            item.available_count ??
            item.availability
          ),
          gap: toNumber(
            item.gap ??
            item.skill_gap ??
            item.gap_count
          )
        }))
      );

    } catch (err) {

      console.error("Analytics loading error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load analytics data. Please check your backend connection."
      );

    } finally {

      setLoading(false);

    }

  }, []);

  // ========================================
  // LOAD DATA ON PAGE OPEN
  // ========================================

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ========================================
  // CALCULATE SUMMARY STATISTICS
  // ========================================

  const totalStudents = registrations.reduce(
    (total, item) => total + item.students,
    0
  );

  const totalResumeUploads = resumeUploads.reduce(
    (total, item) => total + item.uploads,
    0
  );

  const totalSkills = popularSkills.length;

  const totalJobRoles = jobRoleDemand.length;

  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading) {

    return (
      <div className="aa-page">

        <div className="aa-loading">
          <RefreshCw className="aa-spin" size={28} />
          <p>Loading analytics data...</p>
        </div>

      </div>
    );

  }

  // ========================================
  // MAIN DASHBOARD
  // ========================================

  return (

    <div className="aa-page">

      {/* PAGE HEADER */}

      <div className="aa-page-header">

        <div>

          <h1>Admin Analytics</h1>

          <p>
            Monitor student registrations, resumes, skills and job role demand.
          </p>

        </div>

        <button
          className="aa-refresh-button"
          onClick={fetchAnalytics}
        >

          <RefreshCw size={17} />

          Refresh Data

        </button>

      </div>

      {/* ERROR MESSAGE */}

      {error && (

        <div className="aa-error">

          <AlertCircle size={20} />

          <span>{error}</span>

          <button onClick={fetchAnalytics}>
            Retry
          </button>

        </div>

      )}

      {/* SUMMARY CARDS */}

      <div className="aa-stats-grid">

        <AnalyticsStatCard
          title="Student Registrations"
          value={totalStudents}
          icon={Users}
          color="#2563eb"
        />

        <AnalyticsStatCard
          title="Resume Uploads"
          value={totalResumeUploads}
          icon={FileText}
          color="#16a34a"
        />

        <AnalyticsStatCard
          title="Popular Skills"
          value={totalSkills}
          icon={BrainCircuit}
          color="#9333ea"
        />

        <AnalyticsStatCard
          title="Job Roles"
          value={totalJobRoles}
          icon={BriefcaseBusiness}
          color="#ea580c"
        />

      </div>

      {/* REGISTRATION AND RESUME CHARTS */}

      <div className="aa-charts-grid">

        <ChartCard
          title="Student Registration Trends"
          subtitle="Monthly student registrations"
        >

          {registrations.length > 0 ? (

            <ResponsiveContainer width="100%" height={300}>

              <LineChart data={registrations}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="students"
                  name="Students"
                  stroke="#2563eb"
                  strokeWidth={3}
                  activeDot={{ r: 7 }}
                />

              </LineChart>

            </ResponsiveContainer>

          ) : (

            <p className="aa-empty">No registration data available.</p>

          )}

        </ChartCard>

        <ChartCard
          title="Resume Upload Trends"
          subtitle="Monthly resume uploads"
        >

          {resumeUploads.length > 0 ? (

            <ResponsiveContainer width="100%" height={300}>

              <BarChart data={resumeUploads}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="uploads"
                  name="Resume Uploads"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <p className="aa-empty">No resume upload data available.</p>

          )}

        </ChartCard>

      </div>

      {/* POPULAR SKILLS */}

      <div className="aa-charts-grid">

        <ChartCard
          title="Popular Skills"
          subtitle="Number of students possessing each skill"
        >

          {popularSkills.length > 0 ? (

            <ResponsiveContainer width="100%" height={350}>

              <BarChart
                data={popularSkills}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis type="number" allowDecimals={false} />

                <YAxis
                  type="category"
                  dataKey="skill"
                  width={110}
                />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="students"
                  name="Students"
                  fill="#9333ea"
                  radius={[0, 6, 6, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <p className="aa-empty">No popular skills data available.</p>

          )}

        </ChartCard>

        {/* JOB ROLE DEMAND */}

        <ChartCard
          title="Job Role Requirements"
          subtitle="Number of required skills for each job role"
        >

          {jobRoleDemand.length > 0 ? (

            <ResponsiveContainer width="100%" height={350}>

              <BarChart data={jobRoleDemand}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="role"
                  angle={-20}
                  textAnchor="end"
                  height={90}
                  interval={0}
                />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Legend />

                <Bar
                  dataKey="requiredSkills"
                  name="Required Skills"
                  fill="#ea580c"
                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          ) : (

            <p className="aa-empty">No job role data available.</p>

          )}

        </ChartCard>

      </div>

      {/* SKILL GAP ANALYSIS */}

      <ChartCard
        title="Skill Gap Analysis"
        subtitle="Comparison of job role demand and student skill availability"
      >

        {skillGaps.length > 0 ? (

          <ResponsiveContainer width="100%" height={400}>

            <BarChart
              data={skillGaps}
              margin={{ bottom: 50 }}
            >

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="skill"
                angle={-35}
                textAnchor="end"
                interval={0}
                height={100}
              />

              <YAxis allowDecimals={false} />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="demand"
                name="Job Role Demand"
                fill="#2563eb"
              />

              <Bar
                dataKey="availability"
                name="Student Availability"
                fill="#16a34a"
              />

              <Bar
                dataKey="gap"
                name="Skill Gap"
                fill="#dc2626"
              />

            </BarChart>

          </ResponsiveContainer>

        ) : (

          <p className="aa-empty">No skill gap data available.</p>

        )}

      </ChartCard>

      {/* FOOTER */}

      <div className="aa-footer">

        <Target size={17} />

        <span>
          Analytics are based on the data currently available in your platform.
        </span>

      </div>

    </div>

  );

}

export default AdminAnalytics;
