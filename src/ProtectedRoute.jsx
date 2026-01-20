import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ token }) {
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If token exists, render child routes
  return <Outlet />;
}
