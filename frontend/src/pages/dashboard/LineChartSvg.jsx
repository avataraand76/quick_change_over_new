// frontend/src/pages/dashboard/LineChartSvg.jsx
//
// Bieu do duong nhieu chuoi, ve bang SVG thuan - giong cach du an TPM lam,
// khong keo them thu vien chart nao.
//
// ── BA quyet dinh ve do thi, co ly do ────────────────────────────────────
// 1. CHI dan nhan o DIEM CUOI moi duong, khong dan het moi diem. 6 chuoi x 6
//    thang = 36 con so chong len nhau thanh mot dam chu. Muon xem so cu the
//    thi ro chuot vao - co thanh doc + bang gia tri.
// 2. Mau lay theo THU TU CO DINH trong dash.series. Loc bot nhom thi nhung
//    nhom con lai GIU NGUYEN mau, neu khong nguoi xem doc nham duong.
// 3. Duong "toan cong ty" dung mau trung tinh + net dut, co y KHONG lay mot
//    o trong bang mau chuoi - no la duong tham chieu, khong phai mot nhom.

import { useMemo, useState } from "react";
import { Box, Stack, Typography, dash, fontSizes } from "../../ui";

// Hệ toạ độ trong của SVG. Chữ và nét vẽ tính theo đây rồi co giãn cả khối.
const W = 760;
const H = 300;
const PAD = { top: 18, right: 54, bottom: 30, left: 36 };

const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const Y_MAX = 120; // trần trục Y (%) - để chỗ cho giá trị vượt 100%
const Y_TICKS = [0, 20, 40, 60, 80, 100, 120];

const LineChartSvg = ({ categories, series, companySeries, target }) => {
  const [hover, setHover] = useState(null); // chỉ số cột đang rê chuột

  const x = (i) =>
    PAD.left + (categories.length === 1 ? PLOT_W / 2 : (PLOT_W * i) / (categories.length - 1));
  const y = (v) => PAD.top + PLOT_H - (PLOT_H * v) / Y_MAX;

  const path = (values) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");

  // Gán màu theo thứ tự cố định; chuỗi thứ 6 trở đi (nếu có) dùng lại màu
  // cuối - đúng ra phải gộp thành "Khác", ghi chú để sau này xử lý.
  const colorOf = (i) => dash.series[Math.min(i, dash.series.length - 1)];

  const allSeries = [
    ...series.map((s, i) => ({ ...s, color: colorOf(i), dashed: false })),
    ...(companySeries
      ? [{ ...companySeries, color: dash.company, dashed: true }]
      : []),
  ];

  /**
   * Vị trí nhãn ở điểm cuối, ĐÃ ĐẨY RA cho khỏi đè nhau.
   *
   * Cuối tháng các nhóm hay chụm lại quanh cùng một mức (43/44/47%), ba nhãn
   * rơi vào cùng một chỗ và đọc ra một đám chữ. Xếp theo chiều dọc rồi đẩy
   * dần xuống cho mỗi nhãn cách nhau tối thiểu MIN_GAP.
   */
  const endLabels = useMemo(() => {
    const MIN_GAP = 13;
    const items = allSeries
      .map((s) => {
        const value = s.values[s.values.length - 1];
        return { name: s.name, color: s.color, value, y: y(value) };
      })
      .sort((a, b) => a.y - b.y);

    for (let i = 1; i < items.length; i += 1) {
      if (items[i].y - items[i - 1].y < MIN_GAP) {
        items[i].y = items[i - 1].y + MIN_GAP;
      }
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, companySeries]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <svg
          role="img"
          aria-label="Biểu đồ xu hướng hiệu suất bình quân 6 tháng gần nhất"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%", display: "block" }}
          onMouseLeave={() => setHover(null)}
        >
          {/* Lưới ngang + nhãn trục Y. Lưới chìm hơn nét dữ liệu. */}
          {Y_TICKS.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke={dash.grid}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 4}
                textAnchor="end"
                fill={dash.inkMuted}
                fontSize="11"
              >
                {t}%
              </text>
            </g>
          ))}

          {/* Đường mục tiêu - nét đứt, có nhãn để không phải đoán */}
          {target != null && (
            <>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(target)}
                y2={y(target)}
                stroke={dash.inkSoft}
                strokeWidth="1.5"
                strokeDasharray="7 5"
              />
              <text
                x={W - PAD.right + 4}
                y={y(target) - 5}
                fill={dash.inkSoft}
                fontSize="11"
              >
                MT {target}%
              </text>
            </>
          )}

          {/* Nhãn trục X */}
          {categories.map((c, i) => (
            <text
              key={c}
              x={x(i)}
              y={H - PAD.bottom + 18}
              textAnchor="middle"
              fill={dash.inkMuted}
              fontSize="12"
            >
              {c}
            </text>
          ))}

          {/* Thanh dọc theo con trỏ */}
          {hover != null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke={dash.inkSoft}
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Các đường dữ liệu: nét 2px, điểm tròn >= 8px đường kính */}
          {allSeries.map((s) => (
            <g key={s.name}>
              <path
                d={path(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dashed ? "8 5" : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={hover === i ? 5.5 : 4}
                  fill={s.color}
                  // Vòng viền màu nền tách hai điểm chồng nhau ra
                  stroke="#031835"
                  strokeWidth="2"
                />
              ))}
            </g>
          ))}

          {/* Nhãn trực tiếp CHỈ ở điểm cuối, ĐÃ TÁCH CHỒNG. Vẽ sau cùng để
              nằm trên mọi nét. */}
          {endLabels.map((l) => (
            <text
              key={l.name}
              x={x(categories.length - 1) + 8}
              y={l.y + 4}
              fill={l.color}
              fontSize="12"
              fontWeight="700"
            >
              {l.value}%
            </text>
          ))}

          {/* Vùng bắt chuột: phủ kín, chia đều theo số cột */}
          {categories.map((c, i) => (
            <rect
              key={c}
              x={x(i) - PLOT_W / (categories.length - 1) / 2}
              y={PAD.top}
              width={PLOT_W / (categories.length - 1)}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          ))}
        </svg>

        {/* Bảng giá trị khi rê chuột - đặt ngoài SVG cho dễ định kiểu */}
        {hover != null && (
          <Box
            sx={{
              position: "absolute",
              top: 6,
              left: 6,
              px: 1.25,
              py: 0.85,
              background: "rgba(3, 24, 53, 0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 1.5,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <Typography
              sx={{ color: dash.ink, fontSize: fontSizes.label, fontWeight: 700, mb: 0.25 }}
            >
              {categories[hover]}
            </Typography>
            {allSeries.map((s) => (
              <Stack key={s.name} direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: s.color,
                    flexShrink: 0,
                  }}
                />
                <Typography sx={{ color: dash.inkSoft, fontSize: fontSizes.caption }}>
                  {s.name}
                </Typography>
                <Typography
                  sx={{ color: dash.ink, fontSize: fontSizes.caption, fontWeight: 700 }}
                >
                  {s.values[hover]}%
                </Typography>
              </Stack>
            ))}
          </Box>
        )}
      </Box>

      {/* Chú giải - luôn có khi từ 2 chuỗi trở lên */}
      <Stack
        direction="row"
        flexWrap="wrap"
        sx={{ gap: 1, pt: 0.5, justifyContent: "center" }}
      >
        {allSeries.map((s) => (
          <Stack key={s.name} direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                width: 14,
                height: 0,
                borderTop: `3px ${s.dashed ? "dashed" : "solid"} ${s.color}`,
              }}
            />
            <Typography sx={{ color: dash.inkSoft, fontSize: fontSizes.caption }}>
              {s.name}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default LineChartSvg;
