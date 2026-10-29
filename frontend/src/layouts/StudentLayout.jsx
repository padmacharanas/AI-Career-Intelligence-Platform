
import React from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../context/AuthContext";

function StudentLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="student-layout-loading">
        Loading your Student Portal...
      </div>
    );
  }

  return (
    <div className="student-layout">
      <Sidebar />

      <div className="student-main">
        <Topbar user={user} />

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
