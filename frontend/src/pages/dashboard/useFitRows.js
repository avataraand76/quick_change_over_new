// frontend/src/pages/dashboard/useFitRows.js
//
// TU CO CO CHU DE BANG HIEN DU MOI DONG, KHONG PHAI CUON.
//
// Vi sao can: dashboard treo tuong thi khong ai cuon chuot. So lan chuyen doi
// moi ky mot khac (hom nay 23, thang sau co the 35), nen khong the dat cung
// mot co chu - dat to thi thua dong, dat nho thi phi cho.
//
// ── DO THAT, KHONG TINH THEO CONG THUC ───────────────────────────────────
// Ban dau toi tinh chieu cao dong = coChu x lineHeight + dem. SAI: o "RAMP-UP"
// la mot the Y/N co padding va duong vien RIENG, chinh no moi quyet dinh
// chieu cao dong. Ket qua la bang bi cat mat 8 dong ma hook van tuong la vua.
//
// Nay lam nguoc lai: ve ra, DO scrollHeight so voi clientHeight, con tran thi
// ha co chu mot nac roi do lai. Khong phu thuoc gia dinh nao ve noi dung o.
//
// ── VI SAO DUNG CSS VARIABLE CHU KHONG DUNG useState ─────────────────────
// Vong "do -> co -> do lai" ma di qua state cua React thi moi nac la mot lan
// render lai ca bang (7 nac = 7 lan), va vi pham luat react-hooks: goi
// setState dong bo trong effect gay render day chuyen.
//
// Thay vao do hook ghi thang hai bien CSS len khung:
//     --row-font   co chu o than bang
//     --row-pad    dem tren/duoi moi o
//     --head-font  co chu o tieu de (co san rieng, cao hon than bang)
// CSS variable TU THUA KE xuong moi o ben trong, nen chi ghi MOT cho la ca
// bang doi theo, khong render lai lan nao. Bang nao khong nam trong khung nay
// thi khong thay bien -> tu dong dung gia tri mac dinh.

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const MAX_FONT = 13.5; // px - trần chữ rõ nét, dễ đọc trên màn hình Desktop / TV
const MIN_FONT = 12.5; // px - sàn chữ đủ lớn, nếu nhiều dòng thì cuộn mượt thay vì ép chữ nhỏ li ti
const STEP = 0.5; // px - mỗi lần hạ một nấc
const MAX_PASS = 12; // chặn vòng lặp nếu phép đo không hội tụ
const PAD_RATIO = 0.32; // đệm trên/dưới thoải mái cho từng dòng
const HEAD_MIN_FONT = 12.5; // px - sàn riêng cho ô tiêu đề bảng

/**
 * @param {number} rowCount số dòng thân bảng (kể cả dòng tổng) - đổi thì đo lại
 * @returns {object} ref để gắn vào KHUNG CUỘN bao quanh bảng
 */
export function useFitRows(rowCount) {
  const scrollRef = useRef(null);

  const fit = useCallback(() => {
    const box = scrollRef.current;
    if (!box) return;

    const apply = (font) => {
      box.style.setProperty("--row-font", `${font}px`);
      box.style.setProperty("--row-pad", `${(font * PAD_RATIO).toFixed(2)}px`);
      // Tiêu đề co theo nhưng chậm hơn và có sàn riêng cao hơn: nó chỉ chiếm
      // 2 dòng nên co nhiều không lợi bao nhiêu, mà lại khó đọc.
      box.style.setProperty(
        "--head-font",
        `${Math.max(HEAD_MIN_FONT, font + 0.5).toFixed(2)}px`
      );
    };

    // +1 cho sai số làm tròn của trình duyệt
    const overflowing = () => box.scrollHeight > box.clientHeight + 1;

    // Luôn bắt đầu lại từ cỡ lớn nhất: nếu trước đó bị co vì nhiều dòng, mà
    // nay lọc còn ít dòng thì phải phóng to trở lại.
    let font = MAX_FONT;
    apply(font);

    // Đọc scrollHeight sau mỗi lần ghi style buộc trình duyệt tính lại bố cục
    // ngay - đó chính là điều ta cần để đo cho đúng.
    let pass = 0;
    while (overflowing() && font > MIN_FONT && pass < MAX_PASS) {
      font = Math.max(MIN_FONT, font - STEP);
      apply(font);
      pass += 1;
    }

    // Chạm sàn mà vẫn tràn thì đành cho cuộn, còn hơn cắt mất dòng.
    box.style.overflowY = overflowing() ? "auto" : "hidden";
  }, []);

  // Chạy TRƯỚC khi trình duyệt sơn lên màn hình -> không thấy bảng nhấp nháy
  useLayoutEffect(() => {
    fit();
  }, [fit, rowCount]);

  // Khung đổi kích thước (kéo cửa sổ, đổi độ phân giải, bật toàn màn hình)
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || typeof ResizeObserver === "undefined") return undefined;

    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [fit]);

  return scrollRef;
}

export default useFitRows;
