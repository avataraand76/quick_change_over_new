// frontend/src/pages/dashboard/DashPanel.jsx
//
// Vỏ thẻ của dashboard theo phong cách ERP Dashboard:
// Nền glassmorphism, viền mảnh 1px border-white/10, đổ bóng 3D sâu,
// hiệu ứng phản chiếu ánh sáng nhẹ và dải tiêu đề tinh tế.

import { Box, Stack, Typography, dash } from "../../ui";

/**
 * @param {string} title       tiêu đề, luôn VIẾT HOA
 * @param {string} [subtitle]   chú thích nhỏ bên phải tiêu đề
 * @param {node}   [icon]      icon nhỏ trước tiêu đề
 * @param {node}   [action]    nội dung dính góc phải dải tiêu đề (nút, tab, badge)
 * @param {boolean}[dense]     bớt padding cho khối nhỏ
 * @param {boolean}[noPadding] không dùng padding nội dung (cho bảng/biểu đồ phủ sát)
 */
const DashPanel = ({
  title,
  subtitle,
  icon,
  action,
  dense,
  noPadding,
  children,
  sx,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      height: "100%",
      position: "relative",
      background: dash.panel,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${dash.border}`,
      borderRadius: "10px",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.32)",
      overflow: "hidden",
      transition: "border-color 0.25s ease, box-shadow 0.25s ease",
      "&:hover": {
        borderColor: "rgba(59, 130, 246, 0.35)",
      },
      "&::before": {
        content: '""',
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
        pointerEvents: "none",
        zIndex: 0,
        borderRadius: "inherit",
      },
      ...sx,
    }}
  >
    {title && (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 1.5,
          py: 0.65,
          background: "rgba(255, 255, 255, 0.02)",
          borderBottom: `1px solid ${dash.border}`,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
        }}
      >
        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              color: dash.series[0],
              fontSize: 18,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          sx={{
            color: "rgba(255, 255, 255, 0.95)",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: 0.4,
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              color: dash.inkMuted,
              fontSize: "0.72rem",
              fontWeight: 500,
              ml: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        {action && (
          <Box sx={{ display: "flex", alignItems: "center", zIndex: 3 }}>
            {action}
          </Box>
        )}
      </Stack>
    )}

    <Box
      sx={{
        p: noPadding ? 0 : dense ? 0.75 : 1,
        flex: 1,
        minHeight: 0,
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </Box>
  </Box>
);

export default DashPanel;

