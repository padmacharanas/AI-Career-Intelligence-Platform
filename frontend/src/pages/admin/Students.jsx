
import { useEffect, useState } from "react";

import {
  Search,
  Users,
  FileText,
  BrainCircuit,
  ArrowLeft,
  Eye,
  RefreshCw,
  Mail,
  Calendar,
  Building2,
  GraduationCap,
  X,
  UserRound,
  Download
} from "lucide-react";

import api from "../../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStudents = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/students", {
        params: { search: searchValue }
      });

      setStudents(response.data.students || []);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    fetchStudents(value);
  };

  const viewStudent = async (studentId) => {
    try {
      setProfileLoading(true);
      setError("");

      const response = await api.get(`/admin/students/${studentId}`);
      setSelectedStudent(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load student profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const formatDate = (value, includeTime = false) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-IN", includeTime
      ? {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      : {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
    );
  };

  const getInitials = (name = "") =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";

  // ==========================================
  // STUDENT PROFILE
  // ==========================================

  if (selectedStudent) {
    const student = selectedStudent.student;
    const statistics = selectedStudent.statistics;
    const resumes = selectedStudent.resumes || [];

    return (
      <div className="sm-page">

        <button
          className="sm-back-button"
          onClick={() => setSelectedStudent(null)}
        >
          <ArrowLeft size={17} />
          Back to Students
        </button>

        <section className="sm-profile-header">
          <div className="sm-avatar sm-avatar-large">
            {getInitials(student.full_name)}
          </div>

          <div className="sm-profile-heading">
            <div className="sm-eyebrow">STUDENT PROFILE</div>
            <h1>{student.full_name}</h1>
            <p>
              <Mail size={15} />
              {student.email}
            </p>
          </div>

          <span className="sm-role-badge">Student</span>
        </section>

        <section className="sm-stat-grid">

          <div className="sm-stat-card">
            <div className="sm-stat-icon sm-blue">
              <FileText size={21} />
            </div>
            <div>
              <span>Total Resumes</span>
              <h2>{statistics.total_resumes}</h2>
              <small>Uploaded documents</small>
            </div>
          </div>

          <div className="sm-stat-card">
            <div className="sm-stat-icon sm-purple">
              <BrainCircuit size={21} />
            </div>
            <div>
              <span>Unique Skills</span>
              <h2>{statistics.total_unique_skills}</h2>
              <small>Extracted from resumes</small>
            </div>
          </div>

          <div className="sm-stat-card">
            <div className="sm-stat-icon sm-green">
              <GraduationCap size={21} />
            </div>
            <div>
              <span>Graduation Year</span>
              <h2>{student.graduation_year || "—"}</h2>
              <small>Expected graduation</small>
            </div>
          </div>

        </section>

        <section className="sm-profile-grid">

          <div className="sm-card">
            <div className="sm-card-heading">
              <div>
                <h3>Academic Information</h3>
                <p>Student details and education</p>
              </div>
              <GraduationCap size={21} />
            </div>

            <div className="sm-detail-list">

              <div className="sm-detail-item">
                <span>Full Name</span>
                <strong>{student.full_name}</strong>
              </div>

              <div className="sm-detail-item">
                <span>Email Address</span>
                <strong>{student.email}</strong>
              </div>

              <div className="sm-detail-item">
                <span>College</span>
                <strong>{student.college || "Not provided"}</strong>
              </div>

              <div className="sm-detail-item">
                <span>Degree</span>
                <strong>{student.degree || "Not provided"}</strong>
              </div>

              <div className="sm-detail-item">
                <span>Department / Branch</span>
                <strong>{student.branch || "Not provided"}</strong>
              </div>

              <div className="sm-detail-item">
                <span>Graduation Year</span>
                <strong>{student.graduation_year || "Not provided"}</strong>
              </div>

              <div className="sm-detail-item">
                <span>Registered On</span>
                <strong>{formatDate(student.created_at)}</strong>
              </div>

            </div>
          </div>

          <div className="sm-card">
            <div className="sm-card-heading">
              <div>
                <h3>Resume Documents</h3>
                <p>Files uploaded by this student</p>
              </div>
              <span className="sm-count-badge">
                {resumes.length} files
              </span>
            </div>

            {resumes.length === 0 ? (
              <div className="sm-empty">
                <FileText size={30} />
                <strong>No resumes uploaded</strong>
                <span>This student has not uploaded any documents yet.</span>
              </div>
            ) : (
              <div className="sm-resume-list">
                {resumes.map((resume) => (
                  <div className="sm-resume-item" key={resume.id}>
                    <div className="sm-resume-icon">
                      <FileText size={21} />
                    </div>

                    <div className="sm-resume-info">
                      <strong>{resume.file_name}</strong>
                      <span>
                        Uploaded {formatDate(resume.uploaded_at, true)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>
      </div>
    );
  }

  // ==========================================
  // STUDENT DIRECTORY
  // ==========================================

  const totalResumes = students.reduce(
    (total, student) => total + (student.total_resumes || 0),
    0
  );

  const averageResumes = students.length
    ? (totalResumes / students.length).toFixed(1)
    : "0";

  return (
    <div className="sm-page">

      <section className="sm-page-heading">
        <div>
          <div className="sm-eyebrow">ADMINISTRATION / USERS</div>
          <h1>Student Management</h1>
          <p>Manage student accounts and review academic information.</p>
        </div>

        <button
          className="sm-refresh-button"
          onClick={() => fetchStudents(search)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "sm-spin" : ""} />
          Refresh
        </button>
      </section>

      {error && (
        <div className="sm-error">
          {error}
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="sm-stat-grid">

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-blue">
            <Users size={21} />
          </div>
          <div>
            <span>Students Found</span>
            <h2>{students.length}</h2>
            <small>Matching student accounts</small>
          </div>
        </div>

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-purple">
            <FileText size={21} />
          </div>
          <div>
            <span>Total Resumes</span>
            <h2>{totalResumes}</h2>
            <small>Across listed students</small>
          </div>
        </div>

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-green">
            <BrainCircuit size={21} />
          </div>
          <div>
            <span>Average Resumes</span>
            <h2>{averageResumes}</h2>
            <small>Per listed student</small>
          </div>
        </div>

      </section>

      <section className="sm-card">

        <div className="sm-directory-heading">
          <div>
            <h3>Registered Students</h3>
            <p>Search and view student profiles</p>
          </div>

          <span className="sm-count-badge">
            {students.length} students
          </span>
        </div>

        <div className="sm-search-row">
          <div className="sm-search-box">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search by name or email address..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />

            {search && (
              <button
                className="sm-clear-search"
                onClick={() => handleSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="sm-loading">
            <RefreshCw size={23} className="sm-spin" />
            <span>Loading student records...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="sm-empty">
            <Users size={34} />
            <strong>No students found</strong>
            <span>Try changing your search or clearing the search field.</span>
          </div>
        ) : (
          <div className="sm-table-wrapper">
            <table className="sm-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>COLLEGE</th>
                  <th>GRADUATION</th>
                  <th>RESUMES</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>

                    <td>
                      <div className="sm-student-cell">
                        <div className="sm-avatar">
                          {getInitials(student.full_name)}
                        </div>
                        <div>
                          <strong>{student.full_name}</strong>
                          <span>{student.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="sm-college-cell">
                        <Building2 size={16} />
                        <span>{student.college || "Not provided"}</span>
                      </div>
                    </td>

                    <td>
                      <span className="sm-year">
                        {student.graduation_year || "—"}
                      </span>
                    </td>

                    <td>
                      <span className="sm-resume-count">
                        <FileText size={15} />
                        {student.total_resumes}
                      </span>
                    </td>

                    <td>
                      <button
                        className="sm-view-button"
                        disabled={profileLoading}
                        onClick={() => viewStudent(student.id)}
                      >
                        <Eye size={15} />
                        View Profile
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="sm-table-footer">
          Showing {students.length} student
          {students.length === 1 ? "" : "s"}
        </div>

      </section>
    </div>
  );
}

export default Students;
