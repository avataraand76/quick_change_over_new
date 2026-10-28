// backend/src/database/index.js
//
// SO DANG BA CAC KET NOI DATABASE CUA DU AN.
//
// Moi noi trong du an lay pool tu day:
//     const { db } = require("../../database");
//     const [rows] = await db.app.query("SELECT ...");
//
// Ten pool co tinh dat CHUNG CHUNG (`app`, `hr`, `legacy`) chu khong phai
// `qco`, `timesheet`, `egmf`. Nho vay copy folder sang du an moi thi cac
// module dung no khong phai sua mot chu nao - chi doi .env la xong.

const env = require("../config/env");
const mysqlFactory = require("./mysql");
const mssqlFactory = require("./mssql");

/**
 * `app`    DB RIÊNG của dự án: phân quyền + toàn bộ nghiệp vụ. Đọc và ghi.
 * `hr`     DB nhân sự DÙNG CHUNG toàn công ty. CHỈ ĐỌC - dữ liệu do hệ thống
 *          nhân sự đồng bộ sang, ghi vào đây là phá dữ liệu của phòng khác.
 * `legacy` SQL Server của hệ thống cũ (eGMF). `null` nếu .env không khai báo.
 */
const db = {
  app: mysqlFactory.createPool({
    host: env.mysql.host,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.appDatabase,
  }),

  hr: mysqlFactory.createPool({
    host: env.mysql.host,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.hrDatabase,
  }),

  legacy: env.mssql.enabled ? mssqlFactory.createPool(env.mssql) : null,
};

/**
 * Thử toàn bộ kết nối lúc khởi động để lỗi cấu hình lộ ra ngay, thay vì đợi
 * đến khi có người đăng nhập mới biết.
 *
 * KHÔNG ném lỗi: một DB phụ chết không nên làm sập cả server.
 */
const connectAll = async () => {
  await Promise.all([
    mysqlFactory.testPool(db.app, env.mysql.appDatabase),
    mysqlFactory.testPool(db.hr, env.mysql.hrDatabase),
  ]);

  if (db.legacy) {
    await mssqlFactory.connectPool(db.legacy, env.mssql.database);
  }
};

/** Đóng sạch kết nối khi tắt server (Ctrl+C, deploy lại). */
const closeAll = async () => {
  await Promise.allSettled([
    db.app.end(),
    db.hr.end(),
    db.legacy ? db.legacy.close() : Promise.resolve(),
  ]);
  console.log("[Database] Đã đóng toàn bộ kết nối");
};

module.exports = { db, connectAll, closeAll };
