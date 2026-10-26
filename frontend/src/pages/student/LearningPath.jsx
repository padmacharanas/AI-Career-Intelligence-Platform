
import { useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  Target,
} from "lucide-react";

import api from "../../services/api";

// ==========================================
// RESOURCE MATCHING HELPERS
// ==========================================

// Normalize skill names so that variations in
// capitalization, spaces and hyphens do not prevent matching.
const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Get skill tags assigned by Admin to a resource.
const getResourceSkills = (resource) => {
  if (Array.isArray(resource.skills)) {
    return resource.skills;
  }

  if (typeof resource.skills === "string") {
    return resource.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

// Match admin resources using their assigned skill tags.
const getResourceMatches = (skill, resources) => {
  const skillName = normalizeText(skill.skill_name);

  if (!skillName || !Array.isArray(resources)) {
    return [];
  }

  return resources
    .filter((resource) => {
      if (!resource || !resource.url || !resource.title) {
        return false;
      }

      // Students should only see active resources.
      if (resource.is_active === false) {
        return false;
      }

      const assignedSkills = getResourceSkills(resource);

      return assignedSkills.some(
        (assignedSkill) =>
          normalizeText(assignedSkill) === skillName
      );
    })
    .map((resource) => ({
      ...resource,
      matchScore: 100,
    }));
};

// ==========================================
// COMBINE AND REMOVE DUPLICATE RESOURCES
// ==========================================

const combineResources = (backendResources, adminResources) => {
  const combined = [
    ...(Array.isArray(backendResources) ? backendResources : []),
    ...adminResources,
  ];

  const uniqueResources = new Map();

  combined.forEach((resource) => {
    if (!resource?.url) {
      return;
    }

    const normalizedUrl = String(resource.url).trim();

    if (!uniqueResources.has(normalizedUrl)) {
      uniqueResources.set(normalizedUrl, {
        name:
          resource.name ||
          resource.title ||
          "Learning Resource",

        platform:
          resource.platform ||
          resource.category ||
          "Learning Resource",

        url: normalizedUrl,
      });
    }
  });

  return Array.from(uniqueResources.values());
};

// ==========================================
// LEARNING PATH COMPONENT
// ==========================================

function LearningPath() {
  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState("");

  const [learningPaths, setLearningPaths] = useState([]);
  const [resources, setResources] = useState([]);

  const [expandedRole, setExpandedRole] = useState(null);

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingPath, setLoadingPath] = useState(false);
  const [loadingResources, setLoadingResources] = useState(true);

  const [savingSkill, setSavingSkill] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ========================================
  // LOAD STUDENT RESUMES
  // ========================================

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoadingResumes(true);
        setError("");

        const response = await api.get("/resumes/my-resumes");

        const resumeList = response.data.resumes || [];

        setResumes(resumeList);

        if (resumeList.length > 0) {
          setSelectedResume(String(resumeList[0].id));
        }
      } catch (err) {
        setError(
          err.response?.data?.detail ||
            "Unable to load your resumes. Please try again."
        );
      } finally {
        setLoadingResumes(false);
      }
    };

    fetchResumes();
  }, []);

  // ========================================
  // LOAD ADMIN-MANAGED RESOURCES
  // ========================================

  const fetchResources = async () => {
    try {
      setLoadingResources(true);

      const response = await api.get("/resources/");

      const data = response.data;

      const resourceList = Array.isArray(data)
        ? data
        : data.resources || data.items || [];

      setResources(
        Array.isArray(resourceList)
          ? resourceList.filter(
              (resource) => resource.is_active !== false
            )
          : []
      );
    } catch (err) {
      console.error("Unable to load learning resources:", err);
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // ========================================
  // LOAD LEARNING PATH
  // ========================================

  useEffect(() => {
    if (!selectedResume) {
      setLearningPaths([]);
      return;
    }

    const fetchLearningPath = async () => {
      try {
        setLoadingPath(true);
        setError("");
        setSuccess("");
        setExpandedRole(null);

        const response = await api.get(
          `/learning-path/${selectedResume}`
        );

        setLearningPaths(response.data.learning_paths || []);
      } catch (err) {
        setLearningPaths([]);

        setError(
          err.response?.data?.detail ||
            "Unable to load your learning path."
        );
      } finally {
        setLoadingPath(false);
      }
    };

    fetchLearningPath();
  }, [selectedResume]);

  // ========================================
  // OVERALL LEARNING STATISTICS
  // ========================================

  const statistics = useMemo(() => {
    const allSkills = learningPaths.flatMap(
      (role) => role.skills || []
    );

    const totalSkills = allSkills.length;

    const completedSkills = allSkills.filter(
      (skill) => skill.is_completed
    ).length;

    const overallProgress =
      totalSkills > 0
        ? Math.round((completedSkills / totalSkills) * 100)
        : 100;

    return {
      totalRoles: learningPaths.length,
      totalSkills,
      completedSkills,
      overallProgress,
    };
  }, [learningPaths]);

  // ========================================
  // SAVE SKILL COMPLETION STATUS
  // ========================================

  const handleSkillToggle = async (role, skill) => {
    const savingKey =
      `${role.job_role_id}-${skill.skill_name}`;

    try {
      setSavingSkill(savingKey);
      setError("");
      setSuccess("");

      const newStatus = !skill.is_completed;

      await api.post("/learning-path/progress", {
        job_role_id: role.job_role_id,
        skill_name: skill.skill_name,
        is_completed: newStatus,
      });

      setLearningPaths((previousPaths) =>
        previousPaths.map((item) => {
          if (item.job_role_id !== role.job_role_id) {
            return item;
          }

          const updatedSkills = item.skills.map(
            (currentSkill) =>
              currentSkill.skill_name === skill.skill_name
                ? {
                    ...currentSkill,
                    is_completed: newStatus,
                  }
                : currentSkill
          );

          const completedCount = updatedSkills.filter(
            (currentSkill) => currentSkill.is_completed
          ).length;

          const totalCount = updatedSkills.length;

          return {
            ...item,
            skills: updatedSkills,
            completed_skills: completedCount,
            progress_percentage:
              totalCount > 0
                ? Math.round(
                    (completedCount / totalCount) * 100
                  )
                : 100,
          };
        })
      );

      setSuccess(
        `${skill.skill_name} marked as ${
          newStatus ? "completed" : "incomplete"
        }.`
      );
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to save your progress. Please try again."
      );
    } finally {
      setSavingSkill("");
    }
  };

  // ========================================
  // EXPAND / COLLAPSE JOB ROLE
  // ========================================

  const toggleRole = (roleId) => {
    setExpandedRole((current) =>
      current === roleId ? null : roleId
    );
  };

  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loadingResumes) {
    return (
      <div className="learning-page">
        <div className="learning-loading">
          <LoaderCircle
            className="learning-spinner"
            size={28}
          />
          <p>Loading your resumes...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN RENDER
  // ========================================

  return (
    <div className="learning-page">

      {/* PAGE HEADING */}

      <div className="learning-page-header">
        <div>
          <h1>My Learning Path</h1>

          <p>
            Identify missing skills, explore learning resources,
            and track your progress toward your career goals.
          </p>
        </div>

        <div className="learning-heading-icon">
          <GraduationCap size={27} />
        </div>
      </div>

      {/* RESUME SELECTOR */}

      <div className="learning-resume-selector">
        <div className="learning-selector-label">
          <BookOpen size={21} />

          <div>
            <strong>Select your resume</strong>

            <span>
              Choose a resume to generate your learning path.
            </span>
          </div>
        </div>

        <select
          value={selectedResume}
          onChange={(event) =>
            setSelectedResume(event.target.value)
          }
          disabled={resumes.length === 0}
        >
          {resumes.length === 0 && (
            <option value="">
              No resumes uploaded
            </option>
          )}

          {resumes.map((resume) => (
            <option
              key={resume.id}
              value={String(resume.id)}
            >
              {resume.file_name}
            </option>
          ))}
        </select>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="learning-alert learning-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="learning-alert learning-alert-success">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      {/* NO RESUME */}

      {!selectedResume && (
        <div className="learning-empty">
          <BookOpen size={38} />

          <h3>No resume available</h3>

          <p>
            Upload a PDF resume in My Resumes before generating
            your learning path.
          </p>
        </div>
      )}

      {/* LOADING LEARNING PATH */}

      {selectedResume && loadingPath && (
        <div className="learning-loading">
          <LoaderCircle
            className="learning-spinner"
            size={28}
          />

          <p>
            Generating your personalized learning path...
          </p>
        </div>
      )}

      {/* LEARNING PATH CONTENT */}

      {!loadingPath &&
        selectedResume &&
        learningPaths.length > 0 && (
          <>

            {/* SUMMARY CARDS */}

            <div className="learning-stats-grid">

              <div className="learning-stat-card">
                <div className="learning-stat-icon purple">
                  <BriefcaseBusiness size={21} />
                </div>

                <h2>{statistics.totalRoles}</h2>
                <p>Job roles analysed</p>
              </div>

              <div className="learning-stat-card">
                <div className="learning-stat-icon blue">
                  <Target size={21} />
                </div>

                <h2>{statistics.totalSkills}</h2>
                <p>Skills to learn</p>
              </div>

              <div className="learning-stat-card">
                <div className="learning-stat-icon green">
                  <CheckCircle2 size={21} />
                </div>

                <h2>{statistics.completedSkills}</h2>
                <p>Skills completed</p>
              </div>

              <div className="learning-stat-card">
                <div className="learning-stat-icon orange">
                  <GraduationCap size={21} />
                </div>

                <h2>{statistics.overallProgress}%</h2>
                <p>Overall learning progress</p>
              </div>

            </div>

            {/* OVERALL PROGRESS */}

            <div className="learning-overall-card">

              <div className="learning-overall-heading">
                <div>
                  <h3>Overall Learning Progress</h3>

                  <p>
                    {statistics.completedSkills} of{" "}
                    {statistics.totalSkills} missing skills
                    completed
                  </p>
                </div>

                <strong>
                  {statistics.overallProgress}%
                </strong>
              </div>

              <div className="learning-progress-track overall">
                <div
                  className="learning-progress-fill"
                  style={{
                    width: `${statistics.overallProgress}%`,
                  }}
                />
              </div>

            </div>

            {/* CAREER LEARNING PLANS */}

            <div className="learning-roles-section">

              <div className="learning-section-heading">
                <div>
                  <h2>Your Career Learning Plans</h2>

                  <p>
                    Select a job role to view its missing skills
                    and recommended resources.
                  </p>
                </div>
              </div>

              <div className="learning-role-list">

                {learningPaths.map((role) => {
                  const isExpanded =
                    expandedRole === role.job_role_id;

                  const hasMissingSkills =
                    role.total_missing_skills > 0;

                  return (
                    <div
                      className="learning-role-card"
                      key={role.job_role_id}
                    >

                      {/* JOB ROLE HEADER */}

                      <button
                        type="button"
                        className="learning-role-button"
                        onClick={() =>
                          toggleRole(role.job_role_id)
                        }
                      >

                        <div className="learning-role-main">

                          <div className="learning-role-icon">
                            <BriefcaseBusiness size={21} />
                          </div>

                          <div className="learning-role-info">
                            <h3>{role.role_name}</h3>

                            <span>{role.category}</span>

                            <p>{role.description}</p>
                          </div>

                        </div>

                        <div className="learning-role-summary">

                          <div className="learning-match-score">
                            <strong>
                              {role.match_percentage}%
                            </strong>

                            <span>Job match</span>
                          </div>

                          <div className="learning-missing-count">
                            <strong>
                              {role.completed_skills}/
                              {role.total_missing_skills}
                            </strong>

                            <span>Skills completed</span>
                          </div>

                          {isExpanded ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}

                        </div>

                      </button>

                      {/* ROLE PROGRESS */}

                      <div className="learning-role-progress">

                        <div className="learning-progress-track">
                          <div
                            className="learning-progress-fill"
                            style={{
                              width: `${role.progress_percentage}%`,
                            }}
                          />
                        </div>

                        <span>
                          {role.progress_percentage}%
                        </span>

                      </div>

                      {/* EXPANDED ROLE DETAILS */}

                      {isExpanded && (
                        <div className="learning-role-details">

                          {!hasMissingSkills ? (
                            <div className="learning-complete-message">

                              <CheckCircle2 size={21} />

                              <div>
                                <strong>
                                  You have all the required skills!
                                </strong>

                                <p>
                                  Your resume currently matches all
                                  required skills for this role.
                                </p>
                              </div>

                            </div>
                          ) : (
                            <>

                              <h4>
                                Skills you need to learn
                              </h4>

                              <div className="learning-skill-list">

                                {(role.skills || []).map((skill) => {

                                  const savingKey =
                                    `${role.job_role_id}-${skill.skill_name}`;

                                  const isSaving =
                                    savingSkill === savingKey;

                                  // Existing backend recommendations.
                                  const backendResources =
                                    skill.resources || [];

                                  // Admin resources matched by assigned skill tags.
                                  const adminResources =
                                    getResourceMatches(
                                      skill,
                                      resources
                                    ).map((resource) => ({
                                      name: resource.title,
                                      platform:
                                        resource.category ||
                                        "Learning Resource",
                                      url: resource.url,
                                    }));

                                  // Combine recommendations and remove duplicate URLs.
                                  const uniqueResources =
                                    combineResources(
                                      backendResources,
                                      adminResources
                                    );

                                  return (
                                    <div
                                      className={`learning-skill-card ${
                                        skill.is_completed
                                          ? "completed"
                                          : ""
                                      }`}
                                      key={skill.skill_name}
                                    >

                                      {/* SKILL COMPLETION */}

                                      <div className="learning-skill-top">

                                        <button
                                          type="button"
                                          className="learning-skill-check"
                                          onClick={() =>
                                            handleSkillToggle(
                                              role,
                                              skill
                                            )
                                          }
                                          disabled={Boolean(savingSkill)}
                                          aria-label={
                                            skill.is_completed
                                              ? `Mark ${skill.skill_name} incomplete`
                                              : `Mark ${skill.skill_name} completed`
                                          }
                                        >

                                          {isSaving ? (
                                            <LoaderCircle
                                              size={21}
                                              className="learning-spinner"
                                            />
                                          ) : skill.is_completed ? (
                                            <CheckCircle2 size={21} />
                                          ) : (
                                            <Circle size={21} />
                                          )}

                                        </button>

                                        <div className="learning-skill-info">
                                          <strong>
                                            {skill.skill_name}
                                          </strong>

                                          <span>
                                            {skill.is_completed
                                              ? "Completed"
                                              : "Not completed"}
                                          </span>
                                        </div>

                                      </div>

                                      {/* SKILL DESCRIPTION */}

                                      <p className="learning-skill-description">
                                        {skill.description}
                                      </p>

                                      {/* RECOMMENDED RESOURCES */}

                                      <div className="learning-resources">

                                        <h5>
                                          <BookOpen size={15} />
                                          Recommended resources
                                        </h5>

                                        {loadingResources ? (
                                          <p className="learning-resource-empty">
                                            Loading resources...
                                          </p>
                                        ) : uniqueResources.length > 0 ? (

                                          uniqueResources.map(
                                            (resource, index) => (
                                              <a
                                                key={`${resource.url}-${index}`}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="learning-resource-link"
                                              >

                                                <span>
                                                  <strong>
                                                    {resource.name}
                                                  </strong>

                                                  <small>
                                                    {resource.platform}
                                                  </small>
                                                </span>

                                                <ExternalLink size={16} />

                                              </a>
                                            )
                                          )

                                        ) : (
                                          <p className="learning-resource-empty">
                                            No matching resources are
                                            currently available for this
                                            skill. Check the Learning
                                            Resources section for other
                                            materials.
                                          </p>
                                        )}

                                      </div>

                                    </div>
                                  );
                                })}

                              </div>

                            </>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}

              </div>

            </div>

          </>
        )}

    </div>
  );
}

export default LearningPath;
