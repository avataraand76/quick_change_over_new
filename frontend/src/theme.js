// frontend/src/theme.js
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  TOAN BO GIAO DIEN CUA DU AN QCO NAM TRONG FILE NAY
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Muon doi mau, co chu, bo goc, bong do, gradient hay style mac dinh cua
// component MUI -> sua o day, KHONG sua trong pages/ hay components/.
// Cac trang chi import qua "../ui".
//
// Ban nay rut gon tu theme.js cua du an TPM: giu nguyen design token (mau,
// gradient, bo goc, bong, typography, style component), bo phan du lieu
// nghiep vu rieng cua TPM (trang thai may / phieu / lich bao duong).
//
// MUC LUC (Ctrl+F theo so muc, vi du "§3."):
//   §1  MAU                   colors, hexA
//   §2  CO CHU                FLUID_TYPE, scale, fluid, fluidPx, fontSizes
//   §3  GRADIENT / MAU NHAN   gradients, accents, accentGradient/Wash/Shadow
//   §4  BO GOC / VIEN / BONG  radii, borders, shadow, ring, shadows
//   §5  THEME MUI             palette, breakpoints, typography, components
//   §6  PRESET sx             autoGrid, sx.*

import { createTheme } from "@mui/material/styles";

// ══════════════════════════════════════════════════════════════════════════
// §1. MAU
//    Doi mau toan app o day.
// ══════════════════════════════════════════════════════════════════════════

export const colors = {
  /** Tím-xanh thương hiệu (gradient chính của hệ thống) */
  brand: {
    main: "#667eea",
    alt: "#764ba2",
    hover: "#5568d3",
    altHover: "#6a3f8f", // cặp hover của `alt`, luôn đi kèm `hover`
    line: "#d0d4f0", // viền tím nhạt
    wash: "#eef0fb",
  },

  /** Xanh lá - thành công */
  green: {
    main: "#2e7d32", // = palette.success.main
    light: "#4caf50",
    dark: "#1b5e20",
    pale: "#a5d6a7",
    wash: "#e8f5e9",
  },

  /** Xanh dương - thông tin */
  blue: {
    main: "#1976d2", // = palette.primary.main
    light: "#42a5f5",
    dark: "#1565c0",
    sky: "#03a9f4",
    bright: "#38bdf8",
    deep: "#0288d1",
    wash: "#e3f2fd",
  },

  /** Cam - cảnh báo */
  orange: {
    main: "#ff9800",
    dark: "#ed6c02",
    deep: "#e65100",
    hover: "#f57c00",
    wash: "#fff3e0",
  },

  /** Đỏ - lỗi */
  red: {
    main: "#f44336",
    dark: "#d32f2f",
    deepest: "#b71c1c",
    pale: "#ef9a9a",
    wash: "#ffebee",
  },

  /** Xanh ngọc */
  teal: {
    main: "#00897b",
    light: "#26a69a",
    dark: "#00796b",
  },

  /** Tím */
  purple: {
    main: "#673ab7",
    deep: "#7b1fa2",
    magenta: "#9c27b0",
    violet: "#9333ea",
    pink: "#c2185b",
  },

  /** Lơ */
  cyan: {
    main: "#00bcd4",
  },

  /**
   * XANH NAVY - thang xám PHA XANH (kiểu Tailwind slate), dùng cho các KHỐI TỐI.
   * CỐ TÌNH TÁCH khỏi `grey` (xám trung tính) - gộp lại sẽ làm các khối navy
   * chuyển thành xám chì phẳng. Đừng gộp.
   */
  navy: {
    darkest: "#0f172a", // chặng đầu gradient nền tối
    dark: "#1e293b", // chặng cuối gradient nền tối
    main: "#334155",
    light: "#475569",
    muted: "#64748b",
    pale: "#94a3b8", // chữ MỜ trên nền navy
    wash: "#e2e8f0", // chữ sáng trên nền navy
    tint: "#f1f5f9",
    lightest: "#f8fafc",
  },

  /** Vàng - nền ô nhập bị khoá / tự điền (xem sx.fieldHighlight) */
  yellow: {
    wash: "#fffbe5",
  },

  /**
   * THANG XÁM DUY NHẤT của dự án (chuẩn Material, 50..900).
   * KHÔNG thêm sắc xám nào ngoài đây.
   */
  grey: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  white: "#ffffff",
  black: "#000",
};

/**
 * Ghép hậu tố alpha vào mã hex 6 ký tự -> hex 8 ký tự.
 *
 *   hexA(colors.green.main, "11")  ->  "#2e7d3211"   (~7% mờ)
 *   hexA(colors.brand.main, "22")  ->  "#667eea22"   (~13% mờ)
 */
export const hexA = (hex6, alphaHex) => `${hex6}${alphaHex}`;

// ══════════════════════════════════════════════════════════════════════════
// §2. CO CHU
//    FLUID_TYPE = cong tac co dinh / co gian, chi phoi ca §5.
// ══════════════════════════════════════════════════════════════════════════

const REM = 16; // 1rem = 16px (mặc định của trình duyệt)

export const MIN_VW = 360; // điện thoại nhỏ nhất cần hỗ trợ
export const MAX_VW = 1280; // laptop/màn hình lớn - từ đây trở lên không to thêm

/**
 * Sinh chuỗi CSS clamp() nội suy tuyến tính từ minPx (tại minVw)
 * đến maxPx (tại maxVw).
 *
 * @param {number} minPx  giá trị nhỏ nhất, đơn vị px
 * @param {number} maxPx  giá trị lớn nhất, đơn vị px
 * @returns {string} ví dụ "clamp(0.875rem, 0.7717rem + 0.2174vw, 1rem)"
 */
export const fluid = (minPx, maxPx, minVw = MIN_VW, maxVw = MAX_VW) => {
  if (minPx === maxPx) return `${minPx / REM}rem`;

  const slope = (maxPx - minPx) / (maxVw - minVw);
  const interceptRem = (minPx - slope * minVw) / REM;
  const vw = slope * 100;

  return `clamp(${minPx / REM}rem, ${interceptRem.toFixed(4)}rem + ${vw.toFixed(
    4
  )}vw, ${maxPx / REM}rem)`;
};

/**
 * Bản dùng cho px thuần (chiều cao, kích thước icon, bề rộng cột...).
 *
 *   height: fluidPx(240, 420)
 */
export const fluidPx = (minPx, maxPx, minVw = MIN_VW, maxVw = MAX_VW) => {
  if (minPx === maxPx) return `${minPx}px`;

  const slope = (maxPx - minPx) / (maxVw - minVw);
  const intercept = minPx - slope * minVw;
  const vw = slope * 100;

  return `clamp(${minPx}px, ${intercept.toFixed(2)}px + ${vw.toFixed(
    4
  )}vw, ${maxPx}px)`;
};

// ============================================================================
// CÔNG TẮC CỠ CHỮ - MỘT CHỖ DUY NHẤT
// ============================================================================
//
// false = MỌI cỡ chữ trong app là con số CỐ ĐỊNH (đúng bằng giá trị "lớn nhất").
// true  = cỡ chữ tự co giãn theo bề rộng màn hình bằng clamp().
//
// Công tắc này chi phối CẢ BA nơi khai báo cỡ chữ:
//   §5 typography  (variant h1..h6, body1/2, caption...)
//   §2 fontSizes   (các cỡ ghi đè trong trang)
//   §5 components  (fontSize theo size của Button, TableCell)
export const FLUID_TYPE = false;

/**
 * Cỡ chữ theo công tắc FLUID_TYPE.
 *   scale(12, 14)  ->  "0.875rem"                       khi FLUID_TYPE = false
 *   scale(12, 14)  ->  "clamp(0.75rem, ... , 0.875rem)"  khi FLUID_TYPE = true
 */
export const scale = (lo, hi) => (FLUID_TYPE ? fluid(lo, hi) : `${hi / REM}rem`);

/** Xuất lại công tắc chung để nơi khác kiểm tra được trạng thái hiện tại. */
export const FLUID = FLUID_TYPE;

const FIXED = (px) => `${px / REM}rem`;

export const fontSizes = {
  // ── THANG 8 BẬC. Con số là px; đổi ở đây là đổi toàn app. ──────────────
  caption: FIXED(10), // nhãn siêu nhỏ trong Chip / ô bảng
  label: FIXED(11.2), // nhãn, chú thích, icon nhỏ
  small: FIXED(12.6), // chữ nhỏ: ô bảng dày, Chip
  body: scale(12, 13.6), // chữ nội dung thường
  lead: scale(13.6, 15.6), // chữ nhấn: ô bảng chính, Tabs
  title: scale(15.6, 17.6), // tiêu đề nhỏ, AlertTitle
  xl: scale(20, 24), // icon hành động trong bảng
  xxl: scale(24, 28.8), // icon cảnh báo lớn
};

// ══════════════════════════════════════════════════════════════════════════
// §3. GRADIENT / MAU NHAN
//    Dan xuat tu §1. Phai dat TRUOC §4 vi shadows dung accents.*.rgb.
// ══════════════════════════════════════════════════════════════════════════

export const gradients = {
  /** Gradient thương hiệu (tím-xanh) dùng cho tiêu đề, avatar, logo */
  brand: "linear-gradient(45deg, #667eea, #764ba2)",
  /** Nền mờ của khối chào mừng (3 chặng, nhạt nhất) */
  brandWash:
    "linear-gradient(135deg, #667eea11 0%, #764ba211 50%, #2e7d3211 100%)",
  /** Nền mờ của thẻ số liệu tổng (2 chặng, đậm hơn brandWash một bậc) */
  brandWash2: "linear-gradient(135deg, #667eea22 0%, #764ba222 100%)",
  /** 135deg + mốc dừng 0%/100% - dùng ở NỀN TRANG LOGIN, NavigationBar */
  brandDeep: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  /** Thanh ngang 90deg - dùng cho dải tiêu đề mục */
  brandBar: "linear-gradient(90deg,#667eea,#764ba2)",
  /** Đảo chiều 2 màu thương hiệu */
  brandReverse: "linear-gradient(45deg, #764ba2, #667eea)",
  /** Bản tối hơn của brand, dùng cho trạng thái hover của nút */
  brandHover: "linear-gradient(45deg, #5a6fd6, #6a4190)",
  /** Xanh ngọc */
  teal: "linear-gradient(135deg, #00897b 0%, #26a69a 100%)",
  tealDark: "linear-gradient(135deg, #00796b 0%, #00897b 100%)",
  teal45: "linear-gradient(45deg, #00897b 0%, #26a69a 100%)",
  /** Cam đậm */
  orange: "linear-gradient(45deg, #ff9800, #ff5722)",
  orangeHover: "linear-gradient(45deg, #f57c00, #e64a19)",
};

/**
 * Bộ màu nhấn cho các thẻ điều hướng / thẻ thống kê.
 * Mỗi accent gồm: 2 màu gradient + chuỗi rgb dùng cho bóng đổ trong suốt.
 * Thêm một mục ở đây là có ngay một thẻ màu mới, không phải copy 40 dòng sx.
 */
export const accents = {
  red: { from: "#ff6b6b", to: "#ee5a6f", rgb: "255, 107, 107" },
  orange: { from: "#ff9800", to: "#ff5722", rgb: "255, 152, 0" },
  teal: { from: "#00897b", to: "#26a69a", rgb: "0, 137, 123" },
  green: { from: "#2e7d32", to: "#4caf50", rgb: "46, 125, 50" },
  cyan: { from: "#03a9f4", to: "#00bcd4", rgb: "3, 169, 244" },
  amber: { from: "#ffa726", to: "#fb8c00", rgb: "255, 167, 38" },
  purple: { from: "#9c27b0", to: "#e91e63", rgb: "156, 39, 176" },
  slate: { from: "#607d8b", to: "#455a64", rgb: "96, 125, 139" },
  brand: { from: "#667eea", to: "#764ba2", rgb: "102, 126, 234" },
};

/** "linear-gradient(45deg, #ff6b6b, #ee5a6f)" */
export const accentGradient = (key, deg = 45) => {
  const a = accents[key] ?? accents.brand;
  return `linear-gradient(${deg}deg, ${a.from}, ${a.to})`;
};

/** Nền mờ 13% của accent - dùng làm nền thẻ */
export const accentWash = (key) => {
  const a = accents[key] ?? accents.brand;
  return `linear-gradient(135deg, ${a.from}22 0%, ${a.to}22 100%)`;
};

/** Bóng đổ mang màu accent */
export const accentShadow = (key, y = 20, blur = 40, alpha = 0.2) => {
  const a = accents[key] ?? accents.brand;
  return `0 ${y}px ${blur}px rgba(${a.rgb}, ${alpha})`;
};

// ══════════════════════════════════════════════════════════════════════════
// §4. BO GOC / VIEN / BONG DO
//    Bong chuan cua moi mat phang noi dung la shadows.card.
// ══════════════════════════════════════════════════════════════════════════

export const radii = {
  // ------- THANG CHUẨN: chỉ dùng ba bậc này cho code mới -------
  sm: 8,
  md: 12, // bo góc CHUẨN của dự án (nút, ô nhập, alert, card, paper)
  lg: 20, // thẻ lớn, dialog chính

  // Hai hình dạng, không phải bậc thang
  circle: "50%",
  pill: 999,
};

export const borders = {
  /** Viền gần như vô hình, dùng cho thẻ mềm */
  subtle: "1px solid rgba(0, 0, 0, 0.05)",
  /** Đậm hơn subtle một bậc */
  subtle2: "1px solid rgba(0, 0, 0, 0.08)",
  /** Viền xám nhạt thấy rõ, dùng cho bảng và khung ảnh */
  light: `1px solid ${colors.grey[300]}`,
  /** Viền xám nhạt kiểu gạch nối */
  dashed: `1px dashed ${colors.grey[300]}`,
};

/** Chuỗi rgb dùng trong bóng đổ. Tách riêng để bóng đổ cũng truy được về màu. */
export const shadowRgb = {
  black: "0, 0, 0",
  white: "255, 255, 255",
  brand: accents.brand.rgb, // 102, 126, 234
  green: accents.green.rgb, // 46, 125, 50
  teal: accents.teal.rgb, // 0, 137, 123
  slate: "33, 33, 33", // = grey[900] (xám trung tính)
  navy: "15, 23, 42", // = colors.navy.darkest
  indigo: "63, 81, 181",
  orange: "245, 124, 0",
};

/**
 * Sinh chuỗi box-shadow.
 *
 *   shadow(8, 25, shadowRgb.brand, 0.3)  ->  "0 8px 25px rgba(102, 126, 234, 0.3)"
 *
 * @param {number} y     độ lệch dọc (px)
 * @param {number} blur  độ nhoè (px)
 * @param {string} rgb   một khoá của shadowRgb
 * @param {number} alpha độ mờ 0-1
 */
export const shadow = (y, blur, rgb, alpha) =>
  `0 ${y}px ${blur}px rgba(${rgb}, ${alpha})`;

/** Vòng sáng quanh phần tử (spread, không lệch) - dùng cho focus/highlight */
export const ring = (spread, rgb, alpha) =>
  `0 0 0 ${spread}px rgba(${rgb}, ${alpha})`;

/**
 * Các bóng đổ LẶP LẠI nhiều chỗ. Bóng chỉ dùng một lần thì gọi shadow() ngay
 * tại chỗ - đặt tên cho giá trị dùng một lần chỉ thêm lớp gián tiếp.
 */
export const shadows = {
  /** BÓNG CHUẨN CỦA MẶT PHẲNG NỘI DUNG - dùng cho mọi khối "thẻ" trong app. */
  card: shadow(2, 8, "0, 0, 0", 0.1),
  /** Nhấc nổi mang màu thương hiệu */
  brandLift: shadow(8, 25, accents.brand.rgb, 0.3),
  /** Nhấc nổi màu xanh thành công */
  greenLift: shadow(8, 25, accents.green.rgb, 0.3),
  /** Bóng nổi của modal / panel đè lên */
  overlay: shadow(8, 32, "0, 0, 0", 0.2),
  /** Bóng vừa, trung tính */
  medium: shadow(4, 12, "0, 0, 0", 0.15),
  /** Bóng rất nhẹ khi hover thẻ */
  hover: shadow(4, 12, "0, 0, 0", 0.05),
};

// ══════════════════════════════════════════════════════════════════════════
// §5. THEME MUI
//    palette / breakpoints / typography / style mac dinh component.
// ══════════════════════════════════════════════════════════════════════════

export const palette = {
  primary: {
    main: "#1976d2",
    light: "#42a5f5",
    dark: "#1565c0",
  },
  secondary: {
    main: "#dc004e",
    light: "#f50057",
    dark: "#c51162",
  },
  success: {
    main: "#2e7d32",
    light: "#4caf50",
    dark: "#1b5e20",
  },
  background: {
    default: "#f5f5f5",
    paper: "#ffffff",
  },
};

export const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  },
};

// Dưới 600px (breakpoints.down("sm")) tiêu đề LÙI MỘT BẬC. Quy tắc nằm ĐÚNG
// MỘT CHỖ là đây; các trang không cần biết isMobile.
// KHÔNG lùi h6 - h6 được dùng làm cỡ chuẩn ở rất nhiều nơi.
const MOBILE = "@media (max-width:599.95px)"; // = breakpoints.down("sm")

/** Cỡ chữ tiêu đề: chuẩn `hi` px, trên điện thoại dùng `mobile` px. */
const heading = (lo, hi, mobile) =>
  FLUID_TYPE
    ? { fontSize: fluid(lo, hi) }
    : {
        fontSize: `${hi / REM}rem`,
        [MOBILE]: { fontSize: `${mobile / REM}rem` },
      };

export const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',

  //          nhỏ nhất  chuẩn  mobile(<600px) = cỡ của bậc kế tiếp
  h1: heading(40, 96, 60), // -> cỡ h2
  h2: heading(32, 60, 48), // -> cỡ h3
  h3: heading(26, 48, 34), // -> cỡ h4   (tiêu đề trang)
  h4: { ...heading(22, 34, 24), fontWeight: 600 }, // -> cỡ h5
  h5: { ...heading(18, 24, 20), fontWeight: 500 }, // -> cỡ h6
  h6: { fontSize: scale(16, 20), fontWeight: 500 }, // giữ nguyên

  subtitle1: { fontSize: scale(15, 16) },
  subtitle2: { fontSize: scale(13, 14) },

  body1: { fontSize: scale(14, 16) },
  body2: { fontSize: scale(13, 14) },

  button: { fontSize: scale(13, 14) },
  caption: { fontSize: scale(11.5, 12) },
  overline: { fontSize: scale(11.5, 12) },
};

export const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: "none",
        borderRadius: radii.md, // 12px = bo góc chuẩn của dự án
        fontWeight: 500,
      },
      // Button tự đặt fontSize cứng theo size -> ghi đè để cỡ chữ nút cũng đi
      // qua công tắc FLUID_TYPE như phần còn lại.
      sizeSmall: { fontSize: scale(12, 13) },
      sizeMedium: { fontSize: scale(13, 14) },
      sizeLarge: { fontSize: scale(14, 15) },
    },
  },

  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: radii.md,
        boxShadow: shadows.card,
      },
    },
    variants: [
      {
        // <Card variant="soft"> - bản variant của sx.softCard
        props: { variant: "soft" },
        style: {
          borderRadius: radii.lg,
          border: borders.subtle,
        },
      },
    ],
  },

  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: radii.md,
      },
    },
    variants: [
      {
        // MUI cố tình BỎ bóng cho outlined. Ở dự án này outlined được dùng làm
        // KHỐI NỘI DUNG nằm cạnh <Card> vốn luôn có bóng -> trả lại bóng chuẩn
        // để không có chỗ nổi chỗ phẳng.
        props: { variant: "outlined" },
        style: {
          boxShadow: shadows.card,
        },
      },
      {
        // <Paper variant="section"> - khối nội dung có tiêu đề trong trang
        props: { variant: "section" },
        style: ({ theme }) => ({
          padding: theme.spacing(2),
          borderRadius: radii.md,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "none",
          [theme.breakpoints.up("md")]: { padding: theme.spacing(3) },
        }),
      },
      {
        // <Paper variant="statCard"> - ô số liệu nền gradient thương hiệu
        props: { variant: "statCard" },
        style: ({ theme }) => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(0.5),
          padding: theme.spacing(2),
          borderRadius: radii.md,
          color: theme.palette.common.white,
          background: gradients.brand,
          boxShadow: "none",
        }),
      },
    ],
  },

  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: radii.md,
      },
    },
  },

  // Ô nhập viền (TextField/Select/Autocomplete variant="outlined")
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: radii.md,
      },
    },
  },

  // Chỉ áp cho <Table size="small">; 14px = đúng mặc định của MUI.
  MuiTableCell: {
    styleOverrides: {
      sizeSmall: {
        fontSize: scale(12, 14),
      },
    },
  },

  // Tooltip trên màn hình cảm ứng ở nhà máy: cho phép chạm để hiện
  MuiTooltip: {
    defaultProps: {
      enterTouchDelay: 0,
      leaveTouchDelay: 3000,
    },
  },

  // Thanh cuộn mỏng suốt toàn app chuẩn ERP Dashboard
  MuiCssBaseline: {
    styleOverrides: {
      "*": {
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(148, 163, 184, 0.35) transparent",
      },
      "*::-webkit-scrollbar": {
        width: "5px",
        height: "5px",
      },
      "*::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "*::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(148, 163, 184, 0.3)",
        borderRadius: "9999px",
      },
      "*::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "rgba(148, 163, 184, 0.6)",
      },
      "*::-webkit-scrollbar-corner": {
        background: "transparent",
      },
    },
  },
};

export const theme = createTheme({
  breakpoints,
  palette,
  typography,
  shape: { borderRadius: radii.sm },
  components,
});

export default theme;

// ══════════════════════════════════════════════════════════════════════════
// §6. PRESET sx
//    Chi nhung doan sx lap lai nhieu noi. Dung MOT lan thi viet ngay tai cho.
// ══════════════════════════════════════════════════════════════════════════

/**
 * LƯỚI TỰ TÍNH SỐ CỘT (thay cho <Grid size={{ xs: 12, sm: 6, md: 4 }}>).
 * Trình duyệt tự lấy bề rộng CONTAINER chia cho minPx để ra số cột - không có
 * breakpoint nào. Đổi sidebar, đổi zoom, mở trong dialog -> tự đúng.
 *
 * @param {number} minPx   bề rộng tối thiểu của một ô trước khi ngắt cột
 * @param {number} gap     khoảng cách (đơn vị theme.spacing, 1 = 8px)
 * @param {number} maxCols trần số cột (0 = không giới hạn)
 */
export const autoGrid = (minPx = 280, gap = 3, maxCols = 0) => {
  const gapPx = gap * 8; // theme.spacing mặc định: 1 = 8px
  const track =
    maxCols > 0
      ? `min(100%, max(${minPx}px, calc((100% - ${
          (maxCols - 1) * gapPx
        }px) / ${maxCols})))`
      : `min(${minPx}px, 100%)`;

  return {
    display: "grid",
    gap,
    gridTemplateColumns: `repeat(auto-fit, minmax(${track}, 1fr))`,
  };
};

export const sx = {
  /** Canh giữa toàn màn hình - dùng cho loading / trạng thái rỗng.
   *  Dùng 100dvh chứ không phải 100vh: trên mobile 100vh bị thanh địa chỉ của
   *  trình duyệt cắt mất, gây tràn và nhảy layout. */
  centerFull: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
  },

  /** Hàng chip thống kê: tự xuống dòng, mỗi chip giữ đúng bề rộng nội dung */
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
  },

  /** Cắt chữ 1 dòng kèm dấu ... */
  ellipsis: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  /** Chữ tô gradient (tiêu đề QCO, tiêu đề section) */
  gradientText: (gradient = gradients.brand) => ({
    background: gradient,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }),

  /** Khối thẻ mềm: bo góc lớn + viền nhạt + BÓNG CHUẨN.
   *  Ghi tường minh shadows.card để <Paper> dùng preset này cũng nổi giống
   *  <Card> (Card đã tự có bóng qua theme, Paper thì không). */
  softCard: {
    borderRadius: `${radii.lg}px`,
    border: borders.subtle,
    boxShadow: shadows.card,
  },

  /** Panel nội dung có viền xám rõ */
  panel: {
    border: borders.light,
    overflow: "hidden",
    boxShadow: shadows.card,
  },

  /** Thẻ bấm được, ở trạng thái CHƯA chọn */
  cardSelectable: {
    cursor: "pointer",
    border: borders.subtle,
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: shadows.hover,
    },
  },

  /** Thẻ bấm được, ở trạng thái ĐANG chọn (dùng làm filter) */
  cardSelected: (t) => ({
    cursor: "pointer",
    border: `3px solid ${t.palette.primary.main}`,
    boxShadow: shadows.brandLift,
    transform: "translateY(-4px)",
    transition: "all 0.2s ease",
  }),

  /** PaperProps.sx cho Dialog: bo góc trên desktop, vuông khi fullScreen */
  dialogPaper: (fullScreen) => ({
    borderRadius: fullScreen ? 0 : `${radii.lg}px`,
  }),

  /** Tiêu đề Dialog nền gradient thương hiệu */
  dialogTitle: {
    pb: 1,
    background: gradients.brand,
    color: colors.white,
    fontWeight: 700,
  },

  /** Ô nhập liệu được TÔ SÁNG để người dùng biết là tự điền / bị khoá:
   *  nền vàng nhạt, chữ và viền đỏ. */
  fieldHighlight: {
    "& .MuiInputBase-root.Mui-disabled": {
      backgroundColor: `${colors.yellow.wash} !important`,
      "& fieldset": {
        borderColor: `${colors.red.main} !important`,
      },
      "& .MuiInputBase-input": {
        color: colors.red.main,
        WebkitTextFillColor: `${colors.red.main} !important`,
        fontWeight: 600,
        opacity: 1,
      },
      "& .MuiFormLabel-root": {
        color: `${colors.red.main} !important`,
      },
    },
    "& .MuiOutlinedInput-root.Mui-disabled": {
      backgroundColor: `${colors.yellow.wash} !important`,
    },
  },
};


// ══════════════════════════════════════════════════════════════════════════
// §7. DASHBOARD BAO CAO (nen toi)
//    Bang dieu khien treo man hinh lon trong xuong - nen navy, chu sang.
//    Tach rieng khoi §1 vi day la mot NGU CANH khac: cac trang thuong dung
//    nen sang, rieng dashboard dung nen toi.
// ══════════════════════════════════════════════════════════════════════════

export const dash = {
  /** Nền trang: Deep Navy siêu sang từ ERP (#031835) */
  bg: "#031835",
  /** Mặt thẻ: Glassmorphic trong suốt hiện đại pha ERP Card (#062251) */
  panel: "rgba(6, 34, 81, 0.45)",
  /** Nền dải tiêu đề thẻ / hàng xen kẽ */
  panelAlt: "rgba(6, 30, 68, 0.65)",
  /** Nền ô số liệu nổi bật / tile */
  tile: "rgba(4, 23, 56, 0.55)",

  border: "rgba(255, 255, 255, 0.1)",
  borderStrong: "rgba(59, 130, 246, 0.35)",

  /**
   * NỀN ĐỤC cho hàng DÍNH (sticky) của bảng.
   *
   * `panel` / `panelAlt` đều trong suốt một phần - đẹp khi nằm yên, nhưng ô
   * sticky mà nền trong suốt thì chữ của hàng bên dưới XUYÊN QUA khi cuộn,
   * đọc ra hai dòng chồng nhau. Hai mã dưới đây là kết quả trộn sẵn đúng màu
   * đó lên nền thẻ, nên nhìn y hệt mà không còn trong suốt.
   */
  rowHead: "#082556",  // = rgba(8, 38, 88, 0.92) trộn lên mặt thẻ
  rowTotal: "#061e44", // = rgba(6, 30, 68, 0.85) trộn lên mặt thẻ
  grid: "rgba(255, 255, 255, 0.08)", // lưới biểu đồ thanh mảnh, tinh tế

  ink: "#ffffff",
  inkSoft: "#cbd5e1", // slate-300
  inkMuted: "#94a3b8", // slate-400

  /** Màu trạng thái chuẩn ERP Dashboard */
  status: {
    good: "#22c55e", // erp-green
    warn: "#f59e0b", // erp-yellow / amber
    bad: "#ef4444",  // erp-red
    orange: "#f97316", // erp-orange
    blue: "#3b82f6", // erp-blue
    cyan: "#00e5ff", // erp-cyan
    purple: "#8b5cf6", // erp-purple
  },

  /** Màu chuỗi dữ liệu rực rỡ và hài hòa */
  series: ["#3b82f6", "#f97316", "#22c55e", "#f59e0b", "#8b5cf6", "#00e5ff"],

  /** Đường "toàn công ty" - nét đứt trung tính */
  company: "#e2e8f0",
};

/**
 * Chọn màu trạng thái theo ngưỡng phần trăm.
 * Dùng chung cho bảng và biểu đồ để một con số luôn cùng màu ở mọi nơi.
 *
 * @param {number} value   giá trị thực tế (%)
 * @param {number} target  ngưỡng đạt (%)
 */
export const dashStatusColor = (value, target) => {
  if (value >= target) return dash.status.good;
  if (value >= target * 0.75) return dash.status.warn;
  return dash.status.bad;
};
