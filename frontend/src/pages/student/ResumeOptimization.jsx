import React from "react";
import ATSChecker from "../../components/ATSChecker";

function ResumeOptimization() {
  return (
    <div className="resume-optimization-page">
      <div className="page-header">
        <div>
          <h1>ATS Score</h1>
          <p>
            Analyse your existing resume against your target job role
            and discover ways to improve your ATS compatibility.
          </p>
        </div>
      </div>

      <ATSChecker mode="student" />
    </div>
  );
}

export default ResumeOptimization;