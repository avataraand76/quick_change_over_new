// backend/server.js

const express = require("express");
const router = express.Router();
const sql = require("mssql");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const { google } = require("googleapis");
const { Readable } = require("stream");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MSSQL Configuration for Hipro database
const mssqlHiproConfig = {
  user: process.env.MSSQL_HIPRO_USER,
  password: process.env.MSSQL_HIPRO_PASSWORD,
  database: process.env.MSSQL_HIPRO_DATABASE,
  server: process.env.MSSQL_HIPRO_HOST,
  port: parseInt(process.env.MSSQL_HIPRO_PORT),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 300000, // 5 minutes
    cancelTimeout: 5000, // 5 seconds
  },
};

// MSSQL Configuration for HiGMF database
const mssqlHigmfConfig = {
  user: process.env.MSSQL_HGM_USER,
  password: process.env.MSSQL_HGM_PASSWORD,
  database: process.env.MSSQL_HGM_DATABASE,
  server: process.env.MSSQL_HGM_HOST,
  port: parseInt(process.env.MSSQL_HGM_PORT),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    requestTimeout: 300000, // 5 minutes
    cancelTimeout: 5000, // 5 seconds
  },
};

// MySQL Configuration for main database
const mysqlConnection = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 60000,
  multipleStatements: true,
});

// MySQL Configuration for issue logger
const issueLoggerConnection = mysql.createPool({
  host: process.env.ISSUE_LOGGER_HOST,
  user: process.env.ISSUE_LOGGER_USER,
  password: process.env.ISSUE_LOGGER_PASSWORD,
  database: process.env.ISSUE_LOGGER_DATABASE,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 60000,
  multipleStatements: true,
});

// MySQL Configuration for data hi timesheet
const dataHiTimesheetConnection = mysql.createPool({
  host: process.env.DATA_HITIMESHEET_HOST,
  user: process.env.DATA_HITIMESHEET_USER,
  password: process.env.DATA_HITIMESHEET_PASSWORD,
  database: process.env.DATA_HITIMESHEET_DATABASE,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: 60000,
  multipleStatements: true,
});

// Test main MySQL connection
mysqlConnection.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to MAIN MySQL database:", err);
  } else {
    console.log("Successfully connected to MAIN MySQL database");
    connection.release();
  }
});

// Test issue logger MySQL connection
issueLoggerConnection.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to ISSUE LOGGER MySQL database:", err);
  } else {
    console.log("Successfully connected to ISSUE LOGGER MySQL database");
    connection.release();
  }
});

// Test data hi timesheet MySQL connection
dataHiTimesheetConnection.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to DATA HI TIMESHEET MySQL database:", err);
  } else {
    console.log("Successfully connected to DATA HI TIMESHEET MySQL database");
    connection.release();
  }
});

// Create connection pools
const hiproPool = new sql.ConnectionPool(mssqlHiproConfig);
const higmfPool = new sql.ConnectionPool(mssqlHigmfConfig);

// test MSSQL Hipro & MSSQL Higmf connection
Promise.all([hiproPool.connect(), higmfPool.connect()])
  .then(() => {
    console.log("Successfully connected to MSSQL HiPro and HiGMF databases");
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL databases:", err);
  });

// test MSSQL Hipro connection
// sql
//   .connect(mssqlHiproConfig)
//   .then(() => {
//     console.log("Successfully connected to MSSQL HiPro database");
//   })
//   .catch((err) => {
//     console.error("Error connecting to MSSQL:", err);
//   });

// test MSSQL Higmf connection
// sql
//   .connect(mssqlHigmfConfig)
//   .then(() => {
//     console.log("Successfully connected to MSSQL HiGMF database");
//   })
//   .catch((err) => {
//     console.error("Error connecting to MSSQL:", err);
//   });

// Helper function to format dates for logging
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  // Format: YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Helper function to sanitize date inputs
const sanitizeDate = (dateString) => {
  if (!dateString) return null;

  try {
    // Parse the date string to ensure it's valid
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return null;

    // Return in MySQL format
    return formatDate(date);
  } catch (error) {
    console.error("Error sanitizing date:", error, "for input:", dateString);
    return null;
  }
};

// Thêm middleware xác thực JWT
const authenticateToken = (req, res, next) => {
  // Danh sách các endpoint không cần xác thực
  const publicEndpoints = [
    // Thêm các endpoint khác nếu cần
  ];

  // Kiểm tra nếu endpoint hiện tại nằm trong danh sách public
  if (publicEndpoints.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return (
      res
        .status(401)
        // .json({ success: false, message: "No token provided" });
        .json({ success: false, message: "COOK MÀY KIẾM GÌ TRONG ĐÂY" })
    );
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// API lấy thông tin login từ data hi timesheet MySQL
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  dataHiTimesheetConnection.query(
    // "SELECT id, ma_nv, mat_khau, ten_nv FROM sync_nhan_vien WHERE ma_nv = ?",
    "SELECT * FROM sync_nhan_vien WHERE ma_nv = ?",
    [username],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (results.length === 0) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }
      const user = results[0];
      bcrypt.compare(password, user.mat_khau, (err, isMatch) => {
        if (err) {
          return res
            .status(500)
            .json({ success: false, message: "Error comparing passwords" });
        }
        if (!isMatch) {
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
        }

        // Check if user has permissions in tb_user_permission
        mysqlConnection.query(
          "SELECT up.id_permission, p.name_permission FROM tb_user_permission up JOIN tb_permission p ON up.id_permission = p.id_permission WHERE up.id_sync_nhan_vien = ?",
          [user.id],
          (err, permissionResults) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: "Error checking permissions",
              });
            }

            if (permissionResults.length === 0) {
              return res.status(403).json({
                success: false,
                message: "User does not have required permissions",
              });
            }

            // Check if user is ADMIN (id_permission = 1)
            const isAdmin = permissionResults.some(
              (p) => p.id_permission === 1
            );

            // If user is admin, get all permissions, roles, workshops, processes and worksteps
            if (isAdmin) {
              Promise.all([
                mysqlConnection
                  .promise()
                  .query(
                    "SELECT id_permission, name_permission FROM tb_permission"
                  ),
                mysqlConnection
                  .promise()
                  .query("SELECT id_role, name_role FROM tb_role"),
                mysqlConnection
                  .promise()
                  .query("SELECT id_workshop, name_workshop FROM tb_workshop"),
                mysqlConnection
                  .promise()
                  .query("SELECT id_process, name_process FROM tb_process"),
                mysqlConnection
                  .promise()
                  .query(
                    "SELECT id_work_steps, name_work_steps, id_process FROM tb_work_steps"
                  ),
              ])
                .then(
                  ([
                    [permissionDetails],
                    [roleDetails],
                    [workshopDetails],
                    [processDetails],
                    [workstepDetails],
                  ]) => {
                    const token = jwt.sign(
                      {
                        id: user.id,
                        ma_nv: user.ma_nv,
                        ten_nv: user.ten_nv,
                        isAdmin: true,
                        permissions: permissionDetails,
                        roles: roleDetails,
                        workshops: workshopDetails,
                        processes: processDetails,
                        worksteps: workstepDetails,
                      },
                      process.env.JWT_SECRET
                    );

                    res.json({
                      success: true,
                      token,
                      user: {
                        ma_nv: user.ma_nv,
                        ten_nv: user.ten_nv,
                        isAdmin: true,
                        permissions: permissionDetails,
                        roles: roleDetails,
                        workshops: workshopDetails,
                        processes: processDetails,
                        worksteps: workstepDetails,
                      },
                    });
                  }
                )
                .catch((error) => {
                  return res.status(500).json({
                    success: false,
                    message: "Error fetching user details",
                    error: error.message,
                  });
                });
            } else {
              // For non-admin users, get their specific permissions, roles, workshops, processes and worksteps
              Promise.all([
                mysqlConnection.promise().query(
                  `SELECT DISTINCT p.id_permission, p.name_permission
                   FROM tb_user_permission up 
                   JOIN tb_permission p ON up.id_permission = p.id_permission 
                   WHERE up.id_sync_nhan_vien = ?`,
                  [user.id]
                ),
                mysqlConnection.promise().query(
                  `SELECT DISTINCT r.id_role, r.name_role
                   FROM tb_user_role ur 
                   JOIN tb_role r ON ur.id_role = r.id_role 
                   WHERE ur.id_sync_nhan_vien = ?`,
                  [user.id]
                ),
                mysqlConnection.promise().query(
                  `SELECT DISTINCT w.id_workshop, w.name_workshop
                   FROM tb_user_workshop uw 
                   JOIN tb_workshop w ON uw.id_workshop = w.id_workshop 
                   WHERE uw.id_sync_nhan_vien = ?`,
                  [user.id]
                ),
                mysqlConnection.promise().query(
                  `SELECT DISTINCT p.id_process, p.name_process
                   FROM tb_user_role ur
                   JOIN tb_process_role pr ON ur.id_role = pr.id_role
                   JOIN tb_process p ON pr.id_process = p.id_process
                   WHERE ur.id_sync_nhan_vien = ?`,
                  [user.id]
                ),
                mysqlConnection.promise().query(
                  `SELECT DISTINCT ws.id_work_steps, ws.name_work_steps, ws.id_process
                   FROM tb_user_role ur
                   JOIN tb_work_steps_role wsr ON ur.id_role = wsr.id_role
                   JOIN tb_work_steps ws ON wsr.id_work_steps = ws.id_work_steps
                   WHERE ur.id_sync_nhan_vien = ?`,
                  [user.id]
                ),
              ])
                .then(
                  ([
                    [permissionDetails],
                    [roleDetails],
                    [workshopDetails],
                    [processDetails],
                    [workstepDetails],
                  ]) => {
                    const token = jwt.sign(
                      {
                        id: user.id,
                        ma_nv: user.ma_nv,
                        ten_nv: user.ten_nv,
                        isAdmin: false,
                        permissions: permissionDetails,
                        roles: roleDetails,
                        workshops: workshopDetails,
                        processes: processDetails,
                        worksteps: workstepDetails,
                      },
                      process.env.JWT_SECRET
                    );

                    res.json({
                      success: true,
                      token,
                      user: {
                        ma_nv: user.ma_nv,
                        ten_nv: user.ten_nv,
                        isAdmin: false,
                        permissions: permissionDetails,
                        roles: roleDetails,
                        workshops: workshopDetails,
                        processes: processDetails,
                        worksteps: workstepDetails,
                      },
                    });
                  }
                )
                .catch((error) => {
                  return res.status(500).json({
                    success: false,
                    message: "Error fetching user details",
                    error: error.message,
                  });
                });
            }
          }
        );
      });
    }
  );
});

// API lấy thông tin chuyền và mã hàng từ MSSQL có thể không dùng nữa
// app.get("/api/lines-styles", authenticateToken, async (req, res) => {
//   try {
//     const pool = await sql.connect(mssqlHiproConfig);
//     const result = await pool.request().query(`
//       SELECT DISTINCT
//         c.oid_mapping AS [OID cua Line],
//         c.stt AS [stt cua line],
//         sp.oid AS [OID cua ma hang],
//         sp.MaSanPham AS [ma hang]
//       FROM [HiPro].[dbo].[pro_chuyen] c
//       LEFT JOIN [HiPro].[dbo].[NV_SoDoChuyen] sdc ON c.oid_mapping = sdc.Chuyen
//       LEFT JOIN [HiPro].[dbo].[NV_QuiTrinhCongNghe] qtcn ON sdc.QuiTrinh = qtcn.Oid
//       LEFT JOIN [HiPro].[dbo].[DM_SanPham] sp ON qtcn.SanPham = sp.Oid
//       WHERE c.stt IS NOT NULL
//         AND sp.MaSanPham IS NOT NULL
//       ORDER BY
//         c.stt ASC,
//         sp.MaSanPham ASC
//     `);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("Error fetching lines and styles:", err);
//     res.status(500).json({ success: false, message: "Database error" });
//   }
// });

// API lấy thông tin chuyền và mã hàng từ MSSQL HiGMF
app.get("/api/higmf-lines-styles", authenticateToken, async (req, res) => {
  // Hàm formatDate để chuẩn hóa thời gian
  const formatDate = (date) => {
    return new Date(date).toISOString().slice(0, 19).replace("T", " ");
  };

  try {
    // First get data from HiGMF
    // const pool = await sql.connect(mssqlHigmfConfig);
    const result = await higmfPool.request().query(`
      WITH GetData AS (
          SELECT
              kht.KHTId,
              dh.MaHang,
              po.PONo,
              cc.TenCum,
              kht.SoLuong,
              kht.NgayVaoChuyenKeHoachBatDau,
              kht.NgayVaoChuyenKeHoachKetThuc,
              poct.MaChungLoai AS MaChungLoaiCon,
              cltp.TenChungLoaiTiengAnh,
              kh.TenNgan,
              ROW_NUMBER() OVER (PARTITION BY dh.MaHang, cc.TenCum
                                ORDER BY kht.NgayVaoChuyenKeHoachBatDau ASC,
                                        DATEDIFF(HOUR, kht.NgayVaoChuyenKeHoachBatDau, kht.NgayVaoChuyenKeHoachKetThuc) DESC) AS RowNum
          FROM [eGMF].[dbo].[OMM_DonHang] dh
          LEFT JOIN [eGMF].[dbo].[OMM_PO] po ON dh.DHId = po.DHId
          LEFT JOIN [eGMF].[dbo].[OMM_PO_ChiTiet] poct ON poct.POId = po.POId
          LEFT JOIN [eGMF].[dbo].[OMM_KeHoachThang] kht ON kht.CTPOId = poct.POCTId
          LEFT JOIN [eGMF].[dbo].[Lib_CumChuyen] cc ON kht.ChuyenId = cc.CumId
          LEFT JOIN [eGMF].[dbo].[Lib_KhachHang] kh ON dh.KHId = kh.KHId
          LEFT JOIN [eGMF].[dbo].[Lib_ChungLoaiTP] cltp ON cltp.MaChungLoai = poct.MaChungLoai
          WHERE
              cc.CumId IS NOT NULL
              AND kht.NgayVaoChuyenKeHoachBatDau IS NOT NULL
              AND kht.NgayVaoChuyenKeHoachBatDau BETWEEN DATEADD(WEEK, -1, GETDATE()) AND DATEADD(MONTH, 4, GETDATE())
      ),
      FilteredData AS (
          SELECT
              KHTId,
              MaHang,
              PONo,
              TenCum,
              SoLuong,
              NgayVaoChuyenKeHoachBatDau,
              NgayVaoChuyenKeHoachKetThuc,
              MaChungLoaiCon,
              TenChungLoaiTiengAnh,
              TenNgan,
              RowNum,
              LAG(NgayVaoChuyenKeHoachBatDau) OVER (PARTITION BY MaHang, TenCum
                                                    ORDER BY NgayVaoChuyenKeHoachBatDau ASC) AS Prev_NgayBatDau,
              LAG(NgayVaoChuyenKeHoachKetThuc) OVER (PARTITION BY MaHang, TenCum
                                                    ORDER BY NgayVaoChuyenKeHoachBatDau ASC) AS Prev_NgayKetThuc
          FROM GetData
      ),
      FinalFiltered AS (
          SELECT
              KHTId,
              MaHang,
              PONo,
              TenCum,
              SoLuong,
              NgayVaoChuyenKeHoachBatDau,
              NgayVaoChuyenKeHoachKetThuc,
              MaChungLoaiCon,
              CASE
                  WHEN TenChungLoaiTiengAnh LIKE '%PANT%' THEN 'PANTS'
                  WHEN TenChungLoaiTiengAnh LIKE '%VEST%' THEN 'VEST'
                  WHEN TenChungLoaiTiengAnh LIKE '%SHORT%' THEN 'SHORTS'
                  WHEN TenChungLoaiTiengAnh LIKE '%SKIRT%' THEN 'SKIRT'
                  WHEN TenChungLoaiTiengAnh LIKE '%SUIT%' THEN 'SUIT'
                  WHEN TenChungLoaiTiengAnh LIKE '%TOP%' THEN 'TOP'
                  WHEN TenChungLoaiTiengAnh LIKE '%JACKET%' OR TenChungLoaiTiengAnh LIKE '%JKT%' THEN 'JACKET'
                  ELSE 'undefined'
              END AS TenChungLoaiTiengAnh,
              TenNgan
          FROM FilteredData
          WHERE
              RowNum = 1
              OR (
                  NgayVaoChuyenKeHoachBatDau <> Prev_NgayBatDau
                  AND NgayVaoChuyenKeHoachBatDau <> Prev_NgayKetThuc
              )
      )
      SELECT
          KHTId,
          MaHang as style,
          PONo as PO,
          TenCum as line,
          SoLuong as quantity,
          NgayVaoChuyenKeHoachBatDau as plan_date,
          MaChungLoaiCon as sub_style,
          TenChungLoaiTiengAnh as production_style,
          TenNgan as buyer
      FROM FinalFiltered
      ORDER BY TenCum, NgayVaoChuyenKeHoachBatDau ASC
    `);

    // Get SAM and DinhMuc from Hipro for each record
    // const hiproPool = await sql.connect(mssqlHiproConfig);
    const formattedResults = await Promise.all(
      result.recordset.map(async (record) => {
        const hiproResult = await hiproPool.request().query(`
            SELECT 
              TenChuyen as line,
              MaHang as style,
              SAM,
              DinhMuc
            FROM [HiPro].[dbo].[NV_SoDoChuyen_KhaiBaoDinhMuc]
            WHERE TenChuyen = ${record.line}
            AND MaHang LIKE '%${record.style}%'
          `);

        // Check if plan exists in tb_plan
        const [existingPlan] = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            "SELECT id_plan FROM tb_plan WHERE KHTId = ?",
            [record.KHTId.toString()],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        return {
          ...record,
          KHTId: record.KHTId.toString(),
          plan_date: record.plan_date ? formatDate(record.plan_date) : null,
          SAM:
            hiproResult.recordset.length > 0
              ? (parseInt(hiproResult.recordset[0].SAM) || 0) / 60
              : 0,
          DinhMuc:
            hiproResult.recordset.length > 0
              ? parseInt(hiproResult.recordset[0].DinhMuc) || 0
              : 0,
          is_synced: !!existingPlan, // Add is_synced flag
        };
      })
    );

    res.json(formattedResults);
  } catch (err) {
    console.error("Error fetching HiGMF lines and styles:", err);
    res.status(500).json({ success: false, message: "Database error" });
  } finally {
    sql.close();
  }
});

// API đồng bộ dữ liệu từ HIGARMENT
// app.post("/api/sync-higmf-data", authenticateToken, async (req, res) => {
//   try {
//     // Kết nối SQL Server để lấy dữ liệu từ HIGMF
//     const pool = await sql.connect(mssqlHigmfConfig);
//     const result = await pool.request().query(`
//       WITH GetData AS (
//         SELECT
//           kht.KHTId,
//           dh.MaHang,
//           cc.MaCum,
//           kht.SoLuong,
//           kht.NgayVaoChuyenKeHoachBatDau,
//           kht.NgayVaoChuyenKeHoachKetThuc,
//           ROW_NUMBER() OVER (PARTITION BY dh.MaHang, cc.MaCum
//                             ORDER BY kht.NgayVaoChuyenKeHoachBatDau ASC,
//                                     DATEDIFF(HOUR, kht.NgayVaoChuyenKeHoachBatDau, kht.NgayVaoChuyenKeHoachKetThuc) DESC) AS RowNum
//         FROM [eGMF].[dbo].[OMM_DonHang] dh
//         LEFT JOIN [eGMF].[dbo].[OMM_PO] po ON dh.DHId = po.DHId
//         LEFT JOIN [eGMF].[dbo].[OMM_PO_ChiTiet] poct ON poct.POId = po.POId
//         LEFT JOIN [eGMF].[dbo].[OMM_KeHoachThang] kht ON kht.CTPOId = poct.POCTId
//         LEFT JOIN [eGMF].[dbo].[Lib_CumChuyen] cc ON kht.ChuyenId = cc.CumId
//         WHERE
//           cc.CumId IS NOT NULL
//           AND kht.NgayVaoChuyenKeHoachBatDau IS NOT NULL
//           AND kht.NgayVaoChuyenKeHoachBatDau BETWEEN DATEADD(MONTH, -2, GETDATE()) AND DATEADD(MONTH, 2, GETDATE())
//       ),
//       FilteredData AS (
//         SELECT
//           KHTId,
//           MaHang,
//           MaCum,
//           SoLuong,
//           NgayVaoChuyenKeHoachBatDau,
//           NgayVaoChuyenKeHoachKetThuc,
//           RowNum,
//           LAG(NgayVaoChuyenKeHoachBatDau) OVER (PARTITION BY MaHang, MaCum
//                                                 ORDER BY NgayVaoChuyenKeHoachBatDau ASC) AS Prev_NgayBatDau,
//           LAG(NgayVaoChuyenKeHoachKetThuc) OVER (PARTITION BY MaHang, MaCum
//                                                 ORDER BY NgayVaoChuyenKeHoachBatDau ASC) AS Prev_NgayKetThuc
//         FROM GetData
//       ),
//       FinalFiltered AS (
//         SELECT
//           KHTId,
//           MaHang,
//           MaCum,
//           SoLuong,
//           NgayVaoChuyenKeHoachBatDau,
//           NgayVaoChuyenKeHoachKetThuc
//         FROM FilteredData
//         WHERE
//           RowNum = 1
//           OR (
//             NgayVaoChuyenKeHoachBatDau <> Prev_NgayBatDau
//             AND NgayVaoChuyenKeHoachBatDau <> Prev_NgayKetThuc
//           )
//       )
//       SELECT
//         KHTId,
//         MaHang as style,
//         MaCum as line,
//         SoLuong as quantity,
//         NgayVaoChuyenKeHoachBatDau as plan_date
//       FROM FinalFiltered
//       ORDER BY MaCum, NgayVaoChuyenKeHoachBatDau ASC
//     `);

//     // Hàm formatDate để chuẩn hóa thời gian
//     const formatDate = (date) => {
//       return new Date(date).toISOString().slice(0, 19).replace("T", " ");
//     };

//     const higmfData = result.recordset.map((record) => ({
//       ...record,
//       KHTId: record.KHTId.toString(),
//       plan_date: record.plan_date ? formatDate(record.plan_date) : null,
//     }));

//     const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

//     // Sử dụng transaction để đồng bộ dữ liệu
//     const connection = await mysqlConnection.promise().getConnection();
//     try {
//       await connection.beginTransaction();

//       // Lưu các id_plan đã xử lý để trả về
//       const processedPlans = [];

//       for (const plan of higmfData) {
//         // 1. Insert hoặc update tb_plan
//         const [planResult] = await connection.query(
//           `
//           INSERT INTO tb_plan (KHTId, line, style, quantity, plan_date, actual_date, updated_by)
//           VALUES (?, ?, ?, ?, ?, ?, ?)
//           ON DUPLICATE KEY UPDATE
//             line = VALUES(line),
//             style = VALUES(style),
//             quantity = VALUES(quantity),
//             plan_date = VALUES(plan_date),
//             actual_date = VALUES(actual_date),
//             updated_by = VALUES(updated_by)
//           `,
//           [
//             plan.KHTId,
//             plan.line,
//             plan.style,
//             plan.quantity,
//             plan.plan_date,
//             plan.plan_date, // actual_date mặc định bằng plan_date
//             updated_by,
//           ]
//         );

//         // Lấy id_plan (nếu insert thì dùng insertId, nếu update thì query lại)
//         let id_plan;
//         if (planResult.insertId) {
//           id_plan = planResult.insertId;
//         } else {
//           const [existingPlan] = await connection.query(
//             "SELECT id_plan FROM tb_plan WHERE KHTId = ?",
//             [plan.KHTId]
//           );
//           id_plan = existingPlan[0].id_plan;
//         }

//         processedPlans.push({ KHTId: plan.KHTId, id_plan });

//         // 2. Insert hoặc update tb_co
//         await connection.query(
//           `
//           INSERT INTO tb_co (id_plan, updated_by, CO_begin_date)
//           VALUES (?, ?, ?)
//           ON DUPLICATE KEY UPDATE
//             updated_by = VALUES(updated_by),
//             CO_begin_date = VALUES(CO_begin_date)
//           `,
//           [id_plan, updated_by, plan.plan_date]
//         );

//         // 3. Insert hoặc update các bảng tb_process_1,2,3,4,6,7,8
//         const processIds = [1, 2, 3, 4, 6, 7, 8];
//         for (const id_process of processIds) {
//           await connection.query(
//             `
//             INSERT INTO tb_process_${id_process} (id_process, id_plan, updated_by)
//             VALUES (?, ?, ?)
//             ON DUPLICATE KEY UPDATE
//               updated_by = VALUES(updated_by)
//             `,
//             [id_process, id_plan, updated_by]
//           );
//         }
//       }

//       // Commit transaction nếu mọi thứ thành công
//       await connection.commit();

//       res.json({
//         success: true,
//         message: `Đã đồng bộ thành công ${processedPlans.length} kế hoạch`,
//         processedPlans, // Trả về danh sách KHTId và id_plan đã xử lý
//       });
//     } catch (err) {
//       // Rollback nếu có lỗi
//       await connection.rollback();
//       throw err;
//     } finally {
//       connection.release();
//     }
//   } catch (err) {
//     console.error("Error syncing HIGMF data:", err);
//     res.status(500).json({ success: false, message: "Database error" });
//   }
// });

// API tạo kế hoạch để sử dụng middleware trong MAIN mysql
app.post("/api/create-plan", authenticateToken, async (req, res) => {
  const {
    KHTId,
    line,
    style,
    quantity,
    plan_date,
    actual_date,
    production_style,
    buyer,
    SAM,
    DinhMuc,
  } = req.body;
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  let connection;
  try {
    // Get a connection from the pool
    connection = await mysqlConnection.promise().getConnection();
    await connection.beginTransaction();

    // Check if plan exists
    const [existingPlans] = await connection.query(
      "SELECT id_plan FROM tb_plan WHERE KHTId = ?",
      [KHTId]
    );

    let id_plan;

    if (existingPlans.length > 0) {
      // Plan exists - update
      id_plan = existingPlans[0].id_plan;
      await connection.query(
        `
        UPDATE tb_plan 
        SET line = ?, 
            style = ?, 
            quantity = ?, 
            plan_date = ?, 
            updated_by = ?
        WHERE KHTId = ?
        `,
        [line, style, quantity, plan_date, updated_by, KHTId]
      );
    } else {
      // Plan doesn't exist - insert
      const [insertResult] = await connection.query(
        `
        INSERT INTO tb_plan (KHTId, line, style, quantity, plan_date, updated_by)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [KHTId, line, style, quantity, plan_date, updated_by]
      );
      id_plan = insertResult.insertId;
    }

    // Check if CO exists
    const [existingCO] = await connection.query(
      "SELECT id_plan FROM tb_co WHERE id_plan = ?",
      [id_plan]
    );

    if (existingCO.length > 0) {
      // CO exists - update
      await connection.query(
        `
        UPDATE tb_co 
        SET updated_by = ?,
            production_style = ?,
            buyer = ?,
            SAM = ?,
            quota = ?
        WHERE id_plan = ?
        `,
        [updated_by, production_style, buyer, SAM, DinhMuc, id_plan]
      );
    } else {
      // CO doesn't exist - insert
      await connection.query(
        `
        INSERT INTO tb_co (id_plan, updated_by, production_style, buyer, SAM, quota)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [id_plan, updated_by, production_style, buyer, SAM, DinhMuc]
      );
    }

    // Get all process IDs
    const [processResults] = await connection.query(
      "SELECT id_process FROM tb_process ORDER BY id_process ASC"
    );

    // Handle each process
    for (const process of processResults) {
      const id_process = process.id_process;

      if ([1, 2, 3, 4, 6, 7, 8].includes(id_process)) {
        // Check if process exists
        const [existingProcess] = await connection.query(
          `SELECT id_plan FROM tb_process_${id_process} WHERE id_plan = ?`,
          [id_plan]
        );

        if (existingProcess.length > 0) {
          // Process exists - update
          await connection.query(
            `
            UPDATE tb_process_${id_process}
            SET updated_by = ?
            WHERE id_plan = ?
            `,
            [updated_by, id_plan]
          );
        } else {
          // Process doesn't exist - insert
          await connection.query(
            `
            INSERT INTO tb_process_${id_process} (id_process, id_plan, updated_by)
            VALUES (?, ?, ?)
            `,
            [id_process, id_plan, updated_by]
          );
        }
      }
    }

    // Create log entry
    const action = existingPlans.length > 0 ? "CẬP NHẬT" : "TẠO";
    const history_log = `${updated_by} vừa ${action} KẾ HOẠCH chuyền: [${line}], mã hàng: [${style}], thời gian dự kiến: [${plan_date}], thời gian thực tế: [${actual_date}]`;

    await connection.query("INSERT INTO tb_log (history_log) VALUES (?)", [
      history_log,
    ]);

    // Commit the transaction
    await connection.commit();

    res.json({
      success: true,
      message: `Plan ${
        existingPlans.length > 0 ? "updated" : "created"
      } successfully with all related process records`,
      id_plan,
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error in transaction:", err);
    res.status(500).json({ success: false, message: "Database error" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// API to toggle plan inactive status
app.put("/api/plans/:id/toggle-inactive", authenticateToken, (req, res) => {
  const { id } = req.params;
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ success: false, message: "Transaction error" });
      }

      // First get current plan details for logging
      connection.query(
        "SELECT line, style, inactive FROM tb_plan WHERE id_plan = ?",
        [id],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error fetching plan:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          if (results.length === 0) {
            return connection.rollback(() => {
              connection.release();
              res
                .status(404)
                .json({ success: false, message: "Plan not found" });
            });
          }

          const { line, style, inactive } = results[0];
          const newInactiveStatus = inactive === 1 ? 0 : 1;

          // Update the inactive status
          connection.query(
            "UPDATE tb_plan SET inactive = ?, updated_by = ? WHERE id_plan = ?",
            [newInactiveStatus, updated_by, id],
            (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error updating inactive status:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              // Create log entry
              const action = newInactiveStatus === 1 ? "KHÓA" : "MỞ KHÓA";
              const history_log = `${updated_by} vừa ${action} kế hoạch chuyền [${line}], mã hàng [${style}]`;

              connection.query(
                "INSERT INTO tb_log (history_log) VALUES (?)",
                [history_log],
                (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error creating log entry:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Commit the transaction
                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Error committing transaction:", err);
                        res.status(500).json({
                          success: false,
                          message: "Transaction commit error",
                        });
                      });
                    }

                    connection.release();
                    res.json({
                      success: true,
                      message: `Plan ${
                        newInactiveStatus === 1 ? "locked" : "unlocked"
                      } successfully`,
                      inactive: newInactiveStatus,
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// API lấy danh sách kế hoạch trong MAIN mysql
app.get("/api/plans", authenticateToken, (req, res) => {
  mysqlConnection.query(
    `SELECT * FROM tb_plan ORDER BY id_plan DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching plans:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json(results);
    }
  );
});

// API lấy chi tiết kế hoạch theo id trong MAIN mysql
app.get("/api/plans/:id", authenticateToken, (req, res) => {
  const { id } = req.params;

  // Function to determine the workshop based on line number
  const determineWorkshop = (line) => {
    // Parse the line value to an integer
    const lineNum = parseInt(line);

    // Check if lineNum is a valid number
    if (isNaN(lineNum)) {
      return null; // Return null if line is not a valid number
    }

    // Workshop determination logic
    if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
    if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
    if (lineNum >= 21 && lineNum <= 30) return 3;
    if (lineNum >= 31 && lineNum <= 40) return 4;
    return null; // Return null for any line number outside the defined ranges
  };

  // Query the database for the plan
  mysqlConnection.query(
    "SELECT * FROM tb_plan WHERE id_plan = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Error fetching plan:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Plan not found" });
      }

      // Get the plan data
      const plan = results[0];

      // Determine the workshop based on the line value
      const workshop = determineWorkshop(plan.line);

      // Add the workshop to the plan data
      plan.workshop = workshop;

      // If workshop is null, you might want to handle this case
      if (workshop === null) {
        console.warn(`Invalid or unmapped line value: ${plan.line}`);
      }

      // Return the plan with the workshop included
      res.json(plan);
    }
  );
});

// API lấy danh sách kế hoạch cho view calendar trong MAIN mysql
app.get("/api/plans-for-calendar", authenticateToken, (req, res) => {
  const query = `
    SELECT id_plan, line, style, plan_date, actual_date, total_percent_rate
    FROM tb_plan
    WHERE inactive = 0
    OR inactive IS NULL
    ORDER BY plan_date DESC
  `;

  const getWorkshop = (line) => {
    const lineNum = parseInt(line);
    if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
    if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
    if (lineNum >= 21 && lineNum <= 30) return 3;
    if (lineNum >= 31 && lineNum <= 40) return 4;
    return null;
  };

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching plans for calendar:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    const events = results.map((plan) => {
      // const endDate = new Date(plan.plan_date);
      // const startDate = new Date(endDate);
      // startDate.setDate(startDate.getDate() - 8);
      const workshop = getWorkshop(plan.line);
      let backgroundColor, borderColor, textColor;

      // Assign colors based on workshop
      switch (workshop) {
        case 1:
          backgroundColor = "#64b5f6"; // Light Blue
          borderColor = "#42a5f5"; // Medium Blue
          textColor = "black";
          break;
        case 2:
          backgroundColor = "#81c784"; // Light Green
          borderColor = "#66bb6a"; // Medium Green
          textColor = "black";
          break;
        case 3:
          backgroundColor = "#ffb74d"; // Light Orange
          borderColor = "#ffa726"; // Medium Orange
          textColor = "black";
          break;
        case 4:
          backgroundColor = "#ff8a65"; // Light Coral
          borderColor = "#e57373"; // Medium Coral
          textColor = "black";
          break;
        default:
          backgroundColor = "#808080"; // Grey for undefined workshop
          borderColor = "#666666";
          textColor = "white";
      }

      return {
        id: plan.id_plan,
        title: `C${plan.line}_${plan.style}`,
        start: plan.plan_date,
        extendedProps: {
          line: plan.line,
          style: plan.style,
          plan_date: plan.plan_date,
          actual_date: plan.actual_date,
          total_percent_rate: plan.total_percent_rate || 0,
          workshop: workshop,
        },
        backgroundColor,
        borderColor,
        textColor,
        allDay: true,
      };
    });

    res.json(events);
  });
});

// API cập nhật thời gian kế hoạch theo id trong MAIN mysql
app.put("/api/plans/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { plan_date, actual_date } = req.body;

  // Get user info from token
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  // Use a transaction to ensure both updates succeed or fail together
  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection for transaction:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ success: false, message: "Transaction error" });
      }

      // First, get the current plan data to include in the log
      connection.query(
        "SELECT line, style FROM tb_plan WHERE id_plan = ?",
        [id],
        (err, planResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error fetching plan data:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          if (planResults.length === 0) {
            return connection.rollback(() => {
              connection.release();
              res
                .status(404)
                .json({ success: false, message: "Plan not found" });
            });
          }

          const { line, style } = planResults[0];

          const actualDateValue =
            actual_date && actual_date.trim() !== "" ? actual_date : null;
          // Update the plan with new dates and updated_by
          connection.query(
            "UPDATE tb_plan SET plan_date = ?, actual_date = ?, updated_by = ? WHERE id_plan = ?",
            [plan_date, actualDateValue, updated_by, id],
            (err, updateResults) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error updating plan:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              // Update CO_begin_date in tb_co to match actual_date
              connection.query(
                "UPDATE tb_co SET CO_begin_date = ?, updated_by = ? WHERE id_plan = ?",
                [actualDateValue, updated_by, id],
                (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating CO_begin_date:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Create log entry
                  const history_log = `${updated_by} vừa CẬP NHẬT thời gian dự kiến: [${formatDate(
                    plan_date
                  )}], thời gian thực tế: [${formatDate(
                    actual_date
                  )}] của chuyền: [${line}], mã hàng: [${style}]`;

                  connection.query(
                    "INSERT INTO tb_log (history_log) VALUES (?)",
                    [history_log],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Error creating log entry:", err);
                          res.status(500).json({
                            success: false,
                            message: "Database error",
                          });
                        });
                      }

                      // Commit the transaction if all operations succeed
                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error committing transaction:", err);
                            res.status(500).json({
                              success: false,
                              message: "Transaction commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message: "Plan updated successfully",
                        });
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

// API lấy danh sách quy trình trong MAIN mysql
app.get("/api/processes", authenticateToken, (req, res) => {
  mysqlConnection.query(
    "SELECT * FROM tb_process ORDER BY id_process ASC",
    (err, results) => {
      if (err) {
        console.error("Error fetching processes:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json(results);
    }
  );
});

// API lấy dữ liệu CO theo id_plan trong MAIN mysql
app.get("/api/co/:id_plan", authenticateToken, (req, res) => {
  const { id_plan } = req.params;

  mysqlConnection.query(
    "SELECT * FROM tb_co WHERE id_plan = ?",
    [id_plan],
    (err, results) => {
      if (err) {
        console.error("Error fetching CO data:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "CO data not found" });
      }

      res.json(results[0]);
    }
  );
});

// API cập nhật dữ liệu CO trong MAIN mysql
app.put("/api/co/:id_plan", authenticateToken, (req, res) => {
  const { id_plan } = req.params;
  const {
    CO_begin_date,
    CO_end_date,
    last_garment_of_old_style,
    carry_over,
    buyer,
    production_style,
    SAM,
    staff,
    quota,
    eff_1,
    target_of_COPT,
    COPT,
    target_of_COT,
    COT,
  } = req.body;

  // Sanitize date inputs
  const sanitizedCO_begin_date = sanitizeDate(CO_begin_date);
  const sanitizedCO_end_date = sanitizeDate(CO_end_date);
  const sanitizedLast_garment = sanitizeDate(last_garment_of_old_style);

  // Chuyển đổi các giá trị rỗng thành 0 cho các trường số
  const numericFields = {
    SAM: SAM || 0,
    quota: quota || 0,
    eff_1: eff_1 || 0,
    target_of_COPT: target_of_COPT || 0,
    COPT: COPT || 0,
    target_of_COT: target_of_COT || 0,
    COT: COT || 0,
  };

  // Get user info from token
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection for transaction:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ success: false, message: "Transaction error" });
      }

      // Get plan information for the log
      connection.query(
        "SELECT line, style FROM tb_plan WHERE id_plan = ?",
        [id_plan],
        (err, planResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error fetching plan data:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          const line = planResults.length > 0 ? planResults[0].line : "N/A";
          const style = planResults.length > 0 ? planResults[0].style : "N/A";

          // Update CO data
          connection.query(
            `UPDATE tb_co SET 
              CO_begin_date = ?, 
              CO_end_date = ?, 
              last_garment_of_old_style = ?,
              carry_over = ?,
              buyer = ?,
              production_style = ?,
              SAM = ?,
              staff = ?,
              quota = ?,
              eff_1 = ?,
              target_of_COPT = ?,
              COPT = ?,
              target_of_COT = ?,
              COT = ?,
              updated_by = ?
            WHERE id_plan = ?`,
            [
              sanitizedCO_begin_date,
              sanitizedCO_end_date,
              sanitizedLast_garment,
              carry_over,
              buyer,
              production_style,
              numericFields.SAM,
              staff,
              numericFields.quota,
              numericFields.eff_1,
              numericFields.target_of_COPT,
              numericFields.COPT,
              numericFields.target_of_COT,
              numericFields.COT,
              updated_by,
              id_plan,
            ],
            (err, updateResults) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error updating CO data:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              // Update the actual_date in tb_plan to match CO_begin_date
              connection.query(
                "UPDATE tb_plan SET actual_date = ?, updated_by = ? WHERE id_plan = ?",
                [sanitizedCO_begin_date, updated_by, id_plan],
                (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating plan actual_date:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Create log entry with line and style information
                  const history_log = `${updated_by} vừa CẬP NHẬT thông tin CO của kế hoạch chuyền: [${line}], mã hàng: [${style}]`;

                  connection.query(
                    "INSERT INTO tb_log (history_log) VALUES (?)",
                    [history_log],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Error creating log entry:", err);
                          res.status(500).json({
                            success: false,
                            message: "Database error",
                          });
                        });
                      }

                      // Commit the transaction if all operations succeed
                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error committing transaction:", err);
                            res.status(500).json({
                              success: false,
                              message: "Transaction commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message: "CO data updated successfully",
                        });
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
});

// API lấy tỉ lệ hoàn thành của các quy trình cho một kế hoạch cụ thể trong MAIN mysql
app.get("/api/process-rates/:id_plan", authenticateToken, (req, res) => {
  const { id_plan } = req.params;

  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    // Create an array to store all query promises
    const queryPromises = [];

    // For processes 1-4 and 6-8, get percent_rate directly
    [1, 2, 3, 4, 6, 7, 8].forEach((processId) => {
      queryPromises.push(
        new Promise((resolve, reject) => {
          connection.query(
            `SELECT id_process, percent_rate FROM tb_process_${processId} WHERE id_plan = ?`,
            [id_plan],
            (err, results) => {
              if (err) {
                reject(err);
              } else {
                // If no results, return 0 as the percent_rate
                const rate =
                  results.length > 0 ? results[0].percent_rate || 0 : 0;
                resolve({ id_process: processId, percent_rate: rate });
              }
            }
          );
        })
      );
    });

    // For process 5, calculate average of prepare_rate from both tables
    queryPromises.push(
      new Promise((resolve, reject) => {
        connection.query(
          `SELECT AVG(prepare_rate) as avg_rate FROM tb_process_5_preparing_machine WHERE id_plan = ?`,
          [id_plan],
          (err, preparingResults) => {
            if (err) {
              reject(err);
            } else {
              connection.query(
                `SELECT AVG(prepare_rate) as avg_rate FROM tb_process_5_backup_machine WHERE id_plan = ?`,
                [id_plan],
                (err, backupResults) => {
                  if (err) {
                    reject(err);
                  } else {
                    // Get the average rates, default to 0 if null
                    const preparingRate =
                      preparingResults.length > 0
                        ? preparingResults[0].avg_rate || 0
                        : 0;
                    const backupRate =
                      backupResults.length > 0
                        ? backupResults[0].avg_rate || 0
                        : 0;

                    // Calculate weighted average: 80% preparing + 20% backup
                    const avgRate = preparingRate * 0.8 + backupRate * 0.2;

                    resolve({
                      id_process: 5,
                      percent_rate: Math.round(avgRate),
                    });
                  }
                }
              );
            }
          }
        );
      })
    );

    // Execute all queries and return the results
    Promise.all(queryPromises)
      .then((results) => {
        connection.release();
        res.json(results);
      })
      .catch((err) => {
        connection.release();
        console.error("Error fetching process rates:", err);
        res.status(500).json({ success: false, message: "Database error" });
      });
  });
});

// API lấy các bước công việc của một quy trình trong Main mysql
app.get("/api/work-steps/:id_process", authenticateToken, (req, res) => {
  const { id_process } = req.params;

  mysqlConnection.query(
    "SELECT * FROM tb_work_steps WHERE id_process = ? ORDER BY order_of_appearance ASC",
    [id_process],
    (err, results) => {
      if (err) {
        console.error("Error fetching work steps:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json(results);
    }
  );
});

// API lấy dữ liệu downtime cho một kế hoạch trong ISSUE LOGGER mysql
app.get(
  "/api/plans/:id_plan/downtime-issues",
  authenticateToken,
  (req, res) => {
    try {
      const { id_plan } = req.params;

      // First get the CO data and plan data to get the line and style
      mysqlConnection.query(
        "SELECT p.line, p.style, c.CO_begin_date, c.CO_end_date FROM tb_plan p JOIN tb_co c ON p.id_plan = c.id_plan WHERE p.id_plan = ?",
        [id_plan],
        (err, results) => {
          if (err) {
            console.error("Error fetching plan and CO data:", err);
            return res
              .status(500)
              .json({ success: false, message: "Database error" });
          }

          if (results.length === 0) {
            return res.json([]);
          }

          const planData = results[0];

          // Check if any of the required date fields are missing
          if (!planData.CO_begin_date || !planData.CO_end_date) {
            // Return empty array if either date is missing
            return res.json([]);
          }

          const lineNumber = planData.line;
          const productCode = planData.style;

          // Special handling for line 2001, normal handling for others
          let lineNumberCondition;
          let lineParams = [];
          if (lineNumber === "2001") {
            const formattedLineBase = "20.01";
            lineNumberCondition =
              "(line_number = ? OR line_number = ? OR line_number = ?)";
            lineParams.push(
              `Tổ ${formattedLineBase}`,
              `Tổ ${formattedLineBase}A`,
              `Tổ ${formattedLineBase}B`
            );
          } else {
            lineNumberCondition = "line_number = ?";
            lineParams.push(`Tổ ${lineNumber}`);
          }

          // Create a condition to match each character in the product code
          const productCodeChars = productCode.split("");
          const productCodeConditions = productCodeChars
            .map(() => "new_product_code LIKE ?")
            .join(" OR ");

          // Create parameters for product code conditions
          const productCodeParams = productCodeChars.map((char) => `%${char}%`);

          // Build the query with time range condition
          let timeRangeCondition = "AND submission_time >= ? AND end_time <= ?";
          let params = [
            ...lineParams,
            ...productCodeParams,
            planData.CO_begin_date,
            planData.CO_end_date,
          ];

          // console.log("Search Parameters:");
          // console.log("Line Number:", lineNumber);
          // console.log("Line Number Condition:", lineNumberCondition);
          // console.log("Line Params:", lineParams);
          // console.log("Product Code:", productCode);
          // console.log("Product Code Characters:", productCodeChars);
          // console.log("Product Code Params:", productCodeParams);
          // console.log("CO Begin Date:", planData.CO_begin_date);
          // console.log("CO End Date:", planData.CO_end_date);
          // Query the issue logger database
          const query = `
          SELECT 
            i.id_logged_issue,
            i.submission_time,
            i.line_number,
            i.station_number,
            i.id_category,
            c.name_category,
            i.machinery_type,
            i.machinery_code,
            i.issue_description,
            i.solution_description,
            i.problem_solver,
            i.responsible_person,
            i.end_time,
            i.downtime_minutes,
            i.old_product_code,
            i.new_product_code,
            i.workshop,
            i.factory,
            i.status_logged_issue
          FROM tb_logged_issue i
          LEFT JOIN tb_category c ON i.id_category = c.id_category
          WHERE ${lineNumberCondition}
            AND (${productCodeConditions})
            ${timeRangeCondition}
          ORDER BY i.submission_time ASC`;

          // console.log("Final SQL Query:", query);
          // console.log("Query Parameters:", params);

          issueLoggerConnection.query(query, params, (err, results) => {
            if (err) {
              console.error("Error fetching downtime issues:", err);
              return res
                .status(500)
                .json({ success: false, message: "Database error" });
            }

            // console.log("Found issues:", results.length);
            // console.log("First few issues:", results.slice(0, 3));
            res.json(results);
          });
        }
      );
    } catch (error) {
      console.error("Error in downtime issues endpoint:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Function to calculate and update total_percent_rate in tb_plan
const updateTotalPercentRate = (id_plan, connection, callback) => {
  // Create an array to store all query promises
  const queryPromises = [];

  // For processes 1-4 and 6-8, get percent_rate directly
  [1, 2, 3, 4, 6, 7, 8].forEach((processId) => {
    queryPromises.push(
      new Promise((resolve, reject) => {
        connection.query(
          `SELECT percent_rate FROM tb_process_${processId} WHERE id_plan = ?`,
          [id_plan],
          (err, results) => {
            if (err) {
              reject(err);
            } else {
              // If no results, return 0 as the percent_rate
              const rate =
                results.length > 0 ? results[0].percent_rate || 0 : 0;
              resolve(rate);
            }
          }
        );
      })
    );
  });

  // For process 5, calculate weighted average of prepare_rate from both tables
  queryPromises.push(
    new Promise((resolve, reject) => {
      connection.query(
        `SELECT AVG(prepare_rate) as avg_rate FROM tb_process_5_preparing_machine WHERE id_plan = ?`,
        [id_plan],
        (err, preparingResults) => {
          if (err) {
            reject(err);
          } else {
            connection.query(
              `SELECT AVG(prepare_rate) as avg_rate FROM tb_process_5_backup_machine WHERE id_plan = ?`,
              [id_plan],
              (err, backupResults) => {
                if (err) {
                  reject(err);
                } else {
                  // Get the average rates, default to 0 if null
                  const preparingRate =
                    preparingResults.length > 0
                      ? preparingResults[0].avg_rate || 0
                      : 0;
                  const backupRate =
                    backupResults.length > 0
                      ? backupResults[0].avg_rate || 0
                      : 0;

                  // Calculate weighted average: 80% preparing + 20% backup
                  const avgRate = Math.round(
                    preparingRate * 0.8 + backupRate * 0.2
                  );

                  resolve(avgRate);
                }
              }
            );
          }
        }
      );
    })
  );

  // Execute all queries and calculate the average
  Promise.all(queryPromises)
    .then((rates) => {
      // Filter out any NaN values and calculate average
      const validRates = rates.filter((rate) => !isNaN(rate));
      const totalRates = validRates.reduce((sum, rate) => sum + (rate || 0), 0);
      const avgRate =
        validRates.length > 0 ? Math.round(totalRates / validRates.length) : 0;

      // Update the total_percent_rate in tb_plan
      connection.query(
        "UPDATE tb_plan SET total_percent_rate = ? WHERE id_plan = ?",
        [avgRate, id_plan],
        (err) => {
          if (err) {
            console.error("Error updating total_percent_rate:", err);
            if (callback) callback(err);
          } else {
            if (callback) callback(null, avgRate);
          }
        }
      );
    })
    .catch((err) => {
      console.error("Error calculating total_percent_rate:", err);
      if (callback) callback(err);
    });
};

// API endpoints for Process 5 preparing machines
app.get(
  "/api/process5/preparing-machines/:id_plan",
  authenticateToken,
  (req, res) => {
    const { id_plan } = req.params;

    mysqlConnection.query(
      "SELECT * FROM tb_process_5_preparing_machine WHERE id_plan = ? ORDER BY name_machine ASC",
      [id_plan],
      (err, results) => {
        if (err) {
          console.error("Error fetching preparing machines:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }
        res.json(results);
      }
    );
  }
);

// Preparing Machines POST endpoint
app.post("/api/process5/preparing-machines", authenticateToken, (req, res) => {
  const {
    id_plan,
    id_process,
    adjust_date,
    SQL_oid_thiet_bi,
    name_machine,
    quantity,
    prepared,
    pass,
    fail,
  } = req.body;

  // Calculate derived values
  const pass_rate = pass > 0 ? Math.round((pass / prepared) * 100) : 0;
  const not_prepared = quantity - prepared;
  const prepare_rate =
    quantity > 0 ? Math.round((prepared / quantity) * 100) : 0;

  // Get user info from token
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  // Allow adjust_date to be NULL if it's empty
  const adjustDateValue =
    adjust_date && adjust_date.trim() !== "" ? adjust_date : null;

  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ success: false, message: "Transaction error" });
      }

      // Insert or update preparing machine record
      connection.query(
        `INSERT INTO tb_process_5_preparing_machine 
         (id_plan, id_process, adjust_date, SQL_oid_thiet_bi, name_machine, quantity, prepared, pass, fail, pass_rate, not_prepared, prepare_rate, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_plan,
          id_process || 5, // Default to 5 if not provided
          adjustDateValue,
          SQL_oid_thiet_bi,
          name_machine,
          quantity,
          prepared,
          pass,
          fail,
          pass_rate,
          not_prepared,
          prepare_rate,
          updated_by,
        ],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error adding/updating preparing machine:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          // Get plan information for logging
          connection.query(
            "SELECT line, style FROM tb_plan WHERE id_plan = ?",
            [id_plan],
            (err, planResults) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error fetching plan data:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              const line =
                planResults.length > 0 ? planResults[0].line : "Unknown";
              const style =
                planResults.length > 0 ? planResults[0].style : "Unknown";

              // Update process rate
              connection.query(
                "SELECT AVG(prepare_rate) as avg_prepare_rate FROM tb_process_5_preparing_machine WHERE id_plan = ?",
                [id_plan],
                (err, avgResults) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error(
                        "Error calculating average prepare rate:",
                        err
                      );
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Now update the total_percent_rate in the plan
                  updateTotalPercentRate(id_plan, connection, (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error(
                          "Error updating total percent rate:",
                          err
                        );
                        res.status(500).json({
                          success: false,
                          message: "Database error",
                        });
                      });
                    }

                    // Create log entry
                    const action = results.insertId ? "THÊM MỚI" : "CẬP NHẬT";
                    const history_log = `${updated_by} vừa ${action} thông tin máy chuẩn bị "${name_machine}" cho quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) của chuyền [${line}], mã hàng [${style}]`;

                    connection.query(
                      "INSERT INTO tb_log (history_log) VALUES (?)",
                      [history_log],
                      (err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error creating log entry:", err);
                            res.status(500).json({
                              success: false,
                              message: "Database error",
                            });
                          });
                        }

                        // Commit the transaction
                        connection.commit((err) => {
                          if (err) {
                            return connection.rollback(() => {
                              connection.release();
                              console.error(
                                "Error committing transaction:",
                                err
                              );
                              res.status(500).json({
                                success: false,
                                message: "Transaction commit error",
                              });
                            });
                          }

                          connection.release();
                          res.json({
                            success: true,
                            message:
                              "Preparing machine data saved successfully",
                            id: results.insertId || null,
                          });
                        });
                      }
                    );
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// Preparing Machines PUT endpoint
app.put(
  "/api/process5/preparing-machines/:id",
  authenticateToken,
  (req, res) => {
    const { id } = req.params;
    const {
      id_plan,
      id_process,
      adjust_date,
      SQL_oid_thiet_bi,
      name_machine,
      quantity,
      prepared,
      pass,
      fail,
    } = req.body;

    // Calculate derived values
    const pass_rate = pass > 0 ? Math.round((pass / prepared) * 100) : 0;
    const not_prepared = quantity - prepared;
    const prepare_rate =
      quantity > 0 ? Math.round((prepared / quantity) * 100) : 0;

    // Get user info from token
    const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

    // Allow adjust_date to be NULL if it's empty
    const adjustDateValue =
      adjust_date && adjust_date.trim() !== "" ? adjust_date : null;

    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database connection error" });
      }

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Error starting transaction:", err);
          return res
            .status(500)
            .json({ success: false, message: "Transaction error" });
        }

        // Update the preparing machine record
        connection.query(
          `UPDATE tb_process_5_preparing_machine 
         SET adjust_date = ?, 
             name_machine = ?,
             SQL_oid_thiet_bi = ?,
             quantity = ?,
             prepared = ?,
             pass = ?,
             fail = ?,
             pass_rate = ?,
             not_prepared = ?,
             prepare_rate = ?,
             id_process = ?,
             updated_by = ?
         WHERE id_process_5_preparing_machine = ?`,
          [
            adjustDateValue,
            name_machine,
            SQL_oid_thiet_bi,
            quantity,
            prepared,
            pass,
            fail,
            pass_rate,
            not_prepared,
            prepare_rate,
            id_process || 5, // Default to 5 if not provided
            updated_by,
            id,
          ],
          (err, results) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error updating preparing machine:", err);
                res
                  .status(500)
                  .json({ success: false, message: "Database error" });
              });
            }

            if (results.affectedRows === 0) {
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({
                  success: false,
                  message: "Machine not found or no changes made",
                });
              });
            }

            // Get plan information for logging
            connection.query(
              "SELECT line, style FROM tb_plan WHERE id_plan = ?",
              [id_plan],
              (err, planResults) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error fetching plan data:", err);
                    res
                      .status(500)
                      .json({ success: false, message: "Database error" });
                  });
                }

                const line =
                  planResults.length > 0 ? planResults[0].line : "Unknown";
                const style =
                  planResults.length > 0 ? planResults[0].style : "Unknown";

                // Update process rate
                updateTotalPercentRate(id_plan, connection, (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating total percent rate:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Create log entry
                  const history_log = `${updated_by} vừa CẬP NHẬT thông tin máy chuẩn bị "${name_machine}" cho quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) của chuyền [${line}], mã hàng [${style}]`;

                  connection.query(
                    "INSERT INTO tb_log (history_log) VALUES (?)",
                    [history_log],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Error creating log entry:", err);
                          res.status(500).json({
                            success: false,
                            message: "Database error",
                          });
                        });
                      }

                      // Commit the transaction
                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error committing transaction:", err);
                            res.status(500).json({
                              success: false,
                              message: "Transaction commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message:
                            "Preparing machine data updated successfully",
                        });
                      });
                    }
                  );
                });
              }
            );
          }
        );
      });
    });
  }
);

app.delete(
  "/api/process5/preparing-machines/:id",
  authenticateToken,
  (req, res) => {
    const { id } = req.params;
    const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database connection error" });
      }

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Error starting transaction:", err);
          return res
            .status(500)
            .json({ success: false, message: "Transaction error" });
        }

        // Get machine and plan info for logging
        connection.query(
          `SELECT m.name_machine, m.id_plan, p.line, p.style 
         FROM tb_process_5_preparing_machine m 
         JOIN tb_plan p ON m.id_plan = p.id_plan 
         WHERE m.id_process_5_preparing_machine = ?`,
          [id],
          (err, results) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error fetching machine info:", err);
                res
                  .status(500)
                  .json({ success: false, message: "Database error" });
              });
            }

            if (results.length === 0) {
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({
                  success: false,
                  message: "Machine record not found",
                });
              });
            }

            const { name_machine, id_plan, line, style } = results[0];

            // Delete the machine record
            connection.query(
              "DELETE FROM tb_process_5_preparing_machine WHERE id_process_5_preparing_machine = ?",
              [id],
              (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error deleting preparing machine:", err);
                    res
                      .status(500)
                      .json({ success: false, message: "Database error" });
                  });
                }

                // Update process rate
                updateTotalPercentRate(id_plan, connection, (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating total percent rate:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Create log entry
                  const history_log = `${updated_by} vừa XÓA thông tin máy chuẩn bị "${name_machine}" từ quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) của chuyền [${line}], mã hàng [${style}]`;

                  connection.query(
                    "INSERT INTO tb_log (history_log) VALUES (?)",
                    [history_log],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Error creating log entry:", err);
                          res.status(500).json({
                            success: false,
                            message: "Database error",
                          });
                        });
                      }

                      // Commit the transaction
                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error committing transaction:", err);
                            res.status(500).json({
                              success: false,
                              message: "Transaction commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message: "Preparing machine deleted successfully",
                        });
                      });
                    }
                  );
                });
              }
            );
          }
        );
      });
    });
  }
);

// API endpoints for Process 5 backup machines
app.get(
  "/api/process5/backup-machines/:id_plan",
  authenticateToken,
  (req, res) => {
    const { id_plan } = req.params;

    mysqlConnection.query(
      "SELECT * FROM tb_process_5_backup_machine WHERE id_plan = ? ORDER BY name_machine ASC",
      [id_plan],
      (err, results) => {
        if (err) {
          console.error("Error fetching backup machines:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }
        res.json(results);
      }
    );
  }
);

// Get available processes from Hi-Line for a specific line and style
app.get(
  "/api/process5/hiline-processes/:line/:style",
  authenticateToken,
  async (req, res) => {
    const { line, style } = req.params;

    try {
      // Execute query to get available processes
      const result = await hiproPool
        .request()
        .input("mahang", sql.VarChar, style)
        .input("chuyen", sql.VarChar, line).query(`
          SELECT DISTINCT
            qtcn.SoPhieu as [so_phieu],
            clsp.TenChungLoai as [ten_chung_loai]
          FROM [HiPro].[dbo].[ChiTietPhieuYeuCauThietBiCongCuSanXuat] ctp
          LEFT JOIN [HiPro].[dbo].[PhieuYeuCauThietBiCongCuSanXuat] p
            ON ctp.idPhieu = p.id
          LEFT JOIN [HiPro].[dbo].[NV_SoDoChuyen] sdc
            ON p.OidSoDoChuyen = sdc.Oid
          LEFT JOIN [HiPro].[dbo].[NV_QuiTrinhCongNghe] qtcn 
            ON sdc.QuiTrinh = qtcn.Oid
          LEFT JOIN [HiPro].[dbo].[DM_ChungLoaiSanPham] clsp
            ON qtcn.ChungLoaiChiTiet = clsp.Oid
          LEFT JOIN [HiPro].[dbo].[DM_SanPham] sp 
            ON qtcn.SanPham = sp.Oid
          LEFT JOIN [HiPro].[dbo].[pro_chuyen] c
            ON c.oid_mapping = sdc.Chuyen
          WHERE sp.MaSanPham = @mahang 
            AND c.stt = @chuyen
            AND ctp.ThietBi IS NOT NULL
            AND ctp.SoLuongTrenSDC != 0
          ORDER BY qtcn.SoPhieu ASC
        `);

      // Return the list of processes
      res.json({
        success: true,
        processes: result.recordset || [],
      });
    } catch (error) {
      console.error("Error fetching Hi-Line processes:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching processes from Hi-Line",
        error: error.message,
      });
    }
  }
);

// Process 5 Hi-Line data synchronization endpoint
app.post(
  "/api/process5/sync-machines-from-hiline",
  authenticateToken,
  async (req, res) => {
    const { id_plan, line, style, so_phieu } = req.body;

    // Get user info from token for logging
    const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

    try {
      // Connect to MSSQL
      // const pool = await sql.connect(mssqlHiproConfig);

      // Execute the query with parameterized inputs for safety
      const result = await hiproPool
        .request()
        .input("mahang", sql.VarChar, style)
        .input("chuyen", sql.VarChar, line)
        .input("so_phieu", sql.VarChar, so_phieu).query(`
          SELECT DISTINCT
            ctp.ThietBi as [oid_thietbi],
            cltb.TenChungLoai as [ten_may],
            ctp.SoLuongTrenSDC as [so_luong_may],
            qtcn.SoPhieu as [so_phieu]
          FROM [HiPro].[dbo].[ChiTietPhieuYeuCauThietBiCongCuSanXuat] ctp
          LEFT JOIN [HiPro].[dbo].[PhieuYeuCauThietBiCongCuSanXuat] p
            ON ctp.idPhieu = p.id
          LEFT JOIN [HiPro].[dbo].[NV_SoDoChuyen] sdc
            ON p.OidSoDoChuyen = sdc.Oid
          LEFT JOIN [HiPro].[dbo].[NV_QuiTrinhCongNghe] qtcn 
            ON sdc.QuiTrinh = qtcn.Oid
          LEFT JOIN [HiPro].[dbo].[DM_SanPham] sp 
            ON qtcn.SanPham = sp.Oid
          LEFT JOIN [HiPro].[dbo].[pro_chuyen] c
            ON c.oid_mapping = sdc.Chuyen
          LEFT JOIN [HiPro].[dbo].[DM_ChungLoaiThietBi] cltb
            ON ctp.ThietBi = cltb.Oid
          WHERE sp.MaSanPham = @mahang 
            AND c.stt = @chuyen
            AND qtcn.SoPhieu = @so_phieu
            AND ctp.ThietBi IS NOT NULL
            AND ctp.SoLuongTrenSDC != 0
          ORDER BY cltb.TenChungLoai ASC
        `);

      // Close the SQL Server connection
      await sql.close();

      // No machines found
      if (!result.recordset || result.recordset.length === 0) {
        return res.json({
          success: true,
          message: "Không tìm thấy dữ liệu máy từ Hi-Line",
          count: 0,
        });
      }

      // Get MySQL connection to insert data
      mysqlConnection.getConnection((err, connection) => {
        if (err) {
          console.error("Error getting connection:", err);
          return res.status(500).json({
            success: false,
            message: "Database connection error",
          });
        }

        connection.beginTransaction(async (err) => {
          if (err) {
            connection.release();
            console.error("Error starting transaction:", err);
            return res.status(500).json({
              success: false,
              message: "Transaction error",
            });
          }

          try {
            // First, get existing machines for this plan
            const existingMachines = await new Promise((resolve, reject) => {
              connection.query(
                "SELECT id_process_5_preparing_machine, SQL_oid_thiet_bi FROM tb_process_5_preparing_machine WHERE id_plan = ?",
                [id_plan],
                (err, results) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve(results);
                }
              );
            });

            // Create a map of existing machines by SQL_oid_thiet_bi
            const existingMachineMap = {};
            existingMachines.forEach((machine) => {
              if (machine.SQL_oid_thiet_bi) {
                existingMachineMap[machine.SQL_oid_thiet_bi] =
                  machine.id_process_5_preparing_machine;
              }
            });

            // Track operations
            let insertCount = 0;
            let updateCount = 0;
            let errors = [];

            // Process each machine from the result
            for (const machine of result.recordset) {
              // Default values for new machine entries
              const quantity = machine["so_luong_may"] || 0;
              const prepared = 0;
              const pass = 0;
              const fail = 0;
              const pass_rate = 0;
              const not_prepared = quantity;
              const prepare_rate = 0;
              const SQL_oid_thiet_bi = machine["oid_thietbi"];

              try {
                if (existingMachineMap[SQL_oid_thiet_bi]) {
                  // Update existing record
                  await new Promise((resolve, reject) => {
                    connection.query(
                      `UPDATE tb_process_5_preparing_machine 
                      SET name_machine = ?,
                          quantity = ?,
                          not_prepared = quantity - prepared,
                          updated_by = ?
                      WHERE id_process_5_preparing_machine = ?`,
                      [
                        machine["ten_may"],
                        quantity,
                        updated_by,
                        existingMachineMap[SQL_oid_thiet_bi],
                      ],
                      (err, results) => {
                        if (err) {
                          return reject(err);
                        }
                        updateCount++;
                        resolve(results);
                      }
                    );
                  });
                } else {
                  // Insert new record
                  await new Promise((resolve, reject) => {
                    connection.query(
                      `INSERT INTO tb_process_5_preparing_machine 
                      (id_plan, id_process, SQL_oid_thiet_bi, name_machine, quantity, prepared, pass, fail, pass_rate, not_prepared, prepare_rate, updated_by) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        id_plan,
                        5, // Set id_process to 5 for Process 5
                        SQL_oid_thiet_bi,
                        machine["ten_may"],
                        quantity,
                        prepared,
                        pass,
                        fail,
                        pass_rate,
                        not_prepared,
                        prepare_rate,
                        updated_by,
                      ],
                      (err, results) => {
                        if (err) {
                          return reject(err);
                        }
                        insertCount++;
                        resolve(results);
                      }
                    );
                  });
                }
              } catch (error) {
                errors.push({
                  machine: machine["ten_may"],
                  error: error.message,
                });
                console.error(
                  `Error processing machine ${machine["ten_may"]}:`,
                  error
                );
              }
            }

            // Create log entry
            const history_log = `${updated_by} vừa đồng bộ dữ liệu từ Hi-Line cho quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) - Thêm mới: ${insertCount}, Cập nhật: ${updateCount}`;

            await new Promise((resolve, reject) => {
              connection.query(
                "INSERT INTO tb_log (history_log) VALUES (?)",
                [history_log],
                (err) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                }
              );
            });

            // Update process rate
            await new Promise((resolve, reject) => {
              updateTotalPercentRate(id_plan, connection, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve();
              });
            });

            // Commit the transaction
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error committing transaction:", err);
                  res.status(500).json({
                    success: false,
                    message: "Transaction commit error",
                  });
                });
              }

              connection.release();
              res.json({
                success: true,
                message: `Đồng bộ thành công ${
                  insertCount + updateCount
                } máy từ Hi-Line (Thêm mới: ${insertCount}, Cập nhật: ${updateCount})`,
                count: insertCount + updateCount,
                insertedCount: insertCount,
                updatedCount: updateCount,
                errors: errors.length > 0 ? errors : undefined,
              });
            });
          } catch (error) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error during synchronization process:", error);
              res.status(500).json({
                success: false,
                message: "Database error during synchronization",
                error: error.message,
              });
            });
          }
        });
      });
    } catch (error) {
      console.error("Error during Hi-Line synchronization:", error);
      res.status(500).json({
        success: false,
        message: "Error connecting to Hi-Line database or processing data",
        error: error.message,
      });
    }
  }
);

// Add new endpoint to get machine preview
app.get(
  "/api/process5/machines-preview/:id_plan",
  authenticateToken,
  async (req, res) => {
    const { id_plan } = req.params;

    try {
      // Get connection from pool
      mysqlConnection.getConnection((err, connection) => {
        if (err) {
          console.error("Error getting connection:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database connection error" });
        }

        // Get both preparing and backup machines
        Promise.all([
          new Promise((resolve, reject) => {
            connection.query(
              "SELECT name_machine, quantity FROM tb_process_5_preparing_machine WHERE id_plan = ? ORDER BY name_machine ASC",
              [id_plan],
              (err, results) => {
                if (err) reject(err);
                else resolve({ type: "preparing", machines: results });
              }
            );
          }),
          new Promise((resolve, reject) => {
            connection.query(
              "SELECT name_machine, quantity FROM tb_process_5_backup_machine WHERE id_plan = ? ORDER BY name_machine ASC",
              [id_plan],
              (err, results) => {
                if (err) reject(err);
                else resolve({ type: "backup", machines: results });
              }
            );
          }),
          new Promise((resolve, reject) => {
            connection.query(
              "SELECT line, style FROM tb_plan WHERE id_plan = ?",
              [id_plan],
              (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
              }
            );
          }),
        ])
          .then(([preparingMachines, backupMachines, planInfo]) => {
            connection.release();
            res.json({
              success: true,
              source_plan: planInfo,
              preparing_machines: preparingMachines.machines,
              backup_machines: backupMachines.machines,
            });
          })
          .catch((error) => {
            connection.release();
            console.error("Error fetching machine preview:", error);
            res.status(500).json({
              success: false,
              message: "Error fetching machine preview",
              error: error.message,
            });
          });
      });
    } catch (error) {
      console.error("Error in machine preview endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Process 5 copy machines from another plan endpoint
app.post("/api/process5/copy-machines", authenticateToken, async (req, res) => {
  const { source_plan_id, target_plan_id } = req.body;
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  try {
    // Get connection from pool
    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database connection error" });
      }

      connection.beginTransaction(async (err) => {
        if (err) {
          connection.release();
          console.error("Error starting transaction:", err);
          return res
            .status(500)
            .json({ success: false, message: "Transaction error" });
        }

        try {
          // First check if source plan has any machines
          const [hasMachines] = await Promise.all([
            new Promise((resolve, reject) => {
              connection.query(
                `SELECT EXISTS (
                  SELECT 1 FROM tb_process_5_preparing_machine WHERE id_plan = ?
                  UNION
                  SELECT 1 FROM tb_process_5_backup_machine WHERE id_plan = ?
                ) as has_machines`,
                [source_plan_id, source_plan_id],
                (err, results) => {
                  if (err) reject(err);
                  else resolve(results[0].has_machines);
                }
              );
            }),
          ]);

          if (!hasMachines) {
            connection.release();
            return res.status(400).json({
              success: false,
              message: "Kế hoạch nguồn không có dữ liệu máy móc để sao chép",
            });
          }

          // Get source and target plan details for logging
          const [sourcePlan, targetPlan] = await Promise.all([
            new Promise((resolve, reject) => {
              connection.query(
                "SELECT line, style FROM tb_plan WHERE id_plan = ?",
                [source_plan_id],
                (err, results) => {
                  if (err) reject(err);
                  else resolve(results[0]);
                }
              );
            }),
            new Promise((resolve, reject) => {
              connection.query(
                "SELECT line, style FROM tb_plan WHERE id_plan = ?",
                [target_plan_id],
                (err, results) => {
                  if (err) reject(err);
                  else resolve(results[0]);
                }
              );
            }),
          ]);

          // Get preparing machines from source plan
          const preparingMachines = await new Promise((resolve, reject) => {
            connection.query(
              "SELECT * FROM tb_process_5_preparing_machine WHERE id_plan = ?",
              [source_plan_id],
              (err, results) => {
                if (err) reject(err);
                else resolve(results);
              }
            );
          });

          // Get backup machines from source plan
          const backupMachines = await new Promise((resolve, reject) => {
            connection.query(
              "SELECT * FROM tb_process_5_backup_machine WHERE id_plan = ?",
              [source_plan_id],
              (err, results) => {
                if (err) reject(err);
                else resolve(results);
              }
            );
          });

          // Insert preparing machines for target plan
          if (preparingMachines.length > 0) {
            const preparingValues = preparingMachines.map((machine) => [
              target_plan_id,
              machine.id_process,
              null, // Set adjust_date to null instead of copying machine.adjust_date
              machine.SQL_oid_thiet_bi,
              machine.name_machine,
              machine.quantity,
              machine.prepared,
              machine.pass,
              machine.fail,
              machine.pass_rate,
              machine.not_prepared,
              machine.prepare_rate,
              updated_by,
            ]);

            await new Promise((resolve, reject) => {
              connection.query(
                `INSERT INTO tb_process_5_preparing_machine 
                (id_plan, id_process, adjust_date, SQL_oid_thiet_bi, name_machine, 
                quantity, prepared, pass, fail, pass_rate, not_prepared, prepare_rate, updated_by) 
                VALUES ?`,
                [preparingValues],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }

          // Insert backup machines for target plan
          if (backupMachines.length > 0) {
            const backupValues = backupMachines.map((machine) => [
              target_plan_id,
              machine.id_process,
              null, // Set adjust_date to null instead of copying machine.adjust_date
              machine.name_machine,
              machine.quantity,
              machine.prepared,
              machine.pass,
              machine.fail,
              machine.pass_rate,
              machine.not_prepared,
              machine.prepare_rate,
              updated_by,
            ]);

            await new Promise((resolve, reject) => {
              connection.query(
                `INSERT INTO tb_process_5_backup_machine 
                (id_plan, id_process, adjust_date, name_machine, 
                quantity, prepared, pass, fail, pass_rate, not_prepared, prepare_rate, updated_by) 
                VALUES ?`,
                [backupValues],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          }

          // Create log entry
          const history_log = `${updated_by} vừa sao chép thông tin máy móc từ chuyền [${sourcePlan.line}], mã hàng [${sourcePlan.style}] sang chuyền [${targetPlan.line}], mã hàng [${targetPlan.style}]`;

          await new Promise((resolve, reject) => {
            connection.query(
              "INSERT INTO tb_log (history_log) VALUES (?)",
              [history_log],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });

          // Update process rate
          await new Promise((resolve, reject) => {
            updateTotalPercentRate(target_plan_id, connection, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          // Commit transaction
          await new Promise((resolve, reject) => {
            connection.commit((err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          connection.release();
          res.json({
            success: true,
            message: "Machines copied successfully",
            preparing_count: preparingMachines.length,
            backup_count: backupMachines.length,
          });
        } catch (error) {
          return connection.rollback(() => {
            connection.release();
            console.error("Error during machine copy:", error);
            res.status(500).json({
              success: false,
              message: "Error copying machines",
              error: error.message,
            });
          });
        }
      });
    });
  } catch (error) {
    console.error("Error in copy machines endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Backup Machines POST endpoint
app.post("/api/process5/backup-machines", authenticateToken, (req, res) => {
  const {
    id_plan,
    id_process,
    adjust_date,
    name_machine,
    quantity,
    prepared,
    pass,
    fail,
  } = req.body;

  // Calculate derived values
  const pass_rate = pass > 0 ? Math.round((pass / prepared) * 100) : 0;
  const not_prepared = quantity - prepared;
  const prepare_rate =
    quantity > 0 ? Math.round((prepared / quantity) * 100) : 0;

  // Get user info from token
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  // Allow adjust_date to be NULL if it's empty
  const adjustDateValue =
    adjust_date && adjust_date.trim() !== "" ? adjust_date : null;

  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ success: false, message: "Transaction error" });
      }

      // Insert or update backup machine record
      connection.query(
        `INSERT INTO tb_process_5_backup_machine 
         (id_plan, id_process, adjust_date, name_machine, quantity, prepared, pass, fail, pass_rate, not_prepared, prepare_rate, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_plan,
          id_process || 5, // Default to 5 if not provided
          adjustDateValue,
          name_machine,
          quantity,
          prepared,
          pass,
          fail,
          pass_rate,
          not_prepared,
          prepare_rate,
          updated_by,
        ],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error adding/updating backup machine:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          // Get plan information for logging
          connection.query(
            "SELECT line, style FROM tb_plan WHERE id_plan = ?",
            [id_plan],
            (err, planResults) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error fetching plan data:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              const line =
                planResults.length > 0 ? planResults[0].line : "Unknown";
              const style =
                planResults.length > 0 ? planResults[0].style : "Unknown";

              // Update process rate
              connection.query(
                "SELECT AVG(prepare_rate) as avg_prepare_rate FROM tb_process_5_backup_machine WHERE id_plan = ?",
                [id_plan],
                (err, avgResults) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error(
                        "Error calculating average prepare rate:",
                        err
                      );
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Now update the total_percent_rate in the plan
                  updateTotalPercentRate(id_plan, connection, (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error(
                          "Error updating total percent rate:",
                          err
                        );
                        res
                          .status(500)
                          .json({ success: false, message: "Database error" });
                      });
                    }

                    // Create log entry
                    const action = results.insertId ? "THÊM MỚI" : "CẬP NHẬT";
                    const history_log = `${updated_by} vừa ${action} thông tin máy dự phòng "${name_machine}" cho quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) của chuyền [${line}], mã hàng [${style}]`;

                    connection.query(
                      "INSERT INTO tb_log (history_log) VALUES (?)",
                      [history_log],
                      (err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error creating log entry:", err);
                            res.status(500).json({
                              success: false,
                              message: "Database error",
                            });
                          });
                        }

                        // Commit the transaction
                        connection.commit((err) => {
                          if (err) {
                            return connection.rollback(() => {
                              connection.release();
                              console.error(
                                "Error committing transaction:",
                                err
                              );
                              res.status(500).json({
                                success: false,
                                message: "Transaction commit error",
                              });
                            });
                          }

                          connection.release();
                          res.json({
                            success: true,
                            message: "Backup machine data saved successfully",
                            id: results.insertId || null,
                          });
                        });
                      }
                    );
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

// Backup Machines PUT endpoint
app.put("/api/process5/backup-machines/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const {
    id_plan,
    id_process,
    adjust_date,
    name_machine,
    quantity,
    prepared,
    pass,
    fail,
  } = req.body;

  // Calculate derived values
  const pass_rate = pass > 0 ? Math.round((pass / prepared) * 100) : 0;
  const not_prepared = quantity - prepared;
  const prepare_rate =
    quantity > 0 ? Math.round((prepared / quantity) * 100) : 0;

  // Get user info from token
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  // Allow adjust_date to be NULL if it's empty
  const adjustDateValue =
    adjust_date && adjust_date.trim() !== "" ? adjust_date : null;

  mysqlConnection.getConnection((err, connection) => {
    if (err) {
      console.error("Error getting connection:", err);
      return res
        .status(500)
        .json({ success: false, message: "Database connection error" });
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error("Error starting transaction:", err);
        return res
          .status(500)
          .json({ success: false, message: "Transaction error" });
      }

      // Update the backup machine record
      connection.query(
        `UPDATE tb_process_5_backup_machine 
         SET adjust_date = ?, 
             name_machine = ?,
             quantity = ?,
             prepared = ?,
             pass = ?,
             fail = ?,
             pass_rate = ?,
             not_prepared = ?,
             prepare_rate = ?,
             id_process = ?,
             updated_by = ?
         WHERE id_process_5_backup_machine = ?`,
        [
          adjustDateValue,
          name_machine,
          quantity,
          prepared,
          pass,
          fail,
          pass_rate,
          not_prepared,
          prepare_rate,
          id_process || 5, // Default to 5 if not provided
          updated_by,
          id,
        ],
        (err, results) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error updating backup machine:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          if (results.affectedRows === 0) {
            return connection.rollback(() => {
              connection.release();
              res.status(404).json({
                success: false,
                message: "Machine not found or no changes made",
              });
            });
          }

          // Get plan information for logging
          connection.query(
            "SELECT line, style FROM tb_plan WHERE id_plan = ?",
            [id_plan],
            (err, planResults) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error fetching plan data:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              const line =
                planResults.length > 0 ? planResults[0].line : "Unknown";
              const style =
                planResults.length > 0 ? planResults[0].style : "Unknown";

              // Update process rate
              updateTotalPercentRate(id_plan, connection, (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error updating total percent rate:", err);
                    res
                      .status(500)
                      .json({ success: false, message: "Database error" });
                  });
                }

                // Create log entry
                const history_log = `${updated_by} vừa CẬP NHẬT thông tin máy dự phòng "${name_machine}" cho quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) của chuyền [${line}], mã hàng [${style}]`;

                connection.query(
                  "INSERT INTO tb_log (history_log) VALUES (?)",
                  [history_log],
                  (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Error creating log entry:", err);
                        res.status(500).json({
                          success: false,
                          message: "Database error",
                        });
                      });
                    }

                    // Commit the transaction
                    connection.commit((err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Error committing transaction:", err);
                          res.status(500).json({
                            success: false,
                            message: "Transaction commit error",
                          });
                        });
                      }

                      connection.release();
                      res.json({
                        success: true,
                        message: "Backup machine data updated successfully",
                      });
                    });
                  }
                );
              });
            }
          );
        }
      );
    });
  });
});

app.delete(
  "/api/process5/backup-machines/:id",
  authenticateToken,
  (req, res) => {
    const { id } = req.params;
    const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

    mysqlConnection.getConnection((err, connection) => {
      if (err) {
        console.error("Error getting connection:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database connection error" });
      }

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          console.error("Error starting transaction:", err);
          return res
            .status(500)
            .json({ success: false, message: "Transaction error" });
        }

        // Get machine and plan info for logging
        connection.query(
          `SELECT m.name_machine, m.id_plan, p.line, p.style 
         FROM tb_process_5_backup_machine m 
         JOIN tb_plan p ON m.id_plan = p.id_plan 
         WHERE m.id_process_5_backup_machine = ?`,
          [id],
          (err, results) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error fetching machine info:", err);
                res
                  .status(500)
                  .json({ success: false, message: "Database error" });
              });
            }

            if (results.length === 0) {
              return connection.rollback(() => {
                connection.release();
                res.status(404).json({
                  success: false,
                  message: "Machine record not found",
                });
              });
            }

            const { name_machine, id_plan, line, style } = results[0];

            // Delete the machine record
            connection.query(
              "DELETE FROM tb_process_5_backup_machine WHERE id_process_5_backup_machine = ?",
              [id],
              (err) => {
                if (err) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error("Error deleting backup machine:", err);
                    res
                      .status(500)
                      .json({ success: false, message: "Database error" });
                  });
                }

                // Update process rate
                updateTotalPercentRate(id_plan, connection, (err) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating total percent rate:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Create log entry
                  const history_log = `${updated_by} vừa XÓA thông tin máy dự phòng "${name_machine}" từ quy trình 5 (CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP) của chuyền [${line}], mã hàng [${style}]`;

                  connection.query(
                    "INSERT INTO tb_log (history_log) VALUES (?)",
                    [history_log],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error("Error creating log entry:", err);
                          res.status(500).json({
                            success: false,
                            message: "Database error",
                          });
                        });
                      }

                      // Commit the transaction
                      connection.commit((err) => {
                        if (err) {
                          return connection.rollback(() => {
                            connection.release();
                            console.error("Error committing transaction:", err);
                            res.status(500).json({
                              success: false,
                              message: "Transaction commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message: "Backup machine deleted successfully",
                        });
                      });
                    }
                  );
                });
              }
            );
          }
        );
      });
    });
  }
);

// Setup Google Drive API using the auth utils
const {
  getDriveClient,
  executeWithTokenRefresh,
} = require("./utils/authUtils");

// Get the drive client
let drive = getDriveClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Convert Buffer to string with UTF-8 encoding
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    cb(null, true);
  },
});

// GENERIC DOCUMENTATION HANDLERS FOR ALL PROCESSES

/**
 * Generic handler for uploading documentation files to Google Drive and updating the corresponding process table
 * @param {string} processNum - The process number (e.g., 1, 2, 3, etc.)
 * @param {string} processName - The display name of the process for logging
 * @param {boolean} isA3 - Whether this is an A3 documentation or regular documentation
 */
const handleProcessDocumentationUpload = (
  processNum,
  processName,
  isA3 = false
) => {
  const fieldName = isA3 ? "A3_documentation" : "documentation";
  const routePath = isA3
    ? `/api/process${processNum}/upload-a3-documentation`
    : `/api/process${processNum}/upload-documentation`;
  const tableName = `tb_process_${processNum}`;

  app.post(
    routePath,
    authenticateToken,
    upload.array("files", 10),
    async (req, res) => {
      try {
        const files = req.files;
        const id_plan = req.body.id_plan;

        if (!files || files.length === 0) {
          return res
            .status(400)
            .json({ success: false, message: "No files uploaded" });
        }

        if (!id_plan) {
          return res
            .status(400)
            .json({ success: false, message: "Plan ID is required" });
        }

        const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

        const planQuery = `SELECT p.line, p.style, proc.${fieldName} FROM tb_plan p JOIN ${tableName} proc ON p.id_plan = proc.id_plan WHERE p.id_plan = ?`;

        mysqlConnection.query(
          planQuery,
          [id_plan],
          async (err, planResults) => {
            if (err) {
              console.error("Error fetching plan details:", err);
              return res
                .status(500)
                .json({ success: false, message: "Database error" });
            }

            if (planResults.length === 0) {
              return res
                .status(404)
                .json({ success: false, message: "Plan not found" });
            }

            const { line, style } = planResults[0];
            const existingDocumentation = planResults[0][fieldName];

            try {
              const newDocUrls = [];

              // Process each file with retry mechanism in case of token expiration
              const uploadPromises = files.map(async (file) => {
                let fileStream;
                let fileName;

                try {
                  // Try to upload the file with token refresh mechanism
                  return await executeWithTokenRefresh(async () => {
                    // Create a new readable stream for each attempt
                    fileStream = new Readable();
                    fileStream.push(file.buffer);
                    fileStream.push(null);
                    fileName = file.originalname;

                    const driveResponse = await drive.files.create({
                      requestBody: {
                        name: fileName,
                        mimeType: file.mimetype,
                        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
                      },
                      media: {
                        mimeType: file.mimetype,
                        body: fileStream,
                      },
                    });

                    const fileId = driveResponse.data.id;

                    await drive.permissions.create({
                      fileId: fileId,
                      requestBody: {
                        role: "reader",
                        type: "anyone",
                      },
                    });

                    const getFileResponse = await drive.files.get({
                      fileId: fileId,
                      fields: "webViewLink, webContentLink",
                    });

                    return {
                      url: getFileResponse.data.webViewLink,
                      directUrl: getFileResponse.data.webContentLink,
                      filename: fileName,
                    };
                  });
                } catch (uploadError) {
                  console.error(
                    `Error uploading file ${file.originalname}:`,
                    uploadError
                  );
                  throw uploadError;
                }
              });

              const uploadResults = await Promise.all(uploadPromises);
              newDocUrls.push(...uploadResults);

              let updatedDocumentation;
              if (
                existingDocumentation &&
                existingDocumentation.trim() !== ""
              ) {
                updatedDocumentation = `${existingDocumentation}; ${newDocUrls
                  .map((result) => `${result.directUrl}|${result.filename}`)
                  .join("; ")}`;
              } else {
                updatedDocumentation = newDocUrls
                  .map((result) => `${result.directUrl}|${result.filename}`)
                  .join("; ");
              }

              mysqlConnection.getConnection((connErr, connection) => {
                if (connErr) {
                  console.error("Error getting connection:", connErr);
                  return res.status(500).json({
                    success: false,
                    message: "Database connection error",
                  });
                }

                connection.beginTransaction((transErr) => {
                  if (transErr) {
                    connection.release();
                    console.error("Error starting transaction:", transErr);
                    return res
                      .status(500)
                      .json({ success: false, message: "Transaction error" });
                  }

                  // Set percent_rate to 100 only if this is regular documentation (not A3)
                  const updateSQL = isA3
                    ? `UPDATE ${tableName} SET ${fieldName} = ?, updated_by = ? WHERE id_plan = ?`
                    : `UPDATE ${tableName} SET ${fieldName} = ?, percent_rate = 100, updated_by = ? WHERE id_plan = ?`;

                  connection.query(
                    updateSQL,
                    [updatedDocumentation, updated_by, id_plan],
                    (updateErr) => {
                      if (updateErr) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error(
                            `Error updating ${fieldName}:`,
                            updateErr
                          );
                          res.status(500).json({
                            success: false,
                            message: "Database update error",
                          });
                        });
                      }

                      // If this is regular documentation, update the total_percent_rate
                      if (!isA3) {
                        updateTotalPercentRate(id_plan, connection, (err) => {
                          if (err) {
                            console.error(
                              "Error updating total percent rate:",
                              err
                            );
                            // Continue with the transaction anyway
                          }
                        });
                      }

                      const fileNames = files
                        .map((file) => file.originalname)
                        .join(", ");

                      const docType = isA3
                        ? "tài liệu A3 khắc phục"
                        : "tài liệu minh chứng";
                      const completionText = isA3
                        ? ""
                        : " và đã hoàn thành 100% quy trình";

                      const history_log = `${updated_by} đã tải lên ${files.length} ${docType} [${fileNames}] cho quy trình ${processNum} (${processName}) của chuyền [${line}], mã hàng [${style}]${completionText}`;

                      connection.query(
                        "INSERT INTO tb_log (history_log) VALUES (?)",
                        [history_log],
                        (logErr) => {
                          if (logErr) {
                            return connection.rollback(() => {
                              connection.release();
                              console.error(
                                "Error creating log entry:",
                                logErr
                              );
                              res.status(500).json({
                                success: false,
                                message: "Database log error",
                              });
                            });
                          }

                          connection.commit((commitErr) => {
                            if (commitErr) {
                              return connection.rollback(() => {
                                connection.release();
                                console.error(
                                  "Error committing transaction:",
                                  commitErr
                                );
                                res.status(500).json({
                                  success: false,
                                  message: "Transaction commit error",
                                });
                              });
                            }

                            connection.release();
                            res.json({
                              success: true,
                              message: `${files.length} files uploaded successfully`,
                              updatedDocumentation,
                            });
                          });
                        }
                      );
                    }
                  );
                });
              });
            } catch (uploadError) {
              console.error("Error uploading to Google Drive:", uploadError);
              res.status(500).json({
                success: false,
                message: "Error uploading to Google Drive",
              });
            }
          }
        );
      } catch (error) {
        console.error("Server error during file upload:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
    }
  );
};

/**
 * Generic handler for deleting documentation files from Google Drive and updating the process table
 * @param {string} processNum - The process number (e.g., 1, 2, 3, etc.)
 * @param {string} processName - The display name of the process for logging
 * @param {boolean} isA3 - Whether this is an A3 documentation or regular documentation
 */
const handleProcessDocumentationDelete = (
  processNum,
  processName,
  isA3 = false
) => {
  const fieldName = isA3 ? "A3_documentation" : "documentation";
  const routePath = isA3
    ? `/api/process${processNum}/delete-a3-documentation/:id_plan`
    : `/api/process${processNum}/delete-documentation/:id_plan`;
  const tableName = `tb_process_${processNum}`;

  app.delete(routePath, authenticateToken, async (req, res) => {
    const { id_plan } = req.params;
    const { index } = req.query;

    // Get user info from token for logging and tracking
    const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

    if (!index && index !== "0") {
      return res.status(400).json({ message: "Index parameter is required" });
    }

    const indexNum = parseInt(index, 10);
    if (isNaN(indexNum)) {
      return res.status(400).json({ message: "Index must be a number" });
    }

    // Get the current documentation
    mysqlConnection.query(
      `SELECT ${fieldName} FROM ${tableName} WHERE id_plan = ?`,
      [id_plan],
      async (err, results) => {
        if (err) {
          console.error(`Error fetching ${fieldName}:`, err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Process not found" });
        }

        const documentation = results[0][fieldName];

        if (!documentation) {
          return res
            .status(404)
            .json({ message: `No ${isA3 ? "A3 " : ""}documentation found` });
        }

        // Split the documentation string and remove the specified entry
        const documentationEntries = documentation.split("; ");

        if (indexNum < 0 || indexNum >= documentationEntries.length) {
          return res.status(400).json({ message: "Index out of bounds" });
        }

        // Get the file to delete
        const fileToDelete = documentationEntries[indexNum];
        const fileId = fileToDelete.match(/[-\w]{25,}/)?.[0]; // Extract Google Drive file ID

        // Start a transaction
        mysqlConnection.getConnection((connErr, connection) => {
          if (connErr) {
            console.error("Error getting connection:", connErr);
            return res
              .status(500)
              .json({ success: false, message: "Database connection error" });
          }

          connection.beginTransaction(async (transErr) => {
            if (transErr) {
              connection.release();
              console.error("Error starting transaction:", transErr);
              return res
                .status(500)
                .json({ success: false, message: "Transaction error" });
            }

            try {
              // Delete file from Google Drive if fileId exists
              if (fileId) {
                await drive.files.delete({ fileId });
              }

              // Remove the entry from the array
              documentationEntries.splice(indexNum, 1);

              // Rebuild the documentation string
              const newDocumentation =
                documentationEntries.length > 0
                  ? documentationEntries.join("; ")
                  : null;

              // Update the documentation field and conditionally set percent_rate if it's regular documentation
              const percentRate =
                !isA3 && newDocumentation ? 100 : !isA3 ? 0 : null;
              const updateSQL = !isA3
                ? `UPDATE ${tableName} SET ${fieldName} = ?, percent_rate = ?, updated_by = ? WHERE id_plan = ?`
                : `UPDATE ${tableName} SET ${fieldName} = ?, updated_by = ? WHERE id_plan = ?`;

              const updateParams = !isA3
                ? [newDocumentation, percentRate, updated_by, id_plan]
                : [newDocumentation, updated_by, id_plan];

              connection.query(updateSQL, updateParams, (updateErr) => {
                if (updateErr) {
                  return connection.rollback(() => {
                    connection.release();
                    console.error(`Error updating ${fieldName}:`, updateErr);
                    res.status(500).json({
                      success: false,
                      message: "Database update error",
                    });
                  });
                }

                // Update total_percent_rate if this is regular documentation
                if (!isA3) {
                  updateTotalPercentRate(id_plan, connection, (err) => {
                    if (err) {
                      console.error("Error updating total percent rate:", err);
                      // Continue with the transaction anyway
                    }
                  });
                }

                // Log the action using format consistent with other logs
                const docType = isA3
                  ? "tài liệu A3 khắc phục"
                  : "tài liệu minh chứng";
                const history_log = `${updated_by} đã xóa ${docType} từ quy trình ${processNum} (${processName})`;

                connection.query(
                  "INSERT INTO tb_log (history_log) VALUES (?)",
                  [history_log],
                  (logErr) => {
                    if (logErr) {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Error creating log entry:", logErr);
                        res.status(500).json({
                          success: false,
                          message: "Database log error",
                        });
                      });
                    }

                    // Commit transaction
                    connection.commit((commitErr) => {
                      if (commitErr) {
                        return connection.rollback(() => {
                          connection.release();
                          console.error(
                            "Error committing transaction:",
                            commitErr
                          );
                          res.status(500).json({
                            success: false,
                            message: "Transaction commit error",
                          });
                        });
                      }

                      connection.release();
                      res.json({
                        success: true,
                        message: `${
                          isA3 ? "A3 " : ""
                        }Documentation file deleted successfully`,
                        documentation: newDocumentation,
                      });
                    });
                  }
                );
              });
            } catch (error) {
              return connection.rollback(() => {
                connection.release();
                console.error("Error deleting file from Google Drive:", error);
                res.status(500).json({
                  success: false,
                  message: "Error deleting file from Google Drive",
                });
              });
            }
          });
        });
      }
    );
  });
};

/**
 * Generic handler for getting documentation files
 * @param {string} processNum - The process number (e.g., 1, 2, 3, etc.)
 * @param {boolean} isA3 - Whether this is an A3 documentation or regular documentation
 */
const handleProcessDocumentationGet = (processNum, isA3 = false) => {
  const fieldName = isA3 ? "A3_documentation" : "documentation";
  const routePath = isA3
    ? `/api/process${processNum}/a3-documentation/:id_plan`
    : `/api/process${processNum}/documentation/:id_plan`;
  const tableName = `tb_process_${processNum}`;

  app.get(routePath, authenticateToken, (req, res) => {
    const { id_plan } = req.params;

    mysqlConnection.query(
      `SELECT ${fieldName} FROM ${tableName} WHERE id_plan = ?`,
      [id_plan],
      (err, results) => {
        if (err) {
          console.error(`Error fetching ${fieldName}:`, err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Process not found" });
        }

        const documentation = results[0][fieldName];

        // If no documentation, return empty array
        if (!documentation) {
          return res.json({ files: [] });
        }

        // Split documentation by "; " and parse each entry
        const files = documentation.split("; ").map((doc, index) => {
          const [directUrl, filename] = doc.split("|");
          return {
            id: index,
            directUrl: directUrl,
            filename: filename || "Unknown File",
          };
        });

        res.json({ files });
      }
    );
  });
};

// Define process names for logging purposes
const processNames = {
  1: "NGHIÊN CỨU MẪU GỐC",
  2: "HỌP CÔNG TÁC CHUẨN BỊ SẢN XUẤT MÃ HÀNG MỚI",
  3: "LÀM RẬP SẢN XUẤT MAY MẪU ĐỐI, MẪU MOCKUP ",
  4: "LẬP QUY TRÌNH CÔNG NGHỆ, THIẾT KẾ SƠ ĐỒ CHUYỀN, CÂN BẰNG YAMAZUMI",
  6: "HỌP CHUYỂN ĐỔI MÃ HÀNG MỚI",
  7: "CUNG CẤP BTP, PL",
  8: "ĐÀO TẠO BCV MỚI CHO CÔNG NHÂN",
};

// Register documentation endpoints for all processes
[1, 2, 3, 4, 6, 7, 8].forEach((processNum) => {
  // Regular documentation endpoints
  handleProcessDocumentationUpload(processNum, processNames[processNum], false);
  handleProcessDocumentationDelete(processNum, processNames[processNum], false);
  handleProcessDocumentationGet(processNum, false);

  // A3 documentation endpoints
  handleProcessDocumentationUpload(processNum, processNames[processNum], true);
  handleProcessDocumentationDelete(processNum, processNames[processNum], true);
  handleProcessDocumentationGet(processNum, true);
});

// User permission management endpoints
app.get("/api/users/search", authenticateToken, async (req, res) => {
  // Split search terms by comma and trim whitespace
  const searchTerms = req.query.terms
    ? req.query.terms.split(",").map((term) => term.trim())
    : [];

  try {
    // Get users from HiTimesheet database
    const users = await new Promise((resolve, reject) => {
      // Build WHERE conditions for each search term
      const whereConditions = searchTerms
        .filter((term) => term) // Filter out empty terms
        .map((term) => `(nv.ten_nv LIKE ? OR nv.ma_nv LIKE ?)`)
        .join(" OR ");

      // If no valid search terms, return empty result
      if (whereConditions.length === 0) {
        return resolve([]);
      }

      // Double the search terms as we need two parameters for each term
      const searchParams = searchTerms
        .filter((term) => term)
        .reduce((acc, term) => [...acc, `%${term}%`, `%${term}%`], []);

      const query = `
        SELECT 
          nv.id AS id_nhan_vien, 
          nv.ma_nv, 
          nv.ten_nv, 
          nv.cong_viec_phu_trach, 
          bp.ten_bo_phan
        FROM sync_nhan_vien nv
        LEFT JOIN sync_bo_phan bp ON nv.id_bo_phan = bp.id
        LEFT JOIN sync_phong_ban pb ON bp.id_phong_ban = pb.id
        WHERE (${whereConditions})
        AND bp.ten_bo_phan NOT LIKE '%NGHI VIEC%'
        AND bp.ten_bo_phan NOT LIKE '%NGHI DAI HAN%'
        AND bp.ten_bo_phan NOT LIKE '%NV%'
        AND bp.ten_bo_phan NOT LIKE '%THAI SAN%'
        AND bp.id_bo_phan NOT LIKE '%NV%'
        AND pb.id_phong_ban NOT LIKE '%NGHI VIEC%'
        AND pb.ten_phong_ban NOT LIKE '%NGHI VIEC%'
      `;

      dataHiTimesheetConnection.query(query, searchParams, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    // Get permissions for each user
    const userPromises = users.map(async (user) => {
      try {
        // Get direct permissions
        const directPermissions = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            `
            SELECT DISTINCT p.id_permission, p.name_permission
            FROM tb_user_permission up
            JOIN tb_permission p ON up.id_permission = p.id_permission
            WHERE up.id_sync_nhan_vien = ?
            `,
            [user.id_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        // Get role-based permissions
        const rolePermissions = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            `
            SELECT DISTINCT r.id_role, r.name_role
            FROM tb_user_role ur
            JOIN tb_role r ON ur.id_role = r.id_role
            WHERE ur.id_sync_nhan_vien = ?
            `,
            [user.id_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        // Get workshop-based permissions
        const workshopPermissions = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            `
            SELECT DISTINCT w.id_workshop, w.name_workshop
            FROM tb_user_workshop uw
            JOIN tb_workshop w ON uw.id_workshop = w.id_workshop
            WHERE uw.id_sync_nhan_vien = ?
            `,
            [user.id_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        // Combine all permissions
        user.permissions = {
          direct: directPermissions,
          byRole: rolePermissions,
          byWorkshop: workshopPermissions,
        };

        return user;
      } catch (error) {
        console.error(
          `Error fetching permissions for user ${user.id_nhan_vien}:`,
          error
        );
        user.permissions = { direct: [], byRole: [], byWorkshop: [] };
        return user;
      }
    });

    const usersWithPermissions = await Promise.all(userPromises);
    res.json(usersWithPermissions);
  } catch (error) {
    console.error("Error in user search:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all permissions
app.get("/api/tb_permission", authenticateToken, async (req, res) => {
  try {
    const permissions = await new Promise((resolve, reject) => {
      mysqlConnection.query(
        "SELECT id_permission, name_permission FROM tb_permission",
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    res.json(permissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all roles
app.get("/api/tb_role", authenticateToken, async (req, res) => {
  try {
    const roles = await new Promise((resolve, reject) => {
      mysqlConnection.query(
        "SELECT id_role, name_role FROM tb_role",
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all workshops
app.get("/api/tb_workshop", authenticateToken, async (req, res) => {
  try {
    const workshops = await new Promise((resolve, reject) => {
      mysqlConnection.query(
        "SELECT id_workshop, name_workshop FROM tb_workshop",
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    res.json(workshops);
  } catch (error) {
    console.error("Error fetching workshops:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all permissions for a specific user
app.get(
  "/api/users/:userId/all-permissions",
  authenticateToken,
  async (req, res) => {
    const userId = req.params.userId;

    try {
      // Get direct permissions
      const directPermissions = await new Promise((resolve, reject) => {
        mysqlConnection.query(
          `SELECT id_permission FROM tb_user_permission WHERE id_sync_nhan_vien = ?`,
          [userId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.map((r) => r.id_permission));
          }
        );
      });

      // Get role permissions
      const rolePermissions = await new Promise((resolve, reject) => {
        mysqlConnection.query(
          `SELECT id_role FROM tb_user_role WHERE id_sync_nhan_vien = ?`,
          [userId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.map((r) => r.id_role));
          }
        );
      });

      // Get workshop permissions
      const workshopPermissions = await new Promise((resolve, reject) => {
        mysqlConnection.query(
          `SELECT id_workshop FROM tb_user_workshop WHERE id_sync_nhan_vien = ?`,
          [userId],
          (err, results) => {
            if (err) reject(err);
            else resolve(results.map((r) => r.id_workshop));
          }
        );
      });

      res.json({
        direct: directPermissions,
        roles: rolePermissions,
        workshops: workshopPermissions,
      });
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
app.post(
  "/api/users/:userId/permissions",
  authenticateToken,
  async (req, res) => {
    const userId = req.params.userId;
    const { permissions, roles, workshops } = req.body;
    let connection = null;

    try {
      // Get connection
      connection = await new Promise((resolve, reject) => {
        mysqlConnection.getConnection((err, conn) => {
          if (err) reject(err);
          else resolve(conn);
        });
      });

      // Begin transaction
      await new Promise((resolve, reject) => {
        connection.beginTransaction((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Update permissions
      await Promise.all(
        [
          // Delete and insert direct permissions
          new Promise((resolve, reject) => {
            connection.query(
              "DELETE FROM tb_user_permission WHERE id_sync_nhan_vien = ?",
              [userId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }),
          permissions.length > 0 &&
            new Promise((resolve, reject) => {
              const values = permissions.map((permissionId) => [
                userId,
                permissionId,
              ]);
              connection.query(
                "INSERT INTO tb_user_permission (id_sync_nhan_vien, id_permission) VALUES ?",
                [values],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            }),

          // Delete and insert roles
          new Promise((resolve, reject) => {
            connection.query(
              "DELETE FROM tb_user_role WHERE id_sync_nhan_vien = ?",
              [userId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }),
          roles.length > 0 &&
            new Promise((resolve, reject) => {
              const values = roles.map((roleId) => [userId, roleId]);
              connection.query(
                "INSERT INTO tb_user_role (id_sync_nhan_vien, id_role) VALUES ?",
                [values],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            }),

          // Delete and insert workshops
          new Promise((resolve, reject) => {
            connection.query(
              "DELETE FROM tb_user_workshop WHERE id_sync_nhan_vien = ?",
              [userId],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          }),
          workshops.length > 0 &&
            new Promise((resolve, reject) => {
              const values = workshops.map((workshopId) => [
                userId,
                workshopId,
              ]);
              connection.query(
                "INSERT INTO tb_user_workshop (id_sync_nhan_vien, id_workshop) VALUES ?",
                [values],
                (err) => {
                  if (err) reject(err);
                  else resolve();
                }
              );
            }),
        ].filter(Boolean)
      );

      // Commit transaction
      await new Promise((resolve, reject) => {
        connection.commit((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user permissions:", error);
      if (connection) {
        try {
          await new Promise((resolve, reject) => {
            connection.rollback((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        } catch (rollbackError) {
          console.error("Error rolling back transaction:", rollbackError);
        }
      }
      res.status(500).json({ error: "Internal server error" });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
);

// Get all users
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    // First get list of users who have any permissions from main database
    const usersWithPermissions = await new Promise((resolve, reject) => {
      mysqlConnection.query(
        `
        SELECT DISTINCT id_sync_nhan_vien 
        FROM (
          SELECT id_sync_nhan_vien FROM tb_user_permission
          UNION
          SELECT id_sync_nhan_vien FROM tb_user_role
          UNION
          SELECT id_sync_nhan_vien FROM tb_user_workshop
        ) AS users_with_permissions
        WHERE id_sync_nhan_vien IS NOT NULL
        `,
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (usersWithPermissions.length === 0) {
      return res.json([]);
    }

    // Get user details for users who have permissions
    const userDetailsPromises = usersWithPermissions.map(async (permUser) => {
      try {
        // Get user details from HiTimesheet
        const [userDetails] = await new Promise((resolve, reject) => {
          dataHiTimesheetConnection.query(
            `
            SELECT 
              nv.id AS id_nhan_vien,
              nv.ma_nv,
              nv.ten_nv,
              nv.cong_viec_phu_trach,
              bp.ten_bo_phan
            FROM sync_nhan_vien nv
            LEFT JOIN sync_bo_phan bp ON nv.id_bo_phan = bp.id
            WHERE nv.id = ?
            AND bp.ten_bo_phan NOT LIKE '%NGHI VIEC%'
            AND bp.ten_bo_phan NOT LIKE '%NGHI DAI HAN%'
            AND bp.ten_bo_phan NOT LIKE '%NV%'
            AND bp.id_bo_phan NOT LIKE '%NV%'
            `,
            [permUser.id_sync_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        if (!userDetails) {
          return null;
        }

        // Get direct permissions
        const directPermissions = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            `
            SELECT DISTINCT p.id_permission, p.name_permission
            FROM tb_user_permission up
            JOIN tb_permission p ON up.id_permission = p.id_permission
            WHERE up.id_sync_nhan_vien = ?
            `,
            [permUser.id_sync_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        // Get role-based permissions
        const rolePermissions = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            `
            SELECT DISTINCT r.id_role, r.name_role
            FROM tb_user_role ur
            JOIN tb_role r ON ur.id_role = r.id_role
            WHERE ur.id_sync_nhan_vien = ?
            `,
            [permUser.id_sync_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        // Get workshop-based permissions
        const workshopPermissions = await new Promise((resolve, reject) => {
          mysqlConnection.query(
            `
            SELECT DISTINCT w.id_workshop, w.name_workshop
            FROM tb_user_workshop uw
            JOIN tb_workshop w ON uw.id_workshop = w.id_workshop
            WHERE uw.id_sync_nhan_vien = ?
            `,
            [permUser.id_sync_nhan_vien],
            (err, results) => {
              if (err) reject(err);
              else resolve(results);
            }
          );
        });

        return {
          ...userDetails,
          permissions: {
            direct: directPermissions,
            byRole: rolePermissions,
            byWorkshop: workshopPermissions,
          },
        };
      } catch (error) {
        console.error(
          `Error fetching details for user ${permUser.id_sync_nhan_vien}:`,
          error
        );
        return null;
      }
    });

    const finalUsers = (await Promise.all(userDetailsPromises)).filter(
      (user) => user !== null
    ); // Remove any failed user fetches

    res.json(finalUsers);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add this endpoint after other process-related endpoints
app.get("/api/processes/:id_process/roles", authenticateToken, (req, res) => {
  const { id_process } = req.params;

  mysqlConnection.query(
    `SELECT r.id_role, r.name_role 
     FROM tb_process_role pr
     JOIN tb_role r ON pr.id_role = r.id_role
     WHERE pr.id_process = ?
     ORDER BY r.name_role ASC`,
    [id_process],
    (err, results) => {
      if (err) {
        console.error("Error fetching process roles:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json(results);
    }
  );
});

////////////////////code của Anh Thư////////////////////
// CALENDAR: API lấy danh sách kế hoạch cho view calendar trong MAIN mysql
app.get("/api/plans-for-calendar-of-anh-thu", (req, res) => {
  const query = `
    SELECT id_plan, line, style, plan_date, actual_date, total_percent_rate
    FROM tb_plan
    WHERE inactive = 0 OR inactive IS NULL
    ORDER BY plan_date DESC
  `;

  const getWorkshop = (line) => {
    const lineNum = parseInt(line);
    if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
    if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
    if (lineNum >= 21 && lineNum <= 30) return 3;
    if (lineNum >= 31 && lineNum <= 40) return 4;
    return null;
  };

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching plans for calendar:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    const events = results.map((plan) => {
      // const endDate = new Date(plan.plan_date);
      // const startDate = new Date(endDate);
      // startDate.setDate(startDate.getDate() - 5);
      const startDate = new Date(plan.plan_date);
      const workshop = getWorkshop(plan.line);
      let backgroundColor, borderColor, textColor;

      // Assign colors based on workshop
      switch (workshop) {
        case 1:
          backgroundColor = "#FFC107"; // Workshop 1
          borderColor = "#025aa6"; // Darker shade for border
          textColor = "black";
          break;
        case 2:
          backgroundColor = "#007BFF"; // Workshop 2
          borderColor = "#00b374"; // Darker shade for border
          textColor = "white";
          break;
        case 3:
          backgroundColor = "#28A745"; // Workshop 3
          borderColor = "#130aa3"; // Darker shade for border
          textColor = "white";
          break;
        case 4:
          backgroundColor = "#EA7095"; // Workshop 4
          borderColor = "#2fb310"; // Darker shade for border
          textColor = "black";
          break;
        default:
          backgroundColor = "#808080"; // Grey for undefined workshop
          borderColor = "#666666";
          textColor = "white";
      }

      return {
        id: plan.id_plan,
        title: `C${plan.line}_${plan.style}`,
        start: startDate,
        // end: endDate,
        extendedProps: {
          line: plan.line,
          style: plan.style,
          plan_date: plan.plan_date,
          actual_date: plan.actual_date,
          total_percent_rate: plan.total_percent_rate || 0,
          workshop: workshop,
        },
        backgroundColor,
        borderColor,
        textColor,
      };
    });

    res.json(events);
  });
});

// PLAN: Đếm số lần chuyển đổi
app.get("/api/count-so-lan-chuyen-doi", (req, res) => {
  const query = `
    SELECT
      id_plan,
      line,
      style,
      plan_date,
      actual_date,
      COUNT(id_plan) AS Planned_Changeover,  -- Tổng số lần chuyển đổi đã được lên kế hoạch
      SUM(CASE WHEN actual_date IS NOT NULL THEN 1 ELSE 0 END) AS Actual_Changeover, -- Đếm những chuyển đổi đã thực hiện
      SUM(CASE WHEN actual_date IS NULL THEN 1 ELSE 0 END) AS Not_Yet_Changeover -- Đếm những chuyển đổi chưa thực hiện
    FROM tb_plan 
    WHERE inactive = 0 OR inactive IS NULL -- Chỉ lấy dữ liệu còn hoạt động
    GROUP BY id_plan, line, style, plan_date, actual_date
    ORDER BY plan_date DESC;
  `;

  const getWorkshop = (line) => {
    const lineNum = parseInt(line);
    if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
    if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
    if (lineNum >= 21 && lineNum <= 30) return 3;
    if (lineNum >= 31 && lineNum <= 40) return 4;
    return null;
  };

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data dem so lan chuyen doi:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    if (results.length === 0) {
      return res.json({ events: [] });
    }

    // Khởi tạo biến thống kê cho từng xưởng
    const workshopStats = {
      1: { planned_changeover: 0, actual_changeover: 0, not_yet_changeover: 0 },
      2: { planned_changeover: 0, actual_changeover: 0, not_yet_changeover: 0 },
      3: { planned_changeover: 0, actual_changeover: 0, not_yet_changeover: 0 },
      4: { planned_changeover: 0, actual_changeover: 0, not_yet_changeover: 0 },
    };

    // Duyệt qua từng kết quả trả về và xử lý
    const events = results.map((plan) => {
      // Xác định xưởng tương ứng với line
      const workshop = getWorkshop(plan.line);

      // Parse số liệu từ chuỗi sang số nguyên
      const actualChangeover = parseInt(plan.Actual_Changeover, 10) || 0;
      const notYetChangeover = parseInt(plan.Not_Yet_Changeover, 10) || 0;

      // Cộng dồn số liệu vào từng xưởng tương ứng
      if (workshop) {
        workshopStats[workshop].planned_changeover += plan.Planned_Changeover;
        workshopStats[workshop].actual_changeover += actualChangeover;
        workshopStats[workshop].not_yet_changeover += notYetChangeover;
      }

      return {
        id: plan.id_plan,
        start: new Date(plan.plan_date),
        extendedProps: {
          line: plan.line,
          style: plan.style,
          plan_date: plan.plan_date,
          actual_date: plan.actual_date,
          workshop: workshop,
          planned_changeover: plan.Planned_Changeover,
          actual_changeover: actualChangeover,
          not_yet_changeover: notYetChangeover,
        },
      };
    });

    res.json({
      events,
      workshopStats,
    });
  });
});

// PREPARATION: Đếm số lần chưa chuyển đổi
app.get("/api/count-so-lan-chua-chuyen-doi", (req, res) => {
  const query = `
    SELECT DISTINCT
    p.plan_date,
    p.line,
    p.style,
    CAST(COALESCE(p1.percent_rate, 0) AS DECIMAL(5,2)) AS process_1_percent,
    CAST(COALESCE(p2.percent_rate, 0) AS DECIMAL(5,2)) AS process_2_percent,
    CAST(COALESCE(p3.percent_rate, 0) AS DECIMAL(5,2)) AS process_3_percent,
    CAST(COALESCE(p4.percent_rate, 0) AS DECIMAL(5,2)) AS process_4_percent,
    CAST(
          ROUND(
              (COALESCE(
                  (SELECT AVG(prepare_rate)
                  FROM tb_process_5_preparing_machine pr
                  WHERE pr.id_plan = p.id_plan), 0) * 0.8) +
              (COALESCE(
                  (SELECT AVG(prepare_rate)
                  FROM tb_process_5_backup_machine b
                  WHERE b.id_plan = p.id_plan), 0) * 0.2)
              , 2)
          AS DECIMAL(5,2)) AS process_5_percent,
    CAST(COALESCE(p6.percent_rate, 0) AS DECIMAL(5,2)) AS process_6_percent,
    CAST(COALESCE(p7.percent_rate, 0) AS DECIMAL(5,2)) AS process_7_percent,
    CAST(COALESCE(p8.percent_rate, 0) AS DECIMAL(5,2)) AS process_8_percent

    FROM tb_plan p

    LEFT JOIN tb_process_1 p1 ON p.id_plan = p1.id_plan
    LEFT JOIN tb_process_2 p2 ON p.id_plan = p2.id_plan
    LEFT JOIN tb_process_3 p3 ON p.id_plan = p3.id_plan
    LEFT JOIN tb_process_4 p4 ON p.id_plan = p4.id_plan
    LEFT JOIN tb_process_6 p6 ON p.id_plan = p6.id_plan
    LEFT JOIN tb_process_7 p7 ON p.id_plan = p7.id_plan
    LEFT JOIN tb_process_8 p8 ON p.id_plan = p8.id_plan
    LEFT JOIN tb_process_5_backup_machine b ON p.id_plan = b.id_plan
    LEFT JOIN tb_process_5_preparing_machine pr ON p.id_plan = pr.id_plan
    WHERE actual_date IS NULL AND (p.inactive = 0 OR p.inactive IS NULL)
    ORDER BY p.plan_date DESC; 
  `;

  const getWorkshop = (line) => {
    const lineNum = parseInt(line);
    if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
    if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
    if (lineNum >= 21 && lineNum <= 30) return 3;
    if (lineNum >= 31 && lineNum <= 40) return 4;
    return null;
  };

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Ép kiểu các giá trị phần trăm từ chuỗi sang số
    const transformedResults = results.map((row) => {
      const process_1_percent = parseFloat(row.process_1_percent);
      const process_2_percent = parseFloat(row.process_2_percent);
      const process_3_percent = parseFloat(row.process_3_percent);
      const process_4_percent = parseFloat(row.process_4_percent);
      const process_5_percent = parseFloat(row.process_5_percent);
      const process_6_percent = parseFloat(row.process_6_percent);
      const process_7_percent = parseFloat(row.process_7_percent);
      const process_8_percent = parseFloat(row.process_8_percent);

      // Tính phần trăm trung bình của 8 công đoạn
      const avg_percent =
        (process_1_percent +
          process_2_percent +
          process_3_percent +
          process_4_percent +
          process_5_percent +
          process_6_percent +
          process_7_percent +
          process_8_percent) /
        8;

      return {
        start: row.plan_date,
        extendedProps: {
          line: row.line,
          style: row.style,
          process_1_percent: process_1_percent,
          process_2_percent: process_2_percent,
          process_3_percent: process_3_percent,
          process_4_percent: process_4_percent,
          process_5_percent: process_5_percent,
          process_6_percent: process_6_percent,
          process_7_percent: process_7_percent,
          process_8_percent: process_8_percent,
          avg_percent: Math.round(avg_percent),
          // Phân loại trạng thái: "ready" nếu >= 97.5%, ngược lại là "notYetReady"
          status: avg_percent >= 97.5 ? "ready" : "notYetReady",
          workshop: getWorkshop(row.line),
        },
      };
    });
    res.json({ events: transformedResults });
  });
});

// PREP RESULTS
app.get("/api/get-prep-results-data", (req, res) => {
  const query = `
    SELECT DISTINCT
      p.id_plan,
      p.actual_date,
      p.line,
      p.style,
      -- Tỷ lệ hoàn thành từng công đoạn, mặc định là 0 nếu không có dữ liệu
      CAST(COALESCE(p1.percent_rate, 0) AS DECIMAL(5,2)) AS process_1_percent,
      CAST(COALESCE(p2.percent_rate, 0) AS DECIMAL(5,2)) AS process_2_percent,
      CAST(COALESCE(p3.percent_rate, 0) AS DECIMAL(5,2)) AS process_3_percent,
      CAST(COALESCE(p4.percent_rate, 0) AS DECIMAL(5,2)) AS process_4_percent,
      CAST(
          ROUND(
              (COALESCE(
                  (SELECT AVG(prepare_rate)
                  FROM tb_process_5_preparing_machine pr
                  WHERE pr.id_plan = p.id_plan), 0) * 0.8) +
              (COALESCE(
                  (SELECT AVG(prepare_rate)
                  FROM tb_process_5_backup_machine b
                  WHERE b.id_plan = p.id_plan), 0) * 0.2)
              , 2)
          AS DECIMAL(5,2)) AS process_5_percent,
      CAST(COALESCE(p6.percent_rate, 0) AS DECIMAL(5,2)) AS process_6_percent,
      CAST(COALESCE(p7.percent_rate, 0) AS DECIMAL(5,2)) AS process_7_percent,
      CAST(COALESCE(p8.percent_rate, 0) AS DECIMAL(5,2)) AS process_8_percent
    FROM tb_plan p
    LEFT JOIN tb_process_1 p1 ON p.id_plan = p1.id_plan
    LEFT JOIN tb_process_2 p2 ON p.id_plan = p2.id_plan
    LEFT JOIN tb_process_3 p3 ON p.id_plan = p3.id_plan
    LEFT JOIN tb_process_4 p4 ON p.id_plan = p4.id_plan
    LEFT JOIN tb_process_6 p6 ON p.id_plan = p6.id_plan
    LEFT JOIN tb_process_7 p7 ON p.id_plan = p7.id_plan
    LEFT JOIN tb_process_8 p8 ON p.id_plan = p8.id_plan
    WHERE p.actual_date IS NOT NULL
      AND (p.inactive = 0 OR p.inactive IS NULL)
    ORDER BY p.actual_date DESC;
  `;

  const getWorkshop = (line) => {
    const lineNum = parseInt(line);
    if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
    if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
    if (lineNum >= 21 && lineNum <= 30) return 3;
    if (lineNum >= 31 && lineNum <= 40) return 4;
    return null;
  };

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    // Xử lý kết quả trả về: chuyển đổi, tính toán và phân loại
    const events = results.map((plan) => {
      const workshop = getWorkshop(plan.line);
      return {
        id: plan.id_plan,
        extendedProps: {
          line: plan.line,
          style: plan.style,
          actual_date: plan.actual_date,
          workshop: workshop,
          process_1_percent: Number(plan.process_1_percent),
          process_2_percent: Number(plan.process_2_percent),
          process_3_percent: Number(plan.process_3_percent),
          process_4_percent: Number(plan.process_4_percent),
          process_5_percent: Number(plan.process_5_percent),
          process_6_percent: Number(plan.process_6_percent),
          process_7_percent: Number(plan.process_7_percent),
          process_8_percent: Number(plan.process_8_percent),
        },
      };
    });
    res.json({
      events,
    });
  });
});

// COT, COPT & DOWNTIME
app.get("/api/get-cot-copt-downtime-data", (req, res) => {
  try {
    const getWorkshop = (line) => {
      const lineNum = parseInt(line);
      if ((lineNum >= 1 && lineNum <= 10) || lineNum === 1001) return 1;
      if ((lineNum >= 11 && lineNum <= 20) || lineNum === 2001) return 2;
      if (lineNum >= 21 && lineNum <= 30) return 3;
      if (lineNum >= 31 && lineNum <= 40) return 4;
      return null;
    };

    mysqlConnection.query(
      `SELECT 
        p.id_plan, p.line, p.style, 
        c.CO_begin_date, c.CO_end_date, 
        c.target_of_COPT, c.COPT, 
        c.target_of_COT, c.COT
      FROM tb_plan p 
      JOIN tb_co c ON p.id_plan = c.id_plan
			where CO_begin_date is not null and inactive is NULL or inactive=0`,
      (err, planResults) => {
        if (err) {
          console.error("Error fetching plan and CO data:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (planResults.length === 0) {
          return res.json([]);
        }

        // Khai báo các biến tổng và mảng kết quả
        const finalResults = [];
        let completedQueries = 0;
        let globalDowntime = 0;
        let globalWasteMan = 0;
        let totalChangeovers = 0;

        // Duyệt từng plan để truy vấn downtime tương ứng
        planResults.forEach((planData, index) => {
          const lineNumberStr = planData.line;
          const lineNumber = parseInt(lineNumberStr);
          const workshop = getWorkshop(lineNumber);

          planData.line = lineNumber;
          planData.workshop = workshop;

          // Tăng bộ đếm nếu có thời gian bắt đầu CO
          if (planData.CO_begin_date) {
            totalChangeovers++;
          }

          // Nếu thiếu thời gian bắt đầu / kết thúc CO => không cần truy downtime
          if (!planData.CO_begin_date || !planData.CO_end_date) {
            finalResults[index] = {
              ...planData,
              downtime_issues: [],
              total_downtime_minutes: 0,
              total_waste_man: 0,
            };
            completedQueries++;

            // Nếu tất cả plan đã xử lý xong, trả kết quả về
            if (completedQueries === planResults.length) {
              const validResults = finalResults.filter(Boolean);
              res.json({
                total_downtime_minutes_all: globalDowntime,
                total_waste_man_all: Math.round(globalWasteMan * 100) / 100,
                total_changeovers: totalChangeovers,
                data: validResults,
              });
            }
            return;
          }

          // Tạo điều kiện WHERE phù hợp với line
          let lineNumberCondition;
          let lineParams = [];

          // Line đặc biệt: 2001 có thể là "20.01", "20.01A", "20.01B"
          if (lineNumber === 2001) {
            const formattedLineBase = "20.01";
            lineNumberCondition =
              "(line_number = ? OR line_number = ? OR line_number = ?)";
            lineParams.push(
              `Tổ ${formattedLineBase}`,
              `Tổ ${formattedLineBase}A`,
              `Tổ ${formattedLineBase}B`
            );
          } else {
            lineNumberCondition = "line_number = ?";
            lineParams.push(`Tổ ${lineNumberStr}`);
          }

          // Tạo điều kiện LIKE với từng ký tự của product code
          const productCode = planData.style;
          const productCodeChars = productCode.split("");
          const productCodeConditions = productCodeChars
            .map(() => "new_product_code LIKE ?")
            .join(" OR ");
          const productCodeParams = productCodeChars.map((char) => `%${char}%`);

          // Tạo điều kiện thời gian
          const timeRangeCondition =
            "AND submission_time >= ? AND end_time <= ?";
          const params = [
            ...lineParams,
            ...productCodeParams,
            planData.CO_begin_date,
            planData.CO_end_date,
          ];

          // Truy vấn các issue downtime phù hợp với điều kiện
          const query = `
            SELECT 
              i.id_logged_issue,
              i.submission_time,
              i.line_number,
              i.station_number,
              i.id_category,
              c.name_category,
              i.machinery_type,
              i.machinery_code,
              i.issue_description,
              i.solution_description,
              i.problem_solver,
              i.responsible_person,
              i.end_time,
              i.downtime_minutes,
              i.old_product_code,
              i.new_product_code,
              i.workshop,
              i.factory,
              i.status_logged_issue
            FROM tb_logged_issue i
            LEFT JOIN tb_category c ON i.id_category = c.id_category
            WHERE ${lineNumberCondition}
              AND (${productCodeConditions})
              ${timeRangeCondition}
            ORDER BY i.submission_time ASC`;

          issueLoggerConnection.query(query, params, (err, issueResults) => {
            if (err) {
              console.error("Error fetching downtime issues:", err);
              finalResults[index] = {
                ...planData,
                downtime_issues: [],
                total_downtime_minutes: 0,
                total_waste_man: 0,
              };
            } else {
              // Tính toán thêm "waste man" từ downtime: downtime / 535 phút
              const issuesWithWaste = issueResults.map((issue) => {
                const downtime = issue.downtime_minutes || 0;
                const wasteMan = Math.round((downtime / 535) * 100) / 100;
                return {
                  ...issue,
                  waste_man: wasteMan,
                };
              });

              const totalDowntime = issueResults.reduce(
                (sum, issue) => sum + (issue.downtime_minutes || 0),
                0
              );

              const totalWasteMan = issuesWithWaste.reduce(
                (sum, issue) => sum + (issue.waste_man || 0),
                0
              );

              globalDowntime += totalDowntime;
              globalWasteMan += totalWasteMan;

              // Ghi lại kết quả
              finalResults[index] = {
                ...planData,
                downtime_issues: issuesWithWaste,
                total_downtime_minutes: totalDowntime,
                total_waste_man: Math.round(totalWasteMan * 100) / 100,
              };
            }
            completedQueries++;

            // Khi tất cả truy vấn con đã xong -> gửi toàn bộ kết quả
            if (completedQueries === planResults.length) {
              const validResults = finalResults.filter(Boolean);
              res.json({
                total_downtime_minutes_all: globalDowntime,
                total_waste_man_all: Math.round(globalWasteMan * 100) / 100,
                total_changeovers: totalChangeovers,
                data: validResults,
              });
            }
          });
        });
      }
    );
  } catch (error) {
    console.error("Error in plans with downtime endpoint:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// RAMP UP
app.get("/api/get-ramp-up-data", (req, res) => {
  const { date, workshop } = req.query;
  const filterWorkshop = workshop ? parseInt(workshop) : null;

  const query = `
    SELECT DISTINCT
      tb_co.eff_1 AS eff1, 
      tb_co.CO_begin_date, 
      p.line, 
      p.style,
      CAST(COALESCE(p1.percent_rate, 0) AS DECIMAL(5,2)) AS process_1_percent,
      CAST(COALESCE(p2.percent_rate, 0) AS DECIMAL(5,2)) AS process_2_percent,
      CAST(COALESCE(p3.percent_rate, 0) AS DECIMAL(5,2)) AS process_3_percent,
      CAST(COALESCE(p4.percent_rate, 0) AS DECIMAL(5,2)) AS process_4_percent,
      CAST(
          ROUND(
              (COALESCE(
                  (SELECT AVG(prepare_rate)
                  FROM tb_process_5_preparing_machine pr
                  WHERE pr.id_plan = p.id_plan), 0) * 0.8) +
              (COALESCE(
                  (SELECT AVG(prepare_rate)
                  FROM tb_process_5_backup_machine b
                  WHERE b.id_plan = p.id_plan), 0) * 0.2)
              , 2)
          AS DECIMAL(5,2)) AS process_5_percent,
      CAST(COALESCE(p6.percent_rate, 0) AS DECIMAL(5,2)) AS process_6_percent,
      CAST(COALESCE(p7.percent_rate, 0) AS DECIMAL(5,2)) AS process_7_percent,
      CAST(COALESCE(p8.percent_rate, 0) AS DECIMAL(5,2)) AS process_8_percent
    FROM tb_plan p
    JOIN tb_co ON p.id_plan = tb_co.id_plan
    LEFT JOIN tb_process_1 p1 ON p.id_plan = p1.id_plan
    LEFT JOIN tb_process_2 p2 ON p.id_plan = p2.id_plan
    LEFT JOIN tb_process_3 p3 ON p.id_plan = p3.id_plan
    LEFT JOIN tb_process_4 p4 ON p.id_plan = p4.id_plan
    LEFT JOIN tb_process_6 p6 ON p.id_plan = p6.id_plan
    LEFT JOIN tb_process_7 p7 ON p.id_plan = p7.id_plan
    LEFT JOIN tb_process_8 p8 ON p.id_plan = p8.id_plan
    LEFT JOIN tb_process_5_backup_machine b ON p.id_plan = b.id_plan
    LEFT JOIN tb_process_5_preparing_machine pr ON p.id_plan = pr.id_plan
    WHERE (p.inactive = 0 OR p.inactive IS NULL)
    ${date ? "AND DATE(tb_co.CO_begin_date) = ?" : ""}
    ORDER BY CO_begin_date DESC
  `;
  const params = date ? [date] : [];

  mysqlConnection.query(query, params, (err, rows) => {
    if (err) {
      console.error("MySQL error:", err);
      return res.status(500).json({ message: "MySQL query error" });
    }

    if (!rows.length) return res.json([]);

    sql.connect(mssqlHiproConfig, (err) => {
      if (err) {
        console.error("MSSQL connect error:", err.message || err);
        return res
          .status(500)
          .json({ message: "MSSQL connection error", detail: err.message });
      }

      const results = [];
      let completed = 0;

      rows.forEach((row, index) => {
        const line = row.line;
        const lineNum = parseInt(line);

        const getWorkshop = (lineNumber) => {
          if ((lineNumber >= 1 && lineNumber <= 10) || lineNumber === 1001)
            return 1;
          if ((lineNumber >= 11 && lineNumber <= 20) || lineNumber === 2001)
            return 2;
          if (lineNumber >= 21 && lineNumber <= 30) return 3;
          if (lineNumber >= 31 && lineNumber <= 40) return 4;
          return null;
        };

        const currentWorkshop = getWorkshop(lineNum);

        // Nếu truyền workshop và không trùng, bỏ qua record này
        if (filterWorkshop && currentWorkshop !== filterWorkshop) {
          completed++;
          if (completed === rows.length) {
            sql.close();
            res.json(results);
          }
          return;
        }

        const style = row.style;
        const eff1 = row.eff1 || 0;
        const coBeginDate = row.CO_begin_date
          ? new Date(row.CO_begin_date)
          : null;

        // Tính trung bình 8 bước
        const eightStepAvg = Math.round(
          (Number(row.process_1_percent) +
            Number(row.process_2_percent) +
            Number(row.process_3_percent) +
            Number(row.process_4_percent) +
            Number(row.process_5_percent) +
            Number(row.process_6_percent) +
            Number(row.process_7_percent) +
            Number(row.process_8_percent)) /
            8
        );

        const dates = [];
        const start = new Date(coBeginDate);
        start.setDate(start.getDate() + 1);

        while (dates.length < 6) {
          if (start.getDay() !== 0) dates.push(new Date(start));
          start.setDate(start.getDate() + 1);
        }

        const effRest = []; // hiệu suất các ngày sau CO
        let subCompleted = 0;

        // Chỉ lấy 4 ngày đầu để kiểm tra hiệu suất sau CO
        dates.slice(0, 4).forEach((d, i) => {
          const dateStr = d.toISOString().split("T")[0];
          const query = `SELECT line${lineNum} FROM BaoCao_NangSuat_Ngay WHERE CAST(Ngay AS DATE) = '${dateStr}' ORDER BY STT`;

          const request = new sql.Request();
          request.query(query, (err, result) => {
            if (err || !result.recordset) {
              effRest[i] = 0;
            } else {
              const records = result.recordset;
              const first = records[0]?.[`line${lineNum}`];

              // Nếu dòng đầu tiên chứa mã hàng đúng, lấy hiệu suất ở dòng 20 (dòng 19)
              if (first && first.includes(style)) {
                effRest[i] = parseInt(records[19]?.[`line${lineNum}`]) || 0;
              } else {
                effRest[i] = 0;
              }
            }

            subCompleted++;
            if (subCompleted === 4) {
              // Khi đã xử lý xong 4 ngày, thêm vào kết quả
              results[index] = {
                line: lineNum,
                style,
                coBeginDate,
                workshop: currentWorkshop,
                eff: [eff1, ...effRest], // eff1 + 4 ngày sau
                prep: eightStepAvg, // trung bình phần trăm 8 bước chuẩn bị
              };

              completed++;
              if (completed === rows.length) {
                sql.close();
                res.json(results);
              }
            }
          });
        });
      });
    });
  });
});
////////////////////code của Anh Thư////////////////////

const PORT = process.env.MYSQL_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
