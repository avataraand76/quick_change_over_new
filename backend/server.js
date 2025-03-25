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
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    port: parseInt(process.env.MSSQL_HIPRO_PORT),
  },
};

// MSSQL Configuration for HiGMF database
const mssqlHigmfConfig = {
  user: process.env.MSSQL_HGM_USER,
  password: process.env.MSSQL_HGM_PASSWORD,
  database: process.env.MSSQL_HGM_DATABASE,
  server: process.env.MSSQL_HGM_HOST,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    port: parseInt(process.env.MSSQL_HGM_PORT),
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

// test MSSQL Hipro connection
sql
  .connect(mssqlHiproConfig)
  .then(() => {
    console.log("Successfully connected to MSSQL HiPro database");
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL:", err);
  });

// test MSSQL Higmf connection
sql
  .connect(mssqlHigmfConfig)
  .then(() => {
    console.log("Successfully connected to MSSQL HiGMF database");
  })
  .catch((err) => {
    console.error("Error connecting to MSSQL:", err);
  });

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
  try {
    const pool = await sql.connect(mssqlHigmfConfig);
    const result = await pool.request().query(`
      WITH GetData AS (
        SELECT 
          kht.KHTId,
          dh.MaHang, 
          cc.MaCum, 
          kht.SoLuong, 
          kht.NgayVaoChuyenKeHoachBatDau,
          kht.NgayVaoChuyenKeHoachKetThuc,
          ROW_NUMBER() OVER (PARTITION BY dh.MaHang, cc.MaCum 
                            ORDER BY kht.NgayVaoChuyenKeHoachBatDau ASC, 
                                    DATEDIFF(HOUR, kht.NgayVaoChuyenKeHoachBatDau, kht.NgayVaoChuyenKeHoachKetThuc) DESC) AS RowNum
        FROM [eGMF].[dbo].[OMM_DonHang] dh
        LEFT JOIN [eGMF].[dbo].[OMM_PO] po ON dh.DHId = po.DHId
        LEFT JOIN [eGMF].[dbo].[OMM_PO_ChiTiet] poct ON poct.POId = po.POId
        LEFT JOIN [eGMF].[dbo].[OMM_KeHoachThang] kht ON kht.CTPOId = poct.POCTId
        LEFT JOIN [eGMF].[dbo].[Lib_CumChuyen] cc ON kht.ChuyenId = cc.CumId
        WHERE 
          cc.CumId IS NOT NULL
          AND kht.NgayVaoChuyenKeHoachBatDau IS NOT NULL
          AND kht.NgayVaoChuyenKeHoachBatDau BETWEEN DATEADD(MONTH, -2, GETDATE()) AND DATEADD(MONTH, 2, GETDATE())
      ),
      FilteredData AS (
        SELECT 
          KHTId,
          MaHang, 
          MaCum, 
          SoLuong, 
          NgayVaoChuyenKeHoachBatDau,
          NgayVaoChuyenKeHoachKetThuc,
          RowNum,
          LAG(NgayVaoChuyenKeHoachBatDau) OVER (PARTITION BY MaHang, MaCum 
                                                ORDER BY NgayVaoChuyenKeHoachBatDau ASC) AS Prev_NgayBatDau,
          LAG(NgayVaoChuyenKeHoachKetThuc) OVER (PARTITION BY MaHang, MaCum 
                                                ORDER BY NgayVaoChuyenKeHoachBatDau ASC) AS Prev_NgayKetThuc
        FROM GetData
      ),
      FinalFiltered AS (
        SELECT 
          KHTId,
          MaHang, 
          MaCum, 
          SoLuong, 
          NgayVaoChuyenKeHoachBatDau,
          NgayVaoChuyenKeHoachKetThuc
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
        MaCum as line, 
        SoLuong as quantity,
        NgayVaoChuyenKeHoachBatDau as plan_date,
        NgayVaoChuyenKeHoachKetThuc as plan_end_date
      FROM FinalFiltered
      ORDER BY MaCum, NgayVaoChuyenKeHoachBatDau ASC
    `);

    // Format dates in the response
    const formattedResults = result.recordset.map((record) => ({
      ...record,
      KHTId: record.KHTId.toString(),
      plan_date: record.plan_date ? formatDate(record.plan_date) : null,
      plan_end_date: record.plan_end_date
        ? formatDate(record.plan_end_date)
        : null,
    }));

    res.json(formattedResults);
  } catch (err) {
    console.error("Error fetching HiGMF lines and styles:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// API tạo kế hoạch để sử dụng middleware trong MAIN mysql
app.post("/api/create-plan", authenticateToken, (req, res) => {
  const { KHTId, line, style, quantity, plan_date, actual_date } = req.body;

  // Lấy ma_nv từ token đã được decode trong middleware
  const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

  // Use a transaction to ensure all inserts succeed or fail together
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

      // Insert into tb_plan first to get the id_plan
      connection.query(
        "INSERT INTO tb_plan (KHTId, line, style, quantity, plan_date, actual_date, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [KHTId, line, style, quantity, plan_date, actual_date, updated_by],
        (err, planResults) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              console.error("Error creating plan:", err);
              res
                .status(500)
                .json({ success: false, message: "Database error" });
            });
          }

          const id_plan = planResults.insertId;

          // Insert into tb_co with the new id_plan
          connection.query(
            "INSERT INTO tb_co (id_plan, updated_by, CO_begin_date) VALUES (?, ?, ?)",
            [id_plan, updated_by, actual_date],
            (err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  console.error("Error creating CO record:", err);
                  res
                    .status(500)
                    .json({ success: false, message: "Database error" });
                });
              }

              // Get all process IDs
              connection.query(
                "SELECT id_process FROM tb_process ORDER BY id_process ASC",
                (err, processResults) => {
                  if (err) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error fetching processes:", err);
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
                    });
                  }

                  // Create an array to store all insert queries
                  const insertQueries = [];

                  // For each process, insert into the corresponding process table
                  processResults.forEach((process) => {
                    const id_process = process.id_process;

                    // Process 1-4 and 6-8 have the same structure
                    if ([1, 2, 3, 4, 6, 7, 8].includes(id_process)) {
                      insertQueries.push(
                        new Promise((resolve, reject) => {
                          connection.query(
                            `INSERT INTO tb_process_${id_process} (id_process, id_plan, updated_by) VALUES (?, ?, ?)`,
                            [id_process, id_plan, updated_by],
                            (err) => {
                              if (err) {
                                reject(err);
                              } else {
                                resolve();
                              }
                            }
                          );
                        })
                      );
                    }
                    // Process 5 has two special tables
                    else if (id_process === 5) {
                      // No insertions to tb_process_5_preparing_machine and tb_process_5_backup_machine for process 5
                      // Just resolve the promise immediately
                      insertQueries.push(Promise.resolve());
                    }
                  });

                  // Execute all insert queries
                  Promise.all(insertQueries)
                    .then(() => {
                      // Create log entry for plan creation
                      const history_log = `${updated_by} vừa TẠO KẾ HOẠCH chuyền: [${line}], mã hàng: [${style}], thời gian dự kiến: [${formatDate(
                        plan_date
                      )}], thời gian thực tế: [${formatDate(actual_date)}]`;

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

                          // Commit the transaction if all inserts succeed
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
                                "Plan created successfully with all related process records",
                              id_plan: id_plan,
                            });
                          });
                        }
                      );
                    })
                    .catch((err) => {
                      return connection.rollback(() => {
                        connection.release();
                        console.error("Error inserting process records:", err);
                        res
                          .status(500)
                          .json({ success: false, message: "Database error" });
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

// API lấy danh sách kế hoạch cho view calendar trong MAIN mysql
app.get("/api/plans-for-calendar", authenticateToken, (req, res) => {
  const query = `
    SELECT id_plan, line, style, plan_date, actual_date, total_percent_rate
    FROM tb_plan
    ORDER BY plan_date DESC
  `;

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching plans for calendar:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    // Format the data for calendar events
    const events = results.map((plan) => {
      // Calculate start date (plan_date - 5 days)
      const endDate = new Date(plan.plan_date);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 5);

      // Calculate how close we are to the deadline
      const now = new Date();
      const daysUntilDeadline = Math.floor(
        (endDate - now) / (1000 * 60 * 60 * 24)
      );

      // Determine color based on urgency
      let backgroundColor, borderColor;
      if (daysUntilDeadline < 0) {
        // Past deadline
        backgroundColor = "#e57373"; // light red
        borderColor = "#d32f2f";
      } else if (daysUntilDeadline <= 3) {
        // Very urgent (3 days or less)
        backgroundColor = "#ff7043"; // Coral
        borderColor = "#f4511e";
      } else {
        // Generate consistent color based on line and style
        const colors = [
          "#2196F3", // Blue
          "#9C27B0", // Purple
          "#FF9800", // Orange
          "#00BCD4", // Cyan
          "#795548", // Brown
          "#009688", // Teal
          "#673AB7", // Deep Purple
          "#3F51B5", // Indigo
        ];

        // Create a simple hash from line and style
        const hashString = `${plan.line}-${plan.style}`;
        let hash = 0;
        for (let i = 0; i < hashString.length; i++) {
          hash = (hash << 5) - hash + hashString.charCodeAt(i);
          hash = hash & hash; // Convert to 32-bit integer
        }

        // Use absolute value of hash to get consistent index
        const colorIndex = Math.abs(hash) % colors.length;
        backgroundColor = colors[colorIndex];
        borderColor = colors[colorIndex];
      }

      return {
        id: plan.id_plan,
        title: `Chuyền: ${plan.line} - Mã hàng: ${plan.style}`,
        start: startDate,
        end: endDate,
        extendedProps: {
          line: plan.line,
          style: plan.style,
          daysUntilDeadline,
          plan_date: plan.plan_date,
          actual_date: plan.actual_date,
          total_percent_rate: plan.total_percent_rate || 0,
        },
        backgroundColor,
        borderColor,
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

          // Update the plan with new dates and updated_by
          connection.query(
            "UPDATE tb_plan SET plan_date = ?, actual_date = ?, updated_by = ? WHERE id_plan = ?",
            [plan_date, actual_date, updated_by, id],
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
                [actual_date, updated_by, id],
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
              console.error("Error fetching plan data for log:", err);
              res.status(500).json({
                success: false,
                message: "Database error",
              });
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

                    // Calculate the average of both rates
                    const avgRate =
                      (parseFloat(preparingRate) + parseFloat(backupRate)) / 2;

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

          issueLoggerConnection.query(query, params, (err, results) => {
            if (err) {
              console.error("Error fetching downtime issues:", err);
              return res
                .status(500)
                .json({ success: false, message: "Database error" });
            }

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

                  // Calculate the average of both rates
                  const avgRate =
                    (parseFloat(preparingRate) + parseFloat(backupRate)) / 2;

                  resolve(Math.round(avgRate));
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
      // Calculate average of all process rates
      const totalRates = rates.reduce((sum, rate) => sum + rate, 0);
      const avgRate = Math.round(totalRates / rates.length);

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
                        res
                          .status(500)
                          .json({ success: false, message: "Database error" });
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

// Process 5 Hi-Line data synchronization endpoint
app.post(
  "/api/process5/sync-machines-from-hiline",
  authenticateToken,
  async (req, res) => {
    const { id_plan, line, style } = req.body;

    // Get user info from token for logging
    const updated_by = req.user.ma_nv + ": " + req.user.ten_nv;

    try {
      // Connect to MSSQL
      const pool = await sql.connect(mssqlHiproConfig);

      // Execute the query with parameterized inputs for safety
      const result = await pool
        .request()
        .input("mahang", sql.VarChar, style)
        .input("chuyen", sql.VarChar, line).query(`
          SELECT DISTINCT
            ctp.ThietBi as [oid_thietbi],
            cltb.TenChungLoai as [ten_may],
            ctp.SoLuongTrenSDC as [so_luong_may]
          FROM [HiPro].[dbo].[ChiTietPhieuYeuCauThietBiCongCuSanXuat] ctp
          INNER JOIN [HiPro].[dbo].[PhieuYeuCauThietBiCongCuSanXuat] p
            ON ctp.idPhieu = p.id
          INNER JOIN [HiPro].[dbo].[NV_SoDoChuyen] sdc
            ON p.OidSoDoChuyen = sdc.Oid
          INNER JOIN [HiPro].[dbo].[NV_QuiTrinhCongNghe] qtcn 
            ON sdc.QuiTrinh = qtcn.Oid
          INNER JOIN [HiPro].[dbo].[DM_SanPham] sp 
            ON qtcn.SanPham = sp.Oid
          INNER JOIN [HiPro].[dbo].[pro_chuyen] c
            ON c.oid_mapping = sdc.Chuyen
          LEFT JOIN [HiPro].[dbo].[DM_ChungLoaiThietBi] cltb
            ON ctp.ThietBi = cltb.Oid
          WHERE sp.MaSanPham = @mahang 
            AND c.stt = @chuyen
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
    fileSize: 50 * 1024 * 1024, // 50MB limit
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

const PORT = process.env.MYSQL_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
