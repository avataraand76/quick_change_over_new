// frontend/src/pages/dashboard/dashboardMockData.js
//
// ⚠ DỮ LIỆU GIẢ - CHỈ ĐỂ DỰNG BỐ CỤC.
//
// Toàn bộ số liệu của dashboard nằm TRONG MỘT FILE NÀY. Khi có API thật, chỉ
// cần đổi `useDashboardData()` bên dưới thành một lời gọi api và xoá phần số
// liệu cứng - các component không phải sửa gì, vì chúng chỉ nhận props.
//
// Số liệu chép theo ảnh mẫu để nhìn ra ngay bố cục đúng hay sai.

/** Kỳ báo cáo đang xem */
export const period = {
  from: "01/08/2026",
  to: "31/08/2026",
  updatedAt: "31/08/2026 09:00 AM",
};

/** Mục tiêu hiệu suất từng ngày sau chuyển đổi (%) */
export const dayTargets = { d1: 60, d2: 70, d3: 80 };

/** Ngưỡng đạt của HSBQ 3 ngày (%) - dùng cho đường mục tiêu trên biểu đồ */
export const hsbqTarget = 70;

export const groups = [
  "NHÓM 1 - DUNG",
  "NHÓM 2 - HƯƠNG",
  "NHÓM 3 - TIẾN",
  "NHÓM 4 - TUYẾT",
  "NHÓM 5 - XUYÊN",
];

/**
 * Một dòng = một lần chuyển đổi.
 *
 * `maMoi` / `maLap`: mã hàng MỚI (khác mã đang chạy) hay LẶP LẠI (cùng mã).
 *   Mỗi dòng chỉ có một trong hai, cái còn lại để null.
 * `d1`/`d2`/`d3`: hiệu suất thực tế ngày 1/2/3 sau chuyển đổi (%).
 * `hsbq3`: trung bình 3 ngày (%).
 * `rampUp`: đạt ramp-up hay không.
 */
export const rows = [
  { stt: 1, group: "NHÓM 1 - DUNG", to: "15", maMoi: "BM091MJ", maLap: null, date: "08/01/2026", d1: 41, d2: 70, d3: 81, hsbq3: 64, rampUp: false },
  { stt: 2, group: "NHÓM 2 - HƯƠNG", to: "10", maMoi: null, maLap: "AP620MP", date: "08/01/2026", d1: 98, d2: 115, d3: 120, hsbq3: 111, rampUp: true },
  { stt: 3, group: "NHÓM 4 - TUYẾT", to: "1", maMoi: "530A", maLap: null, date: "08/03/2026", d1: 18, d2: 23, d3: 42, hsbq3: 28, rampUp: false },
  { stt: 4, group: "NHÓM 2 - HƯƠNG", to: "37+38", maMoi: "F48A", maLap: null, date: "08/03/2026", d1: 21, d2: 21, d3: 35, hsbq3: 28, rampUp: false },
  { stt: 5, group: "NHÓM 2 - HƯƠNG", to: "7", maMoi: "BF262MJ", maLap: null, date: "08/06/2026", d1: 61, d2: 46, d3: 48, hsbq3: 52, rampUp: false },
  { stt: 6, group: "NHÓM 2 - HƯƠNG", to: "21+22", maMoi: null, maLap: "AU943MV", date: "08/06/2026", d1: 77, d2: 71, d3: 82, hsbq3: 77, rampUp: true },
  { stt: 7, group: "NHÓM 2 - HƯƠNG", to: "3+5", maMoi: null, maLap: "5365", date: "08/06/2026", d1: 22, d2: 64, d3: 68, hsbq3: 51, rampUp: false },
  { stt: 8, group: "NHÓM 3 - TIẾN", to: "29", maMoi: null, maLap: "AW067LS", date: "08/07/2026", d1: 22, d2: 36, d3: 40, hsbq3: 34, rampUp: false },
  { stt: 9, group: "NHÓM 1 - DUNG", to: "19", maMoi: "AN075LP", maLap: null, date: "08/07/2026", d1: 21, d2: 31, d3: 37, hsbq3: 30, rampUp: false },
  { stt: 10, group: "NHÓM 3 - TIẾN", to: "26", maMoi: "AW731LP", maLap: null, date: "08/11/2026", d1: 39, d2: 31, d3: 37, hsbq3: 36, rampUp: false },
  { stt: 11, group: "NHÓM 2 - HƯƠNG", to: "35", maMoi: null, maLap: "N029B", date: "08/11/2026", d1: 28, d2: 43, d3: 60, hsbq3: 44, rampUp: false },
  { stt: 12, group: "NHÓM 3 - TIẾN", to: "25", maMoi: null, maLap: "AQ224MP", date: "08/12/2026", d1: 43, d2: 36, d3: 50, hsbq3: 43, rampUp: false },
  { stt: 13, group: "NHÓM 3 - TIẾN", to: "30", maMoi: null, maLap: "B8996LJ", date: "13/08/2026", d1: 78, d2: 60, d3: 79, hsbq3: 72, rampUp: true },
  { stt: 14, group: "NHÓM 1 - DUNG", to: "20", maMoi: "BG061LJ", maLap: null, date: "14/08/2026", d1: 27, d2: 41, d3: 35, hsbq3: 34, rampUp: false },
  { stt: 15, group: "NHÓM 1 - DUNG", to: "11", maMoi: "MB71000H", maLap: null, date: "18/08/2026", d1: 57, d2: 80, d3: 87, hsbq3: 75, rampUp: true },
  { stt: 16, group: "NHÓM 1 - DUNG", to: "12", maMoi: "MB71000K", maLap: null, date: "18/08/2026", d1: 31, d2: 37, d3: 54, hsbq3: 41, rampUp: false },
  { stt: 17, group: "NHÓM 3 - TIẾN", to: "21+22", maMoi: null, maLap: "BJ103LJ", date: "18/08/2026", d1: 17, d2: 48, d3: 61, hsbq3: 42, rampUp: false },
  { stt: 18, group: "NHÓM 4 - TUYẾT", to: "3+5", maMoi: "9416", maLap: null, date: "21/08/2026", d1: 22, d2: 40, d3: 64, hsbq3: 42, rampUp: false },
  { stt: 19, group: "NHÓM 2 - HƯƠNG", to: "6", maMoi: "BK041GP", maLap: null, date: "21/08/2026", d1: 66, d2: 45, d3: 66, hsbq3: 59, rampUp: false },
  { stt: 20, group: "NHÓM 3 - TIẾN", to: "21+22", maMoi: "MJ7102WK", maLap: null, date: "22/08/2026", d1: 17, d2: 18, d3: 29, hsbq3: 21, rampUp: false },
  { stt: 21, group: "NHÓM 5 - XUYÊN", to: "39+40", maMoi: null, maLap: "F048", date: "25/08/2026", d1: 21, d2: 44, d3: 54, hsbq3: 40, rampUp: false },
  { stt: 22, group: "NHÓM 1 - DUNG", to: "19", maMoi: "MB71F4SQ", maLap: null, date: "27/08/2026", d1: 34, d2: 47, d3: 50, hsbq3: 44, rampUp: false },
  { stt: 23, group: "NHÓM 1 - DUNG", to: "16", maMoi: "F048", maLap: null, date: "28/08/2026", d1: 3, d2: 17, d3: 15, hsbq3: 12, rampUp: false },
];

/** Các chỉ số to ở dải đầu trang */
export const kpi = {
  totalChangeovers: 23,
  hsbqCompany: 47,
  hsbqByDay: { d1: 38, d2: 47, d3: 56 },
  hsbqMaMoi: 40,
  hsbqMaLap: 57,
  rampUpAchieved: 4,
  rampUpTotal: 23,
};

/** Sáu tháng gần nhất - mỗi nhóm một đường, cộng đường trung bình toàn công ty */
export const months = ["T3", "T4", "T5", "T6", "T7", "T8"];

export const monthlySeries = [
  { name: "NHÓM 1 - DUNG", values: [59, 69, 94, 72, 69, 43] },
  { name: "NHÓM 2 - HƯƠNG", values: [92, 61, 83, 53, 54, 63] },
  { name: "NHÓM 3 - TIẾN", values: [54, 57, 83, 41, 47, 44] },
  { name: "NHÓM 4 - TUYẾT", values: [37, 61, 12, 28, 18, 40] },
  { name: "NHÓM 5 - XUYÊN", values: [27, 57, 61, 41, 54, 40] },
];

export const companySeries = { name: "TOÀN CÔNG TY", values: [54, 61, 83, 53, 54, 47] };

/** Tổng hợp theo nhóm - bảng góc dưới bên trái */
export const groupSummary = [
  { group: "NHÓM 1 - DUNG", count: 7, hsbq3: 43, rampUp: "1/7", rampUpPct: 14, maMoi: 43, maLap: null, rating: "Cần cải thiện" },
  { group: "NHÓM 2 - HƯƠNG", count: 7, hsbq3: 60, rampUp: "2/7", rampUpPct: 29, maMoi: 46, maLap: 71, rating: "Cần cải thiện" },
  { group: "NHÓM 3 - TIẾN", count: 6, hsbq3: 41, rampUp: "1/6", rampUpPct: 17, maMoi: 29, maLap: 48, rating: "Cần cải thiện" },
  { group: "NHÓM 4 - TUYẾT", count: 2, hsbq3: 35, rampUp: "0/2", rampUpPct: 0, maMoi: 35, maLap: null, rating: "Cần cải thiện" },
  { group: "NHÓM 5 - XUYÊN", count: 1, hsbq3: 40, rampUp: "0/1", rampUpPct: 0, maMoi: null, maLap: 40, rating: "Cần cải thiện" },
];

export const companySummary = {
  count: 23,
  hsbq3: 47,
  rampUp: "4/23",
  rampUpPct: 17,
  maMoi: 40,
  maLap: 57,
};

/**
 * Cửa duy nhất để trang lấy dữ liệu.
 *
 * KHI CÓ API THẬT: đổi thân hàm này thành
 *
 *     const [data, setData] = useState(null);
 *     useEffect(() => { api.dashboard.overview({ from, to, group }).then(...) }, [...]);
 *     return { ...data, loading };
 *
 * và xoá các hằng số ở trên. Không component nào phải sửa.
 */
export const useDashboardData = () => ({
  period,
  dayTargets,
  hsbqTarget,
  groups,
  rows,
  kpi,
  months,
  monthlySeries,
  companySeries,
  groupSummary,
  companySummary,
  loading: false,
});
