// frontend/src/pages/dashboard/DashboardPage.jsx
//
// TRANG DASHBOARD "TỔNG QUAN KẾT QUẢ CHUYỂN ĐỔI" - ĐỒNG BỘ 100% VỚI MAINLAYOUT & THEME TOÀN HỆ THỐNG
//
// ĐẶC ĐIỂM BỐ CỤC & THEME:
// 1. Tích hợp trực tiếp vào MainLayout (có Sidebar & AppBar đồng nhất với Trang chủ và Trang Admin).
// 2. Khi bật chế độ Toàn màn hình (Fullscreen cho TV nhà xưởng), tự động ẩn Sidebar/AppBar để tối đa không gian.
// 3. Phù hợp 100dvh ("nằm gọn trong 1 khung hình" trên màn hình Desktop/TV) và cuộn mượt trên màn hình nhỏ.
// 4. Giữ nguyên cấu trúc bảng chi tiết 14 cột (MÃ HÀNG -> MÃ MỚI, LẶP LẠI và NGÀY 1/2/3 -> Mục tiêu, Thực tế).

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Box,
  Button,
  ButtonBase,
  CalendarMonth,
  Category,
  Chip,
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
import MainLayout from "../../components/MainLayout";
import DashPanel from "./DashPanel";
import LineChartSvg from "./LineChartSvg";
import BarChartSvg from "./BarChartSvg";
import { useDashboardData } from "./dashboardMockData";
import { useFitRows } from "./useFitRows";

// ══════════════════════════════════════════════════════════════════════════
// CÁC COMPONENT PHỤ TRỢ ĐỒNG BỘ THEME VỚI HOMEPAGE & ADMINPAGE
// ══════════════════════════════════════════════════════════════════════════

/** Ô KPI dải đầu trang đồng bộ kiểu dáng thẻ KPI với HomePage */
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
      gap: 1.5,
      px: { xs: 1.5, xl: 1.75 },
      py: 1.1,
      background: dash.panel,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${dash.border}`,
      borderRadius: "10px",
      boxShadow: dash.shadows.card,
      position: "relative",
      overflow: "hidden",
      height: "100%",
      minHeight: 0,
      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        borderColor: dash.borderStrong,
      },
    }}
  >
    {icon && (
      <Box
        sx={{
          width: { xs: 38, xl: 42 },
          height: { xs: 38, xl: 42 },
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: highlightColor
            ? `${highlightColor}22`
            : "rgba(59, 130, 246, 0.15)",
          color: highlightColor || dash.status.blue,
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
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          lineHeight: 1.2,
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
              fontSize: { xs: "1.25rem", xl: "1.38rem" },
              lineHeight: 1.15,
              letterSpacing: -0.2,
              fontVariantNumeric: "tabular-nums",
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
            fontSize: "0.75rem",
            fontWeight: 500,
            lineHeight: 1.2,
            mt: 0.25,
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
 * Ô bảng - chữ đọc từ biến CSS do `useFitRows` ghi lên khung cuộn của
 * bảng chi tiết để vừa khít khung hình.
 */
const Cell = ({ children, color, bold, align = "center", sx, ...rest }) => (
  <TableCell
    align={align}
    sx={{
      color: color || dash.inkSoft,
      fontWeight: bold ? 700 : 500,
      fontSize: "var(--row-font, 0.82rem)",
      lineHeight: 1.35,
      borderBottom: `1px solid ${dash.border}`,
      px: 0.85,
      py: "var(--row-pad, 4.5px)",
      whiteSpace: "nowrap",
      ...sx,
    }}
    {...rest}
  >
    {children}
  </TableCell>
);

/**
 * Ô tiêu đề bảng sticky đồng bộ màu nền đục dash.rowHead.
 * Hỗ trợ bảng tiêu đề 2 tầng (row 1 ở top: 0, row 2 ở top: 30px) không bị đè hoặc hở khi cuộn.
 */
const HeadCell = ({
  children,
  rowSpan,
  colSpan,
  secondRow = false,
  sx,
  ...rest
}) => (
  <TableCell
    align="center"
    rowSpan={rowSpan}
    colSpan={colSpan}
    sx={{
      position: "sticky",
      top: secondRow ? 30 : 0,
      height: rowSpan === 2 ? 60 : 30,
      color: "#ffffff",
      fontWeight: 700,
      fontSize: "var(--head-font, 0.8rem)",
      letterSpacing: 0.25,
      background: dash.rowHead,
      zIndex: rowSpan === 2 ? 6 : 5,
      borderBottom:
        rowSpan === 2 || secondRow
          ? `2px solid ${dash.borderStrong}`
          : `1px solid rgba(255, 255, 255, 0.14)`,
      borderRight: `1px solid rgba(255, 255, 255, 0.08)`,
      px: 0.75,
      py: 0,
      lineHeight: 1.2,
      whiteSpace: "nowrap",
      boxSizing: "border-box",
      ...sx,
    }}
    {...rest}
  >
    {children}
  </TableCell>
);

/** Thanh ngang tỷ lệ đạt ramp-up */
const HBar = ({ label, value, highlight }) => (
  <Stack
    direction="row"
    spacing={1.25}
    alignItems="center"
    sx={{ flex: 1, minHeight: 0, py: 0.2, overflow: "hidden" }}
  >
    <Typography
      sx={{
        color: highlight ? "#ffffff" : dash.inkSoft,
        fontSize: "0.82rem",
        lineHeight: 1.25,
        fontWeight: highlight ? 700 : 600,
        width: 92,
        flexShrink: 0,
        textAlign: "right",
      }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        flex: 1,
        height: 9,
        flexShrink: 0,
        background: "rgba(255, 255, 255, 0.08)",
        borderRadius: "5px",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${Math.min(value, 100)}%`,
          height: "100%",
          background: highlight
            ? dash.gradients.success
            : dash.gradients.primary,
          borderRadius: "5px",
          transition: "width .4s ease",
        }}
      />
    </Box>
    <Typography
      sx={{
        color: highlight ? dash.status.good : dash.ink,
        fontSize: "0.82rem",
        lineHeight: 1.25,
        fontWeight: 700,
        width: 44,
        flexShrink: 0,
        textAlign: "right",
        fontVariantNumeric: "tabular-nums",
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
  const [chartViewMode, setChartViewMode] = useState("line");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(data.period.updatedAt);

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
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      const dateStr = new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now);
      const timeStr = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(now);
      setLastUpdated(`${dateStr} ${timeStr}`);
    }, 600);
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

  const { dayTargets, hsbqTarget } = data;

  // Tính toán KPI động theo nhóm đang chọn
  const activeKpi = useMemo(() => {
    if (selectedGroup === "TẤT CẢ" || rows.length === 0) {
      return data.kpi;
    }
    const avg = (arr) =>
      arr.length
        ? Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length)
        : null;
    const maMoiVals = rows.filter((r) => r.maMoi).map((r) => r.hsbq3);
    const maLapVals = rows.filter((r) => r.maLap).map((r) => r.hsbq3);
    return {
      totalChangeovers: rows.length,
      hsbqCompany: avg(rows.map((r) => r.hsbq3)) ?? 0,
      hsbqByDay: {
        d1: avg(rows.map((r) => r.d1)) ?? 0,
        d2: avg(rows.map((r) => r.d2)) ?? 0,
        d3: avg(rows.map((r) => r.d3)) ?? 0,
      },
      hsbqMaMoi: avg(maMoiVals),
      hsbqMaLap: avg(maLapVals),
      rampUpAchieved: rows.filter((r) => r.rampUp).length,
      rampUpTotal: rows.length,
    };
  }, [selectedGroup, rows, data.kpi]);

  const detailScrollRef = useFitRows(rows.length + 1);
  const groupScrollRef = useFitRows(data.groupSummary.length + 1);

  // Cụm điều khiển lọc nhóm, kỳ báo cáo, làm mới và toàn màn hình dùng chung
  const toolbarControls = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ flexWrap: "wrap" }}
    >
      {/* Thời gian */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.75}
        sx={{
          px: 1.25,
          py: 0.4,
          background: dash.tile,
          border: `1px solid ${dash.border}`,
          borderRadius: "8px",
        }}
      >
        <CalendarMonth sx={{ color: dash.status.blue, fontSize: 16 }} />
        <Typography
          sx={{ color: dash.inkSoft, fontSize: "0.75rem", fontWeight: 700 }}
        >
          {data.period.from} &ndash; {data.period.to}
        </Typography>
      </Stack>

      {/* Bộ chọn nhóm */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.4}
        sx={{
          p: 0.35,
          background: dash.tile,
          border: `1px solid ${dash.border}`,
          borderRadius: "8px",
        }}
      >
        {["TẤT CẢ", ...data.groups].map((g) => {
          const active = selectedGroup === g;
          const shortName =
            g === "TẤT CẢ"
              ? "Tất cả"
              : g.replace("NHÓM ", "Nhóm ").split(" - ")[0];
          return (
            <Tooltip
              key={g}
              title={
                g === "TẤT CẢ" ? "Hiển thị toàn bộ các nhóm chuyền" : g
              }
            >
              <Button
                size="small"
                onClick={() => setSelectedGroup(g)}
                sx={{
                  minWidth: 0,
                  px: 1,
                  py: 0.25,
                  fontSize: "0.75rem",
                  fontWeight: active ? 700 : 500,
                  textTransform: "none",
                  color: active ? "#ffffff" : dash.inkSoft,
                  background: active ? dash.gradients.primary : "transparent",
                  borderRadius: "6px",
                  boxShadow: active ? dash.shadows.button : "none",
                  "&:hover": {
                    background: active
                      ? dash.gradients.primaryHover
                      : "rgba(255, 255, 255, 0.08)",
                    color: "#ffffff",
                  },
                }}
              >
                {shortName}
              </Button>
            </Tooltip>
          );
        })}
      </Stack>

      {/* Cập nhật */}
      <Tooltip title={`Cập nhật lúc: ${lastUpdated} (Bấm để làm mới)`}>
        <ButtonBase
          onClick={handleRefresh}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            px: 1.1,
            py: 0.45,
            borderRadius: "8px",
            background: dash.tile,
            border: `1px solid ${dash.border}`,
            color: dash.inkSoft,
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              borderColor: dash.borderStrong,
            },
          }}
        >
          <Refresh
            sx={{
              color: dash.status.blue,
              fontSize: 16,
              transition: "transform 0.4s ease",
              transform: isRefreshing ? "rotate(360deg)" : "none",
            }}
          />
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 600,
              display: { xs: "none", xl: "block" },
            }}
          >
            {lastUpdated}
          </Typography>
        </ButtonBase>
      </Tooltip>

      {/* Toàn màn hình (chế độ TV nhà xưởng) */}
      <Tooltip
        title={
          isFullscreen
            ? "Thoát chế độ toàn màn hình (Hiện lại Sidebar)"
            : "Chế độ trình chiếu TV toàn màn hình"
        }
      >
        <IconButton
          onClick={handleToggleFullscreen}
          size="small"
          aria-label={
            isFullscreen ? "Thu nhỏ màn hình" : "Phóng to toàn màn hình"
          }
          sx={{
            color: dash.inkSoft,
            background: dash.tile,
            border: `1px solid ${dash.border}`,
            borderRadius: "8px",
            width: 32,
            height: 32,
            "&:hover": {
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              borderColor: dash.borderStrong,
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
  );

  return (
    <MainLayout
      title="Dashboard Báo Cáo QCO"
      subtitle="Tổng quan hiệu suất 3 ngày đầu & tiến độ ramp-up theo thời gian thực"
      headerActions={toolbarControls}
      fullHeight
      hideChrome={isFullscreen}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
          overflow: { xs: "visible", lg: "hidden" },
        }}
      >
        {/* Thanh tiêu đề thu gọn chỉ hiện khi đang bật chế độ TV Fullscreen */}
        {isFullscreen && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
              px: 2,
              py: 1,
              background: dash.panel,
              backdropFilter: "blur(12px)",
              border: `1px solid ${dash.border}`,
              borderRadius: "10px",
              boxShadow: dash.shadows.card,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1.05rem",
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              TỔNG QUAN KẾT QUẢ CHUYỂN ĐỔI &ndash; QCO
            </Typography>
            {toolbarControls}
          </Box>
        )}

        {/* ── 1. DẢI 5 THẺ CHỈ SỐ KPI ĐỒNG BỘ PHONG CÁCH HOMEPAGE ──────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            },
            gap: 1.25,
            flexShrink: 0,
          }}
        >
          {/* KPI 1: Tổng lần chuyển đổi */}
          <KpiCard
            icon={<BarChart />}
            highlightColor={dash.status.blue}
            label="TỔNG CHUYỂN ĐỔI"
            value={activeKpi.totalChangeovers}
            valueUnit="lần"
            sub={
              selectedGroup === "TẤT CẢ"
                ? `${data.groups.length} nhóm chuyền may`
                : selectedGroup
            }
          />

          {/* KPI 2: HSBQ Chung */}
          <KpiCard
            icon={<ShowChart />}
            highlightColor={dashStatusColor(activeKpi.hsbqCompany, hsbqTarget)}
            label={
              selectedGroup === "TẤT CẢ"
                ? "HSBQ TOÀN CÔNG TY"
                : "HSBQ NHÓM ĐANG CHỌN"
            }
            value={`${activeKpi.hsbqCompany}%`}
            sub={`Mục tiêu: ${hsbqTarget}% (${
              activeKpi.hsbqCompany >= hsbqTarget ? "+" : ""
            }${activeKpi.hsbqCompany - hsbqTarget}%)`}
          />

          {/* KPI 3: HSBQ 3 Ngày liên tiếp */}
          <KpiCard
            icon={<TrendingUp />}
            highlightColor={dash.status.blue}
            label="HSBQ 3 NGÀY ĐẦU"
            sub="Tiến độ tăng dần sau chuyển đổi"
          >
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
              {[
                ["N1", activeKpi.hsbqByDay.d1, dayTargets.d1],
                ["N2", activeKpi.hsbqByDay.d2, dayTargets.d2],
                ["N3", activeKpi.hsbqByDay.d3, dayTargets.d3],
              ].map(([lbl, v, t]) => (
                <Box key={lbl} sx={{ textAlign: "center" }}>
                  <Typography
                    sx={{
                      color: dash.inkSoft,
                      fontSize: "0.75rem",
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
                      lineHeight: 1.1,
                      fontVariantNumeric: "tabular-nums",
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
            <Stack direction="row" spacing={1.75} sx={{ mt: 0.25 }}>
              <Box>
                <Typography
                  sx={{
                    color: dash.inkSoft,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  MÃ MỚI
                </Typography>
                <Typography
                  sx={{
                    color:
                      activeKpi.hsbqMaMoi == null
                        ? dash.inkMuted
                        : dashStatusColor(activeKpi.hsbqMaMoi, hsbqTarget),
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    lineHeight: 1.1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {activeKpi.hsbqMaMoi == null
                    ? "-"
                    : `${activeKpi.hsbqMaMoi}%`}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: dash.inkSoft,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  LẶP LẠI
                </Typography>
                <Typography
                  sx={{
                    color:
                      activeKpi.hsbqMaLap == null
                        ? dash.inkMuted
                        : dashStatusColor(activeKpi.hsbqMaLap, hsbqTarget),
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    lineHeight: 1.1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {activeKpi.hsbqMaLap == null
                    ? "-"
                    : `${activeKpi.hsbqMaLap}%`}
                </Typography>
              </Box>
            </Stack>
          </KpiCard>

          {/* KPI 5: Tỷ lệ đạt Ramp-up */}
          <KpiCard
            icon={<TrackChanges />}
            highlightColor={dash.status.orange}
            label="TỶ LỆ ĐẠT RAMP-UP"
            value={`${activeKpi.rampUpAchieved}/${activeKpi.rampUpTotal}`}
            valueUnit={`(${
              activeKpi.rampUpTotal
                ? (
                    (activeKpi.rampUpAchieved / activeKpi.rampUpTotal) *
                    100
                  ).toFixed(1)
                : "0.0"
            }%)`}
            sub="Lần chuyển đổi đạt mục tiêu"
          >
            <Box
              sx={{
                width: "100%",
                height: 5,
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "3px",
                mt: 0.45,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${
                    activeKpi.rampUpTotal
                      ? (activeKpi.rampUpAchieved / activeKpi.rampUpTotal) * 100
                      : 0
                  }%`,
                  height: "100%",
                  background: dash.gradients.primary,
                  borderRadius: "3px",
                }}
              />
            </Box>
          </KpiCard>
        </Box>

        {/* ── 2. KHU VỰC NỘI DUNG CHÍNH (BẢNG CHI TIẾT & BIỂU ĐỒ) ──────────── */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 56fr) minmax(0, 44fr)",
            },
            overflow: "hidden",
          }}
        >
          {/* ────────── CỘT TRÁI (56%): BẢNG CHI TIẾT & TỔNG HỢP NHÓM ────────── */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              height: "100%",
              minHeight: 0,
            }}
          >
            {/* Khối trên: bảng chi tiết 14 cột (thu gọn tỷ lệ một chút để nhường diện tích cho 2 bảng dưới) */}
            <Box sx={{ flex: 1.25, minHeight: 0 }}>
              <DashPanel
                title="CHI TIẾT HIỆU SUẤT 3 NGÀY VÀ RAMP-UP THEO NHÓM CHUYỂN ĐỔI"
                icon={<BarChart fontSize="inherit" />}
                action={
                  <Chip
                    label={`${rows.length} lượt chuyển đổi`}
                    size="small"
                    sx={{
                      height: 22,
                      bgcolor: "rgba(59, 130, 246, 0.14)",
                      color: dash.status.blue,
                      border: `1px solid ${dash.borderStrong}`,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                  />
                }
                noPadding
              >
                <Box
                  ref={detailScrollRef}
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    height: "100%",
                    overflowX: "auto",
                  }}
                >
                  <Table
                    size="small"
                    sx={{
                      borderCollapse: "separate",
                      borderSpacing: 0,
                    }}
                  >
                    <TableHead
                      sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 6,
                        background: dash.rowHead,
                      }}
                    >
                      <TableRow sx={{ height: 30 }}>
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
                        <HeadCell rowSpan={2} sx={{ borderRight: "none" }}>
                          <Tooltip
                            title={`Đạt (Y) khi HSBQ 3 ngày đầu >= ${hsbqTarget}%`}
                            arrow
                            placement="top"
                          >
                            <Box
                              component="span"
                              sx={{
                                borderBottom:
                                  "1px dotted rgba(255,255,255,0.45)",
                                cursor: "help",
                              }}
                            >
                              RAMP-UP
                            </Box>
                          </Tooltip>
                        </HeadCell>
                      </TableRow>
                      <TableRow sx={{ height: 30 }}>
                        <HeadCell secondRow>MÃ MỚI</HeadCell>
                        <HeadCell secondRow>LẶP LẠI</HeadCell>
                        <HeadCell secondRow>Mục tiêu</HeadCell>
                        <HeadCell secondRow>Thực tế</HeadCell>
                        <HeadCell secondRow>Mục tiêu</HeadCell>
                        <HeadCell secondRow>Thực tế</HeadCell>
                        <HeadCell secondRow>Mục tiêu</HeadCell>
                        <HeadCell secondRow>Thực tế</HeadCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow
                          key={r.stt}
                          sx={{
                            background:
                              i % 2
                                ? "rgba(255, 255, 255, 0.02)"
                                : "transparent",
                            "&:hover": {
                              background: "rgba(59, 130, 246, 0.1)",
                            },
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
                          <Cell
                            bold
                            color={dashStatusColor(r.d1, dayTargets.d1)}
                          >
                            {r.d1}%
                          </Cell>
                          <Cell color={dash.inkMuted}>{dayTargets.d2}%</Cell>
                          <Cell
                            bold
                            color={dashStatusColor(r.d2, dayTargets.d2)}
                          >
                            {r.d2}%
                          </Cell>
                          <Cell color={dash.inkMuted}>{dayTargets.d3}%</Cell>
                          <Cell
                            bold
                            color={dashStatusColor(r.d3, dayTargets.d3)}
                          >
                            {r.d3}%
                          </Cell>
                          <Cell
                            bold
                            color={dashStatusColor(r.hsbq3, hsbqTarget)}
                          >
                            {r.hsbq3}%
                          </Cell>
                          <Cell>
                            <Box
                              sx={{
                                display: "inline-block",
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
                                border: `1px solid ${
                                  r.rampUp
                                    ? "rgba(34, 197, 94, 0.3)"
                                    : "rgba(239, 68, 68, 0.3)"
                                }`,
                              }}
                            >
                              {r.rampUp ? "Y" : "N"}
                            </Box>
                          </Cell>
                        </TableRow>
                      ))}

                      {/* Dòng tổng toàn công ty (hoặc theo nhóm đang lọc) */}
                      <TableRow
                        sx={{
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
                          {selectedGroup === "TẤT CẢ"
                            ? "TRUNG BÌNH TOÀN CÔNG TY"
                            : `TRUNG BÌNH ${selectedGroup.split(" - ")[0]}`}
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
                          color={dashStatusColor(
                            activeKpi.hsbqByDay.d1,
                            dayTargets.d1
                          )}
                        >
                          {activeKpi.hsbqByDay.d1}%
                        </Cell>
                        <Cell bold color={dash.inkMuted}>
                          {dayTargets.d2}%
                        </Cell>
                        <Cell
                          bold
                          color={dashStatusColor(
                            activeKpi.hsbqByDay.d2,
                            dayTargets.d2
                          )}
                        >
                          {activeKpi.hsbqByDay.d2}%
                        </Cell>
                        <Cell bold color={dash.inkMuted}>
                          {dayTargets.d3}%
                        </Cell>
                        <Cell
                          bold
                          color={dashStatusColor(
                            activeKpi.hsbqByDay.d3,
                            dayTargets.d3
                          )}
                        >
                          {activeKpi.hsbqByDay.d3}%
                        </Cell>
                        <Cell
                          bold
                          color={dashStatusColor(
                            activeKpi.hsbqCompany,
                            hsbqTarget
                          )}
                        >
                          {activeKpi.hsbqCompany}%
                        </Cell>
                        <Cell bold color={dash.status.warn}>
                          {activeKpi.rampUpAchieved}/{activeKpi.rampUpTotal}
                        </Cell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </DashPanel>
            </Box>

            {/* Khối dưới: Phân tích theo nhóm & So sánh tỷ lệ đạt ramp-up (mở rộng chiều cao để hiển thị trọn vẹn, chữ rõ nét) */}
            <Box
              sx={{
                flex: 0.95,
                minHeight: { xs: "auto", lg: 235 },
                maxHeight: { xs: "none", lg: 295 },
                display: "grid",
                gap: 1.25,
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
                  <Table
                    size="small"
                    sx={{
                      borderCollapse: "separate",
                      borderSpacing: 0,
                    }}
                  >
                    <TableHead
                      sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 5,
                        background: dash.rowHead,
                      }}
                    >
                      <TableRow sx={{ height: 32 }}>
                        <HeadCell
                          secondRow
                          sx={{ top: 0, textAlign: "left", pl: 1 }}
                        >
                          NHÓM
                        </HeadCell>
                        <HeadCell secondRow sx={{ top: 0 }}>
                          SỐ LẦN
                        </HeadCell>
                        <HeadCell secondRow sx={{ top: 0 }}>
                          HSBQ 3N
                        </HeadCell>
                        <HeadCell secondRow sx={{ top: 0 }}>
                          RAMP-UP
                        </HeadCell>
                        <HeadCell secondRow sx={{ top: 0 }}>
                          MÃ MỚI
                        </HeadCell>
                        <HeadCell secondRow sx={{ top: 0 }}>
                          LẶP LẠI
                        </HeadCell>
                        <HeadCell
                          secondRow
                          sx={{ top: 0, borderRight: "none" }}
                        >
                          XẾP LOẠI
                        </HeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.groupSummary.map((g, i) => {
                        const isRowActive = selectedGroup === g.group;
                        const isGoodRating = g.hsbq3 >= hsbqTarget;
                        return (
                          <TableRow
                            key={g.group}
                            onClick={() =>
                              setSelectedGroup(
                                isRowActive ? "TẤT CẢ" : g.group
                              )
                            }
                            sx={{
                              cursor: "pointer",
                              background: isRowActive
                                ? "rgba(59, 130, 246, 0.18)"
                                : i % 2
                                  ? "rgba(255, 255, 255, 0.02)"
                                  : "transparent",
                              "&:hover": {
                                background: "rgba(59, 130, 246, 0.12)",
                              },
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
                            <Cell
                              bold
                              color={dashStatusColor(g.hsbq3, hsbqTarget)}
                            >
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
                                  fontSize: "0.92em",
                                  lineHeight: 1.3,
                                  fontWeight: 700,
                                  color: isGoodRating
                                    ? dash.status.good
                                    : dash.status.bad,
                                  px: "0.4em",
                                  py: "0.05em",
                                  borderRadius: "4px",
                                  background: isGoodRating
                                    ? "rgba(34, 197, 94, 0.12)"
                                    : "rgba(239, 68, 68, 0.1)",
                                  border: `1px solid ${
                                    isGoodRating
                                      ? "rgba(34, 197, 94, 0.28)"
                                      : "rgba(239, 68, 68, 0.2)"
                                  }`,
                                }}
                              >
                                {g.rating}
                              </Typography>
                            </Cell>
                          </TableRow>
                        );
                      })}
                      <TableRow
                        onClick={() => setSelectedGroup("TẤT CẢ")}
                        sx={{
                          cursor: "pointer",
                          "& td": {
                            position: "sticky",
                            bottom: 0,
                            zIndex: 2,
                            background: dash.rowTotal,
                            borderTop: `2px solid ${dash.borderStrong}`,
                          },
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
                      borderTop: `1px dashed ${dash.border}`,
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
              gap: 1.25,
              height: "100%",
              minHeight: 0,
            }}
          >
            {/* Thẻ trên: Biểu đồ đường HSBQ 6 tháng gần nhất */}
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <DashPanel
                title="SO SÁNH HSBQ 6 THÁNG GẦN NHẤT"
                icon={<ShowChart fontSize="inherit" />}
                action={
                  <Chip
                    label={`Mục tiêu: ${hsbqTarget}%`}
                    size="small"
                    sx={{
                      height: 22,
                      bgcolor: "rgba(255, 255, 255, 0.06)",
                      color: dash.inkSoft,
                      border: `1px solid ${dash.border}`,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  />
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

            {/* Thẻ dưới: Biểu đồ cột linh hoạt với Tab Switcher */}
            <Box sx={{ flex: 1.15, minHeight: 0 }}>
              <DashPanel
                title="PHÂN TÍCH KẾT QUẢ THEO CHUYỀN &amp; MÃ HÀNG"
                icon={<BarChart fontSize="inherit" />}
                action={
                  <Stack
                    direction="row"
                    spacing={0.4}
                    sx={{
                      background: dash.tile,
                      p: 0.3,
                      borderRadius: "8px",
                      border: `1px solid ${dash.border}`,
                    }}
                  >
                    {[
                      { id: "line", label: `Chuyền (${barsByLine.length})` },
                      { id: "new", label: `Mã mới (${barsMaMoi.length})` },
                      { id: "repeat", label: `Lặp lại (${barsMaLap.length})` },
                      { id: "split", label: "Song song" },
                    ].map((tab) => {
                      const active = chartViewMode === tab.id;
                      return (
                        <Button
                          key={tab.id}
                          size="small"
                          onClick={() => setChartViewMode(tab.id)}
                          sx={{
                            px: 0.9,
                            py: 0.25,
                            fontSize: "0.75rem",
                            fontWeight: active ? 700 : 500,
                            textTransform: "none",
                            minWidth: 0,
                            whiteSpace: "nowrap",
                            lineHeight: 1.4,
                            borderRadius: "6px",
                            color: active ? "#ffffff" : dash.inkSoft,
                            background: active
                              ? dash.gradients.primary
                              : "transparent",
                            boxShadow: active ? dash.shadows.button : "none",
                            "&:hover": {
                              background: active
                                ? dash.gradients.primaryHover
                                : "rgba(255, 255, 255, 0.08)",
                              color: "#ffffff",
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
                      <BarChartSvg bars={barsMaMoi} target={hsbqTarget} />
                    </Box>
                  )}

                  {chartViewMode === "repeat" && (
                    <Box sx={{ flex: 1, minHeight: 0, height: "100%" }}>
                      <BarChartSvg bars={barsMaLap} target={hsbqTarget} />
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
                          background: dash.tile,
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
                            fontSize: "0.75rem",
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
                          background: dash.tile,
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
                            fontSize: "0.75rem",
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
      </Box>
    </MainLayout>
  );
};

export default DashboardPage;
