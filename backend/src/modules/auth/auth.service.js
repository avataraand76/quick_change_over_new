// backend/src/modules/auth/auth.service.js
//
// TANG NGHIEP VU dang nhap. Day la noi chua QUYET DINH ("sai mat khau thi
// tra 401", "chua duoc cap quyen thi tra 403"), khong chua SQL va khong biet
// gi ve `req` / `res`.
//
// File nay COPY DUOC NGUYEN SANG DU AN MOI: no khong he biet du an co bao
// nhieu truc phan quyen - moi thu do hoi qua auth.access.js.

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const repository = require("./auth.repository");
const access = require("./auth.access");
const testAccounts = require("./auth.testAccounts");

/**
 * Ký JWT.
 *
 * Nhét đúng ba trường tối thiểu để nhận diện người dùng. KHÔNG nhét quyền vào
 * token: quyền có thể bị thu hồi giữa chừng, mà token đã ký thì không rút lại
 * được - nên quyền luôn đọc lại từ DB ở mỗi request cần kiểm tra.
 */
const signToken = (employee) => {
  const payload = {
    id: employee.id,
    ma_nv: employee.ma_nv,
    phongban_id: employee.id_phong_ban,
  };

  // JWT_EXPIRES_IN để trống = token không hết hạn (giữ đúng hành vi của TPM).
  const options = env.jwt.expiresIn ? { expiresIn: env.jwt.expiresIn } : {};

  return jwt.sign(payload, env.jwt.secret, options);
};

/**
 * Dựng đối tượng `user` trả cho frontend.
 * Đổi tên cột tiếng Việt của DB nhân sự sang tên gọn hơn, và TUYỆT ĐỐI không
 * kèm `mat_khau`.
 */
const toPublicUser = (employee, userAccess) => ({
  id: employee.id,
  ma_nv: employee.ma_nv,
  name: employee.ten_nv,
  job: employee.cong_viec_phu_trach,
  bophan_id: employee.id_bo_phan,
  bophan_name: employee.ten_bo_phan,
  phongban_id: employee.id_phong_ban,
  phongban_name: employee.ten_phong_ban,
  company_id: employee.id_company,
  company_name: employee.ten_cong_ty,
  id_department: employee.id_department, // = id_company + '-' + id_phong_ban
  ...userAccess,
});

/**
 * Đăng nhập bằng mã số thẻ + mật khẩu.
 *
 * @returns {Promise<{token: string, user: object}>}
 * @throws {ApiError} 400 thiếu dữ liệu · 401 sai thông tin · 403 chưa có quyền
 */
const login = async (ma_nv, password) => {
  if (!ma_nv || !password) {
    throw ApiError.badRequest("Vui lòng nhập Mã số thẻ và Mật khẩu");
  }

  // 1. Tài khoản test (chỉ khi .env bật) - không chạm DB
  const testAccount = testAccounts.match(ma_nv, password);
  if (testAccount) {
    return {
      token: signToken(testAccount.employee),
      user: toPublicUser(testAccount.employee, testAccount.access),
    };
  }

  // 2. Tra nhân viên trong DB nhân sự dùng chung
  const employee = await repository.findByCardNumber(ma_nv);

  // Dùng CHUNG một thông báo cho "không có mã thẻ này" và "sai mật khẩu".
  // Tách hai thông báo ra sẽ cho phép người ngoài dò xem mã thẻ nào tồn tại.
  if (!employee) {
    throw ApiError.unauthorized("Sai Mã số thẻ hoặc Mật khẩu");
  }

  // 3. Đối chiếu mật khẩu đã băm bcrypt
  const isPasswordValid = await bcrypt.compare(password, employee.mat_khau);
  if (!isPasswordValid) {
    throw ApiError.unauthorized("Sai Mã số thẻ hoặc Mật khẩu");
  }

  // 4. Là nhân viên thật chưa đủ - phải được cấp quyền trong DB của dự án.
  //    (Cả công ty đều có trong DB nhân sự.)
  const userAccess = await access.getUserAccess(employee.id);
  if (!access.hasSystemAccess(userAccess)) {
    throw ApiError.forbidden(
      "Tài khoản này chưa được cấp quyền truy cập hệ thống."
    );
  }

  return {
    token: signToken(employee),
    user: toPublicUser(employee, userAccess),
  };
};

/**
 * Hồ sơ đầy đủ của người đang đăng nhập, ĐỌC LẠI TỪ DB.
 *
 * Dùng khi frontend mở lại app: quyền có thể đã đổi kể từ lần đăng nhập
 * trước, nên không tin bản lưu trong localStorage. Quyền đã bị thu hồi thì
 * trả 403 và frontend tự đăng xuất.
 *
 * @param {number} idNhanVien lấy từ token đã xác thực
 */
const getProfile = async (idNhanVien) => {
  const testAccount = testAccounts.findById(idNhanVien);
  if (testAccount) {
    return toPublicUser(testAccount.employee, testAccount.access);
  }

  const employee = await repository.findById(idNhanVien);
  if (!employee) {
    // Nhân viên đã bị xoá khỏi DB nhân sự kể từ lúc đăng nhập
    throw ApiError.unauthorized("Tài khoản không còn tồn tại");
  }

  const userAccess = await access.getUserAccess(employee.id);
  if (!access.hasSystemAccess(userAccess)) {
    throw ApiError.forbidden(
      "Tài khoản này chưa được cấp quyền truy cập hệ thống."
    );
  }

  return toPublicUser(employee, userAccess);
};

/**
 * Chỉ mảng TÊN quyền, ví dụ ["ADMIN"].
 * Giữ nguyên dạng phản hồi của TPM để frontend cũ dùng lại được.
 */
const getPermissions = async (idNhanVien) => {
  const testAccount = testAccounts.findById(idNhanVien);
  if (testAccount) {
    return testAccount.access.permissions;
  }

  const userAccess = await access.getUserAccess(idNhanVien);
  return userAccess.permissions;
};

module.exports = { login, getProfile, getPermissions, signToken, toPublicUser };
