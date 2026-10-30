// frontend/src/components/Sidebar.jsx
//
// THANH ĐIỀU HƯỚNG BÊN TRÁI (SIDEBAR) ĐỒNG BỘ THEME DEEP NAVY DASHBOARD

import { useLocation, useNavigate } from "react-router-dom";
import {
  AdminPanelSettings,
  Assessment,
  Avatar,
  Box,
  ChevronLeft,
  ChevronRight,
  Chip,
  dash,
  ExitToApp,
  Home,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Speed,
  Stack,
  Tooltip,
  Typography,
} from "../ui";
import { useAuth } from "../hooks/useAuth";

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 76;

const Sidebar = ({ collapsed, onToggleCollapse, isMobile, onCloseMobile }) => {
  const { user, permissions, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      label: "Trang chủ",
      path: "/",
      icon: <Home fontSize="small" />,
      description: "Tổng quan & lối tắt",
    },
    {
      label: "Dashboard QCO",
      path: "/dashboard",
      icon: <Assessment fontSize="small" />,
      description: "Hiệu suất & Ramp-up",
      badge: "Live",
    },
    ...(isAdmin
      ? [
          {
            label: "Trang Admin",
            path: "/admin",
            icon: <AdminPanelSettings fontSize="small" />,
            description: "Phân quyền người dùng",
            badge: "Admin",
          },
        ]
      : []),
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName =
    user?.ten_nv || user?.name || (user?.ma_nv ? `NV ${user.ma_nv}` : "Người dùng");

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box
      sx={{
        width: isMobile ? "100%" : width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: dash.bg,
        color: dash.ink,
        borderRight: `1px solid ${dash.border}`,
        transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "visible",
        position: "relative",
      }}
    >
      {/* ── 1. HEADER SIDEBAR (LOGO & TOGGLE) ───────────────────────────── */}
      <Box
        sx={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          px: collapsed ? 1 : 2.5,
          borderBottom: `1px solid ${dash.border}`,
          flexShrink: 0,
          background: "rgba(255, 255, 255, 0.02)",
          position: "relative",
          overflow: "visible",
        }}
      >
        <Tooltip
          title={collapsed ? "QCO System - Bấm để mở rộng" : ""}
          placement="right"
          disableHoverListener={!collapsed}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
              minWidth: 0,
            }}
            onClick={collapsed ? onToggleCollapse : () => handleNavClick("/")}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: dash.gradients.primary,
                border: `1px solid ${dash.borderStrong}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: dash.shadows.button,
                flexShrink: 0,
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: collapsed ? "scale(1.06)" : "none",
                },
              }}
            >
              <Speed sx={{ color: "#ffffff", fontSize: 22 }} />
            </Box>

            {!collapsed && (
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={800}
                  sx={{
                    color: "#ffffff",
                    letterSpacing: 0.8,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  QCO SYSTEM
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.75rem",
                    letterSpacing: 0.4,
                    display: "block",
                    whiteSpace: "nowrap",
                  }}
                >
                  Quick Change Over
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        {/* Nút thu nhỏ trên Desktop khi đang mở rộng (nằm gọn bên phải header) */}
        {!isMobile && !collapsed && (
          <Tooltip title="Thu gọn sidebar">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                color: dash.inkMuted,
                bgcolor: "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${dash.border}`,
                borderRadius: "8px",
                p: 0.5,
                "&:hover": {
                  color: "#ffffff",
                  bgcolor: "rgba(255, 255, 255, 0.12)",
                  borderColor: dash.borderStrong,
                },
              }}
            >
              <ChevronLeft fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        {/* Nút mở rộng trên Desktop khi đang thu gọn: Luôn ở trên (mép phải Header), không bị đè Logo */}
        {!isMobile && collapsed && (
          <Tooltip title="Mở rộng sidebar" placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{
                position: "absolute",
                right: -13,
                top: "50%",
                transform: "translateY(-50%)",
                width: 26,
                height: 26,
                borderRadius: "50%",
                bgcolor: dash.menu,
                border: `1px solid ${dash.borderStrong}`,
                color: "#cbd5e1",
                boxShadow: dash.shadows.button,
                zIndex: 1300,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#2563eb",
                  color: "#ffffff",
                  borderColor: "#60a5fa",
                  boxShadow: dash.shadows.buttonHover,
                  transform: "translateY(-50%) scale(1.12)",
                },
              }}
            >
              <ChevronRight sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ── 2. MENU ĐIỀU HƯỚNG ─────────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          py: 2,
          px: 1.5,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 2,
          },
        }}
      >
        {!collapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              mb: 1,
              display: "block",
              color: dash.inkMuted,
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            Chức năng chính
          </Typography>
        )}

        <List disablePadding>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            const buttonContent = (
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                selected={isActive}
                sx={{
                  minHeight: 46,
                  borderRadius: "10px",
                  mb: 0.75,
                  px: collapsed ? 1.5 : 2,
                  justifyContent: collapsed ? "center" : "flex-start",
                  bgcolor: isActive
                    ? "rgba(59, 130, 246, 0.16)"
                    : "transparent",
                  color: isActive ? "#ffffff" : dash.inkSoft,
                  border: isActive
                    ? `1px solid ${dash.borderStrong}`
                    : "1px solid transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    color: "#ffffff",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    transform: collapsed ? "none" : "translateX(2px)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: collapsed ? 0 : 36,
                    color: isActive ? dash.status.blue : dash.inkMuted,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {!collapsed && (
                  <>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "0.88rem",
                        color: "inherit",
                      }}
                      secondaryTypographyProps={{
                        fontSize: "0.75rem",
                        color: dash.inkMuted,
                      }}
                    />
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          bgcolor:
                            item.badge === "Live"
                              ? "rgba(34, 197, 94, 0.15)"
                              : "rgba(139, 92, 246, 0.18)",
                          color:
                            item.badge === "Live"
                              ? dash.status.good
                              : dash.status.purple,
                          border: `1px solid ${
                            item.badge === "Live"
                              ? "rgba(34, 197, 94, 0.3)"
                              : "rgba(139, 92, 246, 0.3)"
                          }`,
                        }}
                      />
                    )}
                  </>
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.path} disablePadding>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right">
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* ── 3. FOOTER SIDEBAR (THÔNG TIN TÀI KHOẢN & ĐĂNG XUẤT) ─────────── */}
      <Box
        sx={{
          p: collapsed ? 1.5 : 2,
          borderTop: `1px solid ${dash.border}`,
          bgcolor: dash.tile,
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <Tooltip title={`Đăng xuất (${displayName})`} placement="right">
            <IconButton
              onClick={handleLogout}
              sx={{
                width: 44,
                height: 44,
                color: dash.status.bad,
                mx: "auto",
                display: "flex",
                borderRadius: "10px",
                border: `1px solid ${dash.border}`,
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
              }}
            >
              <ExitToApp />
            </IconButton>
          </Tooltip>
        ) : (
          <Stack spacing={1.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  background: dash.gradients.primary,
                  border: `1px solid ${dash.borderStrong}`,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#ffffff",
                  boxShadow: dash.shadows.button,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: dash.inkMuted,
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: "0.75rem",
                  }}
                >
                  {user?.phongban_name ||
                    (user?.ma_nv ? `Mã NV: ${user.ma_nv}` : "")}
                </Typography>
              </Box>

              <Tooltip title="Đăng xuất">
                <IconButton
                  size="small"
                  onClick={handleLogout}
                  sx={{
                    color: dash.inkMuted,
                    "&:hover": {
                      color: dash.status.bad,
                      bgcolor: "rgba(239, 68, 68, 0.15)",
                    },
                  }}
                >
                  <ExitToApp fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Chip hiển thị quyền hạn */}
            {permissions && permissions.length > 0 && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {permissions.map((p) => {
                  const roleLabel =
                    p === "admin"
                      ? "Quản trị (ADMIN)"
                      : p === "edit"
                        ? "Kỹ thuật (EDIT)"
                        : p === "view"
                          ? "Xem báo cáo (VIEW)"
                          : p.toUpperCase();
                  return (
                    <Chip
                      key={p}
                      label={roleLabel}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        bgcolor:
                          p === "admin"
                            ? "rgba(139, 92, 246, 0.2)"
                            : "rgba(59, 130, 246, 0.2)",
                        color:
                          p === "admin"
                            ? dash.status.purple
                            : dash.status.blue,
                        border: `1px solid ${
                          p === "admin"
                            ? "rgba(139, 92, 246, 0.35)"
                            : "rgba(59, 130, 246, 0.35)"
                        }`,
                      }}
                    />
                  );
                })}
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default Sidebar;
