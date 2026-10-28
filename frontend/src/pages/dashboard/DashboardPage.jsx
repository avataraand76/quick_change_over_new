// frontend/src/pages/dashboard/DashboardPage.jsx
//
// TRANG DASHBOARD "TỔNG QUAN KẾT QUẢ CHUYỂN ĐỔI" - PHIÊN BẢN GIAO DIỆN ERP
//
// ĐẶC ĐIỂM BỐ CỤC & THEME:
// 1. Phù hợp 100vh ("nằm gọn trong 1 khung hình" trên màn hình Desktop/TV).
// 2. Responsive mượt mà: cuộn tự nhiên trên màn hình nhỏ / điện thoại.
// 3. Theme Deep Navy + Glassmorphism + Ambient Glows lấy cảm hứng từ ERP Dashboard.
// 4. Header hiện đại có Back button, Date chip, Group filter, Refresh spinner, Fullscreen toggle.
// 5. 5 thẻ KPI đầu trang hiển thị sắc nét các chỉ số cốt lõi.
// 6. Bảng chi tiết 3 ngày có sticky header & cuộn nội bộ êm ái qua thanh cuộn mỏng erp-scrollbar.
// 7. Khối biểu đồ cột có Tab Switcher chuyển đổi linh hoạt: Theo chuyền, Mã mới, Mã lặp lại, hoặc Song song.
// 8. Footer thanh trạng thái đồng bộ toàn nhà máy.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowBack,
  BarChart,
  Box,
  Button,
  CalendarMonth,
  Category,
  dash,
  dashStatusColor,
  Fullscreen,
  FullscreenExit,
  IconButton,
  Refresh,
  ShowChart,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  TrackChanges,
  TrendingUp,
  Typography,
} from "../../ui";
import DashPanel from "./DashPanel";
import LineChartSvg from "./LineChartSvg";
import BarChartSvg from "./BarChartSvg";
import { useDashboardData } from "./dashboardMockData";
import { useFitRows } from "./useFitRows";

// ══════════════════════════════════════════════════════════════════════════
// CÁC COMPONENT PHỤ TRỢ (COMPACT & GLASSMORPHIC)
// ══════════════════════════════════════════════════════════════════════════

/** Ô KPI dải đầu trang theo style ERP Dashboard */
const KpiCard = ({
  icon,
  label,
  value,
  valueUnit,
  sub,
  highlightColor,
  children,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      px: { xs: 1.25, xl: 1.5 },
      py: 0.85,
      background: dash.panel,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${dash.border}`,
      borderRadius: "10px",
      boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
      position: "relative",
      overflow: "hidden",
      height: "100%",
      minHeight: 0,
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
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
      },
    }}
  >
    {icon && (
      <Box
        sx={{
          width: { xs: 32, xl: 36 },
          height: { xs: 32, xl: 36 },
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: highlightColor
            ? `${highlightColor}18`
            : "rgba(59, 130, 246, 0.15)",
          color: highlightColor || dash.series[0],
          zIndex: 1,
        }}
      >
        {icon}
      </Box>
    )}
    <Box sx={{ flex: 1, minWidth: 0, zIndex: 1 }}>
      <Typography
        sx={{
          color: dash.inkMuted,
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>

      {value != null && (
        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography
            sx={{
              color: highlightColor || dash.ink,
              fontWeight: 800,
              fontSize: { xs: "1.25rem", xl: "1.45rem" },
              lineHeight: 1.1,
              letterSpacing: -0.2,
            }}
          >
            {value}
          </Typography>
          {valueUnit && (
            <Typography
              component="span"
              sx={{
                color: dash.inkMuted,
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              {valueUnit}
            </Typography>
          )}
        </Stack>
      )}

      {children}

      {sub && (
        <Typography
          sx={{
            color: dash.inkMuted,
            fontSize: "0.68rem",
            fontWeight: 500,
            lineHeight: 1.2,
            mt: 0.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {sub}
        </Typography>
      )}
    </Box>
  </Box>
);

/**
 * Ô bảng - chữ nhỏ, padding gọn, viền mảnh.
 *
 * Cỡ chữ và đệm đọc từ hai biến CSS do `useFitRows` ghi lên khung cuộn của
 * bảng chi tiết. Bảng nào không nằm trong khung đó thì biến không tồn tại và
 * giá trị dự phòng (0.72rem / 2.6px) được dùng - nên các bảng nhỏ khác giữ
 * nguyên mật độ, không bị co theo.
 */
const Cell = ({ children, color, bold, align = "center", sx, ...rest }) => (
  <TableCell
    align={align}
    sx={{
      color: color || dash.inkSoft,
      fontWeight: bold ? 700 : 500,
      fontSize: "var(--row-font, 0.72rem)",
      lineHeight: 1.35,
      borderColor: "rgba(255, 255, 255, 0.07)",
      px: 0.6,
      py: "var(--row-pad, 2.6px)",
      whiteSpace: "nowrap",
      ...sx,
    }}
    {...rest}
  >
    {children}
  </TableCell>
);

/** Ô tiêu đề bảng sticky */
const HeadCell = ({ children, sx, ...rest }) => (
  <TableCell
    align="center"
    sx={{
      color: "rgba(255, 255, 255, 0.95)",
      fontWeight: 700,
      // Cùng cơ chế biến CSS như <Cell>: bảng nào không nằm trong khung co
      // giãn thì dùng giá trị dự phòng.
      fontSize: "var(--head-font, 0.7rem)",
      letterSpacing: 0.3,
      // Nền ĐỤC: ô tiêu đề cũng dính (stickyHeader) nên cùng lý do như dòng tổng
      background: dash.rowHead,
      zIndex: 3,
      borderColor: "rgba(255, 255, 255, 0.1)",
      px: 0.6,
      py: 0.45,
      lineHeight: 1.2,
      ...sx,
    }}
    {...rest}
  >
    {children}
  </TableCell>
);

/** Thanh ngang tỷ lệ đạt ramp-up */
const HBar = ({ label, value, highlight }) => (
  // `flex: 1` + `minHeight: 0`: sáu thanh CHIA ĐỀU chiều cao khối. Để chiều
  // cao cố định thì khối thấp đi là hai thanh cuối bị cắt mất, mà người xem
  // không biết là còn thiếu.
  <Stack
    direction="row"
    spacing={1}
    alignItems="center"
    sx={{ flex: 1, minHeight: 0, py: 0, overflow: "hidden" }}
  >
    <Typography
      sx={{
        color: highlight ? "#ffffff" : dash.inkSoft,
        fontSize: "0.66rem",
        lineHeight: 1.2,
        fontWeight: highlight ? 700 : 500,
        width: 82,
        flexShrink: 0,
        textAlign: "right",
      }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        flex: 1,
        // Thanh phải THẤP HƠN hàng, nếu không hai thanh liền kề chạm nhau và
        // nhìn ra MỘT khối liền chứ không phải sáu thanh riêng.
        height: 7,
        flexShrink: 0,
        background: "rgba(255, 255, 255, 0.08)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${Math.min(value, 100)}%`,
          height: "100%",
          background: highlight
            ? "linear-gradient(90deg, #10b981 0%, #22c55e 100%)"
            : "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
          borderRadius: "4px",
          transition: "width .4s ease",
        }}
      />
    </Box>
    <Typography
      sx={{
        color: highlight ? dash.status.good : dash.ink,
        fontSize: "0.66rem",
        lineHeight: 1.2,
        fontWeight: 700,
        width: 38,
        flexShrink: 0,
        textAlign: "right",
      }}
    >
      {value}%
    </Typography>
  </Stack>
);

// ══════════════════════════════════════════════════════════════════════════
// COMPONENT CHÍNH CỦA TRANG
// ══════════════════════════════════════════════════════════════════════════

const DashboardPage = () => {
  const data = useDashboardData();
  const [selectedGroup, setSelectedGroup] = useState("TẤT CẢ");
  const [chartViewMode, setChartViewMode] = useState("line"); // 'line' (theo chuyền) | 'new' (mã mới) | 'repeat' (mã lặp) | 'split' (song song)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Lắng nghe trạng thái toàn màn hình
  useEffect(() => {
    const onFullscreenChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Lọc dữ liệu theo nhóm
  const rows = useMemo(
    () =>
      selectedGroup === "TẤT CẢ"
        ? data.rows
        : data.rows.filter((r) => r.group === selectedGroup),
    [data.rows, selectedGroup]
  );

  const barsByLine = useMemo(
    () =>
      rows.map((r) => ({
        label: r.to,
        value: r.hsbq3,
        flag: r.rampUp,
      })),
    [rows]
  );

  const barsMaMoi = useMemo(
    () =>
      rows
        .filter((r) => r.maMoi)
        .map((r) => ({ label: r.maMoi, value: r.hsbq3, flag: r.rampUp })),
    [rows]
  );

  const barsMaLap = useMemo(
    () =>
      rows
        .filter((r) => r.maLap)
        .map((r) => ({ label: r.maLap, value: r.hsbq3, flag: r.rampUp })),
    [rows]
  );

  const { kpi, dayTargets, hsbqTarget } = data;

  // +1 cho dòng tổng ở cuối thân mỗi bảng.
  // Hai bảng đo ĐỘC LẬP: mỗi hook ghi biến CSS lên khung cuộn của riêng nó,
  // nên bảng chi tiết co nhiều không kéo bảng nhóm co theo.
  const detailScrollRef = useFitRows(rows.length + 1);
  const groupScrollRef = useFitRows(data.groupSummary.length + 1);

  return (
    <Box
      sx={{
        width: "100vw",
        height: { xs: "auto", lg: "100vh" },
        maxHeight: { xs: "none", lg: "100vh" },
        overflow: { xs: "auto", lg: "hidden" },
        background: dash.bg,
        color: "#ffffff",
        p: { xs: 1, xl: 1.25 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1, xl: 1 },
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* ── AMBIENT GLOWS PHONG CÁCH ERP DASHBOARD (TỐI ƯU HIỆU NĂNG) ─────── */}
      <Box
        sx={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "50vw",
          height: "50vh",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.16) 0%, rgba(59, 130, 246, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "20%",
          right: "-10%",
          width: "45vw",
          height: "60vh",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.14) 0%, rgba(139, 92, 246, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          left: "20%",
          width: "45vw",
          height: "45vh",
          background: "radial-gradient(circle, rgba(0, 229, 255, 0.12) 0%, rgba(0, 229, 255, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
          transform: "translateZ(0)",
        }}
      />

      {/* ── 1. HEADER (TIÊU ĐỀ & ĐIỀU KHIỂN ĐỒNG BỘ ERP) ──────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          px: 1.5,
          py: 0.75,
          background: dash.panel,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${dash.border}`,
          borderRadius: "10px",
          boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.25)",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Cụm Trái: Nút Back cam + Tiêu đề + Phụ đề */}
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Tooltip title="Về trang chủ">
            <IconButton
              component={Link}
              to="/"
              size="small"
              sx={{
                background: "#f97316",
                color: "#ffffff",
                borderRadius: "8px",
                width: 34,
                height: 34,
                boxShadow: "0 4px 12px rgba(249, 115, 22, 0.35)",
                "&:hover": { background: "#ea580c" },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box>
            <Typography
              component="h1"
              sx={{
                color: "#ffffff",
                fontWeight: 800,
                fontSize: { xs: "1rem", sm: "1.15rem", xl: "1.25rem" },
                letterSpacing: 0.5,
                textTransform: "uppercase",
                lineHeight: 1.2,
              }}
            >
              TỔNG QUAN KẾT QUẢ CHUYỂN ĐỔI &ndash; QCO
            </Typography>
            <Typography
              sx={{
                color: dash.inkMuted,
                fontSize: { xs: "0.68rem", xl: "0.75rem" },
                fontWeight: 500,
              }}
            >
              Tổng quan hiệu suất 3 ngày &amp; tiến độ ramp-up theo thời gian
              thực
            </Typography>
          </Box>
        </Stack>

        {/* Cụm Phải: Khoảng thời gian + Bộ lọc nhóm + Nút Cập nhật + Toàn màn hình */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ flexWrap: "wrap" }}
        >
          {/* Thời gian */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{
              px: 1.25,
              py: 0.45,
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${dash.border}`,
              borderRadius: "8px",
            }}
          >
            <CalendarMonth sx={{ color: dash.series[0], fontSize: 18 }} />
            <Box>
              <Typography
                sx={{
                  color: dash.inkMuted,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                THỜI GIAN
              </Typography>
              <Typography
                sx={{ color: "#ffffff", fontSize: "0.72rem", fontWeight: 700 }}
              >
                {data.period.from} &ndash; {data.period.to}
              </Typography>
            </Box>
          </Stack>

          {/* Bộ chọn nhóm */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              p: 0.3,
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${dash.border}`,
              borderRadius: "8px",
            }}
          >
            {["TẤT CẢ", ...data.groups].map((g) => {
              const active = selectedGroup === g;
              const shortName =
                g === "TẤT CẢ"
                  ? "TẤT CẢ"
                  : g.replace("NHÓM ", "N").split(" - ")[0];
              return (
                <Button
                  key={g}
                  size="small"
                  onClick={() => setSelectedGroup(g)}
                  sx={{
                    minWidth: 0,
                    px: 1,
                    py: 0.3,
                    fontSize: "0.7rem",
                    fontWeight: active ? 700 : 500,
                    color: active ? "#ffffff" : dash.inkMuted,
                    background: active
                      ? "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
                      : "transparent",
                    borderRadius: "6px",
                    boxShadow: active
                      ? "0 2px 8px rgba(37, 99, 235, 0.4)"
                      : "none",
                    "&:hover": {
                      background: active
                        ? "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)"
                        : "rgba(255, 255, 255, 0.08)",
                      color: "#ffffff",
                    },
                  }}
                >
                  {shortName}
                </Button>
              );
            })}
          </Stack>

          {/* Cập nhật */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            onClick={handleRefresh}
            sx={{
              px: 1,
              py: 0.4,
              borderLeft: `1px solid ${dash.border}`,
              cursor: "pointer",
              "&:hover": { "& .refresh-icon": { color: "#60a5fa" } },
            }}
            title="Bấm để cập nhật dữ liệu"
          >
            <Refresh
              className="refresh-icon"
              sx={{
                color: dash.series[0],
                fontSize: 18,
                transition: "transform 0.4s ease",
                transform: isRefreshing ? "rotate(360deg)" : "none",
              }}
            />
            <Box>
              <Typography
                sx={{
                  color: dash.inkMuted,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                Cập nhật
              </Typography>
              <Typography
                sx={{ color: "#ffffff", fontSize: "0.72rem", fontWeight: 700 }}
              >
                {data.period.updatedAt}
              </Typography>
            </Box>
          </Stack>

          {/* Toàn màn hình */}
          <Tooltip
            title={isFullscreen ? "Thu nhỏ màn hình" : "Phóng to toàn màn hình"}
          >
            <IconButton
              onClick={handleToggleFullscreen}
              size="small"
              sx={{
                color: dash.inkSoft,
                border: `1px solid ${dash.border}`,
                borderRadius: "8px",
                width: 32,
                height: 32,
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                },
              }}
            >
              {isFullscreen ? (
                <FullscreenExit fontSize="small" />
              ) : (
                <Fullscreen fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── 2. DẢI 5 THẺ CHỈ SỐ KPI (ROW 1) ──────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 1,
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* KPI 1: Tổng lần chuyển đổi */}
        <KpiCard
          icon={<BarChart />}
          highlightColor={dash.status.blue}
          label="TỔNG CHUYỂN ĐỔI"
          value={kpi.totalChangeovers}
          valueUnit="lần"
          sub={`${data.groups.length} nhóm chuyền may`}
        />

        {/* KPI 2: HSBQ Chung toàn công ty */}
        <KpiCard
          icon={<ShowChart />}
          highlightColor={dashStatusColor(kpi.hsbqCompany, hsbqTarget)}
          label="HSBQ TOÀN CÔNG TY"
          value={`${kpi.hsbqCompany}%`}
          sub={`Mục tiêu: ${hsbqTarget}% (${kpi.hsbqCompany - hsbqTarget}%)`}
        />

        {/* KPI 3: HSBQ 3 Ngày liên tiếp */}
        <KpiCard
          icon={<TrendingUp />}
          highlightColor={dash.status.cyan}
          label="HSBQ 3 NGÀY ĐẦU"
          sub="Tiến độ tăng dần sau chuyển đổi"
        >
          <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
            {[
              ["N1", kpi.hsbqByDay.d1, dayTargets.d1],
              ["N2", kpi.hsbqByDay.d2, dayTargets.d2],
              ["N3", kpi.hsbqByDay.d3, dayTargets.d3],
            ].map(([lbl, v, t]) => (
              <Box key={lbl} sx={{ textAlign: "center" }}>
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                  }}
                >
                  {lbl}
                </Typography>
                <Typography
                  sx={{
                    color: dashStatusColor(v, t),
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    lineHeight: 1,
                  }}
                >
                  {v}%
                </Typography>
              </Box>
            ))}
          </Stack>
        </KpiCard>

        {/* KPI 4: HSBQ Theo mã hàng (Mới vs Lặp lại) */}
        <KpiCard
          icon={<Category />}
          highlightColor={dash.status.purple}
          label="MÃ MỚI VÀ LẶP LẠI"
          sub={`Mục tiêu chung: ${hsbqTarget}%`}
        >
          <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
            <Box>
              <Typography
                sx={{
                  color: dash.inkMuted,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                MÃ MỚI
              </Typography>
              <Typography
                sx={{
                  color: dashStatusColor(kpi.hsbqMaMoi, hsbqTarget),
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  lineHeight: 1,
                }}
              >
                {kpi.hsbqMaMoi}%
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  color: dash.inkMuted,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                LẶP LẠI
              </Typography>
              <Typography
                sx={{
                  color: dashStatusColor(kpi.hsbqMaLap, hsbqTarget),
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  lineHeight: 1,
                }}
              >
                {kpi.hsbqMaLap}%
              </Typography>
            </Box>
          </Stack>
        </KpiCard>

        {/* KPI 5: Tỷ lệ đạt Ramp-up */}
        <KpiCard
          icon={<TrackChanges />}
          highlightColor={dash.status.orange}
          label="TỶ LỆ ĐẠT RAMP-UP"
          value={`${kpi.rampUpAchieved}/${kpi.rampUpTotal}`}
          valueUnit={`(${((kpi.rampUpAchieved / kpi.rampUpTotal) * 100).toFixed(1)}%)`}
          sub="Lần chuyển đổi đạt mục tiêu"
        >
          <Box
            sx={{
              width: "100%",
              height: 4,
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "2px",
              mt: 0.4,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${(kpi.rampUpAchieved / kpi.rampUpTotal) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #f97316 0%, #fbbf24 100%)",
                borderRadius: "2px",
              }}
            />
          </Box>
        </KpiCard>
      </Box>

      {/* ── 3. KHU VỰC NỘI DUNG CHÍNH (FITS TRỌN VẸN TRONG 100VH) ───────────── */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 56fr) minmax(0, 44fr)",
          },
          position: "relative",
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* ────────── CỘT TRÁI (56%): BẢNG CHI TIẾT & TỔNG HỢP NHÓM ────────── */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
            minHeight: 0,
          }}
        >
          {/* Khối trên: bảng chi tiết. `flex: 1` để nuốt TRỌN phần chiều cao
              còn lại sau khi khối dưới đã lấy đúng phần cố định của nó - đây
              là bảng phải hiện đủ mọi dòng, nên nó được ưu tiên. */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DashPanel
              title="CHI TIẾT HIỆU SUẤT 3 NGÀY VÀ RAMP-UP THEO NHÓM CHUYỂN ĐỔI"
              icon={<BarChart fontSize="inherit" />}
              action={
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    px: 1,
                    py: 0.2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "4px",
                  }}
                >
                  {rows.length} lượt
                </Typography>
              }
              noPadding
            >
              <Box
                ref={detailScrollRef}
                sx={{
                  flex: 1,
                  minHeight: 0,
                  height: "100%",
                  // `overflowY` do useFitRows tự đặt sau khi đo: co vừa thì
                  // ẩn, chạm sàn cỡ chữ mà vẫn tràn thì cho cuộn.
                  overflowX: "auto",
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <HeadCell rowSpan={2}>STT</HeadCell>
                      <HeadCell rowSpan={2} sx={{ textAlign: "left", pl: 1 }}>
                        NHÓM &ndash; PHỤ TRÁCH
                      </HeadCell>
                      <HeadCell rowSpan={2}>TỔ</HeadCell>
                      <HeadCell colSpan={2}>MÃ HÀNG</HeadCell>
                      <HeadCell rowSpan={2}>
                        NGÀY VÀO <br /> CHUYỂN ĐỔI
                      </HeadCell>
                      <HeadCell colSpan={2}>NGÀY 1</HeadCell>
                      <HeadCell colSpan={2}>NGÀY 2</HeadCell>
                      <HeadCell colSpan={2}>NGÀY 3</HeadCell>
                      <HeadCell rowSpan={2}>HSBQ 3N</HeadCell>
                      <HeadCell rowSpan={2}>RAMP-UP</HeadCell>
                    </TableRow>
                    <TableRow>
                      <HeadCell>MÃ MỚI</HeadCell>
                      <HeadCell>LẶP LẠI</HeadCell>
                      <HeadCell>Mục tiêu</HeadCell>
                      <HeadCell>Thực tế</HeadCell>
                      <HeadCell>Mục tiêu</HeadCell>
                      <HeadCell>Thực tế</HeadCell>
                      <HeadCell>Mục tiêu</HeadCell>
                      <HeadCell>Thực tế</HeadCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow
                        key={r.stt}
                        sx={{
                          background:
                            i % 2 ? "rgba(255, 255, 255, 0.02)" : "transparent",
                          "&:hover": { background: "rgba(59, 130, 246, 0.12)" },
                          transition: "background 0.15s ease",
                        }}
                      >
                        <Cell>{r.stt}</Cell>
                        <Cell
                          align="left"
                          color="#ffffff"
                          sx={{ pl: 1, fontWeight: 600 }}
                        >
                          {r.group}
                        </Cell>
                        <Cell>{r.to}</Cell>
                        <Cell color={r.maMoi ? dash.ink : dash.inkMuted}>
                          {r.maMoi || "-"}
                        </Cell>
                        <Cell color={r.maLap ? dash.ink : dash.inkMuted}>
                          {r.maLap || "-"}
                        </Cell>
                        <Cell>{r.date}</Cell>
                        <Cell color={dash.inkMuted}>{dayTargets.d1}%</Cell>
                        <Cell bold color={dashStatusColor(r.d1, dayTargets.d1)}>
                          {r.d1}%
                        </Cell>
                        <Cell color={dash.inkMuted}>{dayTargets.d2}%</Cell>
                        <Cell bold color={dashStatusColor(r.d2, dayTargets.d2)}>
                          {r.d2}%
                        </Cell>
                        <Cell color={dash.inkMuted}>{dayTargets.d3}%</Cell>
                        <Cell bold color={dashStatusColor(r.d3, dayTargets.d3)}>
                          {r.d3}%
                        </Cell>
                        <Cell bold color={dashStatusColor(r.hsbq3, hsbqTarget)}>
                          {r.hsbq3}%
                        </Cell>
                        <Cell>
                          <Box
                            sx={{
                              display: "inline-block",
                              // ĐƠN VỊ `em`: thẻ co theo cỡ chữ của ô. Dùng
                              // rem/spacing cố định thì chính thẻ này giữ
                              // chiều cao dòng, cỡ chữ co mấy cũng vô ích.
                              px: "0.5em",
                              py: "0.05em",
                              borderRadius: "4px",
                              fontSize: "0.95em",
                              lineHeight: 1.3,
                              fontWeight: 800,
                              background: r.rampUp
                                ? "rgba(34, 197, 94, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                              color: r.rampUp
                                ? dash.status.good
                                : dash.status.bad,
                              border: `1px solid ${r.rampUp ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                            }}
                          >
                            {r.rampUp ? "Y" : "N"}
                          </Box>
                        </Cell>
                      </TableRow>
                    ))}

                    {/* Dòng tổng toàn công ty */}
                    <TableRow
                      sx={{
                        // `position: sticky` đặt trên <tr> KHÔNG có tác dụng -
                        // trình duyệt chỉ dính từng Ô. Nền cũng phải nằm trên ô
                        // và phải ĐỤC, nếu không chữ hàng dưới xuyên qua.
                        "& td": {
                          position: "sticky",
                          bottom: 0,
                          zIndex: 2,
                          background: dash.rowTotal,
                          borderTop: `2px solid ${dash.borderStrong}`,
                        },
                      }}
                    >
                      <Cell
                        colSpan={2}
                        bold
                        color="#ffffff"
                        align="left"
                        sx={{ pl: 1 }}
                      >
                        TRUNG BÌNH TOÀN CÔNG TY
                      </Cell>
                      <Cell bold color="#ffffff">
                        {rows.length}
                      </Cell>
                      <Cell colSpan={3} />
                      <Cell bold color={dash.inkMuted}>
                        {dayTargets.d1}%
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(kpi.hsbqByDay.d1, dayTargets.d1)}
                      >
                        {kpi.hsbqByDay.d1}%
                      </Cell>
                      <Cell bold color={dash.inkMuted}>
                        {dayTargets.d2}%
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(kpi.hsbqByDay.d2, dayTargets.d2)}
                      >
                        {kpi.hsbqByDay.d2}%
                      </Cell>
                      <Cell bold color={dash.inkMuted}>
                        {dayTargets.d3}%
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(kpi.hsbqByDay.d3, dayTargets.d3)}
                      >
                        {kpi.hsbqByDay.d3}%
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(kpi.hsbqCompany, hsbqTarget)}
                      >
                        {kpi.hsbqCompany}%
                      </Cell>
                      <Cell bold color={dash.status.warn}>
                        {kpi.rampUpAchieved}/{kpi.rampUpTotal}
                      </Cell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </DashPanel>
          </Box>

          {/* Khối dưới: hai thẻ con - lấy ĐÚNG MỘT phần chiều cao cố định rồi
              thôi, phần dư dồn hết cho bảng chi tiết ở trên.
              Dùng `vh` chứ không phải tỷ lệ flex: tỷ lệ flex thì màn hình càng
              thấp hai thẻ này càng bóp bảng chi tiết, trong khi chúng chỉ cần
              đủ chỗ cho 6 dòng là xong. `clamp` giữ trong khoảng dùng được. */}
          <Box
            sx={{
              flexShrink: 0,
              height: { xs: "auto", lg: "clamp(108px, 16vh, 210px)" },
              minHeight: 0,
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "minmax(0, 62fr) minmax(0, 38fr)",
              },
            }}
          >
            {/* Bảng phân tích theo nhóm */}
            <DashPanel
              title="PHÂN TÍCH KẾT QUẢ THEO NHÓM"
              icon={<BarChart fontSize="inherit" />}
              noPadding
            >
              <Box
                ref={groupScrollRef}
                sx={{ flex: 1, minHeight: 0, overflowX: "auto" }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <HeadCell sx={{ textAlign: "left", pl: 1 }}>
                        NHÓM
                      </HeadCell>
                      <HeadCell>SỐ LẦN</HeadCell>
                      <HeadCell>HSBQ 3N</HeadCell>
                      <HeadCell>RAMP-UP</HeadCell>
                      <HeadCell>MÃ MỚI</HeadCell>
                      <HeadCell>LẶP LẠI</HeadCell>
                      <HeadCell>XẾP LOẠI</HeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.groupSummary.map((g, i) => (
                      <TableRow
                        key={g.group}
                        sx={{
                          background:
                            i % 2 ? "rgba(255, 255, 255, 0.02)" : "transparent",
                          "&:hover": { background: "rgba(59, 130, 246, 0.1)" },
                        }}
                      >
                        <Cell
                          align="left"
                          color="#ffffff"
                          sx={{ pl: 1, fontWeight: 600 }}
                        >
                          {g.group}
                        </Cell>
                        <Cell>{g.count}</Cell>
                        <Cell bold color={dashStatusColor(g.hsbq3, hsbqTarget)}>
                          {g.hsbq3}%
                        </Cell>
                        <Cell>{g.rampUp}</Cell>
                        <Cell
                          bold
                          color={
                            g.maMoi == null
                              ? dash.inkMuted
                              : dashStatusColor(g.maMoi, hsbqTarget)
                          }
                        >
                          {g.maMoi == null ? "-" : `${g.maMoi}%`}
                        </Cell>
                        <Cell
                          bold
                          color={
                            g.maLap == null
                              ? dash.inkMuted
                              : dashStatusColor(g.maLap, hsbqTarget)
                          }
                        >
                          {g.maLap == null ? "-" : `${g.maLap}%`}
                        </Cell>
                        <Cell>
                          <Typography
                            component="span"
                            sx={{
                              // `em` để chip co theo cỡ chữ của ô. Dùng rem /
                              // spacing cố định thì chính chip này giữ chiều
                              // cao dòng, cỡ chữ co mấy cũng không hẹp lại.
                              fontSize: "0.92em",
                              lineHeight: 1.3,
                              fontWeight: 700,
                              color: dash.status.bad,
                              px: "0.4em",
                              py: "0.05em",
                              borderRadius: "4px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.2)",
                            }}
                          >
                            {g.rating}
                          </Typography>
                        </Cell>
                      </TableRow>
                    ))}
                    <TableRow
                      sx={{
                        background: "rgba(6, 30, 68, 0.85)",
                        borderTop: "1px solid rgba(59, 130, 246, 0.25)",
                      }}
                    >
                      <Cell align="left" bold color="#ffffff" sx={{ pl: 1 }}>
                        TOÀN CÔNG TY
                      </Cell>
                      <Cell bold color="#ffffff">
                        {data.companySummary.count}
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(
                          data.companySummary.hsbq3,
                          hsbqTarget
                        )}
                      >
                        {data.companySummary.hsbq3}%
                      </Cell>
                      <Cell bold color="#ffffff">
                        {data.companySummary.rampUp}
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(
                          data.companySummary.maMoi,
                          hsbqTarget
                        )}
                      >
                        {data.companySummary.maMoi}%
                      </Cell>
                      <Cell
                        bold
                        color={dashStatusColor(
                          data.companySummary.maLap,
                          hsbqTarget
                        )}
                      >
                        {data.companySummary.maLap}%
                      </Cell>
                      <Cell>-</Cell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </DashPanel>

            {/* Thanh so sánh tỷ lệ đạt ramp-up */}
            <DashPanel
              title="SO SÁNH TỶ LỆ ĐẠT RAMP-UP"
              icon={<BarChart fontSize="inherit" />}
              dense
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  py: 0.25,
                }}
              >
                {data.groupSummary.map((g) => (
                  <HBar
                    key={g.group}
                    label={g.group.split(" - ")[0]}
                    value={g.rampUpPct}
                  />
                ))}
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    borderTop: "1px dashed rgba(255, 255, 255, 0.1)",
                    mt: 0.25,
                    pt: 0.25,
                  }}
                >
                  <HBar
                    label="Toàn công ty"
                    value={data.companySummary.rampUpPct}
                    highlight
                  />
                </Box>
              </Box>
            </DashPanel>
          </Box>
        </Box>

        {/* ────────── CỘT PHẢI (44%): BIỂU ĐỒ ĐƯỜNG & BIỂU ĐỒ CỘT ────────── */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            height: "100%",
            minHeight: 0,
          }}
        >
          {/* Thẻ trên (46%): Biểu đồ đường HSBQ 6 tháng gần nhất */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <DashPanel
              title="SO SÁNH HSBQ 6 THÁNG GẦN NHẤT"
              icon={<ShowChart fontSize="inherit" />}
              action={
                <Typography
                  sx={{
                    color: dash.inkMuted,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    px: 0.8,
                    py: 0.2,
                    background: "rgba(255, 255, 255, 0.05)",
                    borderRadius: "4px",
                  }}
                >
                  Mục tiêu: {hsbqTarget}%
                </Typography>
              }
              dense
            >
              <Box sx={{ flex: 1, minHeight: 0, height: "100%" }}>
                <LineChartSvg
                  categories={data.months}
                  series={data.monthlySeries}
                  companySeries={data.companySeries}
                  target={hsbqTarget}
                />
              </Box>
            </DashPanel>
          </Box>

          {/* Thẻ dưới (54%): Biểu đồ cột linh hoạt với Tab Switcher */}
          <Box sx={{ flex: 1.15, minHeight: 0 }}>
            <DashPanel
              title="PHÂN TÍCH KẾT QUẢ THEO CHUYỀN &amp; MÃ HÀNG"
              icon={<BarChart fontSize="inherit" />}
              action={
                /* Bộ chuyển tab xem biểu đồ để giữ dashboard trọn vẹn 1 khung hình */
                <Stack
                  direction="row"
                  spacing={0.4}
                  sx={{
                    background: "rgba(255, 255, 255, 0.05)",
                    p: 0.3,
                    borderRadius: "6px",
                    border: `1px solid ${dash.border}`,
                  }}
                >
                  {[
                    { id: "line", label: `CHUYỀN (${barsByLine.length})` },
                    { id: "new", label: `MÃ MỚI (${barsMaMoi.length})` },
                    { id: "repeat", label: `LẶP LẠI (${barsMaLap.length})` },
                    { id: "split", label: "SONG SONG" },
                  ].map((tab) => {
                    const active = chartViewMode === tab.id;
                    return (
                      <Button
                        key={tab.id}
                        size="small"
                        onClick={() => setChartViewMode(tab.id)}
                        sx={{
                          px: 0.8,
                          py: 0.2,
                          fontSize: "0.66rem",
                          fontWeight: active ? 700 : 500,
                          minWidth: 0,
                          // Không cho vỡ dòng: "SONG SONG" từng tụt xuống hai
                          // hàng làm dải tab cao gấp đôi và lệch tiêu đề.
                          whiteSpace: "nowrap",
                          lineHeight: 1.4,
                          borderRadius: "4px",
                          color: active ? "#ffffff" : dash.inkMuted,
                          background: active
                            ? "rgba(59, 130, 246, 0.8)"
                            : "transparent",
                          boxShadow: active
                            ? "0 2px 6px rgba(59, 130, 246, 0.3)"
                            : "none",
                          "&:hover": {
                            background: active
                              ? "rgba(59, 130, 246, 0.9)"
                              : "rgba(255, 255, 255, 0.08)",
                          },
                        }}
                      >
                        {tab.label}
                      </Button>
                    );
                  })}
                </Stack>
              }
              dense
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {chartViewMode === "line" && (
                  <Box sx={{ flex: 1, minHeight: 0, height: "100%" }}>
                    <BarChartSvg bars={barsByLine} target={hsbqTarget} />
                  </Box>
                )}

                {chartViewMode === "new" && (
                  <Box sx={{ flex: 1, minHeight: 0, height: "100%" }}>
                    <BarChartSvg
                      bars={barsMaMoi}
                      target={hsbqTarget}
                      flagLabel="Mã mới / Khác mã hàng"
                    />
                  </Box>
                )}

                {chartViewMode === "repeat" && (
                  <Box sx={{ flex: 1, minHeight: 0, height: "100%" }}>
                    <BarChartSvg
                      bars={barsMaLap}
                      target={hsbqTarget}
                      flagLabel="Mã lặp lại / Cùng mã hàng"
                    />
                  </Box>
                )}

                {chartViewMode === "split" && (
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      flex: 1,
                      minHeight: 0,
                      height: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${dash.border}`,
                        borderRadius: "8px",
                        p: 0.75,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        height: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#ffffff",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textAlign: "center",
                          mb: 0.25,
                        }}
                      >
                        MÃ MỚI / KHÁC MÃ HÀNG
                      </Typography>
                      <Box sx={{ flex: 1, minHeight: 0 }}>
                        <BarChartSvg bars={barsMaMoi} target={hsbqTarget} />
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        background: "rgba(255, 255, 255, 0.02)",
                        border: `1px solid ${dash.border}`,
                        borderRadius: "8px",
                        p: 0.75,
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 0,
                        height: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#ffffff",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textAlign: "center",
                          mb: 0.25,
                        }}
                      >
                        MÃ LẶP LẠI / CÙNG MÃ HÀNG
                      </Typography>
                      <Box sx={{ flex: 1, minHeight: 0 }}>
                        <BarChartSvg bars={barsMaLap} target={hsbqTarget} />
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            </DashPanel>
          </Box>
        </Box>
      </Box>

      {/* ── 4. FOOTER STATUS BAR (ĐỒNG BỘ PHONG CÁCH ERP DASHBOARD) ───────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          minHeight: 32,
          px: 2,
          py: 0.4,
          background: dash.panel,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: `1px solid ${dash.border}`,
          borderRadius: "8px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ flexWrap: "nowrap", overflow: "hidden" }}
        >
          <Typography
            sx={{
              color: "#ffffff",
              fontWeight: 800,
              fontSize: { xs: "0.72rem", xl: "0.8rem" },
              letterSpacing: 0.5,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            TỔNG QUAN CHUYỂN ĐỔI
          </Typography>

          <Box
            sx={{
              width: "1px",
              height: 14,
              background: "rgba(255, 255, 255, 0.18)",
              flexShrink: 0,
            }}
          />

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ whiteSpace: "nowrap" }}
          >
            <Typography sx={{ color: dash.inkMuted, fontSize: "0.7rem" }}>
              Chuyền tham gia:
            </Typography>
            <Typography
              sx={{ color: "#ffffff", fontSize: "0.72rem", fontWeight: 700 }}
            >
              {rows.length}
            </Typography>
          </Stack>

          <Box
            sx={{
              width: "1px",
              height: 14,
              background: "rgba(255, 255, 255, 0.18)",
              flexShrink: 0,
            }}
          />

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ whiteSpace: "nowrap" }}
          >
            <Typography sx={{ color: dash.inkMuted, fontSize: "0.7rem" }}>
              Nhóm:
            </Typography>
            <Typography
              sx={{ color: "#ffffff", fontSize: "0.72rem", fontWeight: 700 }}
            >
              {data.groups.length}
            </Typography>
          </Stack>

          <Box
            sx={{
              width: "1px",
              height: 14,
              background: "rgba(255, 255, 255, 0.18)",
              flexShrink: 0,
            }}
          />

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ whiteSpace: "nowrap" }}
          >
            <Typography sx={{ color: dash.inkMuted, fontSize: "0.7rem" }}>
              Đạt Ramp-up:
            </Typography>
            <Typography
              sx={{
                color: dash.status.warn,
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {kpi.rampUpAchieved}/{kpi.rampUpTotal} (
              {((kpi.rampUpAchieved / kpi.rampUpTotal) * 100).toFixed(1)}%)
            </Typography>
          </Stack>

          <Box
            sx={{
              width: "1px",
              height: 14,
              background: "rgba(255, 255, 255, 0.18)",
              flexShrink: 0,
            }}
          />

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ whiteSpace: "nowrap" }}
          >
            <Typography sx={{ color: dash.inkMuted, fontSize: "0.7rem" }}>
              HSBQ toàn cty:
            </Typography>
            <Typography
              sx={{
                color: dashStatusColor(kpi.hsbqCompany, hsbqTarget),
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {kpi.hsbqCompany}%
            </Typography>
          </Stack>
        </Stack>

        <Typography
          sx={{
            color: "#f97316",
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: "0.7rem",
            whiteSpace: "nowrap",
            display: { xs: "none", md: "block" },
          }}
        >
          Dữ liệu chính xác &ndash; Quyết định kịp thời &ndash; Hiệu quả vượt
          trội
        </Typography>
      </Box>
    </Box>
  );
};

export default DashboardPage;
