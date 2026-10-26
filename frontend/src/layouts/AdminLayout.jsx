
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


function AdminLayout() {

  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const pageTitles = {
    "/admin/dashboard": "Admin Dashboard",
    "/admin/students": "Student Management",
    "/admin/users": "User Management",
    "/admin/job-roles": "Job Role Management",
    "/admin/resources": "Learning Resources",
    "/admin/settings": "Platform Settings"
  };

  const title =
    pageTitles[location.pathname] || "Admin Portal";


  return (
    <div className="app-container">

      <Sidebar role="admin" />

      <main className="main-area">

        <Topbar title={title} user={user} />

        <Outlet />

      </main>

    </div>
  );
}

export default AdminLayout;
