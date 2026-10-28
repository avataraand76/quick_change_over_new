// backend/src/modules/admin/admin.controller.js
//
// CONTROLLER CHO CÁC API ADMIN & PHÂN QUYỀN.

const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/response");
const service = require("./admin.service");

/**
 * GET /api/admin/permissions
 * Lấy tất cả quyền có sẵn trong hệ thống: ['admin', 'edit', 'view']
 */
const getPermissions = asyncHandler(async (req, res) => {
  const data = await service.getPermissions();
  res.json(ok(data, "Lấy danh sách quyền thành công"));
});

/**
 * GET /api/admin/users/search?query=...
 * Tìm kiếm nhân viên theo mã hoặc tên
 */
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const data = await service.searchUsers(query);
  res.json(ok(data, "Tìm kiếm người dùng thành công"));
});

/**
 * GET /api/admin/users/assigned
 * Lấy danh sách người dùng đã được cấp quyền
 */
const getAssignedUsers = asyncHandler(async (req, res) => {
  const data = await service.getAssignedUsers();
  res.json(ok(data, "Lấy danh sách người dùng đã phân quyền thành công"));
});

/**
 * GET /api/admin/users/permissions?ma_nv=...
 * Lấy danh sách quyền của 1 nhân viên
 */
const getUserPermissions = asyncHandler(async (req, res) => {
  const { ma_nv } = req.query;
  const data = await service.getUserPermissions(ma_nv);
  res.json(ok(data, "Lấy quyền người dùng thành công"));
});

/**
 * PUT /api/admin/users/permissions
 * Body: { ma_nv, permissions: ['admin', 'edit'] }
 * Cập nhật quyền cho nhân viên
 */
const updateUserPermissions = asyncHandler(async (req, res) => {
  const { ma_nv, permissions } = req.body;
  const operatorUserId = req.user?.id || 0;
  await service.updateUserPermissions(ma_nv, permissions, operatorUserId);
  res.json(ok(null, "Cập nhật quyền thành công"));
});

module.exports = {
  getPermissions,
  searchUsers,
  getAssignedUsers,
  getUserPermissions,
  updateUserPermissions,
};
