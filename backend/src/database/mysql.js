// backend/src/database/mysql.js
//
// Xuong tao pool MySQL. KHONG doc .env, KHONG biet gi ve nghiep vu -
// nhan config vao, tra pool ra. Nho vay copy sang du an khac dung nguyen.

const mysql = require("mysql2/promise");

/**
 * Thiết lập dùng chung cho mọi pool MySQL của công ty.
 *
 * Vì sao các mốc thời gian đều dài: server MySQL đặt ngoài nhà máy, đường
 * truyền có lúc chậm. `enableKeepAlive` giữ kết nối sống qua các khoảng nghỉ
 * dài giữa hai ca sản xuất - không có nó thì request đầu ca hay dính lỗi
 * "connection lost".
 */
const POOL_DEFAULTS = {
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 60000,
};

/**
 * Tạo một pool MySQL.
 *
 * @param {object} config
 * @param {string} config.host
 * @param {string} config.user
 * @param {string} config.password
 * @param {string} config.database
 * @param {object} [overrides] ghi đè POOL_DEFAULTS khi cần
 * @returns {import("mysql2/promise").Pool}
 */
const createPool = ({ host, user, password, database }, overrides = {}) =>
  mysql.createPool({
    host,
    user,
    password,
    database,
    ...POOL_DEFAULTS,
    ...overrides,
  });

/**
 * Lấy thử một kết nối rồi trả lại ngay, để biết cấu hình có đúng không.
 * Trả về true/false thay vì ném lỗi: một DB phụ chết không nên làm sập server.
 *
 * @returns {Promise<boolean>}
 */
const testPool = async (pool, label) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log(`[MySQL] Kết nối thành công: ${label}`);
    return true;
  } catch (err) {
    console.error(`[MySQL] LỖI kết nối ${label}:`, err.message);
    return false;
  }
};

module.exports = { createPool, testPool, POOL_DEFAULTS };
