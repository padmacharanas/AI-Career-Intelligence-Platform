
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

// ==========================================
// AUTHENTICATION PAGES
// ==========================================

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// ==========================================
// LAYOUTS
// ==========================================

import StudentLayout from "./layouts/StudentLayout";
import AdminLayout from "./layouts/AdminLayout";

// ==========================================
// STUDENT PAGES
// ==========================================

import StudentDashboard from "./pages/student/StudentDashboard";
import Resumes from "./pages/student/Resumes";
import JobMatches from "./pages/student/JobMatches";
import LearningPath from "./pages/student/LearningPath";
import StudentResources from "./pages/student/Resources";
import MyProfile from "./pages/student/MyProfile";

// ==========================================
// ADMIN PAGES
// ==========================================

import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import AdminResumes from "./pages/admin/Resumes";
import JobRoles from "./pages/admin/JobRoles";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import Resources from "./pages/admin/Resources";

// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Checking your session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ==========================================
// STUDENT ROUTE
// ==========================================

function StudentRoute() {
  const { user } = useAuth();

  if (user?.role !== "student") {
    return (
      <Navigate
        to={
          user?.role === "admin"
            ? "/admin/dashboard"
            : "/login"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

// ==========================================
// ADMIN ROUTE
// ==========================================

function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <Navigate
        to={
          user?.role === "student"
            ? "/student/dashboard"
            : "/login"
        }
        replace
      />
    );
  }

  return <Outlet />;
}

// ==========================================
// MAIN APPLICATION ROUTES
// ==========================================

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading application...</div>;
  }

  const dashboardPath =
    user?.role === "admin"
      ? "/admin/dashboard"
      : "/student/dashboard";

  return (
    <Routes>

      {/* ==================================
          AUTHENTICATION ROUTES
      ================================== */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={dashboardPath} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={dashboardPath} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* ==================================
          PROTECTED ROUTES
      ================================== */}

      <Route element={<ProtectedRoute />}>

        {/* ==================================
            STUDENT ROUTES
        ================================== */}

        <Route element={<StudentRoute />}>

          <Route path="/student" element={<StudentLayout />}>

            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<StudentDashboard />}
            />

            <Route
              path="resumes"
              element={<Resumes />}
            />

            <Route
              path="job-matches"
              element={<JobMatches />}
            />

            <Route
              path="learning"
              element={<LearningPath />}
            />

            {/* NEW: STUDENT LEARNING RESOURCES */}

            <Route
              path="resources"
              element={<StudentResources />}
            />

            <Route
              path="profile"
              element={<MyProfile />}
            />

          </Route>

        </Route>

        {/* ==================================
            ADMIN ROUTES
        ================================== */}

        <Route element={<AdminRoute />}>

          <Route path="/admin" element={<AdminLayout />}>

            <Route
              index
              element={<Navigate to="dashboard" replace />}
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="students"
              element={<Students />}
            />

            <Route
              path="resumes"
              element={<AdminResumes />}
            />

            <Route
              path="job-roles"
              element={<JobRoles />}
            />

            <Route
              path="analytics"
              element={<AdminAnalytics />}
            />

            <Route
              path="resources"
              element={<Resources />}
            />

          </Route>

        </Route>

      </Route>

      {/* ==================================
          DEFAULT ROUTE
      ================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to={user ? dashboardPath : "/login"}
            replace
          />
        }
      />

      {/* ==================================
          UNKNOWN ROUTES
      ================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
