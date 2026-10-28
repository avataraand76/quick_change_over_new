// backend/src/modules/admin/admin.repository.js
//
// TẦNG TRUY VẤN DATABASE CHO QUẢN TRỊ VÀ PHÂN QUYỀN.
//
// Tuân thủ nguyên tắc:
// - `db.hr` (sync_data_hi_time_sheet): CHỈ ĐỌC thông tin nhân viên, phòng ban, bộ phận.
// - `db.app` (qco_database): ĐỌC & GHI tb_permission, tb_user_permission.

const { db } = require("../../database");

/**
 * Lấy tất cả quyền có trong hệ thống từ tb_permission.
 *
 * @returns {Promise<Array<{id_permission: number, name_permission: string}>>}
 */
const getAllPermissions = async () => {
  const [rows] = await db.app.query(
    "SELECT id_permission, name_permission FROM tb_permission ORDER BY id_permission ASC"
  );
  return rows;
};

/**
 * Tìm kiếm nhân viên trong DB nhân sự theo mã thẻ hoặc họ tên.
 *
 * @param {string} searchPattern Chuỗi dạng `%query%`
 * @param {number} limit Giới hạn kết quả
 * @returns {Promise<Array<object>>}
 */
const searchEmployees = async (searchPattern, limit = 50) => {
  const [rows] = await db.hr.query(
    `
    SELECT 
      nv.id,
      nv.ma_nv,
      nv.ten_nv,
      nv.cong_viec_phu_trach,
      bp.id AS id_bo_phan,
      bp.ten_bo_phan,
      pb.id AS id_phong_ban,
      pb.ten_phong_ban,
      com.id_company,
      com.ten_cong_ty
    FROM sync_nhan_vien nv
    LEFT JOIN sync_bo_phan bp ON bp.id = nv.id_bo_phan
    LEFT JOIN sync_phong_ban pb ON pb.id = bp.id_phong_ban
    LEFT JOIN sync_company com ON com.id_company = pb.id_company
    WHERE nv.ma_nv LIKE ? OR nv.ten_nv LIKE ?
    ORDER BY nv.ma_nv ASC
    LIMIT ?
    `,
    [searchPattern, searchPattern, limit]
  );
  return rows;
};

/**
 * Tìm một nhân viên theo mã thẻ (ma_nv).
 *
 * @param {string} ma_nv
 * @returns {Promise<object|null>}
 */
const findEmployeeByCardNumber = async (ma_nv) => {
  const [rows] = await db.hr.query(
    `
    SELECT 
      nv.id,
      nv.ma_nv,
      nv.ten_nv,
      nv.cong_viec_phu_trach,
      bp.id AS id_bo_phan,
      bp.ten_bo_phan,
      pb.id AS id_phong_ban,
      pb.ten_phong_ban,
      com.id_company,
      com.ten_cong_ty
    FROM sync_nhan_vien nv
    LEFT JOIN sync_bo_phan bp ON bp.id = nv.id_bo_phan
    LEFT JOIN sync_phong_ban pb ON pb.id = bp.id_phong_ban
    LEFT JOIN sync_company com ON com.id_company = pb.id_company
    WHERE nv.ma_nv = ?
    LIMIT 1
    `,
    [ma_nv]
  );
  return rows[0] || null;
};

/**
 * Lấy danh sách tên quyền của 1 nhân viên theo id_nhan_vien trong DB ứng dụng.
 *
 * @param {number} idNhanVien
 * @returns {Promise<string[]>}
 */
const getUserPermissions = async (idNhanVien) => {
  const [rows] = await db.app.query(
    `
    SELECT p.name_permission
    FROM tb_user_permission up
    JOIN tb_permission p ON up.id_permission = p.id_permission
    WHERE up.id_nhan_vien = ?
    ORDER BY p.id_permission ASC
    `,
    [idNhanVien]
  );
  return rows.map((r) => r.name_permission);
};

/**
 * Lấy tất cả phân quyền hiện có trong hệ thống (nhóm theo id_nhan_vien).
 *
 * @returns {Promise<Array<{id_nhan_vien: number, permissions: string[]}>>}
 */
const getAllUserPermissions = async () => {
  const [rows] = await db.app.query(
    `
    SELECT up.id_nhan_vien, p.name_permission
    FROM tb_user_permission up
    JOIN tb_permission p ON up.id_permission = p.id_permission
    ORDER BY up.id_nhan_vien ASC, p.id_permission ASC
    `
  );

  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.id_nhan_vien)) {
      map.set(row.id_nhan_vien, []);
    }
    map.get(row.id_nhan_vien).push(row.name_permission);
  }

  return Array.from(map.entries()).map(([id_nhan_vien, permissions]) => ({
    id_nhan_vien,
    permissions,
  }));
};

/**
 * Lấy thông tin nhiều nhân viên từ DB nhân sự theo danh sách ID.
 *
 * @param {number[]} ids
 * @returns {Promise<Array<object>>}
 */
const getEmployeesByIds = async (ids) => {
  if (!ids || ids.length === 0) return [];
  const [rows] = await db.hr.query(
    `
    SELECT 
      nv.id,
      nv.ma_nv,
      nv.ten_nv,
      nv.cong_viec_phu_trach,
      bp.id AS id_bo_phan,
      bp.ten_bo_phan,
      pb.id AS id_phong_ban,
      pb.ten_phong_ban,
      com.id_company,
      com.ten_cong_ty
    FROM sync_nhan_vien nv
    LEFT JOIN sync_bo_phan bp ON bp.id = nv.id_bo_phan
    LEFT JOIN sync_phong_ban pb ON pb.id = bp.id_phong_ban
    LEFT JOIN sync_company com ON com.id_company = pb.id_company
    WHERE nv.id IN (?)
    ORDER BY nv.ma_nv ASC
    `,
    [ids]
  );
  return rows;
};

/**
 * Cập nhật quyền cho 1 nhân viên:
 * Dùng Transaction để xóa quyền cũ và chèn quyền mới.
 *
 * @param {number} idNhanVien
 * @param {string[]} permissionNames
 * @param {number} operatorUserId ID của Admin đang thực hiện thao tác
 * @returns {Promise<void>}
 */
const updateUserPermissions = async (idNhanVien, permissionNames, operatorUserId = 0) => {
  const connection = await db.app.getConnection();
  try {
    let permissionIds = [];
    if (permissionNames && permissionNames.length > 0) {
      const [perms] = await connection.query(
        "SELECT id_permission, name_permission FROM tb_permission WHERE name_permission IN (?)",
        [permissionNames]
      );
      permissionIds = perms.map((p) => p.id_permission);
    }

    await connection.beginTransaction();

    // 1. Xóa toàn bộ quyền cũ của nhân viên
    await connection.query(
      "DELETE FROM tb_user_permission WHERE id_nhan_vien = ?",
      [idNhanVien]
    );

    // 2. Chèn danh sách quyền mới (nếu có)
    if (permissionIds.length > 0) {
      const values = permissionIds.map((id_permission) => [
        id_permission,
        idNhanVien,
        operatorUserId,
        operatorUserId,
      ]);

      await connection.query(
        "INSERT INTO tb_user_permission (id_permission, id_nhan_vien, created_by, updated_by) VALUES ?",
        [values]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllPermissions,
  searchEmployees,
  findEmployeeByCardNumber,
  getUserPermissions,
  getAllUserPermissions,
  getEmployeesByIds,
  updateUserPermissions,
};
