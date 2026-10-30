// frontend/src/pages/HomePage.jsx
//
// TRANG CHỦ HỆ THỐNG QCO - ĐỒNG BỘ THEME DEEP NAVY + GLASSMORPHISM VỚI DASHBOARD

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdminPanelSettings,
  Alert,
  ArrowForward,
  Assessment,
  Box,
  Button,
  Chip,
  Container,
  dash,
  dashStatusColor,
  Grid,
  InfoOutlined,
  PlaylistAddCheck,
  Security,
  ShowChart,
  Snackbar,
  Speed,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TrackChanges,
  TrendingUp,
  Typography,
  Warning,
} from "../ui";
import MainLayout from "../components/MainLayout";
import { useAuth } from "../hooks/useAuth";
import { useDashboardData } from "./dashboard/dashboardMockData";

const HomePage = () => {
  const { user, isAdmin, canEdit } = useAuth();
  const navigate = useNavigate();
  const data = useDashboardData();
  const [infoNotice, setInfoNotice] = useState("");

  const displayName =
    user?.ten_nv ||
    user?.name ||
    (user?.ma_nv ? `NV ${user.ma_nv}` : "Người dùng");

  const todayStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const { kpi, hsbqTarget, period } = data;
  const periodLabel = `${period.from} – ${period.to}`;
  const rampUpPct =
    kpi.rampUpTotal > 0
      ? ((kpi.rampUpAchieved / kpi.rampUpTotal) * 100).toFixed(1)
      : "0.0";

  // Danh sách 5 chuyền có HSBQ 3 ngày thấp nhất cần chú ý hỗ trợ kỹ thuật
  const attentionRows = useMemo(() => {
    return [...data.rows]
      .filter((r) => !r.rampUp)
      .sort((a, b) => a.hsbq3 - b.hsbq3)
      .slice(0, 5);
  }, [data.rows]);

  // Thẻ điều hướng chức năng đồng bộ màu chuẩn ERP (độ tương phản >= 4.5:1)
  const quickNavCards = [
    {
      title: "Dashboard Báo Cáo QCO",
      subtitle: "Hiệu suất chuyển đổi & Ramp-up",
      description:
        "Theo dõi trực quan kết quả 3 ngày đầu chuyển đổi, biểu đồ HSBQ theo từng chuyền may và phân tích tỷ lệ mã mới vs lặp lại theo thời gian thực.",
      icon: <Assessment sx={{ fontSize: 28 }} />,
      color: dash.status.blue,
      gradient: dash.gradients.primary,
      gradientHover: dash.gradients.primaryHover,
      glowBg: "rgba(59, 130, 246, 0.14)",
      borderColor: "rgba(59, 130, 246, 0.35)",
      actionLabel: "Truy cập Dashboard",
      onAction: () => navigate("/dashboard"),
      show: true,
      badge: "Trực tuyến",
    },
    {
      title: "Kế Hoạch Chuyển Đổi",
      subtitle: "Mã hàng & Chuyền may",
      description:
        "Theo dõi danh mục kế hoạch chuẩn bị máy móc, công đoạn may mẫu và bố trí thiết bị phục vụ chuyển đổi nhanh trong xưởng may.",
      icon: <PlaylistAddCheck sx={{ fontSize: 28 }} />,
      color: dash.status.good,
      gradient: dash.gradients.success,
      gradientHover: dash.gradients.success,
      glowBg: "rgba(34, 197, 94, 0.14)",
      borderColor: "rgba(34, 197, 94, 0.35)",
      actionLabel: "Xem thông tin phân hệ",
      onAction: () =>
        setInfoNotice(
          "Phân hệ Lập kế hoạch chuyển đổi đang được tích hợp CSDL xưởng may. Vui lòng theo dõi kết quả thực tế tại Dashboard Báo Cáo QCO."
        ),
      show: true,
      badge: "Đang phát triển",
    },
    {
      title: "Trang Quản Trị & Phân Quyền",
      subtitle: "Phân quyền cán bộ công nhân viên",
      description:
        "Tìm kiếm nhân viên trong hệ thống nhân sự, cấp quyền Quản trị (Admin), Nhập liệu (Edit) hoặc Xem (View) theo mô hình phân quyền nhà máy.",
      icon: <AdminPanelSettings sx={{ fontSize: 28 }} />,
      color: dash.status.purple,
      gradient: dash.gradients.purple,
      gradientHover: dash.gradients.purple,
      glowBg: "rgba(139, 92, 246, 0.14)",
      borderColor: "rgba(139, 92, 246, 0.35)",
      actionLabel: "Vào Trang Admin",
      onAction: () => navigate("/admin"),
      show: isAdmin,
      badge: "Quản trị",
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
            boxShadow: dash.shadows.panel,
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
          <Grid
            container
            spacing={3}
            alignItems="center"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ mb: 1.5 }}
                alignItems="center"
                flexWrap="wrap"
              >
                <Chip
                  label={todayStr}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.08)",
                    border: `1px solid ${dash.border}`,
                    color: dash.inkSoft,
                    fontWeight: 600,
                    fontSize: "0.75rem",
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
                      fontSize: "0.75rem",
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
                Xin chào, {displayName}
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
                Hệ thống theo dõi tiến độ chuyển đổi mã hàng (Quick Change
                đầu ({periodLabel}) và quản lý phân quyền vận hành nhà máy.
              </Typography>

              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mt: 3 }}
                flexWrap="wrap"
              >
                <Button
                  variant="contained"
                  onClick={() => navigate("/dashboard")}
                  startIcon={<Assessment />}
                  sx={{
                    background: dash.gradients.primary,
                    color: "#ffffff",
                    fontWeight: 700,
                    px: 3,
                    py: 1,
                    borderRadius: "8px",
                    boxShadow: dash.shadows.button,
                    "&:hover": {
                      background: dash.gradients.primaryHover,
                      transform: "translateY(-1px)",
                      boxShadow: dash.shadows.buttonHover,
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
                      borderColor: "rgba(139, 92, 246, 0.45)",
                      background: "rgba(139, 92, 246, 0.14)",
                      fontWeight: 700,
                      px: 2.5,
                      py: 1,
                      borderRadius: "8px",
                      "&:hover": {
                        borderColor: dash.status.purple,
                        background: "rgba(139, 92, 246, 0.24)",
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
              sx={{
                display: { xs: "none", md: "flex" },
                justifyContent: "center",
              }}
            >
              <Box
                sx={{
                  width: 124,
                  height: 124,
                  borderRadius: "50%",
                  bgcolor: "rgba(59, 130, 246, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: dash.shadows.card,
                  border: `2px solid ${dash.borderStrong}`,
                }}
              >
                <Speed sx={{ fontSize: 64, color: dash.series[0] }} />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ── 2. DẢI 4 THẺ THỐNG KÊ NHANH ĐỒNG BỘ DỮ LIỆU THỰC VỚI DASHBOARD ── */}
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
                boxShadow: dash.shadows.card,
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: dash.borderStrong },
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  TỔNG LƯỢT CHUYỂN ĐỔI
                </Typography>
                <Typography
                  sx={{
                    color: "#ffffff",
                    fontWeight: 800,
                    fontSize: "1.35rem",
                    lineHeight: 1.15,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {kpi.totalChangeovers}{" "}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.75rem",
                      color: dash.inkMuted,
                      fontWeight: 600,
                    }}
                  >
                  </Typography>
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
                boxShadow: dash.shadows.card,
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: dash.borderStrong },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "8px",
                  bgcolor: "rgba(239, 68, 68, 0.14)",
                  color: dashStatusColor(kpi.hsbqCompany, hsbqTarget),
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  HSBQ TOÀN CÔNG TY
                </Typography>
                <Typography
                  sx={{
                    color: dashStatusColor(kpi.hsbqCompany, hsbqTarget),
                    fontWeight: 800,
                    fontSize: "1.35rem",
                    lineHeight: 1.15,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {kpi.hsbqCompany}%{" "}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.75rem",
                      color: dash.inkMuted,
                      fontWeight: 600,
                    }}
                  >
                    (Mục tiêu {hsbqTarget}%)
                  </Typography>
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
                boxShadow: dash.shadows.card,
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: dash.borderStrong },
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  TỶ LỆ ĐẠT RAMP-UP
                </Typography>
                <Typography
                  sx={{
                    color: dash.status.orange,
                    fontWeight: 800,
                    fontSize: "1.35rem",
                    lineHeight: 1.15,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {kpi.rampUpAchieved}/{kpi.rampUpTotal}{" "}
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "0.75rem",
                      color: dash.inkMuted,
                      fontWeight: 600,
                    }}
                  >
                    ({rampUpPct}%)
                  </Typography>
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
                boxShadow: dash.shadows.card,
                display: "flex",
                alignItems: "center",
                gap: 1.75,
                transition: "all 0.2s ease",
                "&:hover": { borderColor: dash.borderStrong },
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                  }}
                >
                  QUYỀN HẠN CỦA BẠN
                </Typography>
                <Typography
                  sx={{
                    color: dash.status.purple,
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    lineHeight: 1.15,
                  }}
                >
                  {isAdmin
                    ? "Quản trị (ADMIN)"
                    : canEdit
                      ? "Kỹ thuật (EDIT)"
                      : "Xem báo cáo (VIEW)"}
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
                      boxShadow: dash.shadows.card,
                      p: 3,
                      display: "flex",
                      flexDirection: "column",
                      transition: "all 0.25s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        borderColor: card.borderColor,
                        boxShadow: dash.shadows.panel,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
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
                          boxShadow: dash.shadows.button,
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
                            fontSize: "0.75rem",
                            bgcolor: card.glowBg,
                            color: card.color,
                            border: `1px solid ${card.borderColor}`,
                          }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="h6"
                      fontWeight={800}
                      color="#ffffff"
                      gutterBottom
                    >
                      {card.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        color: card.color,
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        mb: 1,
                        display: "block",
                      }}
                    >
                      {card.subtitle}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: dash.inkSoft,
                        mb: 3,
                        flexGrow: 1,
                        lineHeight: 1.6,
                      }}
                    >
                      {card.description}
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={card.onAction}
                      endIcon={<ArrowForward />}
                      sx={{
                        background: card.gradient,
                        borderRadius: "8px",
                        fontWeight: 700,
                        py: 1.1,
                        color: "#ffffff",
                        boxShadow: dash.shadows.button,
                        "&:hover": {
                          background: card.gradientHover,
                          transform: "translateY(-1px)",
                          boxShadow: dash.shadows.buttonHover,
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

        {/* ── 4. CHUYỀN CẦN CHÚ Ý & CƠ CHẾ PHÂN QUYỀN ─────────────────────── */}
        <Grid container spacing={2.5}>
          {/* Bảng cảnh báo nhanh các chuyền có HSBQ thấp nhất kỳ */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Box
              sx={{
                p: 2.5,
                height: "100%",
                borderRadius: "10px",
                background: dash.panel,
                backdropFilter: "blur(12px)",
                border: `1px solid ${dash.border}`,
                boxShadow: dash.shadows.card,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1.5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Warning sx={{ color: dash.status.warn, fontSize: 20 }} />
                  <Typography variant="h6" fontWeight={800} color="#ffffff">
                    Chuyền Cần Chú Ý (HSBQ Dưới Ngưỡng {hsbqTarget}%)
                  </Typography>
                </Stack>
                <Button
                  size="small"
                  onClick={() => navigate("/dashboard")}
                  endIcon={<ArrowForward fontSize="small" />}
                  sx={{
                    color: dash.status.blue,
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  Chi tiết
                </Button>
              </Stack>

              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: dash.inkMuted,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderBottom: `1px solid ${dash.border}`,
                        }}
                      >
                        NHÓM &ndash; PHỤ TRÁCH
                      </TableCell>
                      <TableCell
                        sx={{
                          color: dash.inkMuted,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderBottom: `1px solid ${dash.border}`,
                        }}
                      >
                        TỔ
                      </TableCell>
                      <TableCell
                        sx={{
                          color: dash.inkMuted,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderBottom: `1px solid ${dash.border}`,
                        }}
                      >
                        MÃ HÀNG
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: dash.inkMuted,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderBottom: `1px solid ${dash.border}`,
                        }}
                      >
                        NGÀY 1 / 2 / 3
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: dash.inkMuted,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          borderBottom: `1px solid ${dash.border}`,
                        }}
                      >
                        HSBQ 3N
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attentionRows.map((row) => (
                      <TableRow
                        key={row.stt}
                        sx={{
                          "&:hover": { bgcolor: "rgba(59, 130, 246, 0.08)" },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: "#ffffff",
                            fontWeight: 600,
                            fontSize: "0.82rem",
                            borderBottom: `1px solid ${dash.border}`,
                          }}
                        >
                          {row.group}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: dash.inkSoft,
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            borderBottom: `1px solid ${dash.border}`,
                          }}
                        >
                          {row.to}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: dash.inkSoft,
                            fontSize: "0.82rem",
                            borderBottom: `1px solid ${dash.border}`,
                          }}
                        >
                          {row.maMoi || row.maLap}{" "}
                          <Typography
                            component="span"
                            sx={{
                              color: dash.inkMuted,
                              fontSize: "0.75rem",
                            }}
                          >
                            ({row.maMoi ? "Mới" : "Lặp"})
                          </Typography>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: dash.inkMuted,
                            fontSize: "0.82rem",
                            borderBottom: `1px solid ${dash.border}`,
                          }}
                        >
                          {row.d1}% / {row.d2}% / {row.d3}%
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: dash.status.bad,
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            borderBottom: `1px solid ${dash.border}`,
                          }}
                        >
                          {row.hsbq3}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Grid>

          {/* Cơ chế phân quyền hệ thống */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Box
              sx={{
                p: 2.5,
                height: "100%",
                borderRadius: "10px",
                background: dash.panel,
                backdropFilter: "blur(12px)",
                border: `1px solid ${dash.border}`,
                boxShadow: dash.shadows.card,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  mb: 1.5,
                }}
              >
                <InfoOutlined sx={{ color: dash.series[0] }} />
                <Typography variant="h6" fontWeight={800} color="#ffffff">
                  Cấp Độ Phân Quyền QCO
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: "rgba(139, 92, 246, 0.08)",
                    border: "1px solid rgba(139, 92, 246, 0.25)",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={0.5}
                  >
                    <Chip
                      label="ADMIN"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        background: dash.gradients.purple,
                        color: "#ffffff",
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#ffffff"
                    >
                      Quản trị viên hệ thống
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: dash.inkMuted,
                      fontSize: "0.75rem",
                      display: "block",
                    }}
                  >
                    Tìm kiếm nhân sự và cấp/thu hồi quyền cho toàn nhà máy.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: "rgba(59, 130, 246, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={0.5}
                  >
                    <Chip
                      label="EDIT"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        background: dash.gradients.primary,
                        color: "#ffffff",
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#ffffff"
                    >
                      Kỹ thuật &amp; Kế hoạch
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: dash.inkMuted,
                      fontSize: "0.75rem",
                      display: "block",
                    }}
                  >
                    Nhập liệu, cập nhật kế hoạch chuyển đổi và thông số chuyền
                    may.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: "rgba(34, 197, 94, 0.08)",
                    border: "1px solid rgba(34, 197, 94, 0.25)",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={0.5}
                  >
                    <Chip
                      label="VIEW"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        background: dash.gradients.success,
                        color: "#ffffff",
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="#ffffff"
                    >
                      Xem báo cáo điều hành
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: dash.inkMuted,
                      fontSize: "0.75rem",
                      display: "block",
                    }}
                  >
                    Tra cứu báo cáo tổng hợp, theo dõi HSBQ và tỷ lệ đạt
                    ramp-up.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={Boolean(infoNotice)}
        autoHideDuration={4500}
        onClose={() => setInfoNotice("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setInfoNotice("")}
          severity="info"
          variant="filled"
          sx={{ borderRadius: "8px", fontWeight: 600 }}
        >
          {infoNotice}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default HomePage;
