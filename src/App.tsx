import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const Login = lazy(() => import("./pages/Login/Login"));
const ForgotPassword = lazy(() => import("./pages/Login/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/Login/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Projects = lazy(() => import("./pages/Projects/Projects"));
const ProjectWorkspace = lazy(
  () => import("./pages/ProjectWorkspace/ProjectWorkspace"),
);
const Activities = lazy(() => import("./pages/Activities/Activities"));
const PlannerDashboard = lazy(() => import("./pages/Planner/PlannerDashboard"));
const PlannerProjects = lazy(() => import("./pages/Planner/PlannerProjects"));
const PlannerProjectWorkspace = lazy(
  () => import("./pages/Planner/PlannerProjectWorkspace"),
);
const ProgramsUpload = lazy(() => import("./pages/Planner/ProgramsUpload"));
const PlannerActivities = lazy(
  () => import("./pages/Planner/PlannerActivities"),
);
const PlannerActions = lazy(() => import("./pages/Planner/PlannerActions"));
const PlannerExports = lazy(() => import("./pages/Planner/PlannerExports"));
const PlannerWeeklyDashboard = lazy(
  () => import("./pages/Planner/PlannerWeeklyDashboard"),
);
const PlannerGovernanceDashboard = lazy(
  () => import("./pages/Planner/PlannerGovernanceDashboard"),
);
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminProjects = lazy(() => import("./pages/Admin/AdminProjects"));
const AdminProjectWorkspace = lazy(
  () => import("./pages/Admin/AdminProjectWorkspace"),
);
const AdminProgramsUpload = lazy(
  () => import("./pages/Admin/AdminProgramsUpload"),
);
const AdminActivities = lazy(() => import("./pages/Admin/AdminActivities"));
const AdminActions = lazy(() => import("./pages/Admin/AdminActions"));
const AdminWeeklyDashboard = lazy(
  () => import("./pages/Admin/AdminWeeklyDashboard"),
);
const AdminGovernanceDashboard = lazy(
  () => import("./pages/Admin/AdminGovernanceDashboard"),
);
const AdminExports = lazy(() => import("./pages/Admin/AdminExports"));
const UserManagement = lazy(() => import("./pages/Admin/UserManagement"));
const AuditLogs = lazy(() => import("./pages/Admin/AuditLogs"));
const AdminNotifications = lazy(
  () => import("./pages/Admin/AdminNotifications"),
);
const PlannerNotifications = lazy(
  () => import("./pages/Planner/PlannerNotifications"),
);
const PlannerSettings = lazy(() => import("./pages/Planner/PlannerSettings"));
const UserSettings = lazy(() => import("./pages/Dashboard/UserSettings"));
const UserGovernanceDashboard = lazy(
  () => import("./pages/Dashboard/UserGovernanceDashboard"),
);
const UserExports = lazy(() => import("./pages/Dashboard/UserExports"));
const UserNotifications = lazy(
  () => import("./pages/Dashboard/UserNotifications"),
);

const PageFallback = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      color: "#94A3B8",
      fontSize: 14,
    }}
  >
    Loading…
  </div>
);

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
    <Suspense fallback={<PageFallback />}>
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
          path="/forgot-password"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />
          }
        />

        <Route
          path="/reset-password/:token"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />
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
          path="/dashboard/governance"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserGovernanceDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/exports"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserExports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/notifications"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserNotifications />
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

        {/* Without this an unrecognised URL matches nothing and React renders
            an empty document — a blank screen with no way back. Signed-in
            visitors land on their own dashboard, everyone else on login. */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                !isAuthenticated
                  ? "/login"
                  : user?.role === "admin"
                    ? "/admin"
                    : user?.role === "planner"
                      ? "/planner"
                      : "/dashboard"
              }
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
