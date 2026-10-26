
import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Download,
  Eye,
  ArrowLeft,
  User,
  Calendar,
  GraduationCap,
  Code,
  RefreshCw,
  X,
  AlertCircle,
  Trash2
} from "lucide-react";

import api from "../../services/api";

function AdminResumes() {
  const [resumes, setResumes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedResume, setSelectedResume] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ==========================================
  // FETCH ALL STUDENT RESUMES
  // ==========================================

  const fetchResumes = async (searchValue = search) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/resumes", {
        params: { search: searchValue }
      });

      setResumes(response.data.resumes || []);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load student resumes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes("");
  }, []);

  // ==========================================
  // SEARCH RESUMES
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault();
    fetchResumes(search);
  };

  // ==========================================
  // VIEW RESUME DETAILS
  // ==========================================

  const handleViewResume = async (resumeId) => {
    try {
      setDetailsLoading(true);
      setError("");
      setSelectedResume(null);

      const response = await api.get(
        `/admin/resumes/${resumeId}`
      );

      setSelectedResume(response.data);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load resume details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // DOWNLOAD RESUME PDF
  // ==========================================

  const handleDownload = async (resume) => {
    try {
      setDownloadingId(resume.id);
      setError("");
      setSuccess("");

      const response = await api.get(
        `/admin/resumes/${resume.id}/download`,
        {
          responseType: "blob"
        }
      );

      const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/pdf"
        })
      );

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = resume.file_name || "student_resume.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Revoke after the browser has had time to start the download.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

    } catch (err) {
      setError("Unable to download this resume.");
    } finally {
      setDownloadingId(null);
    }
  };

  // ==========================================
  // DELETE RESUME
  // ==========================================

  const handleDelete = async (resume) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${resume.file_name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(resume.id);
      setError("");
      setSuccess("");

      await api.delete(`/admin/resumes/${resume.id}`);

      // Remove the deleted resume from the displayed list.
      setResumes((previousResumes) =>
        previousResumes.filter(
          (item) => item.id !== resume.id
        )
      );

      // Close the details page if this resume is currently open.
      if (selectedResume?.id === resume.id) {
        setSelectedResume(null);
      }

      setSuccess("Resume deleted successfully.");

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete this resume."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // ==========================================
  // RESUME DETAILS PAGE
  // ==========================================

  if (selectedResume) {
    return (
      <div className="ar-page">

        <button
          className="ar-back-button"
          onClick={() => setSelectedResume(null)}
        >
          <ArrowLeft size={17} />
          Back to Resumes
        </button>

        <div className="ar-heading">
          <div>
            <span className="ar-eyebrow">
              ADMINISTRATION / RESUME DETAILS
            </span>

            <h1>Resume Details</h1>

            <p>
              Review student information and extracted skills.
            </p>
          </div>

          <div className="ar-detail-actions">

            <button
              className="ar-download-button"
              onClick={() =>
                handleDownload({
                  id: selectedResume.id,
                  file_name: selectedResume.file_name
                })
              }
              disabled={
                downloadingId === selectedResume.id ||
                deletingId === selectedResume.id
              }
            >
              <Download size={17} />

              {downloadingId === selectedResume.id
                ? "Downloading..."
                : "Download PDF"}
            </button>

            <button
              className="ar-delete-button"
              onClick={() =>
                handleDelete({
                  id: selectedResume.id,
                  file_name: selectedResume.file_name
                })
              }
              disabled={
                deletingId === selectedResume.id ||
                downloadingId === selectedResume.id
              }
            >
              <Trash2 size={17} />

              {deletingId === selectedResume.id
                ? "Deleting..."
                : "Delete Resume"}
            </button>

          </div>
        </div>

        {error && (
          <div className="ar-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="ar-success">
            {success}
          </div>
        )}

        <div className="ar-detail-grid">

          {/* STUDENT INFORMATION */}

          <section className="ar-panel">

            <div className="ar-panel-title">
              <User size={19} />
              Student Information
            </div>

            <div className="ar-profile">

              <div className="ar-avatar">
                {selectedResume.student?.full_name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>

              <div>
                <h2>
                  {selectedResume.student?.full_name}
                </h2>

                <p>
                  {selectedResume.student?.email}
                </p>
              </div>

            </div>

            <div className="ar-info-list">

              <div>
                <GraduationCap size={17} />
                <span>College</span>

                <strong>
                  {selectedResume.student?.college ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <FileText size={17} />
                <span>Degree</span>

                <strong>
                  {selectedResume.student?.degree ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <Code size={17} />
                <span>Branch</span>

                <strong>
                  {selectedResume.student?.branch ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <Calendar size={17} />
                <span>Graduation</span>

                <strong>
                  {selectedResume.student?.graduation_year ||
                    "Not provided"}
                </strong>
              </div>

            </div>

          </section>

          {/* RESUME INFORMATION */}

          <section className="ar-panel">

            <div className="ar-panel-title">
              <FileText size={19} />
              Resume Information
            </div>

            <div className="ar-file-card">

              <FileText size={30} />

              <div>
                <strong>
                  {selectedResume.file_name}
                </strong>

                <p>PDF Document</p>
              </div>

            </div>

            <div className="ar-upload-date">
              <Calendar size={17} />

              Uploaded: {formatDate(selectedResume.uploaded_at)}
            </div>

            <div className="ar-skill-heading">
              <Code size={18} />

              Extracted Skills (
                {selectedResume.skills?.length || 0}
              )
            </div>

            <div className="ar-skills">

              {selectedResume.skills?.length > 0 ? (

                selectedResume.skills.map((skill, index) => (
                  <span
                    className="ar-skill-tag"
                    key={index}
                  >
                    {skill.skill_name}
                  </span>
                ))

              ) : (

                <p>No extracted skills available.</p>

              )}

            </div>

          </section>

        </div>

        {/* EXTRACTED RESUME TEXT */}

        <section className="ar-panel ar-text-panel">

          <div className="ar-panel-title">
            <FileText size={19} />
            Extracted Resume Text
          </div>

          <pre className="ar-extracted-text">
            {selectedResume.extracted_text ||
              "No extracted text available."}
          </pre>

        </section>

      </div>
    );
  }

  // ==========================================
  // RESUME MANAGEMENT MAIN PAGE
  // ==========================================

  return (
    <div className="ar-page">

      {/* PAGE HEADING */}

      <div className="ar-heading">

        <div>
          <span className="ar-eyebrow">
            ADMINISTRATION / MANAGEMENT
          </span>

          <h1>Resume Management</h1>

          <p>
            View, search and manage resumes uploaded by students.
          </p>
        </div>

        <button
          className="ar-refresh-button"
          onClick={() => fetchResumes(search)}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>

      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="ar-success">
          {success}
        </div>
      )}

      {/* SUMMARY CARD */}

      <div className="ar-summary">

        <div className="ar-summary-icon">
          <FileText size={24} />
        </div>

        <div>
          <span>Total Student Resumes</span>

          <h2>{resumes.length}</h2>

          <p>Uploaded student documents</p>
        </div>

      </div>

      {/* SEARCH FORM */}

      <form
        className="ar-search-form"
        onSubmit={handleSearch}
      >

        <div className="ar-search-input">

          <Search size={19} />

          <input
            type="text"
            placeholder="Search student name, email or filename..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchResumes("");
              }}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}

        </div>

        <button
          type="submit"
          className="ar-search-button"
        >
          Search
        </button>

      </form>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="ar-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* RESUME TABLE */}

      <section className="ar-table-panel">

        <div className="ar-table-heading">

          <div>
            <h2>Student Resumes</h2>

            <p>
              Resume documents uploaded by registered students.
            </p>
          </div>

          <span>
            {resumes.length} resumes
          </span>

        </div>

        {loading ? (

          <div className="ar-state">

            <RefreshCw
              className="ar-spinner"
              size={25}
            />

            <p>Loading student resumes...</p>

          </div>

        ) : resumes.length === 0 ? (

          <div className="ar-state">

            <FileText size={35} />

            <h3>No resumes found</h3>

            <p>
              There are no student resumes matching your search.
            </p>

          </div>

        ) : (

          <div className="ar-table-wrapper">

            <table className="ar-table">

              <thead>
                <tr>
                  <th>Resume</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Uploaded Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {resumes.map((resume) => (

                  <tr key={resume.id}>

                    {/* RESUME NAME */}

                    <td>
                      <div className="ar-resume-name">

                        <div className="ar-file-icon">
                          <FileText size={19} />
                        </div>

                        <span>{resume.file_name}</span>

                      </div>
                    </td>

                    {/* STUDENT */}

                    <td>
                      <strong>
                        {resume.student?.full_name}
                      </strong>
                    </td>

                    {/* EMAIL */}

                    <td>
                      {resume.student?.email}
                    </td>

                    {/* UPLOAD DATE */}

                    <td>
                      {formatDate(resume.uploaded_at)}
                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div className="ar-actions">

                        {/* VIEW BUTTON */}

                        <button
                          className="ar-view-action"
                          title="View details"
                          onClick={() =>
                            handleViewResume(resume.id)
                          }
                          disabled={deletingId === resume.id}
                        >
                          <Eye size={17} />
                        </button>

                        {/* DOWNLOAD BUTTON */}

                        <button
                          className="ar-download-action"
                          title="Download PDF"
                          onClick={() =>
                            handleDownload(resume)
                          }
                          disabled={
                            downloadingId === resume.id ||
                            deletingId === resume.id
                          }
                        >
                          <Download size={17} />
                        </button>

                        {/* DELETE BUTTON */}

                        <button
                          className="ar-delete-action"
                          title="Delete resume"
                          onClick={() =>
                            handleDelete(resume)
                          }
                          disabled={
                            deletingId === resume.id ||
                            downloadingId === resume.id
                          }
                        >
                          {deletingId === resume.id ? (
                            <RefreshCw
                              className="ar-spinner"
                              size={17}
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* DETAILS LOADING OVERLAY */}

      {detailsLoading && (
        <div className="ar-loading-overlay">

          <div className="ar-loading-box">

            <RefreshCw
              className="ar-spinner"
              size={25}
            />

            <p>Loading resume details...</p>

          </div>

        </div>
      )}

    </div>
  );
}

export default AdminResumes;
