// frontend/src/pages/dashboard/DashPanel.jsx
//
// Vỏ thẻ của dashboard đồng bộ 100% với thẻ trên HomePage & AdminPage:
// Nền glassmorphism dash.panel, viền mảnh 1px dash.border, đổ bóng dash.shadows.card
// và dải tiêu đề đồng nhất toàn hệ thống.

import { Box, Stack, Typography, dash } from "../../ui";

/**
 * @param {string} title       tiêu đề khối
 * @param {string} [subtitle]  chú thích nhỏ bên phải tiêu đề
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
      boxShadow: dash.shadows.card,
      overflow: "hidden",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        borderColor: dash.borderStrong,
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
          py: 0.75,
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
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "6px",
              bgcolor: "rgba(59, 130, 246, 0.14)",
              color: dash.status.blue,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          sx={{
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.82rem",
            letterSpacing: 0.35,
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
              fontSize: "0.75rem",
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
        p: noPadding ? 0 : dense ? 0.75 : 1.25,
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
