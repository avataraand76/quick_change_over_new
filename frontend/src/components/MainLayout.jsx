// frontend/src/components/MainLayout.jsx
//
// KHUNG GIAO DIỆN CHÍNH ĐỒNG BỘ THEME DEEP NAVY + GLASSMORPHISM VỚI DASHBOARD

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  dash,
  Drawer,
  IconButton,
  MenuIcon,
  Stack,
  Toolbar,
  Typography,
  useResponsive,
} from "../ui";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";
import { useAuth } from "../hooks/useAuth";

const MainLayout = ({ children, title, subtitle }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { belowMd: isMobile } = useResponsive();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const getPageTitle = () => {
    if (title) return title;
    if (location.pathname === "/") return "Tổng quan hệ thống";
    if (location.pathname === "/admin") return "Trang Quản Trị";
    if (location.pathname === "/dashboard") return "Dashboard Báo Cáo";
    return "QCO System";
  };

  const displayName =
    user?.ten_nv || user?.name || (user?.ma_nv ? `NV ${user.ma_nv}` : "Người dùng");

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        bgcolor: dash.bg,
        color: dash.ink,
        position: "relative",
      }}
    >
      {/* ── AMBIENT GLOWS TỐI ƯU HIỆU NĂNG (DÙNG RADIAL GRADIENT KHÔNG GÂY LAG GPU) ── */}
      <Box
        sx={{
          position: "fixed",
          top: "-15%",
          left: "-10%",
          width: "55vw",
          height: "55vh",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />
      <Box
        sx={{
          position: "fixed",
          top: "20%",
          right: "-10%",
          width: "50vw",
          height: "60vh",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: "-15%",
          left: "20%",
          width: "50vw",
          height: "50vh",
          background: "radial-gradient(circle, rgba(0, 229, 255, 0.10) 0%, rgba(0, 229, 255, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />

      {/* ── 1. SIDEBAR CHO DESKTOP ───────────────────────────────────────── */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{
            width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            flexShrink: 0,
            height: "100%",
            zIndex: (theme) => theme.zIndex.drawer,
            transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "visible",
            position: "relative",
          }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={handleToggleCollapse}
            isMobile={false}
          />
        </Box>
      )}

      {/* ── 2. SIDEBAR DRAWER CHO MOBILE ─────────────────────────────────── */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: SIDEBAR_WIDTH,
              bgcolor: dash.bg,
              borderRight: `1px solid ${dash.border}`,
            },
          }}
        >
          <Sidebar
            collapsed={false}
            isMobile={true}
            onCloseMobile={handleDrawerToggle}
          />
        </Drawer>
      )}

      {/* ── 3. KHU VỰC NỘI DUNG CHÍNH ─────────────────────────────────────── */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          zIndex: 1,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Top Header Glassmorphic chuẩn ERP Dashboard */}
        <AppBar
          position="sticky"
          top={0}
          elevation={0}
          sx={{
            background: dash.panel,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            borderBottom: `1px solid ${dash.border}`,
            color: dash.ink,
            zIndex: (theme) => theme.zIndex.appBar,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 3 }, minHeight: { xs: 58, sm: 64 } }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, color: dash.series[0] }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1rem", sm: "1.15rem" },
                  color: "#ffffff",
                  lineHeight: 1.2,
                  letterSpacing: 0.3,
                }}
              >
                {getPageTitle()}
              </Typography>
              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: dash.inkMuted,
                    display: { xs: "none", sm: "block" },
                    fontSize: "0.72rem",
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* Thông tin user góc phải */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  flexDirection: "column",
                  alignItems: "flex-end",
                  px: 1.25,
                  py: 0.35,
                  borderRadius: "8px",
                  bgcolor: "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${dash.border}`,
                }}
              >
                <Typography variant="body2" fontWeight={700} sx={{ color: "#ffffff", fontSize: "0.82rem" }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: dash.inkMuted, fontSize: "0.68rem" }}>
                  {user?.phongban_name || "Nhà máy Việt Long Hưng"}
                </Typography>
              </Box>

              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/")}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Nội dung trang */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, lg: 3.5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
