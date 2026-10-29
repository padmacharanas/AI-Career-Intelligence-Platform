
import React from "react";

import {
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  FileText,
  AlertCircle,
  TrendingUp,
  BriefcaseBusiness,
  Sparkles,
  GraduationCap,
  MessageSquareText
} from "lucide-react";

function ATSReport({ report }) {
  if (!report) return null;

  // ==========================================
  // REPORT DATA
  // ==========================================

  const breakdown = report.score_breakdown || {};

  const matchedSkills = report.matched_skills || [];
  const missingSkills = report.missing_skills || [];

  const suggestions = report.improvement_suggestions || [];

  const score = Math.min(
    100,
    Math.max(0, Number(report.overall_score ?? 0))
  );

  // ==========================================
  // SCORE LABEL
  // ==========================================

  const getScoreLabel = (value) => {
    if (value >= 80) return "Strong compatibility";
    if (value >= 60) return "Moderate compatibility";
    if (value >= 40) return "Needs improvement";

    return "Low compatibility";
  };

  // ==========================================
  // SCORE COMPONENTS
  // ==========================================

  const components = [
    {
      key: "skills",
      label: "Required Skills",
      weight: "40%"
    },
    {
      key: "keywords",
      label: "Job Description Keywords",
      weight: "30%"
    },
    {
      key: "content",
      label: "Resume Content",
      weight: "15%"
    },
    {
      key: "sentence_quality",
      label: "Sentence Quality",
      weight: "10%"
    },
    {
      key: "education",
      label: "Education Match",
      weight: "5%"
    }
  ];

  const keywordData = breakdown.keywords || {};
  const contentData = breakdown.content || {};

  const sentenceData = breakdown.sentence_quality || {};
  const educationData = breakdown.education || {};

  const scoreColor =
    score >= 80
      ? "strong"
      : score >= 60
        ? "moderate"
        : "needs-work";

  // ==========================================
  // REPORT UI
  // ==========================================

  return (
    <div className="ats-report-v2">

      {/* ======================================
          REPORT TITLE
      ====================================== */}

      <div className="ats-v2-title">

        <div>
          <span className="ats-v2-eyebrow">
            <Sparkles size={14} />
            YOUR RESUME INSIGHTS
          </span>

          <h2>ATS Compatibility Report</h2>

          <p>
            A detailed assessment of how your resume
            matches your selected job role.
          </p>
        </div>

        <div className="ats-v2-role">
          <BriefcaseBusiness size={16} />

          <span>
            {report.job_role?.role_name || "Selected Job Role"}
          </span>
        </div>

      </div>

      {/* ======================================
          SCORE OVERVIEW
      ====================================== */}

      <section className="ats-v2-overview">

        <div className="ats-v2-score-panel">

          <div className={`ats-v2-score-ring ${scoreColor}`}>

            <div className="ats-v2-score-inner">
              <strong>{score.toFixed(1)}%</strong>

              <span>ATS SCORE</span>
            </div>

          </div>

          <div className="ats-v2-score-description">

            <span className="ats-v2-status">
              <CheckCircle size={15} />
              Analysis completed
            </span>

            <h3>{getScoreLabel(score)}</h3>

            <p>
              This resume has an estimated compatibility of{" "}
              <strong>{score.toFixed(1)}%</strong> for this job role.
            </p>

          </div>

        </div>

        <div className="ats-v2-overview-note">

          <Target size={19} />

          <div>
            <strong>Overall compatibility</strong>

            <span>
              This score evaluates required skills, job description
              keywords, resume content, sentence quality and
              education match.
            </span>
          </div>

        </div>

      </section>

      {/* ======================================
          SCORE BREAKDOWN
      ====================================== */}

      <section className="ats-v2-section">

        <div className="ats-v2-section-heading">

          <div className="ats-v2-heading-icon">
            <TrendingUp size={19} />
          </div>

          <div>
            <h3>Score Breakdown</h3>

            <p>
              Understand how each category contributes to the score.
            </p>
          </div>

        </div>

        <div className="ats-v2-breakdown-grid">

          {components.map((item) => {

            const data = breakdown[item.key];

            if (!data) return null;

            const percentage = Math.min(
              100,
              Math.max(0, Number(data.percentage ?? 0))
            );

            return (
              <div
                className="ats-v2-breakdown-card"
                key={item.key}
              >

                <div className="ats-v2-breakdown-top">

                  <span>{item.label}</span>

                  <strong>
                    {percentage.toFixed(1)}%
                  </strong>

                </div>

                <div className="ats-v2-progress">

                  <div
                    className="ats-v2-progress-fill"
                    style={{
                      width: `${percentage}%`
                    }}
                  />

                </div>

                <div className="ats-v2-breakdown-bottom">

                  <span>
                    Weight: {item.weight}
                  </span>

                  <span>
                    {Number(data.weighted_score ?? 0).toFixed(1)}
                    {" / "}
                    {Number(data.weight ?? 0)}
                  </span>

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* ======================================
          SKILLS ASSESSMENT
      ====================================== */}

      <section className="ats-v2-section">

        <div className="ats-v2-section-heading">

          <div className="ats-v2-heading-icon">
            <CheckCircle size={19} />
          </div>

          <div>
            <h3>Skills Assessment</h3>

            <p>
              Compare the student's skills with the requirements
              of the selected role.
            </p>
          </div>

        </div>

        <div className="ats-v2-skills-grid">

          {/* MATCHED SKILLS */}

          <div className="ats-v2-detail-card">

            <div className="ats-v2-card-heading">

              <div className="ats-v2-card-icon success">
                <CheckCircle size={17} />
              </div>

              <div>
                <h4>Matched Skills</h4>

                <span>
                  {matchedSkills.length} skills found
                </span>
              </div>

            </div>

            {matchedSkills.length > 0 ? (

              <div className="ats-v2-tags">

                {matchedSkills.map((skill, index) => (

                  <span
                    className="ats-v2-tag matched"
                    key={index}
                  >
                    <CheckCircle size={13} />
                    {skill}
                  </span>

                ))}

              </div>

            ) : (

              <p className="ats-v2-empty">
                No required skills matched yet.
              </p>

            )}

          </div>

          {/* MISSING SKILLS */}

          <div className="ats-v2-detail-card">

            <div className="ats-v2-card-heading">

              <div className="ats-v2-card-icon danger">
                <XCircle size={17} />
              </div>

              <div>
                <h4>Missing Skills</h4>

                <span>
                  {missingSkills.length} skills to review
                </span>
              </div>

            </div>

            {missingSkills.length > 0 ? (

              <div className="ats-v2-tags">

                {missingSkills.map((skill, index) => (

                  <span
                    className="ats-v2-tag missing"
                    key={index}
                  >
                    <XCircle size={13} />
                    {skill}
                  </span>

                ))}

              </div>

            ) : (

              <p className="ats-v2-positive">
                All configured required skills matched.
              </p>

            )}

          </div>

        </div>

      </section>

      {/* ======================================
          RESUME CONTENT ANALYSIS
      ====================================== */}

      <section className="ats-v2-section">

        <div className="ats-v2-section-heading">

          <div className="ats-v2-heading-icon">
            <FileText size={19} />
          </div>

          <div>
            <h3>Resume Content Analysis</h3>

            <p>
              Review keywords and important resume sections.
            </p>
          </div>

        </div>

        <div className="ats-v2-detail-grid">

          {/* KEYWORD ANALYSIS */}

          <div className="ats-v2-detail-card">

            <div className="ats-v2-card-heading">

              <div className="ats-v2-card-icon info">
                <FileText size={17} />
              </div>

              <div>
                <h4>Keyword Analysis</h4>

                <span>
                  Job description matching
                </span>
              </div>

            </div>

            <div className="ats-v2-stat-row">

              <div>
                <strong>
                  {keywordData.matched_keywords?.length || 0}
                </strong>

                <span>Matched</span>
              </div>

              <div>
                <strong>
                  {keywordData.missing_keywords?.length || 0}
                </strong>

                <span>Missing</span>
              </div>

            </div>

            {keywordData.missing_keywords?.length > 0 && (

              <>
                <p className="ats-v2-subtitle">
                  Keywords to review
                </p>

                <div className="ats-v2-tags">

                  {keywordData.missing_keywords.map(
                    (keyword, index) => (

                      <span
                        className="ats-v2-tag missing"
                        key={index}
                      >
                        {keyword}
                      </span>

                    )
                  )}

                </div>
              </>

            )}

          </div>

          {/* RESUME SECTIONS */}

          <div className="ats-v2-detail-card">

            <div className="ats-v2-card-heading">

              <div className="ats-v2-card-icon info">
                <BriefcaseBusiness size={17} />
              </div>

              <div>
                <h4>Resume Sections</h4>

                <span>
                  Content structure check
                </span>
              </div>

            </div>

            <div className="ats-v2-stat-row">

              <div>
                <strong>
                  {contentData.found_sections?.length || 0}
                </strong>

                <span>Detected</span>
              </div>

              <div>
                <strong>
                  {contentData.missing_sections?.length || 0}
                </strong>

                <span>Needs attention</span>
              </div>

            </div>

            {contentData.missing_sections?.length > 0 && (

              <>
                <p className="ats-v2-subtitle">
                  Sections to review
                </p>

                <div className="ats-v2-tags">

                  {contentData.missing_sections.map(
                    (section, index) => (

                      <span
                        className="ats-v2-tag missing"
                        key={index}
                      >
                        {section}
                      </span>

                    )
                  )}

                </div>
              </>

            )}

          </div>

        </div>

      </section>

      {/* ======================================
          SENTENCE QUALITY
      ====================================== */}

      <section className="ats-v2-section">

        <div className="ats-v2-section-heading">

          <div className="ats-v2-heading-icon">
            <MessageSquareText size={19} />
          </div>

          <div>
            <h3>Sentence Quality</h3>

            <p>
              Review the clarity and effectiveness
              of resume statements.
            </p>
          </div>

        </div>

        <div className="ats-v2-detail-card">

          <div className="ats-v2-stat-row">

            <div>
              <strong>
                {Number(sentenceData.percentage ?? 0).toFixed(1)}%
              </strong>

              <span>Sentence quality score</span>
            </div>

            <div>
              <strong>
                {sentenceData.quality_checks?.length || 0}
              </strong>

              <span>Quality checks</span>
            </div>

          </div>

          {sentenceData.feedback?.length > 0 && (

            <>
              <p className="ats-v2-subtitle">
                Writing feedback
              </p>

              <div className="ats-v2-tags">

                {sentenceData.feedback.map(
                  (item, index) => (

                    <span
                      className="ats-v2-tag"
                      key={index}
                    >
                      {item}
                    </span>

                  )
                )}

              </div>
            </>

          )}

        </div>

      </section>

      {/* ======================================
          EDUCATION MATCH
      ====================================== */}

      <section className="ats-v2-section">

        <div className="ats-v2-section-heading">

          <div className="ats-v2-heading-icon">
            <GraduationCap size={19} />
          </div>

          <div>
            <h3>Education Match</h3>

            <p>
              Check how the student's educational background
              relates to the selected role.
            </p>
          </div>

        </div>

        <div className="ats-v2-detail-card">

          <div className="ats-v2-stat-row">

            <div>
              <strong>
                {Number(educationData.percentage ?? 0).toFixed(1)}%
              </strong>

              <span>Education match score</span>
            </div>

            <div>
              <strong>
                {educationData.matched_qualifications?.length || 0}
              </strong>

              <span>Matched qualifications</span>
            </div>

          </div>

          {educationData.matched_qualifications?.length > 0 && (

            <>
              <p className="ats-v2-subtitle">
                Matched qualifications
              </p>

              <div className="ats-v2-tags">

                {educationData.matched_qualifications.map(
                  (item, index) => (

                    <span
                      className="ats-v2-tag matched"
                      key={index}
                    >
                      <CheckCircle size={13} />
                      {item}
                    </span>

                  )
                )}

              </div>
            </>

          )}

          {educationData.feedback && (

            <p className="ats-v2-empty">
              {educationData.feedback}
            </p>

          )}

        </div>

      </section>

      {/* ======================================
          RECOMMENDED IMPROVEMENTS
      ====================================== */}

      <section className="ats-v2-section">

        <div className="ats-v2-section-heading">

          <div className="ats-v2-heading-icon">
            <Lightbulb size={19} />
          </div>

          <div>
            <h3>Recommended Improvements</h3>

            <p>
              Actionable suggestions to strengthen the resume.
            </p>
          </div>

        </div>

        {suggestions.length > 0 ? (

          <div className="ats-v2-suggestions">

            {suggestions.map((item, index) => {

              const priority = String(
                item.priority || "Medium"
              ).toLowerCase();

              return (

                <div
                  className="ats-v2-suggestion"
                  key={index}
                >

                  <div className="ats-v2-suggestion-top">

                    <div className="ats-v2-suggestion-icon">
                      <Lightbulb size={17} />
                    </div>

                    <strong>
                      {item.area || "General Improvement"}
                    </strong>

                    <span
                      className={`ats-v2-priority ${priority}`}
                    >
                      {item.priority || "Medium"} Priority
                    </span>

                  </div>

                  <p>
                    {item.suggestion}
                  </p>

                </div>

              );
            })}

          </div>

        ) : (

          <div className="ats-v2-empty-state">
            <CheckCircle size={20} />

            <p>
              No improvement suggestions available.
            </p>
          </div>

        )}

      </section>

      {/* ======================================
          DISCLAIMER
      ====================================== */}

      <div className="ats-v2-disclaimer">

        <AlertCircle size={18} />

        <p>
          {report.disclaimer ||
            "This is an estimated compatibility score generated by this platform. It is not an actual employer ATS score and does not guarantee interview selection."}
        </p>

      </div>

    </div>
  );
}

export default ATSReport;
