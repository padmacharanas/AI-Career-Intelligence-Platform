
import { useEffect, useState } from "react";
import {
  ScanSearch,
  FileText,
  UserRound,
  RefreshCw,
  AlertCircle
} from "lucide-react";

import api from "../../services/api";
import ATSChecker from "../../components/ATSChecker";

function AdminATSScore() {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/resumes");

      const resumeList = response.data?.resumes || [];

      setResumes(resumeList);

      setSelectedResumeId((previous) => {
        const stillExists = resumeList.some(
          (resume) => String(resume.id) === previous
        );

        if (stillExists) return previous;

        return resumeList.length
          ? String(resumeList[0].id)
          : "";
      });
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
    fetchResumes();
  }, []);

  const selectedResume = resumes.find(
    (resume) => String(resume.id) === selectedResumeId
  );

  return (
    <div className="admin-ats-page">
      <div className="page-header">
        <div>
          <span className="ats-eyebrow">
            ADMINISTRATION / ANALYSIS
          </span>

          <h1>ATS Score</h1>

          <p>
            Analyse resumes uploaded by students against available job roles.
          </p>
        </div>

        <button
          type="button"
          className="admin-ats-refresh-button"
          onClick={fetchResumes}
          disabled={loading}
          title="Refresh student resumes"
        >
          <RefreshCw
            size={17}
            className={loading ? "refresh-icon spinning" : "refresh-icon"}
          />

          <span>
            {loading ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {error && (
        <div className="ats-message ats-error" role="alert">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="ats-loading">
          <RefreshCw size={19} className="ats-spin" />
          Loading student resumes...
        </div>
      ) : resumes.length === 0 ? (
        <section className="ats-selection-card">
          <FileText size={28} />

          <h3>No student resumes available</h3>

          <p>
            Student resumes will appear here after they upload them.
          </p>
        </section>
      ) : (
        <>
          <section className="ats-selection-card">
            <h3>
              <UserRound size={18} />
              Select a Student Resume
            </h3>

            <div className="ats-form-group">
              <label htmlFor="admin-ats-resume">
                Student and Resume
              </label>

              <select
                id="admin-ats-resume"
                value={selectedResumeId}
                onChange={(event) =>
                  setSelectedResumeId(event.target.value)
                }
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.student?.full_name || "Student"} —{" "}
                    {resume.file_name} (#{resume.id})
                  </option>
                ))}
              </select>
            </div>

            {selectedResume && (
              <div className="admin-ats-student-info">
                <div>
                  <strong>
                    {selectedResume.student?.full_name || "Student"}
                  </strong>

                  <p>
                    {selectedResume.student?.email || "Email unavailable"}
                  </p>
                </div>

                <span>
                  {selectedResume.file_name}
                </span>
              </div>
            )}
          </section>

          {selectedResumeId && (
            <ATSChecker
              key={selectedResumeId}
              mode="admin"
              resumeId={Number(selectedResumeId)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default AdminATSScore;
