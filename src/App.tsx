import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import ProjectWorkspace from "./pages/ProjectWorkspace/ProjectWorkspace";
import Activities from "./pages/Activities/Activities";
import PlannerDashboard from "./pages/Planner/PlannerDashboard";
import PlannerProjects from "./pages/Planner/PlannerProjects";
import PlannerProjectWorkspace from "./pages/Planner/PlannerProjectWorkspace";
import ProgramsUpload from "./pages/Planner/ProgramsUpload";
import PlannerActivities from "./pages/Planner/PlannerActivities";
import PlannerActions from "./pages/Planner/PlannerActions";
import PlannerExports from "./pages/Planner/PlannerExports";
import PlannerWeeklyDashboard from "./pages/Planner/PlannerWeeklyDashboard";
import PlannerGovernanceDashboard from "./pages/Planner/PlannerGovernanceDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminProjects from "./pages/Admin/AdminProjects";
import AdminProjectWorkspace from "./pages/Admin/AdminProjectWorkspace";
import AdminProgramsUpload from "./pages/Admin/AdminProgramsUpload";
import AdminActivities from "./pages/Admin/AdminActivities";
import AdminActions from "./pages/Admin/AdminActions";
import AdminWeeklyDashboard from "./pages/Admin/AdminWeeklyDashboard";
import AdminGovernanceDashboard from "./pages/Admin/AdminGovernanceDashboard";
import AdminExports from "./pages/Admin/AdminExports";
import UserManagement from "./pages/Admin/UserManagement";
import AuditLogs from "./pages/Admin/AuditLogs";
import AdminNotifications from "./pages/Admin/AdminNotifications";
import PlannerNotifications from "./pages/Planner/PlannerNotifications";
import PlannerSettings from "./pages/Planner/PlannerSettings";
import UserSettings from "./pages/Dashboard/UserSettings";

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    void logout();
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={
                user?.role === "admin"
                  ? "/admin"
                  : user?.role === "planner"
                    ? "/planner"
                    : "/dashboard"
              }
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProjects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/projects/:projectId"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProjectWorkspace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/programs-upload"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProgramsUpload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/activities"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminActivities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/action"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminActions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/weekly-dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminWeeklyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/governance"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminGovernanceDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/export"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminExports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/projects"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerProjects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/projects/:projectId"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerProjectWorkspace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/programs-upload"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <ProgramsUpload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/activities"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerActivities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/action"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerActions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/export"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerExports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/weekly-dashboard"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerWeeklyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/governance"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerGovernanceDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/notifications"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/planner/settings"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/projects"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Projects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/projects/:projectId"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <ProjectWorkspace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/activities"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Activities />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/settings"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <UserSettings />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
