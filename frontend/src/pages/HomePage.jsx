// frontend/src/pages/HomePage.jsx
//
// TRANG CHỦ HỆ THỐNG QCO - ĐỒNG BỘ THEME DEEP NAVY + GLASSMORPHISM VỚI DASHBOARD

import { useNavigate } from "react-router-dom";
import {
  AdminPanelSettings,
  ArrowForward,
  Assessment,
  Box,
  Button,
  Chip,
  Container,
  dash,
  Grid,
  InfoOutlined,
  PlaylistAddCheck,
  Security,
  ShowChart,
  Speed,
  Stack,
  TrackChanges,
  TrendingUp,
  Typography,
} from "../ui";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../hooks/useAuth";

const HomePage = () => {
  const { user, isAdmin, canEdit } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.ten_nv || user?.name || (user?.ma_nv ? `NV ${user.ma_nv}` : "Người dùng");

  const todayStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  // Thẻ điều hướng chức năng đồng bộ màu chuẩn ERP
  const quickNavCards = [
    {
      title: "Dashboard Báo Cáo QCO",
      subtitle: "Hiệu suất chuyển đổi & Ramp-up",
      description:
        "Theo dõi trực quan kết quả 3 ngày đầu chuyển đổi, biểu đồ HSBQ theo từng chuyền may và phân tích tỷ lệ mã mới vs lặp lại theo thời gian thực.",
      icon: <Assessment sx={{ fontSize: 28 }} />,
      color: dash.status.blue,
      gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
      glowBg: "rgba(59, 130, 246, 0.12)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      actionLabel: "Truy cập Dashboard",
      path: "/dashboard",
      show: true,
      badge: "Realtime",
    },
    {
      title: "Kế Hoạch Chuyển Đổi",
      subtitle: "Mã hàng & Chuyền may",
      description:
        "Theo dõi danh mục kế hoạch chuẩn bị máy móc, công đoạn may mẫu và bố trí thiết bị phục vụ chuyển đổi nhanh trong xưởng may.",
      icon: <PlaylistAddCheck sx={{ fontSize: 28 }} />,
      color: dash.status.good,
      gradient: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)",
      glowBg: "rgba(34, 197, 94, 0.12)",
      borderColor: "rgba(34, 197, 94, 0.3)",
      actionLabel: "Xem chi tiết",
      path: "/dashboard",
      show: true,
    },
    {
      title: "Trang Quản Trị & Phân Quyền",
      subtitle: "Phân quyền cán bộ công nhân viên",
      description:
        "Tìm kiếm nhân viên trong hệ thống nhân sự, cấp quyền Quản trị (Admin), Nhập liệu (Edit) hoặc Xem (View) theo mô hình phân quyền TPM.",
      icon: <AdminPanelSettings sx={{ fontSize: 28 }} />,
      color: dash.status.purple,
      gradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
      glowBg: "rgba(139, 92, 246, 0.12)",
      borderColor: "rgba(139, 92, 246, 0.3)",
      actionLabel: "Vào Trang Admin",
      path: "/admin",
      show: isAdmin,
      badge: "Admin Only",
    },
  ];

  return (
    <MainLayout
      title="Tổng quan hệ thống"
      subtitle="Hệ thống quản lý chuyển đổi mã hàng QCO - Công ty May Việt Long Hưng"
    >
      <Container maxWidth="xl" disableGutters>
        {/* ── 1. HERO BANNER CHÀO MỪNG (GLASSMORPHIC ERP HERO) ──────────── */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            mb: 3,
            borderRadius: "10px",
            background: dash.panel,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: `1px solid ${dash.borderStrong}`,
            color: "#ffffff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.32)",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)",
              pointerEvents: "none",
              zIndex: 0,
            },
          }}
        >
          <Grid container spacing={3} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} alignItems="center" flexWrap="wrap">
                <Chip
                  label={todayStr}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    border: `1px solid ${dash.border}`,
                    color: dash.inkSoft,
                    fontWeight: 600,
                    fontSize: "0.72rem",
                  }}
                />
                {user?.phongban_name && (
                  <Chip
                    label={user.phongban_name}
                    size="small"
                    sx={{
                      bgcolor: "rgba(245, 158, 11, 0.15)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      color: dash.status.warn,
                      fontWeight: 700,
                      fontSize: "0.72rem",
                    }}
                  />
                )}
              </Stack>

              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.35rem", sm: "1.75rem", md: "1.95rem" },
                  lineHeight: 1.25,
                  mb: 1,
                  letterSpacing: -0.2,
                }}
              >
                Xin chào, {displayName}! 👋
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: dash.inkSoft,
                  fontSize: { xs: "0.85rem", sm: "0.95rem" },
                  maxWidth: 680,
                  lineHeight: 1.55,
                }}
              >
                Chào mừng bạn đến với Hệ thống QCO (Quick Change Over). Theo dõi tiến độ
                chuyển đổi mã hàng, hiệu suất chuyền may và phân quyền quản trị hệ thống.
              </Typography>

              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => navigate("/dashboard")}
                  startIcon={<Assessment />}
                  sx={{
                    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                    color: "#ffffff",
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Xem Dashboard Báo Cáo
                </Button>

                {isAdmin && (
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/admin")}
                    startIcon={<AdminPanelSettings />}
                    sx={{
                      color: "#ffffff",
                      borderColor: "rgba(139, 92, 246, 0.4)",
                      background: "rgba(139, 92, 246, 0.12)",
                      fontWeight: 700,
                      px: 2.5,
                      py: 1,
                      borderRadius: "8px",
                      "&:hover": {
                        borderColor: dash.status.purple,
                        background: "rgba(139, 92, 246, 0.22)",
                      },
                    }}
                  >
                    Trang Quản Trị
                  </Button>
                )}
              </Stack>
            </Grid>

            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}
            >
              <Box
                sx={{
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  bgcolor: "rgba(59, 130, 246, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                  border: "2px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <Speed sx={{ fontSize: 68, color: dash.series[0] }} />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ── 2. DẢI 4 THẺ THỐNG KÊ NHANH (ERP KPI CARDS) ──────────────── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* KPI 1 */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                background: dash.panel,
                backdropFilter: "blur(12px)",
                border: `1px solid ${dash.border}`,
                boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "rgba(59, 130, 246, 0.35)" },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  bgcolor: "rgba(59, 130, 246, 0.15)",
                  color: dash.status.blue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShowChart />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  TỔNG LƯỢT CHUYỂN ĐỔI
                </Typography>
                <Typography sx={{ color: "#ffffff", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.1 }}>
                  14 <Typography component="span" sx={{ fontSize: "0.75rem", color: dash.inkMuted, fontWeight: 600 }}>lần</Typography>
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* KPI 2 */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                background: dash.panel,
                backdropFilter: "blur(12px)",
                border: `1px solid ${dash.border}`,
                boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "rgba(34, 197, 94, 0.35)" },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  bgcolor: "rgba(34, 197, 94, 0.15)",
                  color: dash.status.good,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TrendingUp />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  HSBQ TOÀN CÔNG TY
                </Typography>
                <Typography sx={{ color: dash.status.good, fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.1 }}>
                  68.5%
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* KPI 3 */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                background: dash.panel,
                backdropFilter: "blur(12px)",
                border: `1px solid ${dash.border}`,
                boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "rgba(249, 115, 22, 0.35)" },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  bgcolor: "rgba(249, 115, 22, 0.15)",
                  color: dash.status.orange,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TrackChanges />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  TỶ LỆ ĐẠT RAMP-UP
                </Typography>
                <Typography sx={{ color: dash.status.orange, fontWeight: 800, fontSize: "1.35rem", lineHeight: 1.1 }}>
                  11/14 <Typography component="span" sx={{ fontSize: "0.75rem", color: dash.inkMuted, fontWeight: 600 }}>(78.6%)</Typography>
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* KPI 4 */}
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                background: dash.panel,
                backdropFilter: "blur(12px)",
                border: `1px solid ${dash.border}`,
                boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "rgba(139, 92, 246, 0.35)" },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  bgcolor: "rgba(139, 92, 246, 0.15)",
                  color: dash.status.purple,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Security />
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  QUYỀN HẠN CỦA BẠN
                </Typography>
                <Typography sx={{ color: dash.status.purple, fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.1 }}>
                  {isAdmin ? "ADMIN (Toàn quyền)" : canEdit ? "EDIT (Chỉnh sửa)" : "VIEW (Chỉ xem)"}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ── 3. KHỐI ĐIỀU HƯỚNG NHANH (CARDS) ────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Speed sx={{ color: dash.series[0], fontSize: 22 }} />
            <Typography variant="h6" fontWeight={800} color="#ffffff">
              Chức Năng &amp; Điều Hướng Nhanh
            </Typography>
          </Box>

          <Grid container spacing={2.5}>
            {quickNavCards
              .filter((card) => card.show)
              .map((card) => (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={card.title}>
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: "10px",
                      background: dash.panel,
                      backdropFilter: "blur(12px)",
                      border: `1px solid ${dash.border}`,
                      boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: card.color,
                        boxShadow: `0 12px 30px rgba(0, 0, 0, 0.4)`,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "10px",
                          background: card.gradient,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        }}
                      >
                        {card.icon}
                      </Box>

                      {card.badge && (
                        <Chip
                          label={card.badge}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            bgcolor: card.glowBg,
                            color: card.color,
                            border: `1px solid ${card.borderColor}`,
                          }}
                        />
                      )}
                    </Box>

                    <Typography variant="h6" fontWeight={800} color="#ffffff" gutterBottom>
                      {card.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{ color: card.color, textTransform: "uppercase", letterSpacing: 0.5, mb: 1, display: "block" }}
                    >
                      {card.subtitle}
                    </Typography>

                    <Typography variant="body2" sx={{ color: dash.inkSoft, mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
                      {card.description}
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={() => navigate(card.path)}
                      endIcon={<ArrowForward />}
                      sx={{
                        background: card.gradient,
                        borderRadius: "8px",
                        fontWeight: 700,
                        py: 1.1,
                        color: "#ffffff",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
                        "&:hover": {
                          transform: "translateY(-1px)",
                          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.35)",
                        },
                      }}
                    >
                      {card.actionLabel}
                    </Button>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* ── 4. THÔNG TIN PHÂN QUYỀN HỆ THỐNG ────────────────────────────── */}
        <Box
          sx={{
            p: 3,
            borderRadius: "10px",
            background: dash.panel,
            backdropFilter: "blur(12px)",
            border: `1px solid ${dash.border}`,
            boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
            <InfoOutlined sx={{ color: dash.series[0] }} />
            <Typography variant="h6" fontWeight={800} color="#ffffff">
              Cơ Chế Phân Quyền Trong Hệ Thống QCO
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ color: dash.inkSoft, mb: 2.5 }}>
            Hệ thống phân quyền được đồng bộ trực tiếp với CSDL Nhân sự và quản lý theo 3 cấp độ:
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "8px",
                  bgcolor: "rgba(139, 92, 246, 0.08)",
                  border: "1px solid rgba(139, 92, 246, 0.25)",
                }}
              >
                <Chip
                  label="ADMIN"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: dash.status.purple,
                    color: "white",
                    mb: 1,
                  }}
                />
                <Typography variant="body2" fontWeight={700} color="#ffffff" gutterBottom>
                  Quản trị viên toàn hệ thống
                </Typography>
                <Typography variant="caption" sx={{ color: dash.inkMuted, display: "block" }}>
                  Có quyền truy cập trang Admin, tìm kiếm nhân viên và gán/thu hồi phân quyền cho toàn bộ nhân sự.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "8px",
                  bgcolor: "rgba(59, 130, 246, 0.08)",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                }}
              >
                <Chip
                  label="EDIT"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: dash.status.blue,
                    color: "white",
                    mb: 1,
                  }}
                />
                <Typography variant="body2" fontWeight={700} color="#ffffff" gutterBottom>
                  Quyền chỉnh sửa dữ liệu
                </Typography>
                <Typography variant="caption" sx={{ color: dash.inkMuted, display: "block" }}>
                  Được phép thêm mới và cập nhật dữ liệu kế hoạch chuyển đổi, thiết lập thông số kỹ thuật chuyền may.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "8px",
                  bgcolor: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                }}
              >
                <Chip
                  label="VIEW"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: dash.status.good,
                    color: "white",
                    mb: 1,
                  }}
                />
                <Typography variant="body2" fontWeight={700} color="#ffffff" gutterBottom>
                  Quyền xem báo cáo
                </Typography>
                <Typography variant="caption" sx={{ color: dash.inkMuted, display: "block" }}>
                  Được phép tra cứu báo cáo tổng hợp, theo dõi chỉ số HSBQ và tỷ lệ đạt ramp-up trên dashboard.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default HomePage;
