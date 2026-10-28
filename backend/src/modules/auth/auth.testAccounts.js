// backend/src/modules/auth/auth.testAccounts.js
//
// TAI KHOAN AO de thu giao dien ma khong can nhan vien that, va khong can DB
// nhan su song.
//
// ⚠ DAT SAU CONG TAC .env: ALLOW_TEST_ACCOUNTS=true. Mac dinh TAT.
//   De bat tren may that = mo mot cua hau dang nhap cho ai cung vao duoc.
//   (TPM bat vinh vien trong code; o day co tinh lam khac.)
//
// Quyen cua tai khoan test duoc VIET THANG trong file nay, khong tra DB - nho
// vay thu duoc ca khi bang tb_user_permission chua co dong nao.

const env = require("../../config/env");

/**
 * Khoá của object = thứ gõ vào ô "Số thẻ" ở màn hình đăng nhập.
 * Mật khẩu chung lấy từ .env (TEST_ACCOUNT_PASSWORD).
 *
 * Ba tài khoản ứng đúng ba quyền trong `tb_permission`: admin / edit / view.
 * `id` để dải 999xx cho không đụng id nhân viên thật.
 */
const TEST_ACCOUNTS = {
  admin: {
    employee: {
      id: 99999,
      ma_nv: "99999",
      ten_nv: "Quản Trị Viên (Test)",
      cong_viec_phu_trach: "Quản trị hệ thống",
      id_bo_phan: 93,
      ten_bo_phan: "Phòng IT (Test)",
      id_phong_ban: 15,
      ten_phong_ban: "Phòng IT (Test)",
      id_company: 1,
      ten_cong_ty: "Việt Long Hưng (Test)",
      id_department: "1-15",
    },
    access: { permissions: ["admin"] },
  },

  edit: {
    employee: {
      id: 99990,
      ma_nv: "99990",
      ten_nv: "Người Chỉnh Sửa (Test)",
      cong_viec_phu_trach: "Chỉnh sửa dữ liệu",
      id_bo_phan: 50,
      ten_bo_phan: "Bộ phận Kỹ Thuật (Test)",
      id_phong_ban: 10,
      ten_phong_ban: "Phòng Kỹ Thuật (Test)",
      id_company: 1,
      ten_cong_ty: "Việt Long Hưng (Test)",
      id_department: "1-10",
    },
    access: { permissions: ["edit"] },
  },

  view: {
    employee: {
      id: 99995,
      ma_nv: "99995",
      ten_nv: "Người Xem (Test)",
      cong_viec_phu_trach: "Xem dữ liệu",
      id_bo_phan: 50,
      ten_bo_phan: "Bộ phận Kỹ Thuật (Test)",
      id_phong_ban: 10,
      ten_phong_ban: "Phòng Kỹ Thuật (Test)",
      id_company: 1,
      ten_cong_ty: "Việt Long Hưng (Test)",
      id_department: "1-10",
    },
    access: { permissions: ["view"] },
  },
};

const isEnabled = () => env.testAccounts.enabled;

/**
 * Tìm tài khoản test theo mã thẻ + mật khẩu gõ vào.
 * Trả null nếu công tắc đang tắt hoặc không khớp.
 *
 * Nhận CẢ HAI cách gõ: khoá ngắn (`admin`) lẫn mã thẻ ảo (`99999`). Hai giá
 * trị này khác nhau nên ai nhìn bảng tài khoản test rồi gõ `99999` sẽ bị báo
 * sai mật khẩu một cách khó hiểu - chấp nhận cả hai thì hết bẫy.
 */
const match = (ma_nv, password) => {
  if (!isEnabled()) return null;

  const account =
    TEST_ACCOUNTS[ma_nv] ||
    Object.values(TEST_ACCOUNTS).find((a) => a.employee.ma_nv === ma_nv);

  if (!account) return null;
  if (password !== env.testAccounts.password) return null;

  return account;
};

/**
 * Tìm tài khoản test theo id trong token.
 * Cần cho /me và /permissions: tài khoản test không có dòng nào trong DB nên
 * không tra DB được.
 */
const findById = (id) => {
  if (!isEnabled()) return null;
  return Object.values(TEST_ACCOUNTS).find((a) => a.employee.id === id) || null;
};

/**
 * Danh sách tài khoản test để in cảnh báo lúc khởi động.
 * In kèm mã thẻ ảo để người chạy biết gõ gì cũng được: "admin (99999)".
 */
const names = () =>
  Object.entries(TEST_ACCOUNTS).map(
    ([key, a]) => `${key} (${a.employee.ma_nv})`
  );

module.exports = { isEnabled, match, findById, names };
