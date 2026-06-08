import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDocuments from "./pages/AdminDocuments.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import Client from "./pages/Client.jsx";
import Landing from "./pages/Landing.jsx";
import Profile from "./pages/Profile.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Screen from "./pages/screen.jsx";
function RootRedirect() {
  return <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* public */}
        <Route path="/welcome" element={<Landing />} />
        <Route path="/screen" element={<Screen />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* authenticated */}
        <Route
          path="/ask"
          element={
            <ProtectedRoute>
              <Client />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* admin only */}
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute adminOnly>
              <AdminDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* root: send to landing; the landing component itself bounces logged-in users to /ask */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Route>
    </Routes>
  );
}
