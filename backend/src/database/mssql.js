// backend/src/database/mssql.js
//
// Xuong tao ket noi MSSQL (SQL Server). Cung nguyen tac nhu mysql.js:
// nhan config vao, tra pool ra, khong doc .env.
//
// Dung cho cac he thong cu cua nha may (vi du eGMF) van chay tren SQL Server.

const sql = require("mssql");

/**
 * Thiết lập dùng chung cho mọi pool MSSQL.
 *
 * `encrypt: false` + `trustServerCertificate: true` vì các SQL Server trong
 * nhà máy chạy trong mạng nội bộ, không cài chứng chỉ TLS hợp lệ.
 * `requestTimeout` để 5 phút cho các truy vấn báo cáo nặng.
 */
const POOL_DEFAULTS = {
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 300000, // 5 phút
    cancelTimeout: 5000,
  },
};

/**
 * Tạo pool MSSQL (chưa kết nối - gọi connectPool() sau).
 *
 * @param {object} config { server, port, user, password, database }
 * @returns {import("mssql").ConnectionPool}
 */
const createPool = ({ server, port, user, password, database }) =>
  new sql.ConnectionPool({
    server,
    port,
    user,
    password,
    database,
    ...POOL_DEFAULTS,
  });

/**
 * Mở kết nối. Trả true/false thay vì ném lỗi - MSSQL thường là nguồn phụ,
 * chết thì các chức năng khác vẫn phải chạy được.
 *
 * @returns {Promise<boolean>}
 */
const connectPool = async (pool, label) => {
  try {
    await pool.connect();
    console.log(`[MSSQL] Kết nối thành công: ${label}`);
    return true;
  } catch (err) {
    console.error(`[MSSQL] LỖI kết nối ${label}:`, err.message);
    return false;
  }
};

module.exports = { sql, createPool, connectPool, POOL_DEFAULTS };
