
import React, { useCallback, useEffect, useState } from "react";
import {
  FileText,
  Upload,
  Eye,
  Trash2,
  Brain,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import api from "../../services/api";

function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extractingId, setExtractingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [previewResume, setPreviewResume] = useState(null);

  // Display messages
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  // Fetch uploaded resumes
  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/resumes/my-resumes");
      const resumeList = response.data.resumes || [];

      setResumes(
        resumeList.map((resume) => ({
          ...resume,
          resume_id: resume.id ?? resume.resume_id,
        }))
      );
    } catch (error) {
      console.error("Fetch resumes error:", error);

      showMessage(
        error.response?.data?.detail || "Failed to load resumes.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Select PDF file
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    setMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showMessage("Only PDF files are allowed.", "error");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage("File size must not exceed 5 MB.", "error");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Upload resume and automatically extract skills
  const handleUpload = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!selectedFile) {
      showMessage("Please select a PDF file first.", "error");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResponse = await api.post(
        "/resumes/upload",
        formData
      );

      const resumeId = uploadResponse.data.resume_id;

      if (!resumeId) {
        throw new Error(
          "Resume uploaded, but the resume ID was not returned."
        );
      }

      const skillsResponse = await api.post(
        `/resumes/${resumeId}/extract-skills`
      );

      const totalSkills = skillsResponse.data.total_skills ?? 0;

      setSelectedFile(null);

      const fileInput = document.getElementById("resume-file-input");

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchResumes();

      showMessage(
        `Resume uploaded successfully! ${totalSkills} skills extracted.`,
        "success"
      );
    } catch (error) {
      console.error("Resume upload/extraction error:", error);

      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Something went wrong while uploading the resume.";

      showMessage(errorMessage, "error");

      await fetchResumes();
    } finally {
      setUploading(false);
    }
  };

  // Manually extract skills again
  const handleExtractSkills = async (resumeId) => {
    try {
      setExtractingId(resumeId);
      setMessage("");

      const response = await api.post(
        `/resumes/${resumeId}/extract-skills`
      );

      const totalSkills = response.data.total_skills ?? 0;

      showMessage(
        `Successfully extracted ${totalSkills} skills.`,
        "success"
      );
    } catch (error) {
      console.error("Skill extraction error:", error);

      showMessage(
        error.response?.data?.detail || "Failed to extract skills.",
        "error"
      );
    } finally {
      setExtractingId(null);
    }
  };

  // View extracted resume text
  const handleViewResume = async (resumeId) => {
    try {
      setViewingId(resumeId);

      const response = await api.get(
        `/resumes/${resumeId}/text`
      );

      setPreviewResume(response.data);
    } catch (error) {
      console.error("View resume error:", error);

      showMessage(
        error.response?.data?.detail || "Failed to load resume.",
        "error"
      );
    } finally {
      setViewingId(null);
    }
  };

  // Delete resume
  const handleDeleteResume = async (resumeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(resumeId);
      setMessage("");

      await api.delete(`/resumes/${resumeId}`);

      setResumes((previousResumes) =>
        previousResumes.filter(
          (resume) => resume.resume_id !== resumeId
        )
      );

      showMessage("Resume deleted successfully.", "success");
    } catch (error) {
      console.error("Delete resume error:", error);

      showMessage(
        error.response?.data?.detail || "Failed to delete resume.",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Format upload date
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="resumes-page">
      {/* Page heading */}
      <div className="page-header">
        <div>
          <h1>My Resumes</h1>
          <p>
            Upload your resume and automatically identify your
            technical skills.
          </p>
        </div>

        <button
          className="secondary-btn"
          onClick={fetchResumes}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`resume-message ${
            messageType === "error" ? "error" : "success"
          }`}
        >
          {messageType === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle size={18} />
          )}

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Close message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload section */}
      <section className="resume-upload-card">
        <div className="section-heading">
          <div className="section-icon">
            <Upload size={22} />
          </div>

          <div>
            <h2>Upload Your Resume</h2>
            <p>Upload a PDF to extract your skills automatically.</p>
          </div>
        </div>

        <form onSubmit={handleUpload}>
          <label
            htmlFor="resume-file-input"
            className="resume-drop-area"
          >
            <FileText size={38} />

            <strong>
              {selectedFile
                ? selectedFile.name
                : "Choose your resume PDF"}
            </strong>

            <span>
              Click here to browse files (PDF, maximum 5 MB)
            </span>

            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              hidden
            />
          </label>

          {selectedFile && (
            <div className="selected-file">
              <FileText size={18} />
              <span>{selectedFile.name}</span>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);

                  const input = document.getElementById(
                    "resume-file-input"
                  );

                  if (input) input.value = "";
                }}
                disabled={uploading}
                aria-label="Remove selected file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <button
            type="submit"
            className="primary-btn upload-btn"
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="spin" />
                Uploading and extracting skills...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Resume
              </>
            )}
          </button>
        </form>

        <div className="upload-info">
          <Brain size={17} />
          <span>
            Skills are extracted automatically after a successful
            upload.
          </span>
        </div>
      </section>

      {/* Resume history */}
      <section className="resume-history-section">
        <div className="section-heading history-heading">
          <div>
            <h2>Resume History</h2>
            <p>
              {resumes.length}{" "}
              {resumes.length === 1 ? "resume" : "resumes"} uploaded
            </p>
          </div>
        </div>

        {loading ? (
          <div className="resume-loading">
            <Loader2 size={28} className="spin" />
            <p>Loading your resumes...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="resume-empty">
            <FileText size={42} />
            <h3>No resumes uploaded yet</h3>
            <p>Upload your first resume to get started.</p>
          </div>
        ) : (
          <div className="resume-list">
            {resumes.map((resume) => (
              <div
                className="resume-item"
                key={resume.resume_id}
              >
                <div className="resume-file-icon">
                  <FileText size={24} />
                </div>

                <div className="resume-details">
                  <h3>{resume.file_name}</h3>

                  <p>
                    Uploaded on {formatDate(resume.uploaded_at)}
                  </p>

                  <span className="resume-id">
                    Resume ID: {resume.resume_id}
                  </span>
                </div>

                <div className="resume-actions">
                  <button
                    type="button"
                    className="action-btn view-btn"
                    onClick={() =>
                      handleViewResume(resume.resume_id)
                    }
                    disabled={viewingId === resume.resume_id}
                    title="View extracted text"
                  >
                    {viewingId === resume.resume_id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Eye size={16} />
                    )}
                    View
                  </button>

                  <button
                    type="button"
                    className="action-btn extract-btn"
                    onClick={() =>
                      handleExtractSkills(resume.resume_id)
                    }
                    disabled={extractingId === resume.resume_id}
                    title="Extract skills again"
                  >
                    {extractingId === resume.resume_id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Brain size={16} />
                    )}
                    Extract Skills
                  </button>

                  <button
                    type="button"
                    className="action-btn delete-btn"
                    onClick={() =>
                      handleDeleteResume(resume.resume_id)
                    }
                    disabled={deletingId === resume.resume_id}
                    title="Delete resume"
                  >
                    {deletingId === resume.resume_id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Resume preview modal */}
      {previewResume && (
        <div
          className="resume-modal-overlay"
          onClick={() => setPreviewResume(null)}
        >
          <div
            className="resume-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="resume-modal-header">
              <div>
                <h2>Resume Preview</h2>
                <p>{previewResume.file_name}</p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewResume(null)}
                aria-label="Close preview"
              >
                <X size={22} />
              </button>
            </div>

            <div className="resume-modal-content">
              <pre>
                {previewResume.extracted_text ||
                  "No extracted text available."}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resumes;
