// backend/src/middlewares/errorHandler.js
//
// BAY LOI CUOI CUNG. Gan SAU tat ca route trong app.js.
// Moi loi trong du an deu ket thuc o day va di ra duoi cung mot dang.

const ApiError = require("../utils/ApiError");
const { fail } = require("../utils/response");
const env = require("../config/env");

// eslint-disable-next-line no-unused-vars -- Express nhận diện error middleware
// bằng việc đếm 4 tham số, nên `next` phải có mặt dù không dùng tới.
const errorHandler = (err, req, res, next) => {
  const isKnown = err instanceof ApiError;
  const statusCode = isKnown ? err.statusCode : 500;

  // Lỗi mình chủ động ném ra thì message đã viết cho người dùng đọc.
  // Lỗi ngoài dự kiến (bug, DB sập) thì KHÔNG lộ nội dung ra ngoài - nó có
  // thể chứa tên bảng, câu SQL, đường dẫn file.
  const message = isKnown ? err.message : "Lỗi máy chủ";

  // Luôn ghi log đầy đủ ở server, kể cả khi giấu với client.
  if (!isKnown || statusCode >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  // Chi tiết kỹ thuật chỉ gửi kèm khi đang chạy dev.
  const detail =
    env.nodeEnv === "development" && !isKnown ? err.message : undefined;

  res.status(statusCode).json(fail(message, detail));
};

module.exports = errorHandler;
