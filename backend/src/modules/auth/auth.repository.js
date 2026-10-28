// backend/src/modules/auth/auth.repository.js
//
// TANG TRUY VAN DB NHAN SU. Chi chua SQL, khong chua quyet dinh nghiep vu.
//
// DB `hr` (sync_data_hi_time_sheet) la DB DUNG CHUNG toan cong ty, do he
// thong nhan su dong bo sang. CHI DOC - moi truy van o file nay deu la SELECT.
// Du an TPM cung doc dung bang nay bang dung cau JOIN nay.

const { db } = require("../../database");

/**
 * Cột nhân viên dùng chung cho mọi truy vấn bên dưới.
 *
 * `id_department` = id_company + '-' + id_phong_ban. Đây là quy ước có sẵn từ
 * TPM: một phòng ban chỉ định danh được khi đi kèm công ty, vì hai công ty
 * trong tập đoàn có thể trùng số phòng ban.
 */
const EMPLOYEE_COLUMNS = `
  nv.id,
  nv.ma_nv,
  nv.mat_khau,
  nv.ten_nv,
  nv.cong_viec_phu_trach,
  bp.id AS id_bo_phan,
  bp.ten_bo_phan,
  pb.id AS id_phong_ban,
  pb.ten_phong_ban,
  com.id_company,
  com.ten_cong_ty,
  CONCAT(com.id_company, '-', pb.id) AS id_department
`;

const EMPLOYEE_JOINS = `
  FROM sync_nhan_vien nv
  LEFT JOIN sync_bo_phan bp ON bp.id = nv.id_bo_phan
  LEFT JOIN sync_phong_ban pb ON pb.id = bp.id_phong_ban
  LEFT JOIN sync_company com ON com.id_company = pb.id_company
`;

/**
 * Tìm nhân viên theo MÃ SỐ THẺ (thứ người dùng gõ ở ô đăng nhập).
 *
 * @param {string} ma_nv
 * @returns {Promise<object|null>} có kèm `mat_khau` đã băm - CHỈ dùng để so
 *   sánh trong auth.service, TUYỆT ĐỐI không đưa ra ngoài response.
 */
const findByCardNumber = async (ma_nv) => {
  const [rows] = await db.hr.execute(
    `SELECT ${EMPLOYEE_COLUMNS} ${EMPLOYEE_JOINS} WHERE nv.ma_nv = ?`,
    [ma_nv]
  );
  return rows[0] || null;
};

/**
 * Tìm nhân viên theo id nội bộ (thứ được nhét vào JWT lúc đăng nhập).
 * Dùng cho /me: luôn đọc lại từ DB thay vì tin vào token đã ký từ lâu.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
const findById = async (id) => {
  const [rows] = await db.hr.execute(
    `SELECT ${EMPLOYEE_COLUMNS} ${EMPLOYEE_JOINS} WHERE nv.id = ?`,
    [id]
  );
  return rows[0] || null;
};

module.exports = { findByCardNumber, findById };
