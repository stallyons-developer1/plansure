import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Projects from "./pages/Projects/Projects";
import ProjectWorkspace from "./pages/ProjectWorkspace/ProjectWorkspace";
import Activities from "./pages/Activities/Activities";

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

const PlannerDashboard = () => (
  <div
    style={{
      padding: "40px",
      color: "#f1f5f9",
      background: "#0f172a",
      minHeight: "100vh",
    }}
  >
    <h1>Planner Dashboard</h1>
    <p>Welcome, Planner!</p>
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
        path="/planner/*"
        element={
          <ProtectedRoute allowedRoles={["planner"]}>
            <PlannerDashboard />
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
