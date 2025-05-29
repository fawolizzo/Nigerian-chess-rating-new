import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * ProtectedRoute component
 * 
 * Handles authentication and role-based authorization for protected routes.
 * Redirects to login if not authenticated.
 * Redirects to home if authenticated but lacking required role.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object from Supabase auth
 * @param {Array} [props.allowedRoles] - Optional array of roles allowed to access the route
 * @param {string} props.userRole - Current user's role
 * @param {React.ReactNode} props.children - Components to render if authentication passes
 * @returns {React.ReactNode} Protected route content or redirect
 */
const ProtectedRoute = ({ user, allowedRoles = [], userRole, children }) => {
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If role check is needed and user doesn't have allowed role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  // Otherwise render children
  return children;
};

ProtectedRoute.propTypes = {
  user: PropTypes.object,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  userRole: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default ProtectedRoute;
