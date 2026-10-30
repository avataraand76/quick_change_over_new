// frontend/src/components/MainLayout.jsx
//
// KHUNG GIAO DIỆN CHÍNH ĐỒNG BỘ THEME DEEP NAVY + GLASSMORPHISM VỚI DASHBOARD

import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  dash,
  Drawer,
  IconButton,
  MenuIcon,
  Toolbar,
  Typography,
  useResponsive,
} from "../ui";
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from "./Sidebar";

const SIDEBAR_STORAGE_KEY = "qco_sidebar_collapsed";

const MainLayout = ({
  children,
  title,
  subtitle,
  headerActions,
  fullHeight = false,
  hideChrome = false,
}) => {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { belowMd: isMobile } = useResponsive();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Bỏ qua nếu trình duyệt chặn localStorage
      }
      return next;
    });
  };

  const getPageTitle = () => {
    if (title) return title;
    if (location.pathname === "/") return "Tổng quan hệ thống";
    if (location.pathname === "/admin") return "Trang Quản Trị";
    if (location.pathname === "/dashboard") return "Dashboard Báo Cáo";
    return "QCO System";
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100dvh",
        maxHeight: "100dvh",
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
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)",
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
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)",
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
          background:
            "radial-gradient(circle, rgba(0, 229, 255, 0.10) 0%, rgba(0, 229, 255, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />

      {/* ── 1. SIDEBAR CHO DESKTOP ───────────────────────────────────────── */}
      {!isMobile && !hideChrome && (
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
      {isMobile && !hideChrome && (
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
          overflowY: fullHeight ? { xs: "auto", lg: "hidden" } : "auto",
          overflowX: "hidden",
          position: "relative",
          zIndex: 1,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Top Header Glassmorphic chuẩn ERP Dashboard */}
        {!hideChrome && (
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
              flexShrink: 0,
            }}
          >
            <Toolbar
              sx={{
                px: { xs: 2, sm: 3 },
                minHeight: { xs: 56, sm: 62 },
                gap: 1.5,
                flexWrap: "wrap",
                py: { xs: 0.75, sm: 0 },
              }}
            >
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={handleDrawerToggle}
                  sx={{ mr: 1, color: dash.series[0] }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              <Box sx={{ flexGrow: 1, minWidth: 180 }}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.12rem" },
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
                      display: { xs: "none", md: "block" },
                      fontSize: "0.75rem",
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>

              {headerActions && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {headerActions}
                </Box>
              )}
            </Toolbar>
          </AppBar>
        )}

        {/* Nội dung trang */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minHeight: 0,
            display: fullHeight ? "flex" : "block",
            flexDirection: fullHeight ? "column" : undefined,
            overflow: fullHeight ? { xs: "visible", lg: "hidden" } : "visible",
            p: fullHeight
              ? { xs: 1.25, sm: 1.5, xl: 2 }
              : { xs: 2, sm: 3, lg: 3.5 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
