// backend/src/app.js
//
// DUNG express app: middleware -> route -> bay loi.
//
// Co tinh TACH KHOI server.js (noi goi listen). Nho vay app dung duoc ma
// khong can mo cong - tien cho test sau nay, va de nhin ra THU TU cac lop.

const express = require("express");
const cors = require("cors");

const auth = require("./modules/auth");
const admin = require("./modules/admin");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// ── Middleware chung ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Kiểm tra sức khoẻ ─────────────────────────────────────────────────────
// Không cần token. Dùng để biết server còn sống mà không phải đăng nhập.
app.get("/health", (req, res) => {
  res.json({ success: true, message: "OK", data: { uptime: process.uptime() } });
});

// ── Các module nghiệp vụ ──────────────────────────────────────────────────
// Thêm module mới thì thêm một dòng ở đây:
//   app.use("/api/plans", plans.routes);
app.use("/api/auth", auth.routes);
app.use("/api/admin", admin.routes);

// ── Bẫy lỗi: PHẢI đặt cuối cùng, đúng thứ tự này ──────────────────────────
app.use(notFound); // không khớp route nào -> 404 dạng JSON
app.use(errorHandler); // mọi lỗi -> { success: false, message }

module.exports = app;
