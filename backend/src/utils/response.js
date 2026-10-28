// backend/src/utils/response.js
//
// Dang phan hoi CHUNG cua moi API: { success, message, data }.
//
// Frontend (api.jsx + AuthContext) doc dung ba truong nay, nen giu nguyen
// khi copy sang du an moi thi frontend cu dung duoc luon.

/**
 * Phản hồi thành công.
 *
 *     res.json(ok({ user }, "Đăng nhập thành công"))
 *     -> { success: true, message: "Đăng nhập thành công", data: { user } }
 */
const ok = (data = null, message = "Thành công") => ({
  success: true,
  message,
  data,
});

/**
 * Phản hồi thất bại. Thường KHÔNG gọi tay - cứ `throw ApiError.xxx()` rồi để
 * errorHandler dựng. Chỉ dùng trực tiếp ở những chỗ nằm ngoài luồng route.
 */
const fail = (message = "Thất bại", error = undefined) => ({
  success: false,
  message,
  ...(error ? { error } : {}),
});

module.exports = { ok, fail };
