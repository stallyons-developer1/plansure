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

const AdminDashboard = () => (
  <div
    style={{
      padding: "40px",
      color: "#f1f5f9",
      background: "#0f172a",
      minHeight: "100vh",
    }}
  >
    <h1>Admin Dashboard</h1>
    <p>Welcome, Admin!</p>
  </div>
);

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
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
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
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

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
