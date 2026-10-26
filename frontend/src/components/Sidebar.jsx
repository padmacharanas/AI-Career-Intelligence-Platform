
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  BriefcaseBusiness,
  GraduationCap,
  UserRound,
  LogOut,
  BrainCircuit,
  Users,
  ChartNoAxesCombined,
  BookOpen
} from "lucide-react";

// ==========================================
// STUDENT MENU
// ==========================================

const studentMenu = [
  {
    name: "Dashboard",
    path: "/student/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "My Resumes",
    path: "/student/resumes",
    icon: FileText
  },
  {
    name: "Job Matches",
    path: "/student/job-matches",
    icon: BriefcaseBusiness
  },
  {
    name: "Learning Path",
    path: "/student/learning",
    icon: GraduationCap
  },
  {
    name: "Learning Resources",
    path: "/student/resources",
    icon: BookOpen
  },
  {
    name: "My Profile",
    path: "/student/profile",
    icon: UserRound
  }
];

// ==========================================
// SIDEBAR COMPONENT
// ==========================================

function Sidebar({ role = "student" }) {
  const isAdmin = role === "admin";

  // ========================================
  // ADMIN MENU
  // ========================================

  const adminMenu = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard
    },
    {
      name: "Student Management",
      path: "/admin/students",
      icon: Users
    },
    {
      name: "Resume Management",
      path: "/admin/resumes",
      icon: FileText
    },
    {
      name: "Job Roles",
      path: "/admin/job-roles",
      icon: BriefcaseBusiness
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: ChartNoAxesCombined
    },
    {
      name: "Resources",
      path: "/admin/resources",
      icon: GraduationCap
    }
  ];

  const menu = isAdmin ? adminMenu : studentMenu;

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <aside className="sidebar">

      <div className="brand">
        <div className="brand-icon">
          <BrainCircuit size={23} />
        </div>

        <div className="brand-text">
          <h2>Career Intelligence</h2>
          <p>{isAdmin ? "Admin Portal" : "Student Portal"}</p>
        </div>
      </div>

      <p className="nav-label">MAIN MENU</p>

      <nav className="nav-menu">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
              end
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className="nav-item"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
