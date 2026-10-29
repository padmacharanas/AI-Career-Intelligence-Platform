
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
  GraduationCap,
  X,
  Building2,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Pencil,
  Save,
  UserRound
} from "lucide-react";

import api from "../../services/api";

function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [studentToDelete, setStudentToDelete] = useState(null);

  // EDIT FORM STATE
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    college: "",
    degree: "",
    branch: "",
    graduation_year: ""
  });

  // ==========================================
  // FETCH STUDENTS
  // ==========================================

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

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = (value) => {
    setSearch(value);
    fetchStudents(value);
  };

  // ==========================================
  // VIEW STUDENT PROFILE
  // ==========================================

  const viewStudent = async (studentId) => {
    try {
      setProfileLoading(true);
      setError("");
      setSuccess("");
      setEditing(false);

      const response = await api.get(
        `/admin/students/${studentId}`
      );

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

  // ==========================================
  // START EDITING
  // ==========================================

  const startEditing = () => {
    if (!selectedStudent?.student) return;

    const student = selectedStudent.student;

    setEditForm({
      full_name: student.full_name || "",
      email: student.email || "",
      college: student.college || "",
      degree: student.degree || "",
      branch: student.branch || "",
      graduation_year: student.graduation_year || ""
    });

    setError("");
    setSuccess("");
    setEditing(true);
  };

  // ==========================================
  // HANDLE FORM INPUTS
  // ==========================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // ==========================================
  // CANCEL EDITING
  // ==========================================

  const cancelEditing = () => {
    setEditing(false);
    setError("");

    setEditForm({
      full_name: "",
      email: "",
      college: "",
      degree: "",
      branch: "",
      graduation_year: ""
    });
  };

  // ==========================================
  // SAVE STUDENT DETAILS
  // ==========================================

  const handleSaveStudent = async (event) => {
    event.preventDefault();

    if (!selectedStudent?.student || saving) return;

    const studentId = selectedStudent.student.id;

    const payload = {
      full_name: editForm.full_name.trim(),
      email: editForm.email.trim(),
      college: editForm.college.trim(),
      degree: editForm.degree.trim(),
      branch: editForm.branch.trim(),
      graduation_year: Number(editForm.graduation_year)
    };

    if (
      !payload.full_name ||
      !payload.email ||
      !payload.college ||
      !payload.degree ||
      !payload.branch
    ) {
      setError("Please fill in all student details.");
      return;
    }

    if (!Number.isInteger(payload.graduation_year) ||
        payload.graduation_year < 2000 ||
        payload.graduation_year > 2100) {
      setError("Please enter a valid graduation year.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/admin/students/${studentId}`,
        payload
      );

      // Refresh complete profile while preserving resume history
      const profileResponse = await api.get(
        `/admin/students/${studentId}`
      );

      setSelectedStudent(profileResponse.data);
      setEditing(false);

      // Refresh directory so updated name/email are displayed
      await fetchStudents(search);

      setSuccess(
        response.data?.message ||
        "Student details updated successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to update student details. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const confirmDeleteStudent = (student) => {
    setError("");
    setSuccess("");
    setStudentToDelete(student);
  };

  // ==========================================
  // DELETE STUDENT
  // ==========================================

  const handleDeleteStudent = async () => {
    if (!studentToDelete || deleting) return;

    try {
      setDeleting(true);
      setError("");

      const studentId = studentToDelete.id;
      const studentName = studentToDelete.full_name;

      const response = await api.delete(
        `/admin/students/${studentId}`
      );

      setStudentToDelete(null);

      if (selectedStudent?.student?.id === studentId) {
        setSelectedStudent(null);
        setEditing(false);
      }

      await fetchStudents(search);

      setSuccess(
        response.data?.message ||
        `${studentName} was deleted successfully.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete student. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (value, includeTime = false) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString(
      "en-IN",
      includeTime
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

  // ==========================================
  // AVATAR INITIALS
  // ==========================================

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
          onClick={() => {
            setSelectedStudent(null);
            setEditing(false);
            setError("");
            setSuccess("");
          }}
        >
          <ArrowLeft size={17} />
          Back to Students
        </button>

        {error && (
          <div className="sm-error">
            {error}
            <button onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="sm-success">
            {success}
            <button onClick={() => setSuccess("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* PROFILE HEADER */}

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

          <div className="sm-profile-actions">

            <span className="sm-role-badge">Student</span>

            <button
              type="button"
              className="sm-edit-button"
              onClick={startEditing}
              disabled={saving || deleting}
            >
              <Pencil size={16} />
              Edit Details
            </button>

            <button
              type="button"
              className="sm-delete-button"
              onClick={() => confirmDeleteStudent(student)}
              disabled={deleting || saving}
            >
              <Trash2 size={16} />
              Delete Student
            </button>

          </div>

        </section>

        {/* PROFILE STATISTICS */}

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

        {/* PROFILE DETAILS AND RESUMES */}

        <section className="sm-profile-grid">

          <div className="sm-card">

            <div className="sm-card-heading">
              <div>
                <h3>Academic Information</h3>
                <p>
                  {editing
                    ? "Update the student's personal and academic details"
                    : "Student details and education"}
                </p>
              </div>

              <GraduationCap size={21} />
            </div>

            {editing ? (

              /* EDIT FORM */

              <form
                className="sm-edit-form"
                onSubmit={handleSaveStudent}
              >

                <div className="sm-form-group">
                  <label htmlFor="sm-full-name">Full Name</label>
                  <input
                    id="sm-full-name"
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleEditChange}
                    maxLength={150}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="sm-form-group">
                  <label htmlFor="sm-email">Email Address</label>
                  <input
                    id="sm-email"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="sm-form-group">
                  <label htmlFor="sm-college">College</label>
                  <input
                    id="sm-college"
                    type="text"
                    name="college"
                    value={editForm.college}
                    onChange={handleEditChange}
                    maxLength={255}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="sm-form-group">
                  <label htmlFor="sm-degree">Degree</label>
                  <input
                    id="sm-degree"
                    type="text"
                    name="degree"
                    value={editForm.degree}
                    onChange={handleEditChange}
                    maxLength={100}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="sm-form-group">
                  <label htmlFor="sm-branch">
                    Department / Branch
                  </label>
                  <input
                    id="sm-branch"
                    type="text"
                    name="branch"
                    value={editForm.branch}
                    onChange={handleEditChange}
                    maxLength={150}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="sm-form-group">
                  <label htmlFor="sm-graduation-year">
                    Graduation Year
                  </label>
                  <input
                    id="sm-graduation-year"
                    type="number"
                    name="graduation_year"
                    value={editForm.graduation_year}
                    onChange={handleEditChange}
                    min="2000"
                    max="2100"
                    step="1"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="sm-form-readonly">
                  <span>Registered On</span>
                  <strong>{formatDate(student.created_at)}</strong>
                  <small>
                    Registration date is system-generated and cannot
                    be edited.
                  </small>
                </div>

                <div className="sm-edit-actions">

                  <button
                    type="button"
                    className="sm-cancel-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="sm-save-button"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="sm-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>

                </div>

              </form>

            ) : (

              /* READ-ONLY PROFILE */

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
                  <strong>
                    {student.graduation_year || "Not provided"}
                  </strong>
                </div>

                <div className="sm-detail-item">
                  <span>Registered On</span>
                  <strong>{formatDate(student.created_at)}</strong>
                </div>

              </div>

            )}

          </div>

          {/* RESUME DOCUMENTS */}

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
                <span>
                  This student has not uploaded any documents yet.
                </span>
              </div>
            ) : (
              <div className="sm-resume-list">

                {resumes.map((resume) => (
                  <div
                    className="sm-resume-item"
                    key={resume.id}
                  >

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

        {studentToDelete && (
          <DeleteStudentDialog
            student={studentToDelete}
            deleting={deleting}
            onCancel={() => setStudentToDelete(null)}
            onConfirm={handleDeleteStudent}
          />
        )}

      </div>
    );
  }

  // ==========================================
  // STUDENT DIRECTORY STATISTICS
  // ==========================================

  const totalResumes = students.reduce(
    (total, student) => total + (student.total_resumes || 0),
    0
  );

  const averageResumes = students.length
    ? (totalResumes / students.length).toFixed(1)
    : "0";

  const studentsWithResumes = students.filter(
    (student) => (student.total_resumes || 0) > 0
  ).length;

  const studentsWithoutResumes =
    students.length - studentsWithResumes;

  // ==========================================
  // STUDENT DIRECTORY
  // ==========================================

  return (
    <div className="sm-page">

      <section className="sm-page-heading">

        <div>
          <div className="sm-eyebrow">ADMINISTRATION / USERS</div>
          <h1>Student Management</h1>
          <p>
            Manage student accounts and review academic information.
          </p>
        </div>

        <button
          className="sm-refresh-button"
          onClick={() => fetchStudents(search)}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "sm-spin" : ""}
          />
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

      {success && (
        <div className="sm-success">
          {success}
          <button onClick={() => setSuccess("")}>
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

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-green">
            <ShieldCheck size={21} />
          </div>

          <div>
            <span>With Resumes</span>
            <h2>{studentsWithResumes}</h2>
            <small>Students with uploaded files</small>
          </div>
        </div>

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-purple">
            <FileText size={21} />
          </div>

          <div>
            <span>Without Resumes</span>
            <h2>{studentsWithoutResumes}</h2>
            <small>Students without uploaded files</small>
          </div>
        </div>

      </section>

      <section className="sm-card">

        <div className="sm-directory-heading">

          <div>
            <h3>Registered Students</h3>
            <p>Search, view, and manage student profiles</p>
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
            <span>
              Try changing your search or clearing the search field.
            </span>
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
                  <th>ACTIONS</th>
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
                        <span>
                          {student.college || "Not provided"}
                        </span>
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
                        {student.total_resumes || 0}
                      </span>
                    </td>

                    <td>
                      <div className="sm-action-buttons">

                        <button
                          className="sm-view-button"
                          disabled={profileLoading || deleting}
                          onClick={() => viewStudent(student.id)}
                        >
                          <Eye size={15} />
                          View Profile
                        </button>

                        <button
                          className="sm-delete-button"
                          disabled={deleting}
                          onClick={() => confirmDeleteStudent(student)}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>

                      </div>
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

      {studentToDelete && (
        <DeleteStudentDialog
          student={studentToDelete}
          deleting={deleting}
          onCancel={() => setStudentToDelete(null)}
          onConfirm={handleDeleteStudent}
        />
      )}

    </div>
  );
}


// ==========================================
// DELETE STUDENT CONFIRMATION DIALOG
// ==========================================

function DeleteStudentDialog({
  student,
  deleting,
  onCancel,
  onConfirm
}) {
  return (
    <div
      className="sm-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) {
          onCancel();
        }
      }}
    >
      <div
        className="sm-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-delete-title"
      >

        <div className="sm-delete-modal-icon">
          <AlertTriangle size={27} />
        </div>

        <button
          className="sm-modal-close"
          onClick={onCancel}
          disabled={deleting}
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>

        <h2 id="sm-delete-title">Delete Student Account?</h2>

        <p className="sm-delete-description">
          You are about to permanently delete the following student
          account.
        </p>

        <div className="sm-delete-student-info">
          <div className="sm-avatar">
            {student.full_name
              ?.trim()
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join("") || "ST"}
          </div>

          <div>
            <strong>{student.full_name}</strong>
            <span>{student.email}</span>
          </div>
        </div>

        <div className="sm-delete-warning">
          <AlertTriangle size={17} />

          <span>
            This action cannot be undone. Associated resumes, ATS
            reports, extracted skills, and learning progress will
            also be deleted.
          </span>
        </div>

        <div className="sm-delete-modal-actions">

          <button
            className="sm-cancel-button"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancel
          </button>

          <button
            className="sm-confirm-delete-button"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <RefreshCw size={16} className="sm-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Permanently Delete
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}

export default Students;
