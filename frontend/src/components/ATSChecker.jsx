
import { useCallback, useEffect, useState } from "react";

import {
  Target,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  BriefcaseBusiness
} from "lucide-react";

import api from "../services/api";
import ATSReport from "./ATSReport";

function ATSChecker({ mode = "student", resumeId = null }) {
  const isAdmin = mode === "admin";

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(
    resumeId ? String(resumeId) : ""
  );

  const [jobRoles, setJobRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==========================================
  // LOAD RESUMES AND JOB ROLES
  // ==========================================

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const roleResponse = await api.get("/job-roles/");

      const roles = Array.isArray(roleResponse.data?.job_roles)
        ? roleResponse.data.job_roles
        : [];

      setJobRoles(roles);

      if (isAdmin) {
        if (resumeId) {
          setSelectedResume(String(resumeId));
        }
      } else {
        const resumeResponse = await api.get("/resumes/my-resumes");

        const resumeList = Array.isArray(resumeResponse.data?.resumes)
          ? resumeResponse.data.resumes
          : [];

        const formattedResumes = resumeList.map((resume) => ({
          ...resume,
          resume_id: resume.id ?? resume.resume_id
        }));

        setResumes(formattedResumes);

        setSelectedResume((previous) => {
          const stillExists = formattedResumes.some(
            (resume) => String(resume.resume_id) === previous
          );

          if (stillExists) return previous;

          return formattedResumes.length
            ? String(formattedResumes[0].resume_id)
            : "";
        });
      }

      setSelectedRole((previous) => {
        const stillExists = roles.some(
          (role) => String(role.id ?? role.job_role_id) === previous
        );

        if (stillExists) return previous;

        return roles.length
          ? String(roles[0].id ?? roles[0].job_role_id)
          : "";
      });

    } catch (err) {
      console.error("ATS INITIAL DATA ERROR:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load resumes or job roles."
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin, resumeId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ==========================================
  // ANALYSE RESUME
  // ==========================================

  const handleAnalyze = async () => {
    if (!selectedResume || !selectedRole) {
      setError("Please select a resume and job role.");
      return;
    }

    try {
      setAnalyzing(true);
      setError("");
      setMessage("");
      setReport(null);

      const endpoint = isAdmin
        ? "/ats/admin/analyze"
        : "/ats/analyze";

      const response = await api.post(endpoint, {
        resume_id: Number(selectedResume),
        job_role_id: Number(selectedRole)
      });

      const analysisReport = response.data?.analysis_report
        ? response.data.analysis_report
        : response.data;

      setReport(analysisReport);

      setMessage("ATS analysis completed and saved successfully.");

      requestAnimationFrame(() => {
        document
          .getElementById("ats-report-display")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
      });

    } catch (err) {
      console.error("ATS ANALYSIS ERROR:", err);

      setError(
        err.response?.data?.detail ||
        "ATS analysis failed. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="ats-loading">
        <Loader2 size={19} className="ats-spin" />
        Loading ATS checker...
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className={`ats-checker ${isAdmin ? "admin-ats-checker" : ""}`}>

      {/* HEADER */}

      <div className="ats-checker-heading">
        <div>
          <span className="ats-eyebrow">
            {isAdmin ? "ADMINISTRATION / ANALYSIS" : "RESUME OPTIMIZATION"}
          </span>

          <h2>
            <Target size={20} />
            {isAdmin ? "Analyse Student Resume" : "ATS Resume Checker"}
          </h2>

          <p>
            {isAdmin
              ? "Evaluate the selected student's resume against a target job role."
              : "Compare your existing resume with a selected job role."}
          </p>
        </div>

        <button
          type="button"
          className="ats-refresh-button"
          onClick={fetchInitialData}
          disabled={analyzing}
          title="Refresh"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="ats-message ats-error" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {message && (
        <div className="ats-message ats-success" role="status">
          <CheckCircle size={16} />
          {message}
        </div>
      )}

      {/* STUDENT RESUME SELECTION */}

      {!isAdmin && (
        <section className="ats-selection-card">
          <h3>
            <FileText size={18} />
            Select Your Resume
          </h3>

          <div className="ats-form-group">
            <label htmlFor="ats-resume">
              Existing Resume
            </label>

            <select
              id="ats-resume"
              value={selectedResume}
              onChange={(event) => {
                setSelectedResume(event.target.value);
                setReport(null);
                setMessage("");
                setError("");
              }}
            >
              {resumes.length === 0 && (
                <option value="">
                  No uploaded resumes found
                </option>
              )}

              {resumes.map((resume) => (
                <option
                  key={resume.resume_id}
                  value={resume.resume_id}
                >
                  {resume.file_name} (#{resume.resume_id})
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* JOB ROLE SELECTION */}

      <section className="ats-selection-card ats-analysis-card">

        <div className="ats-analysis-card-heading">
          <div className="ats-analysis-icon">
            <BriefcaseBusiness size={21} />
          </div>

          <div>
            <h3>
              {isAdmin ? "Configure ATS Analysis" : "Select Target Job Role"}
            </h3>

            <p>
              {isAdmin
                ? "Choose the job role you want to evaluate the selected student's resume against."
                : "Choose the job role you want your resume to match."}
            </p>
          </div>
        </div>

        <div className="ats-form-group">
          <label htmlFor="ats-job-role">
            Target Job Role
          </label>

          <select
            id="ats-job-role"
            value={selectedRole}
            onChange={(event) => {
              setSelectedRole(event.target.value);
              setReport(null);
              setMessage("");
              setError("");
            }}
          >
            {jobRoles.length === 0 && (
              <option value="">
                No job roles available
              </option>
            )}

            {jobRoles.map((role) => {
              const id = role.id ?? role.job_role_id;

              return (
                <option key={id} value={id}>
                  {role.role_name || role.role || "Job Role"}
                </option>
              );
            })}
          </select>
        </div>

        <button
          type="button"
          className="ats-analyze-button"
          onClick={handleAnalyze}
          disabled={
            analyzing ||
            !selectedResume ||
            !selectedRole ||
            (!isAdmin && resumes.length === 0) ||
            (isAdmin && !resumeId)
          }
        >
          {analyzing ? (
            <>
              <Loader2 size={17} className="ats-spin" />
              Analysing Resume...
            </>
          ) : (
            <>
              <Target size={17} />
              Analyse Resume
            </>
          )}
        </button>

        <p className="ats-form-note">
          <FileText size={14} />
          {isAdmin
            ? "The selected student's existing uploaded resume will be analysed. No duplicate upload is required."
            : "Your existing uploaded resume will be analysed. No duplicate upload is required."}
        </p>

      </section>

      {/* GENERATED ATS REPORT */}

      {report && (
        <div
          className="ats-result-section"
          id="ats-report-display"
        >
          <ATSReport report={report} />
        </div>
      )}

    </div>
  );
}

export default ATSChecker;
