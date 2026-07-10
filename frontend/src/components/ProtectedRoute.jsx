import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Guards routes that require authentication; redirects to /login otherwise. */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
