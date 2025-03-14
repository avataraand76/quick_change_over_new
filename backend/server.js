// backend/server.js

const express = require("express");
const sql = require("mssql");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const { google } = require("googleapis");
const { Readable } = require("stream");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MSSQL Configuration
const mssqlConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  database: process.env.MSSQL_DATABASE,
  server: process.env.MSSQL_HOST,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    port: parseInt(process.env.MSSQL_PORT),
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

// test MSSQL connection
sql
  .connect(mssqlConfig)
  .then(() => {
    console.log("Successfully connected to MSSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL:", err);
  });

// Thêm middleware xác thực JWT
const authenticateToken = (req, res, next) => {
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
        const token = jwt.sign(
          {
            id: user.id,
            ma_nv: user.ma_nv,
            ten_nv: user.ten_nv,
          },
          process.env.JWT_SECRET
        );
        res.json({
          success: true,
          token,
          user: {
            ma_nv: user.ma_nv,
            ten_nv: user.ten_nv,
          },
        });
      });
    }
  );
});

// API lấy thông tin chuyền và mã hàng từ MSSQL
app.get("/api/lines-styles", authenticateToken, async (req, res) => {
  try {
    const pool = await sql.connect(mssqlConfig);
    const result = await pool.request().query(`
      SELECT DISTINCT
        c.oid_mapping AS [OID cua Line], 
        c.stt AS [stt cua line],
        sp.oid AS [OID cua ma hang],
        sp.MaSanPham AS [ma hang]
      FROM [HiPro].[dbo].[pro_chuyen] c
      LEFT JOIN [HiPro].[dbo].[NV_SoDoChuyen] sdc ON c.oid_mapping = sdc.Chuyen
      LEFT JOIN [HiPro].[dbo].[NV_QuiTrinhCongNghe] qtcn ON sdc.QuiTrinh = qtcn.Oid
      LEFT JOIN [HiPro].[dbo].[DM_SanPham] sp ON qtcn.SanPham = sp.Oid
      WHERE c.stt IS NOT NULL  -- Chỉ lấy các chuyền có số thứ tự
        AND sp.MaSanPham IS NOT NULL  -- Chỉ lấy các mã hàng có giá trị
      ORDER BY 
        c.stt ASC,            -- Sắp xếp chuyền theo thứ tự tăng dần
        sp.MaSanPham ASC      -- Sắp xếp mã hàng theo alphabet
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching lines and styles:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// API tạo kế hoạch để sử dụng middleware trong MAIN mysql
app.post("/api/create-plan", authenticateToken, (req, res) => {
  const { SQL_oid_line, line, SQL_oid_ma_hang, style, plan_date, actual_date } =
    req.body;

  // Lấy ma_nv từ token đã được decode trong middleware
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  mysqlConnection.query(
    "INSERT INTO tb_plan (SQL_oid_line, line, SQL_oid_ma_hang, style, plan_date, actual_date, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      SQL_oid_line,
      line,
      SQL_oid_ma_hang,
      style,
      plan_date,
      actual_date,
      updated_by,
    ],
    (err, results) => {
      if (err) {
        console.error("Error creating plan:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Plan created successfully" });
    }
  );
});

// API lấy danh sách kế hoạch trong MAIN mysql
app.get("/api/plans", authenticateToken, (req, res) => {
  mysqlConnection.query(
    `SELECT * FROM tb_plan ORDER BY created_at DESC`,
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
      res.json(results[0]);
    }
  );
});

// API cập nhật thời gian kế hoạch theo id trong MAIN mysql
app.put("/api/plans/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { plan_date, actual_date } = req.body;

  mysqlConnection.query(
    "UPDATE tb_plan SET plan_date = ?, actual_date = ? WHERE id_plan = ?",
    [plan_date, actual_date, id],
    (err, results) => {
      if (err) {
        console.error("Error updating plan:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Plan updated successfully" });
    }
  );
});

// API cập nhật thời gian theo id trong MAIN mysql
app.put("/api/plans/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { plan_date, actual_date } = req.body;

  mysqlConnection.query(
    "UPDATE tb_plan SET plan_date = ?, actual_date = ? WHERE id_plan = ?",
    [plan_date, actual_date, id],
    (err, results) => {
      if (err) {
        console.error("Error updating plan:", err);
        return res
          .status(500)
          .json({ success: false, message: "Database error" });
      }
      res.json({ success: true, message: "Plan updated successfully" });
    }
  );
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

const PORT = process.env.MYSQL_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
