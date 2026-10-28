// backend/src/modules/admin/admin.service.js
//
// TẦNG XỬ LÝ NGHIỆP VỤ CHO QUẢN TRỊ & PHÂN QUYỀN.

const ApiError = require("../../utils/ApiError");
const testAccounts = require("../auth/auth.testAccounts");
const repo = require("./admin.repository");

/**
 * Lấy danh sách tất cả các quyền hệ thống hỗ trợ.
 * Định dạng trả về mảng chuỗi (giống TPM): ['admin', 'edit', 'view']
 *
 * @returns {Promise<string[]>}
 */
const getPermissions = async () => {
  const permissions = await repo.getAllPermissions();
  return permissions.map((p) => p.name_permission);
};

/**
 * Tìm kiếm nhân viên phục vụ phân quyền.
 *
 * @param {string} query Từ khóa tìm kiếm (mã thẻ hoặc họ tên)
 * @returns {Promise<Array<object>>}
 */
const searchUsers = async (query) => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();
  const searchPattern = `%${cleanQuery}%`;

  // 1. Tìm trong DB nhân sự (sync_nhan_vien)
  const employees = await repo.searchEmployees(searchPattern, 30);

  // 2. Nếu chế độ test account bật, kiểm tra xem có tài khoản test nào khớp không
  const matchedTestAccounts = [];
  if (testAccounts.isEnabled()) {
    const qLower = cleanQuery.toLowerCase();
    const testList = [
      {
        ma_nv: "admin",
        ten_nv: "Quản Trị Viên (Test Account)",
        cong_viec_phu_trach: "Quản trị hệ thống",
        ten_bo_phan: "Phòng IT (Test)",
        ten_phong_ban: "Phòng IT (Test)",
        is_test: true,
      },
      {
        ma_nv: "edit",
        ten_nv: "Người Chỉnh Sửa (Test Account)",
        cong_viec_phu_trach: "Chỉnh sửa dữ liệu",
        ten_bo_phan: "Bộ phận Kỹ Thuật (Test)",
        ten_phong_ban: "Phòng Kỹ Thuật (Test)",
        is_test: true,
      },
      {
        ma_nv: "view",
        ten_nv: "Người Xem (Test Account)",
        cong_viec_phu_trach: "Xem dữ liệu",
        ten_bo_phan: "Bộ phận Kỹ Thuật (Test)",
        ten_phong_ban: "Phòng Kỹ Thuật (Test)",
        is_test: true,
      },
    ];

    for (const item of testList) {
      if (
        item.ma_nv.toLowerCase().includes(qLower) ||
        item.ten_nv.toLowerCase().includes(qLower)
      ) {
        matchedTestAccounts.push(item);
      }
    }
  }

  return [...matchedTestAccounts, ...employees];
};

/**
 * Lấy danh sách tất cả người dùng hiện ĐÃ ĐƯỢC CẤP QUYỀN trong hệ thống.
 * Giúp Admin kiểm tra nhanh ai đang có quyền gì mà không cần gõ tìm kiếm từng người.
 *
 * @returns {Promise<Array<object>>}
 */
const getAssignedUsers = async () => {
  const userPerms = await repo.getAllUserPermissions();
  if (userPerms.length === 0) return [];

  const userIds = userPerms.map((u) => u.id_nhan_vien);
  const employees = await repo.getEmployeesByIds(userIds);

  const empMap = new Map(employees.map((e) => [e.id, e]));

  const result = [];
  for (const up of userPerms) {
    const emp = empMap.get(up.id_nhan_vien);
    if (emp) {
      result.push({
        ...emp,
        permissions: up.permissions,
      });
    } else {
      // Nhân viên có thể đã nghỉ hoặc không còn trong DB nhân sự
      result.push({
        id: up.id_nhan_vien,
        ma_nv: `ID-${up.id_nhan_vien}`,
        ten_nv: `Nhân viên #${up.id_nhan_vien}`,
        ten_phong_ban: "Không xác định",
        permissions: up.permissions,
      });
    }
  }

  return result;
};

/**
 * Lấy danh sách quyền của một nhân viên theo mã thẻ.
 *
 * @param {string} ma_nv
 * @returns {Promise<string[]>} mảng tên quyền, ví dụ: ['admin', 'edit']
 */
const getUserPermissions = async (ma_nv) => {
  if (!ma_nv) {
    throw ApiError.badRequest("ma_nv là bắt buộc");
  }

  // 1. Kiểm tra tài khoản test
  if (testAccounts.isEnabled()) {
    const matched = testAccounts.match(ma_nv, process.env.TEST_ACCOUNT_PASSWORD || "123456");
    if (matched) {
      return matched.access.permissions;
    }
  }

  // 2. Tra cứu nhân viên trong DB nhân sự
  const user = await repo.findEmployeeByCardNumber(ma_nv);
  if (!user) {
    throw ApiError.notFound("Không tìm thấy nhân viên với mã: " + ma_nv);
  }

  // 3. Lấy quyền từ DB ứng dụng
  return await repo.getUserPermissions(user.id);
};

/**
 * Cập nhật danh sách quyền cho một nhân viên.
 *
 * @param {string} ma_nv
 * @param {string[]} permissions Mảng tên quyền, ví dụ ['admin', 'edit']
 * @param {number} operatorUserId ID của Admin đang thực hiện
 * @returns {Promise<void>}
 */
const updateUserPermissions = async (ma_nv, permissions, operatorUserId) => {
  if (!ma_nv) {
    throw ApiError.badRequest("ma_nv là bắt buộc");
  }

  if (!Array.isArray(permissions)) {
    throw ApiError.badRequest("permissions phải là một mảng");
  }

  // Kiểm tra tài khoản test
  if (testAccounts.isEnabled()) {
    const isTest = ["admin", "edit", "view", "99999", "99990", "99995"].includes(ma_nv);
    if (isTest) {
      throw ApiError.badRequest(
        "Tài khoản test được khai báo cố định trong file hệ thống, không lưu vào DB"
      );
    }
  }

  // 1. Tìm nhân viên để lấy id
  const user = await repo.findEmployeeByCardNumber(ma_nv);
  if (!user) {
    throw ApiError.notFound("Không tìm thấy nhân viên với mã: " + ma_nv);
  }

  // 2. Cập nhật phân quyền
  await repo.updateUserPermissions(user.id, permissions, operatorUserId);
};

module.exports = {
  getPermissions,
  searchUsers,
  getAssignedUsers,
  getUserPermissions,
  updateUserPermissions,
};
