// src/components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../api/client';

function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default ProtectedRoute;