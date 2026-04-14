import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";

// Placeholder components - will be replaced with actual dashboards
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

// Protected Route wrapper
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
        path="/dashboard/*"
        element={
          <ProtectedRoute allowedRoles={["user"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
