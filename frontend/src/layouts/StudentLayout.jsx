import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function StudentLayout() {
  return (
    <div className="student-layout">
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Right-side content area */}
      <div className="student-main">
        {/* Top navigation bar */}
        <Topbar />

        {/* Only this section scrolls */}
        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;