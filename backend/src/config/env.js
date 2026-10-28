// backend/src/config/env.js
//
// NOI DUY NHAT DUOC PHEP DOC process.env TRONG TOAN BO DU AN.
//
// Vi sao gom mot cho: khi copy du an sang project moi, chi can mo file nay la
// thay HET moi thu can cau hinh - khong phai di grep "process.env" khap noi.
// Cac module khac chi `require("../config/env")` roi dung thuoc tinh.

require("dotenv").config();

/** Doc bien bat buoc. Thieu thi chan ngay luc khoi dong, khong de chay tiep. */
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thiếu biến môi trường bắt buộc: ${name}. Kiểm tra lại file .env`
    );
  }
  return value;
};

/** Doc bien tuy chon, khong co thi lay gia tri mac dinh. */
const optional = (name, fallback = "") => process.env[name] || fallback;

/** Doc bien dang bat/tat. CHI chuoi "true" moi duoc coi la bat. */
const flag = (name, fallback = false) => {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return value === "true";
};

const env = {
  port: Number(optional("PORT", "8081")),

  // ── MySQL ───────────────────────────────────────────────────────────────
  mysql: {
    host: required("MYSQL_HOST"),
    user: required("MYSQL_USER"),
    password: required("MYSQL_PASSWORD"),

    /** DB RIÊNG của dự án: phân quyền + toàn bộ nghiệp vụ. */
    appDatabase: required("QCO_DATABASE"),

    /** DB nhân sự DÙNG CHUNG toàn công ty (chỉ đọc). */
    hrDatabase: required("DATA_HITIMESHEET_DATABASE"),
  },

  // ── MSSQL (tuỳ chọn) ────────────────────────────────────────────────────
  // Chỉ kết nối khi có MSSQL_SERVER trong .env. Dự án nào không dùng thì bỏ
  // trống, server vẫn khởi động bình thường.
  mssql: {
    enabled: Boolean(optional("MSSQL_SERVER")),
    server: optional("MSSQL_SERVER"),
    port: Number(optional("MSSQL_PORT", "1433")),
    user: optional("MSSQL_USER"),
    password: optional("MSSQL_PASSWORD"),
    database: optional("MSSQL_HIGMF"),
  },

  // ── JWT ─────────────────────────────────────────────────────────────────
  jwt: {
    secret: required("JWT_SECRET"),

    /**
     * Thời hạn token, ví dụ "8h" hoặc "30d".
     * ĐỂ TRỐNG = token không bao giờ hết hạn (TPM đang như vậy).
     */
    expiresIn: optional("JWT_EXPIRES_IN", ""),
  },

  // ── Tài khoản test ──────────────────────────────────────────────────────
  testAccounts: {
    enabled: flag("ALLOW_TEST_ACCOUNTS", false),
    password: optional("TEST_ACCOUNT_PASSWORD", "123456"),
  },
};

module.exports = env;
