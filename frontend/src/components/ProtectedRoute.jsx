// frontend/src/components/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress, dash, sx as preset, Typography } from "../ui";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          ...preset.centerFull,
          minHeight: "100dvh",
          flexDirection: "column",
          bgcolor: dash.bg,
          color: dash.ink,
        }}
      >
        <CircularProgress size={48} sx={{ color: dash.status.blue }} />
        <Typography variant="body1" sx={{ mt: 2, color: dash.inkSoft, fontWeight: 600 }}>
          Đang tải dữ liệu...
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
