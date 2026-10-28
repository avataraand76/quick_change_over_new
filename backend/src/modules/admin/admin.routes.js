// backend/src/modules/admin/admin.routes.js
//
// ĐỊNH TUYẾN CÁC API ADMIN.
// Toàn bộ các route tại đây đều yêu cầu:
// 1. Phải đăng nhập (authenticateToken)
// 2. Phải có quyền "admin" (requirePermission("admin"))

const { Router } = require("express");
const { authenticateToken, requirePermission } = require("../auth");
const controller = require("./admin.controller");

const router = Router();

// Chốt chặn bảo vệ mọi route admin
router.use(authenticateToken, requirePermission("admin"));

// 1. Danh sách quyền có sẵn
router.get("/permissions", controller.getPermissions);

// 2. Tìm kiếm nhân viên
router.get("/users/search", controller.searchUsers);

// 3. Danh sách nhân viên đã được phân quyền
router.get("/users/assigned", controller.getAssignedUsers);

// 4. Lấy quyền của một nhân viên
router.get("/users/permissions", controller.getUserPermissions);

// 5. Cập nhật quyền cho nhân viên
router.put("/users/permissions", controller.updateUserPermissions);

module.exports = router;
