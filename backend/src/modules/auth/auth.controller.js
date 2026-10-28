// backend/src/modules/auth/auth.controller.js
//
// TANG HTTP. Chi lam ba viec: doc du lieu tu `req`, goi service, dong goi
// `res`. KHONG chua logic nghiep vu va KHONG chua SQL.
//
// Loi khong bat o day - cu de service `throw ApiError`, asyncHandler trong
// auth.routes.js se day sang errorHandler.

const { ok } = require("../../utils/response");
const service = require("./auth.service");

/** POST /api/auth/login */
const login = async (req, res) => {
  const { ma_nv, password } = req.body;
  const data = await service.login(ma_nv, password);
  res.json(ok(data, "Đăng nhập thành công"));
};

/** GET /api/auth/me - hồ sơ đầy đủ, đọc lại từ DB */
const me = async (req, res) => {
  const user = await service.getProfile(req.user.id);
  res.json(ok({ user }, "Lấy thông tin người dùng thành công"));
};

/** GET /api/auth/permissions - chỉ mảng tên quyền (giữ tương thích TPM) */
const permissions = async (req, res) => {
  const data = await service.getPermissions(req.user.id);
  res.json(ok(data, "Permissions retrieved successfully"));
};

module.exports = { login, me, permissions };
