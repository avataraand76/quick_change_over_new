// backend/src/utils/ApiError.js
//
// Loi CO MA HTTP. Nem cai nay o bat ky dau trong service, errorHandler se tu
// doi thanh phan hoi dung chuan - khong phai chuyen `res` xuong tan tang duoi.
//
//     throw ApiError.unauthorized("Sai Mã số thẻ hoặc Mật khẩu");

class ApiError extends Error {
  /**
   * @param {number} statusCode ma HTTP tra ve cho client
   * @param {string} message    thong bao cho NGUOI DUNG doc (tieng Viet)
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;

    // Đánh dấu đây là lỗi mình chủ động ném ra, phân biệt với lỗi lập trình
    // (undefined is not a function...). errorHandler dựa vào cờ này để quyết
    // định có lộ `message` ra ngoài hay không.
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 - client gửi thiếu hoặc sai định dạng dữ liệu */
  static badRequest(message) {
    return new ApiError(400, message);
  }

  /** 401 - chưa đăng nhập, hoặc token sai/hết hạn */
  static unauthorized(message) {
    return new ApiError(401, message);
  }

  /** 403 - đã đăng nhập nhưng KHÔNG ĐỦ QUYỀN */
  static forbidden(message) {
    return new ApiError(403, message);
  }

  /** 404 - không tìm thấy */
  static notFound(message) {
    return new ApiError(404, message);
  }

  /** 500 - lỗi phía máy chủ */
  static internal(message) {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
