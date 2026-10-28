// frontend/src/pages/dashboard/BarChartSvg.jsx
//
// Bieu do cot doc, ve bang SVG thuan.
//
// Dung cho ba khoi: theo chuyen, theo ma hang moi, theo ma hang lap lai.
// Mau cot theo NGUONG dat/chua dat (do/vang/xanh) chu khong phai mau nhan
// dang - day la mot phep do duy nhat chia theo trang thai, nen dung bang
// mau trang thai. Con so luon in tren dau cot, va o Y/N nam duoi chan cot,
// nen khong bao gio phai doc bang mau khong.

import { useState } from "react";
import { Box, Stack, Typography, dash, dashStatusColor, fontSizes } from "../../ui";

const Y_MAX = 120;
const Y_TICKS = [0, 20, 40, 60, 80, 100, 120];

/** Dưới bề rộng này thì ngừng co và cho cuộn ngang (chỉ gặp trên điện thoại) */
const FLOOR_W = 380;

/**
 * @param {Array}  bars   [{ label, value, flag }] - flag = đạt ramp-up (bool)
 * @param {number} target ngưỡng đạt, vẽ thành đường nét đứt
 * @param {string} flagLabel chú thích cho hàng Y/N dưới chân cột
 */
const BarChartSvg = ({ bars, target, flagLabel = "Đạt ramp-up (Y = Yes, N = No)" }) => {
  const [hover, setHover] = useState(null);

  /**
   * Nhãn trục X dài hơn bề rộng cột thì XOAY 45 độ.
   *
   * Khối "theo chuyền" có nhãn ngắn ("15", "37+38") nên nằm ngang được. Khối
   * "theo mã hàng" có nhãn kiểu "MB71000H" rộng gấp rưỡi cột - để nằm ngang
   * là các nhãn dính vào nhau thành một dải chữ không đọc nổi.
   */
  const maxLabelLen = Math.max(1, ...bars.map((b) => String(b.label).length));
  const rotate = maxLabelLen > 5;

  const H = rotate ? 290 : 260;
  const PAD = { top: 22, right: 8, bottom: rotate ? 76 : 46, left: 34 };
  const PLOT_H = H - PAD.top - PAD.bottom;

  // Bề rộng tính theo số cột để nhiều cột vẫn không bị bóp dẹt
  const slot = 30;
  const W = PAD.left + PAD.right + slot * bars.length;
  const barW = slot * 0.6;

  const y = (v) => PAD.top + PLOT_H - (PLOT_H * Math.min(v, Y_MAX)) / Y_MAX;
  const cx = (i) => PAD.left + slot * i + slot / 2;

  const labelY = PAD.top + PLOT_H + (rotate ? 30 : 34);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Chú giải đặt trên, cùng một hàng như các khối khác */}
      <Stack direction="row" spacing={1.5} sx={{ pb: 0.5, flexWrap: "wrap", alignItems: "center" }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "2px", background: dash.status.good }} />
          <Typography sx={{ color: dash.inkSoft, fontSize: fontSizes.caption }}>
            Đạt mục tiêu
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "2px", background: dash.status.warn }} />
          <Typography sx={{ color: dash.inkSoft, fontSize: fontSizes.caption }}>
            Gần đạt
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: "2px", background: dash.status.bad }} />
          <Typography sx={{ color: dash.inkSoft, fontSize: fontSizes.caption }}>
            Chưa đạt
          </Typography>
        </Stack>
        <Typography sx={{ color: dash.inkMuted, fontSize: fontSizes.caption }}>
          · {flagLabel} · MT: {target}%
        </Typography>
      </Stack>

      {/* Khối biểu đồ TỰ CO cho vừa thẻ - dashboard phải gọn trong một khung
          hình, không ai cuộn ngang trên màn hình treo tường. Nhãn dài đã được
          xoay 45 độ nên co nhỏ vẫn đọc được.
          Chỉ khi thẻ hẹp dưới FLOOR_W mới cho cuộn, để trên điện thoại chữ
          không bé đến mức vô nghĩa. */}
      <Box sx={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "hidden" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: "100%",
            height: "100%",
            minWidth: Math.min(W, FLOOR_W),
            display: "block",
          }}
          onMouseLeave={() => setHover(null)}
        >
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
                x={PAD.left - 5}
                y={y(t) + 4}
                textAnchor="end"
                fill={dash.inkMuted}
                fontSize="10"
              >
                {t}%
              </text>
            </g>
          ))}

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(target)}
            y2={y(target)}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {bars.map((b, i) => {
            const color = dashStatusColor(b.value, target);
            const top = y(b.value);
            return (
              <g
                key={`${b.label}-${i}`}
                onMouseEnter={() => setHover(i)}
                style={{ cursor: "default" }}
              >
                {/* Vùng bắt chuột cao hơn cột để dễ trỏ trúng */}
                <rect
                  x={cx(i) - slot / 2}
                  y={PAD.top}
                  width={slot}
                  height={PLOT_H}
                  fill={hover === i ? "rgba(255, 255, 255, 0.08)" : "transparent"}
                  rx="3"
                />
                <rect
                  x={cx(i) - barW / 2}
                  y={top}
                  width={barW}
                  height={PAD.top + PLOT_H - top}
                  fill={color}
                  rx="3"
                />
                <text
                  x={cx(i)}
                  y={top - 5}
                  textAnchor="middle"
                  fill={dash.ink}
                  fontSize="10"
                  fontWeight="700"
                >
                  {b.value}%
                </text>

                {/* Ô Y/N dưới chân cột - trạng thái đọc được không cần màu */}
                {b.flag != null && (
                  <>
                    <rect
                      x={cx(i) - 7}
                      y={PAD.top + PLOT_H + 5}
                      width="14"
                      height="14"
                      rx="3"
                      fill={b.flag ? dash.status.good : dash.status.bad}
                    />
                    <text
                      x={cx(i)}
                      y={PAD.top + PLOT_H + 16}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="800"
                    >
                      {b.flag ? "Y" : "N"}
                    </text>
                  </>
                )}

                <text
                  x={cx(i)}
                  y={labelY}
                  textAnchor={rotate ? "end" : "middle"}
                  transform={rotate ? `rotate(-45 ${cx(i)} ${labelY})` : undefined}
                  fill={dash.inkMuted}
                  fontSize="9"
                >
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </Box>
    </Box>
  );
};

export default BarChartSvg;
