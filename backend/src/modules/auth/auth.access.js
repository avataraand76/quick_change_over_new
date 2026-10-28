// backend/src/modules/auth/auth.access.js
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ★ DAY LA FILE DUY NHAT PHAI VIET LAI KHI COPY MODULE auth/ SANG DU AN  ║
// ║    MOI. Moi file con lai trong folder nay deu dung nguyen.              ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// Vi sao tach rieng: CACH dang nhap thi du an nao cung giong nhau (tra ma the
// -> so bcrypt -> ky JWT). Nhung MO HINH PHAN QUYEN thi moi du an mot kieu.
// Phan "giong nhau" nam o auth.service.js, phan "moi du an mot kieu" nam tron
// trong file nay. Service chi goi qua hai ham duoi day.
//
// ── PHAN QUYEN CUA QCO ────────────────────────────────────────────────────
// MOT TRUC duy nhat, giong het TPM:
//
//   tb_permission        danh muc quyen: admin / edit / view
//   tb_user_permission   nhan vien nao co quyen nao
//                        khoa `id_nhan_vien` = `sync_nhan_vien.id` ben DB nhan su

const { db } = require("../../database");

/**
 * Tên quyền, viết một lần ở đây để nơi khác không phải so chuỗi tay.
 * Khớp đúng cột `name_permission` trong bảng `tb_permission`.
 */
const PERMISSIONS = {
  ADMIN: "admin",
  EDIT: "edit",
  VIEW: "view",
};

/**
 * Lấy phân quyền của một nhân viên trong DB của dự án.
 *
 * Dùng JOIN chứ không đọc thẳng `tb_user_permission`, để dòng trỏ tới quyền
 * đã bị xoá tự rớt thay vì lọt ra ngoài dưới dạng `undefined`.
 *
 * Trả về một OBJECT (không phải mảng trần) để sau này thêm trục phân quyền
 * mới thì chỉ thêm khoá, `auth.service.js` không phải sửa.
 *
 * @param {number} idNhanVien = sync_nhan_vien.id
 * @returns {Promise<{permissions: string[]}>}
 */
const getUserAccess = async (idNhanVien) => {
  const [rows] = await db.app.query(
    `
    SELECT p.name_permission
    FROM tb_user_permission up
    JOIN tb_permission p ON p.id_permission = up.id_permission
    WHERE up.id_nhan_vien = ?
    `,
    [idNhanVien]
  );

  return {
    permissions: rows.map((r) => r.name_permission),
  };
};

/**
 * Nhân viên này có được vào hệ thống không?
 *
 * Là nhân viên hợp lệ trong DB nhân sự CHƯA đủ - cả công ty đều có trong đó.
 * Phải được cấp ít nhất một quyền trong DB của dự án mới được vào.
 *
 * @param {object} access kết quả của getUserAccess()
 * @returns {boolean}
 */
const hasSystemAccess = (access) => access.permissions.length > 0;

module.exports = { PERMISSIONS, getUserAccess, hasSystemAccess };
