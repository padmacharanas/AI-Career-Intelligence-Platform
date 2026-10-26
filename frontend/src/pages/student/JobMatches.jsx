
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  BriefcaseBusiness,
  Award,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Search,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";

import api from "../../services/api";

function JobMatches() {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [jobRoles, setJobRoles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] =
    useState(false);
  const [recommendationsLoaded, setRecommendationsLoaded] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ROLE HELPERS

  const getRoleName = (job) =>
    job.role_name || job.role || job.job_title || "Job Role";

  const getRoleId = (job, index) =>
    job.job_role_id ?? job.id ?? `${getRoleName(job)}-${index}`;

  const getMatchColor = (percentage) => {
    if (percentage >= 80) return "#169b76";
    if (percentage >= 50) return "#e69b36";
    return "#df6485";
  };

  const getMatchLabel = (percentage) => {
    if (percentage >= 80) return "Strong Skill Match";
    if (percentage >= 50) return "Moderate Skill Match";
    return "Develop More Skills";
  };

  // 1. FETCH RESUMES AND JOB ROLES

  const fetchResumesAndRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const [resumeResponse, roleResponse] = await Promise.all([
        api.get("/resumes/my-resumes"),
        api.get("/job-roles/"),
      ]);

      const resumeList = Array.isArray(resumeResponse.data?.resumes)
        ? resumeResponse.data.resumes
        : [];

      const roleList = Array.isArray(roleResponse.data?.job_roles)
        ? roleResponse.data.job_roles
        : [];

      const formattedResumes = resumeList.map((resume) => ({
        ...resume,
        resume_id: resume.id ?? resume.resume_id,
      }));

      setResumes(formattedResumes);
      setJobRoles(roleList);

      setSelectedResume((previous) => {
        const exists = formattedResumes.some(
          (resume) => String(resume.resume_id) === previous
        );

        if (exists) return previous;

        return formattedResumes.length
          ? String(formattedResumes[0].resume_id)
          : "";
      });

      if (!formattedResumes.length) {
        setSelectedResume("");
        setMatches([]);
        setRecommendations([]);
        setRecommendationsLoaded(false);
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load resumes and job roles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. ANALYSE JOB MATCHES

  const fetchMatches = useCallback(async (resumeId) => {
    if (!resumeId) {
      setError("Please select a resume first.");
      return;
    }

    try {
      setMatching(true);
      setError("");
      setMessage("");

      setMatches([]);
      setRecommendations([]);
      setRecommendationsLoaded(false);

      const skillResponse = await api.get(
        `/resumes/${resumeId}/skills`
      );

      const skills = Array.isArray(skillResponse.data?.skills)
        ? skillResponse.data.skills
        : [];

      if (!skills.length) {
        setError(
          "No extracted skills found. Please extract skills from My Resumes first."
        );
        return;
      }

      const response = await api.get(
        `/job-roles/match/${resumeId}`
      );

      const matchData = Array.isArray(response.data?.job_matches)
        ? response.data.job_matches
        : [];

      setMatches(matchData);

      setMessage(
        matchData.length
          ? `Successfully analysed ${
              response.data.total_roles_analyzed ?? matchData.length
            } job roles!`
          : "Analysis completed, but no job matches were returned."
      );
    } catch (err) {
      console.error("JOB MATCH ERROR:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to calculate job matches. Please try again."
      );
    } finally {
      setMatching(false);
    }
  }, []);

  // 3. FETCH LEARNING RECOMMENDATIONS

  const fetchRecommendations = async () => {
    if (!selectedResume) {
      setError("Please select a resume first.");
      return;
    }

    try {
      setLoadingRecommendations(true);
      setRecommendationsLoaded(false);
      setError("");
      setMessage("");
      setRecommendations([]);

      const response = await api.get(
        `/job-roles/recommendations/${selectedResume}`
      );

      console.log(
        "RECOMMENDATIONS DATA:",
        JSON.stringify(response.data, null, 2)
      );

      const data = Array.isArray(
        response.data?.learning_recommendations
      )
        ? response.data.learning_recommendations
        : [];

      setRecommendations(data);
      setRecommendationsLoaded(true);

      const rolesWithMissingSkills = data.filter(
        (role) =>
          Array.isArray(role.missing_skills) &&
          role.missing_skills.length > 0
      ).length;

      setMessage(
        `Recommendations loaded successfully! ${data.length} job roles analysed, ${rolesWithMissingSkills} roles have skills to learn.`
      );
    } catch (err) {
      console.error("RECOMMENDATIONS ERROR:", err);
      console.error("ERROR RESPONSE:", err.response?.data);

      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to load learning recommendations."
      );
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // 4. INITIAL PAGE LOADING

  useEffect(() => {
    fetchResumesAndRoles();
  }, [fetchResumesAndRoles]);

  // 5. RESUME SELECTION

  const handleResumeChange = (event) => {
    setSelectedResume(event.target.value);
    setMatches([]);
    setRecommendations([]);
    setRecommendationsLoaded(false);
    setError("");
    setMessage("");
    setSearchTerm("");
    setFilter("all");
  };

  // 6. ANALYSE BUTTON

  const handleAnalyze = () => {
    fetchMatches(selectedResume);
  };

  // 7. SEARCH AND FILTER

  const filteredMatches = useMemo(() => {
    return matches.filter((job) => {
      const roleName = getRoleName(job);

      const matchesSearch = roleName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const percentage = Number(job.match_percentage) || 0;

      const matchesFilter =
        filter === "all" ||
        (filter === "strong" && percentage >= 80) ||
        (filter === "moderate" &&
          percentage >= 50 &&
          percentage < 80) ||
        (filter === "develop" && percentage < 50);

      return matchesSearch && matchesFilter;
    });
  }, [matches, searchTerm, filter]);

  // 8. STATISTICS

  const averageMatch = useMemo(() => {
    if (!matches.length) return 0;

    const total = matches.reduce(
      (sum, job) => sum + (Number(job.match_percentage) || 0),
      0
    );

    return Math.round(total / matches.length);
  }, [matches]);

  const strongMatches = useMemo(
    () =>
      matches.filter(
        (job) => Number(job.match_percentage) >= 80
      ).length,
    [matches]
  );

  // 9. LOADING SCREEN

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="loading">
          Loading career opportunities...
        </div>
      </div>
    );
  }

  // 10. MAIN PAGE

  return (
    <div className="dashboard-content">

      {/* PAGE HEADING */}

      <section className="welcome-section">
        <div>
          <h1>Job Matches</h1>
          <p>
            Discover career opportunities based on your resume skills.
          </p>
        </div>

        <button
          className="icon-button"
          onClick={fetchResumesAndRoles}
          title="Refresh"
          disabled={loading}
        >
          <RefreshCw size={18} />
        </button>
      </section>

      {/* NOTIFICATIONS */}

      {error && (
        <div className="error-message" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="success-message" role="status">
          <CheckCircle size={17} />
          <span>{message}</span>
        </div>
      )}

      {/* RESUME SELECTION */}

      <section className="panel" style={{ marginBottom: "20px" }}>
        <div className="panel-heading">
          <h3>
            <FileText
              size={18}
              style={{
                marginRight: "8px",
                verticalAlign: "middle",
              }}
            />
            Select Resume for Analysis
          </h3>
        </div>

        {resumes.length > 0 ? (
          <>
            <p style={{ fontSize: "13px", color: "#737d91" }}>
              Choose a resume to compare with available job roles.
            </p>

            <select
              value={selectedResume}
              onChange={handleResumeChange}
              style={{
                width: "100%",
                maxWidth: "450px",
                padding: "12px",
                marginTop: "12px",
                border: "1px solid #dfe3eb",
                borderRadius: "8px",
                background: "#fff",
                fontSize: "13px",
              }}
            >
              {resumes.map((resume) => (
                <option
                  key={resume.resume_id}
                  value={resume.resume_id}
                >
                  {resume.file_name} (Resume #{resume.resume_id})
                </option>
              ))}
            </select>

            <div style={{ marginTop: "15px" }}>
              <button
                className="primary-button"
                onClick={handleAnalyze}
                disabled={!selectedResume || matching}
              >
                <Target size={16} />
                {matching
                  ? "Analysing..."
                  : "Analyse Job Matches"}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <FileText size={35} color="#929bad" />
            <p>You haven't uploaded a resume yet.</p>

            <button
              className="primary-button"
              style={{ marginTop: "12px" }}
              onClick={() => navigate("/student/resumes")}
            >
              Upload Resume
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </section>

      {/* MATCH STATISTICS */}

      <section className="stats-grid">
        <div className="panel">
          <Target size={22} color="#6658df" />
          <h2 style={{ marginTop: "10px" }}>
            {matches.length}
          </h2>
          <p>Roles Analysed</p>
        </div>

        <div className="panel">
          <TrendingUp size={22} color="#169b76" />
          <h2 style={{ marginTop: "10px" }}>
            {averageMatch}%
          </h2>
          <p>Average Match</p>
        </div>

        <div className="panel">
          <Award size={22} color="#e69b36" />
          <h2 style={{ marginTop: "10px" }}>
            {strongMatches}
          </h2>
          <p>Strong Matches</p>
        </div>

        <div className="panel">
          <BriefcaseBusiness size={22} color="#df6485" />
          <h2 style={{ marginTop: "10px" }}>
            {jobRoles.length}
          </h2>
          <p>Available Roles</p>
        </div>
      </section>

      {/* JOB MATCH RESULTS */}

      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="panel-heading">
          <h3>Career Opportunities</h3>
          <span>{matches.length} matches</span>
        </div>

        {matches.length > 0 ? (
          <>
            {/* SEARCH AND FILTER */}

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid #dfe3eb",
                  borderRadius: "8px",
                  padding: "0 12px",
                  flex: 1,
                  minWidth: "180px",
                }}
              >
                <Search size={16} color="#929bad" />

                <input
                  type="text"
                  placeholder="Search job roles..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  style={{
                    border: "none",
                    outline: "none",
                    padding: "11px 0",
                    width: "100%",
                  }}
                />
              </div>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                style={{
                  padding: "10px",
                  border: "1px solid #dfe3eb",
                  borderRadius: "8px",
                  background: "#fff",
                }}
              >
                <option value="all">All Matches</option>
                <option value="strong">Strong (80%+)</option>
                <option value="moderate">
                  Moderate (50–79%)
                </option>
                <option value="develop">
                  Needs Improvement
                </option>
              </select>
            </div>

            {/* MATCH CARDS */}

            {filteredMatches.length > 0 ? (
              filteredMatches.map((job, index) => {
                const percentage = Math.min(
                  100,
                  Math.max(
                    0,
                    Number(job.match_percentage) || 0
                  )
                );

                const color = getMatchColor(percentage);

                const matchedSkills = Array.isArray(
                  job.matched_skills
                )
                  ? job.matched_skills
                  : [];

                const missingSkills = Array.isArray(
                  job.missing_skills
                )
                  ? job.missing_skills
                  : [];

                return (
                  <div
                    key={getRoleId(job, index)}
                    style={{
                      border: "1px solid #e9eaf0",
                      borderRadius: "12px",
                      padding: "18px",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h3>{getRoleName(job)}</h3>

                        <p
                          style={{
                            fontSize: "12px",
                            color: "#929bad",
                            marginTop: "5px",
                          }}
                        >
                          {job.category || "Career Opportunity"}
                        </p>

                        {job.description && (
                          <p
                            style={{
                              fontSize: "13px",
                              marginTop: "8px",
                            }}
                          >
                            {job.description}
                          </p>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <h2 style={{ color }}>
                          {percentage}%
                        </h2>

                        <span
                          style={{
                            fontSize: "11px",
                            color,
                            fontWeight: 600,
                          }}
                        >
                          {getMatchLabel(percentage)}
                        </span>
                      </div>
                    </div>

                    <div
                      className="progress-track"
                      style={{ marginTop: "16px" }}
                    >
                      <div
                        className="progress-fill"
                        style={{
                          width: `${percentage}%`,
                          background: color,
                        }}
                      />
                    </div>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "#737d91",
                        marginTop: "8px",
                      }}
                    >
                      {job.total_matched_skills ??
                        matchedSkills.length}{" "}
                      of{" "}
                      {job.total_required_skills ??
                        matchedSkills.length +
                          missingSkills.length}{" "}
                      required skills matched
                    </p>

                    {/* MATCHED SKILLS */}

                    <div style={{ marginTop: "18px" }}>
                      <strong style={{ fontSize: "13px" }}>
                        <CheckCircle
                          size={14}
                          color="#169b76"
                          style={{
                            marginRight: "6px",
                            verticalAlign: "middle",
                          }}
                        />
                        Matched Skills ({matchedSkills.length})
                      </strong>

                      <div
                        className="skill-list"
                        style={{ marginTop: "10px" }}
                      >
                        {matchedSkills.length > 0 ? (
                          matchedSkills.map(
                            (skill, skillIndex) => (
                              <span
                                className="skill-tag"
                                key={`${skill}-${skillIndex}`}
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#929bad",
                            }}
                          >
                            No matching skills identified.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* MISSING SKILLS */}

                    <div style={{ marginTop: "18px" }}>
                      <strong style={{ fontSize: "13px" }}>
                        <BookOpen
                          size={14}
                          color="#e69b36"
                          style={{
                            marginRight: "6px",
                            verticalAlign: "middle",
                          }}
                        />
                        Skills to Learn ({missingSkills.length})
                      </strong>

                      <div
                        className="skill-list"
                        style={{ marginTop: "10px" }}
                      >
                        {missingSkills.length > 0 ? (
                          missingSkills.map(
                            (skill, skillIndex) => (
                              <span
                                key={`${skill}-${skillIndex}`}
                                className="skill-tag"
                                style={{
                                  background: "#fff5e9",
                                  color: "#bd7a20",
                                }}
                              >
                                {skill}
                              </span>
                            )
                          )
                        ) : (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#169b76",
                            }}
                          >
                            All required skills matched!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                No job roles match your search or selected filter.
              </div>
            )}

            {/* RECOMMENDATIONS BUTTON */}

            <button
              className="primary-button"
              onClick={fetchRecommendations}
              disabled={
                loadingRecommendations ||
                matching ||
                !selectedResume
              }
              style={{ marginTop: "10px" }}
            >
              <Sparkles size={16} />

              {loadingRecommendations
                ? "Loading Recommendations..."
                : "Get Learning Recommendations"}
            </button>
          </>
        ) : matching ? (
          <div className="loading">
            Analysing your resume skills...
          </div>
        ) : (
          <div className="empty-state">
            <Target
              size={38}
              color="#929bad"
              style={{ marginBottom: "10px" }}
            />

            <p>No job matches calculated yet.</p>

            <p
              style={{
                fontSize: "12px",
                marginTop: "5px",
              }}
            >
              Select a resume and click Analyse Job Matches.
            </p>
          </div>
        )}
      </section>

      {/* LEARNING RECOMMENDATIONS */}

      {recommendationsLoaded && (
        <section className="panel learning-panel">
          <div className="panel-heading">
            <h3>
              <Sparkles
                size={18}
                style={{
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              />
              Learning Recommendations
            </h3>

            <span>{recommendations.length} job roles</span>
          </div>

          {recommendations.length === 0 ? (
            <div className="empty-state">
              No learning recommendations were returned by the server.
            </div>
          ) : (
            <div className="learning-role-list">
              {recommendations.map((role, index) => {
                const skillRecommendations = Array.isArray(
                  role.learning_recommendations
                )
                  ? role.learning_recommendations
                  : [];

                const missingSkills = Array.isArray(
                  role.missing_skills
                )
                  ? role.missing_skills
                  : [];

                const percentage =
                  Number(role.match_percentage) || 0;

                return (
                  <article
                    className="learning-role-card"
                    key={getRoleId(role, index)}
                  >
                    <div className="learning-role-header">
                      <div>
                        <h4>{getRoleName(role)}</h4>

                        <p>
                          {missingSkills.length} skills to learn
                        </p>
                      </div>

                      <div className="learning-match">
                        <strong>{percentage}%</strong>
                        <span>Current match</span>
                      </div>
                    </div>

                    {missingSkills.length === 0 ? (
                      <div className="learning-complete">
                        <CheckCircle size={18} />

                        <span>
                          Excellent! No missing skills for this role.
                        </span>
                      </div>
                    ) : skillRecommendations.length > 0 ? (
                      <div className="learning-skills-grid">
                        {skillRecommendations.map(
                          (item, itemIndex) => {
                            const resources = Array.isArray(
                              item.resources
                            )
                              ? item.resources
                              : [];

                            return (
                              <div
                                className="learning-skill-card"
                                key={`${item.skill || "skill"}-${itemIndex}`}
                              >
                                <div className="learning-skill-title">
                                  <BookOpen size={18} />

                                  <h5>
                                    {item.skill || "Learning skill"}
                                  </h5>
                                </div>

                                <p className="learning-description">
                                  {item.description ||
                                    `Learn the fundamentals of ${item.skill}.`}
                                </p>

                                {resources.length > 0 ? (
                                  <div className="learning-resources">
                                    {resources.map(
                                      (resource, resourceIndex) => (
                                        <a
                                          key={`${
                                            resource.url ||
                                            resource.name
                                          }-${resourceIndex}`}
                                          className="learning-resource-link"
                                          href={
                                            resource.url || undefined
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(event) => {
                                            if (!resource.url) {
                                              event.preventDefault();
                                            }
                                          }}
                                        >
                                          <span>
                                            {resource.name ||
                                              "Learning resource"}

                                            {resource.platform && (
                                              <small>
                                                {resource.platform}
                                              </small>
                                            )}
                                          </span>

                                          {resource.url && (
                                            <ExternalLink size={15} />
                                          )}
                                        </a>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="learning-no-resource">
                                    No curated learning link is
                                    available yet.
                                  </p>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="learning-no-resource">
                        No individual learning recommendations are
                        available for this role yet.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* RECOMMENDATIONS LOADING */}

      {loadingRecommendations && (
        <div className="panel" style={{ marginTop: "20px" }}>
          <div className="loading">
            Generating personalized learning recommendations...
          </div>
        </div>
      )}
    </div>
  );
}

export default JobMatches;
