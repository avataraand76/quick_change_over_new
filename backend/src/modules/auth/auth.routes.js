// backend/src/modules/auth/auth.routes.js
//
// BANG DUONG DAN cua module auth. Nhin file nay la biet module co nhung API
// nao va API nao can dang nhap - khong phai doc het controller.

const express = require("express");

const asyncHandler = require("../../utils/asyncHandler");
const controller = require("./auth.controller");
const { authenticateToken } = require("./auth.middleware");

const router = express.Router();

// Cong khai - chinh no la cua vao
router.post("/login", asyncHandler(controller.login));

// Can token
router.get("/me", authenticateToken, asyncHandler(controller.me));
router.get(
  "/permissions",
  authenticateToken,
  asyncHandler(controller.permissions)
);

module.exports = router;
