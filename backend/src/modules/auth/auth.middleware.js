// backend/src/modules/auth/auth.middleware.js
//
// Hai chot chan dung cho MOI route khac trong du an:
//
//   authenticateToken         da dang nhap chua?
//   requirePermission("ADMIN")  co du quyen khong?
//
// Vi du:
//   router.post("/plans", authenticateToken, requirePermission("ADMIN"), ...)

const jwt = require("jsonwebtoken");

const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const access = require("./auth.access");
const testAccounts = require("./auth.testAccounts");

/**
 * Xác thực JWT trong header `Authorization: Bearer <token>`.
 * Thành công thì gắn payload đã giải mã vào `req.user`.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(ApiError.unauthorized("Access token is required"));
  }

  jwt.verify(token, env.jwt.secret, (err, decoded) => {
    if (err) {
      // 403 chứ không phải 401: interceptor của frontend coi cả hai là hết
      // phiên và đá về trang đăng nhập.
      return next(ApiError.forbidden("Invalid token"));
    }
    req.user = decoded;
    next();
  });
};

/**
 * Chặn nếu người dùng không có ÍT NHẤT MỘT trong các quyền liệt kê.
 *
 * Quyền luôn ĐỌC LẠI TỪ DB chứ không lấy từ token: quyền có thể bị thu hồi
 * giữa chừng mà token đã ký thì không rút lại được.
 *
 * Phải đặt SAU authenticateToken (cần `req.user`).
 *
 * @param {...string} allowed ví dụ requirePermission("admin", "edit")
 */
const requirePermission = (...allowed) =>
  asyncHandler(async (req, res, next) => {
    if (!req.user?.id) {
      return next(ApiError.unauthorized("Chưa đăng nhập"));
    }

    const testAccount = testAccounts.findById(req.user.id);
    const permissions = testAccount
      ? testAccount.access.permissions
      : (await access.getUserAccess(req.user.id)).permissions;

    const allowedSet = new Set(allowed);
    if (!permissions.some((p) => allowedSet.has(p))) {
      return next(
        ApiError.forbidden("Bạn không có quyền thực hiện thao tác này")
      );
    }

    // Để route phía sau dùng lại, khỏi truy vấn thêm lần nữa
    req.permissions = permissions;
    next();
  });

module.exports = { authenticateToken, requirePermission };
