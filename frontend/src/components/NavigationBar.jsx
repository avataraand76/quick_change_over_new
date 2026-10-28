// frontend/src/components/NavigationBar.jsx
//
// THANH ĐIỀU HƯỚNG CHUNG CỦA HỆ THỐNG QCO (THAM KHẢO THEO TPM).

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AdminPanelSettings,
  AppBar,
  Avatar,
  Assessment,
  Box,
  dash,
  Divider,
  ExitToApp,
  Home,
  IconButton,
  Menu,
  MenuIcon,
  MenuItem,
  radii,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useResponsive,
} from "../ui";
import { useAuth } from "../hooks/useAuth";

const NavigationBar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileAnchorEl, setMobileAnchorEl] = useState(null);

  const { belowLg: isMobile } = useResponsive();

  const navItems = [
    { label: "TRANG CHỦ", icon: <Home fontSize="small" />, route: "/" },
    {
      label: "DASHBOARD",
      icon: <Assessment fontSize="small" />,
      route: "/dashboard",
    },
    ...(isAdmin
      ? [
          {
            label: "TRANG ADMIN",
            icon: <AdminPanelSettings fontSize="small" />,
            route: "/admin",
          },
        ]
      : []),
  ];

  const getCurrentTabIndex = () => {
    const pathname = location.pathname;
    const idx = navItems.findIndex((item) => item.route === pathname);
    return idx >= 0 ? idx : 0;
  };

  const handleTabChange = (event, newValue) => {
    if (newValue < navItems.length) {
      navigate(navItems[newValue].route);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate("/login");
  };

  const handleMobileMenuOpen = (event) => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileAnchorEl(null);
  };

  const handleMobileNav = (route) => {
    navigate(route);
    handleMobileMenuClose();
  };

  if (!isAuthenticated) {
    return null;
  }

  const displayName =
    user?.ten_nv || user?.name || (user?.ma_nv ? `NV ${user.ma_nv}` : "Người dùng");

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: dash.panel,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${dash.border}`,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ py: 0.5, px: { xs: 1.5, sm: 3 } }}>
        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 1, color: dash.status.blue }}
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: 0.5,
              }}
            >
              QCO System
            </Typography>
          </>
        ) : (
          <>
            {/* Logo thương hiệu */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mr: { lg: 3, xl: 4 },
                cursor: "pointer",
              }}
              onClick={() => navigate("/")}
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  mr: 1.5,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                }}
              >
                <Assessment sx={{ color: "white", fontSize: 22 }} />
              </Avatar>
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: 0.8,
                  textShadow: "0 2px 4px rgba(0,0,0,0.25)",
                }}
              >
                QCO System
              </Typography>
            </Box>

            {/* Navigation Tabs (Desktop) */}
            <Box sx={{ flexGrow: 1 }}>
              <Tabs
                value={getCurrentTabIndex()}
                onChange={handleTabChange}
                textColor="inherit"
                sx={{
                  "& .MuiTab-root": {
                    color: dash.inkSoft,
                    fontWeight: 700,
                    fontSize: { lg: "0.88rem", xl: "0.95rem" },
                    minWidth: { lg: 120, xl: 135 },
                    borderRadius: `${radii.md}px`,
                    margin: "0 4px",
                    px: { lg: 1.5, xl: 2 },
                    py: 1,
                    minHeight: 44,
                    transition: "all 0.25s ease",
                    "&.Mui-selected": {
                      color: "#ffffff",
                      background: "rgba(59, 130, 246, 0.2)",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)",
                    },
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.08)",
                      transform: "translateY(-1px)",
                    },
                  },
                  "& .MuiTabs-indicator": {
                    display: "none",
                  },
                }}
              >
                {navItems.map((item) => (
                  <Tab
                    key={item.route}
                    icon={item.icon}
                    label={item.label}
                    iconPosition="start"
                  />
                ))}
              </Tabs>
            </Box>
          </>
        )}

        {/* Cụm thông tin tài khoản bên phải */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              alignItems: "center",
              bgcolor: "rgba(255, 255, 255, 0.05)",
              borderRadius: `${radii.pill}px`,
              px: 1.5,
              py: 0.5,
              border: `1px solid ${dash.border}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: dash.inkSoft, fontWeight: 600 }}
            >
              Xin chào, <strong style={{ color: dash.status.amber }}>{displayName}</strong>
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              p: 0.5,
              border: `2px solid rgba(59, 130, 246, 0.4)`,
              "&:hover": {
                borderColor: dash.status.blue,
                background: "rgba(59, 130, 246, 0.15)",
              },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: dash.series[0],
                fontSize: "0.95rem",
                fontWeight: 700,
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Box>

        {/* Menu người dùng dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: `${radii.md}px`,
              bgcolor: "#072048",
              color: dash.ink,
              border: `1px solid ${dash.border}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              backdropFilter: "blur(16px)",
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#ffffff" }}>
              {displayName}
            </Typography>
            {user?.ma_nv && (
              <Typography variant="caption" sx={{ color: dash.inkMuted, display: "block" }}>
                Mã NV: {user.ma_nv}
              </Typography>
            )}
            {user?.phongban_name && (
              <Typography variant="caption" sx={{ color: dash.inkMuted, display: "block" }}>
                {user.phongban_name}
              </Typography>
            )}
          </Box>
          <Divider sx={{ borderColor: dash.border }} />
          <MenuItem onClick={handleLogout} sx={{ color: dash.status.bad, py: 1.2, "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" } }}>
            <ExitToApp fontSize="small" sx={{ mr: 1 }} />
            Đăng xuất
          </MenuItem>
        </Menu>

        {/* Menu Mobile */}
        <Menu
          anchorEl={mobileAnchorEl}
          open={Boolean(mobileAnchorEl)}
          onClose={handleMobileMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
              borderRadius: `${radii.md}px`,
              bgcolor: "#072048",
              color: dash.ink,
              border: `1px solid ${dash.border}`,
            },
          }}
        >
          {navItems.map((item) => (
            <MenuItem
              key={item.route}
              onClick={() => handleMobileNav(item.route)}
              selected={location.pathname === item.route}
              sx={{
                py: 1.2,
                "&.Mui-selected": { bgcolor: "rgba(59, 130, 246, 0.25)" },
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              <Box sx={{ mr: 1.5, display: "flex", color: dash.status.blue }}>
                {item.icon}
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: "#ffffff" }}>
                {item.label}
              </Typography>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;
