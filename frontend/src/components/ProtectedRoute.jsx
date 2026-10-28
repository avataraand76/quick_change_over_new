// frontend/src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, sx as preset, Typography } from "../ui";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ ...preset.centerFull, flexDirection: "column" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Nhớ trang đang muốn vào để đăng nhập xong quay lại đúng chỗ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    // Không có quyền admin -> chuyển về trang chủ
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
