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
      WHERE c.stt IS NOT NULL
        AND sp.MaSanPham IS NOT NULL
      ORDER BY 
        c.stt ASC,
        sp.MaSanPham ASC
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
                      // Insert into tb_process_5_preparing_machine
                      insertQueries.push(
                        new Promise((resolve, reject) => {
                          connection.query(
                            "INSERT INTO tb_process_5_preparing_machine (id_process, id_plan, updated_by) VALUES (?, ?, ?)",
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

                      // Insert into tb_process_5_preventive_machine
                      insertQueries.push(
                        new Promise((resolve, reject) => {
                          connection.query(
                            "INSERT INTO tb_process_5_preventive_machine (id_process, id_plan, updated_by) VALUES (?, ?, ?)",
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
                `SELECT AVG(prepare_rate) as avg_rate FROM tb_process_5_preventive_machine WHERE id_plan = ?`,
                [id_plan],
                (err, preventiveResults) => {
                  if (err) {
                    reject(err);
                  } else {
                    // Get the average rates, default to 0 if null
                    const preparingRate =
                      preparingResults.length > 0
                        ? preparingResults[0].avg_rate || 0
                        : 0;
                    const preventiveRate =
                      preventiveResults.length > 0
                        ? preventiveResults[0].avg_rate || 0
                        : 0;

                    // Calculate the average of both rates
                    const avgRate =
                      (parseFloat(preparingRate) + parseFloat(preventiveRate)) /
                      2;

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

// Setup Google Drive API
let drive;

// Initialize Google Drive API client
const initDriveClient = async () => {
  try {
    // Sử dụng OAuth2 thay vì Service Account
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Đặt credentials với refresh token từ .env
    oauth2Client.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    drive = google.drive({ version: "v3", auth: oauth2Client });
    console.log("Google Drive API client initialized successfully with OAuth2");
  } catch (error) {
    console.error("Error initializing Google Drive API client:", error);
  }
};

// Call the init function when server starts
initDriveClient();

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

// Upload documentation file to Google Drive and update tb_process_1
app.post(
  "/api/process1/upload-documentation",
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

      const planQuery =
        "SELECT p.line, p.style, proc.documentation FROM tb_plan p JOIN tb_process_1 proc ON p.id_plan = proc.id_plan WHERE p.id_plan = ?";

      mysqlConnection.query(planQuery, [id_plan], async (err, planResults) => {
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

        const { line, style, documentation } = planResults[0];

        try {
          const newDocUrls = [];

          const uploadPromises = files.map(async (file) => {
            const fileStream = new Readable();
            fileStream.push(file.buffer);
            fileStream.push(null);

            const fileName = file.originalname; // Keep original filename

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
              fields: "webViewLink, webContentLink", // Add webContentLink for direct viewing
            });

            return {
              url: getFileResponse.data.webViewLink,
              directUrl: getFileResponse.data.webContentLink,
              filename: fileName,
            };
          });

          const uploadResults = await Promise.all(uploadPromises);
          newDocUrls.push(...uploadResults);

          let updatedDocumentation;
          if (documentation && documentation.trim() !== "") {
            updatedDocumentation = `${documentation}; ${newDocUrls
              .map(
                (result) =>
                  `${result.url}|${result.directUrl}|${result.filename}`
              )
              .join("; ")}`;
          } else {
            updatedDocumentation = newDocUrls
              .map(
                (result) =>
                  `${result.url}|${result.directUrl}|${result.filename}`
              )
              .join("; ");
          }

          mysqlConnection.getConnection((connErr, connection) => {
            if (connErr) {
              console.error("Error getting connection:", connErr);
              return res
                .status(500)
                .json({ success: false, message: "Database connection error" });
            }

            connection.beginTransaction((transErr) => {
              if (transErr) {
                connection.release();
                console.error("Error starting transaction:", transErr);
                return res
                  .status(500)
                  .json({ success: false, message: "Transaction error" });
              }

              connection.query(
                "UPDATE tb_process_1 SET documentation = ?, percent_rate = 100, updated_by = ? WHERE id_plan = ?",
                [updatedDocumentation, updated_by, id_plan],
                (updateErr) => {
                  if (updateErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating documentation:", updateErr);
                      res.status(500).json({
                        success: false,
                        message: "Database update error",
                      });
                    });
                  }

                  const fileNames = files
                    .map((file) => file.originalname)
                    .join(", ");
                  const history_log = `${updated_by} đã tải lên ${files.length} tài liệu minh chứng [${fileNames}] cho quy trình 1 (Nghiên cứu mẫu gốc) của chuyền [${line}], mã hàng [${style}] và đã hoàn thành 100% quy trình`;

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
      });
    } catch (error) {
      console.error("Server error during file upload:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Delete documentation file entry
app.delete(
  "/api/process1/delete-documentation/:id_plan",
  authenticateToken,
  async (req, res) => {
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
      "SELECT documentation FROM tb_process_1 WHERE id_plan = ?",
      [id_plan],
      async (err, results) => {
        if (err) {
          console.error("Error fetching documentation:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Process not found" });
        }

        const { documentation } = results[0];

        if (!documentation) {
          return res.status(404).json({ message: "No documentation found" });
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

              // Update the documentation field and conditionally set percent_rate
              const percentRate = newDocumentation ? 100 : 0;

              connection.query(
                "UPDATE tb_process_1 SET documentation = ?, percent_rate = ?, updated_by = ? WHERE id_plan = ?",
                [newDocumentation, percentRate, updated_by, id_plan],
                (updateErr) => {
                  if (updateErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error("Error updating documentation:", updateErr);
                      res.status(500).json({
                        success: false,
                        message: "Database update error",
                      });
                    });
                  }

                  // Log the action using format consistent with other logs
                  const history_log = `${updated_by} đã xóa tài liệu minh chứng từ quy trình 1 (Nghiên cứu mẫu gốc)`;

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
                              message: "Commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message: "Documentation file deleted successfully",
                          documentation: newDocumentation,
                        });
                      });
                    }
                  );
                }
              );
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
  }
);

// Get documentation files for Process 1
app.get(
  "/api/process1/documentation/:id_plan",
  authenticateToken,
  (req, res) => {
    const { id_plan } = req.params;

    mysqlConnection.query(
      "SELECT documentation FROM tb_process_1 WHERE id_plan = ?",
      [id_plan],
      (err, results) => {
        if (err) {
          console.error("Error fetching documentation:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Process not found" });
        }

        const { documentation } = results[0];

        // If no documentation, return empty array
        if (!documentation) {
          return res.json({ files: [] });
        }

        // Split documentation by "; " and parse each entry
        const files = documentation.split("; ").map((doc, index) => {
          const [url, directUrl, filename] = doc.split("|");
          return {
            id: index,
            url: url,
            directUrl: directUrl || url,
            filename: filename || "Unknown File",
          };
        });

        res.json({ files });
      }
    );
  }
);

// Upload A3 documentation file to Google Drive and update tb_process_1
app.post(
  "/api/process1/upload-a3-documentation",
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

      const planQuery =
        "SELECT p.line, p.style, proc.A3_documentation FROM tb_plan p JOIN tb_process_1 proc ON p.id_plan = proc.id_plan WHERE p.id_plan = ?";
      mysqlConnection.query(planQuery, [id_plan], async (err, planResults) => {
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

        const { line, style, A3_documentation } = planResults[0];

        try {
          const newA3Urls = [];

          const uploadPromises = files.map(async (file) => {
            const fileStream = new Readable();
            fileStream.push(file.buffer);
            fileStream.push(null);

            const fileName = file.originalname; // Keep original filename

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
              fields: "webViewLink, webContentLink", // Add webContentLink for direct viewing
            });

            return {
              url: getFileResponse.data.webViewLink,
              directUrl: getFileResponse.data.webContentLink,
              filename: fileName,
            };
          });

          const uploadResults = await Promise.all(uploadPromises);
          newA3Urls.push(...uploadResults);

          let updatedA3Documentation;
          if (A3_documentation && A3_documentation.trim() !== "") {
            updatedA3Documentation = `${A3_documentation}; ${newA3Urls
              .map(
                (result) =>
                  `${result.url}|${result.directUrl}|${result.filename}`
              )
              .join("; ")}`;
          } else {
            updatedA3Documentation = newA3Urls
              .map(
                (result) =>
                  `${result.url}|${result.directUrl}|${result.filename}`
              )
              .join("; ");
          }

          mysqlConnection.getConnection((connErr, connection) => {
            if (connErr) {
              console.error("Error getting connection:", connErr);
              return res
                .status(500)
                .json({ success: false, message: "Database connection error" });
            }

            connection.beginTransaction((transErr) => {
              if (transErr) {
                connection.release();
                console.error("Error starting transaction:", transErr);
                return res
                  .status(500)
                  .json({ success: false, message: "Transaction error" });
              }

              connection.query(
                "UPDATE tb_process_1 SET A3_documentation = ?, updated_by = ? WHERE id_plan = ?",
                [updatedA3Documentation, updated_by, id_plan],
                (updateErr) => {
                  if (updateErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error(
                        "Error updating A3 documentation:",
                        updateErr
                      );
                      res.status(500).json({
                        success: false,
                        message: "Database update error",
                      });
                    });
                  }

                  const fileNames = files
                    .map((file) => file.originalname)
                    .join(", ");
                  const history_log = `${updated_by} đã tải lên ${files.length} tài liệu A3 khắc phục [${fileNames}] cho quy trình 1 (Nghiên cứu mẫu gốc) của chuyền [${line}], mã hàng [${style}]`;

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
                          message: `${files.length} A3 files uploaded successfully`,
                          updatedA3Documentation,
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
      });
    } catch (error) {
      console.error("Server error during file upload:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get A3 documentation files for Process 1
app.get(
  "/api/process1/a3-documentation/:id_plan",
  authenticateToken,
  (req, res) => {
    const { id_plan } = req.params;

    mysqlConnection.query(
      "SELECT A3_documentation FROM tb_process_1 WHERE id_plan = ?",
      [id_plan],
      (err, results) => {
        if (err) {
          console.error("Error fetching A3 documentation:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Process not found" });
        }

        const { A3_documentation } = results[0];

        // If no documentation, return empty array
        if (!A3_documentation) {
          return res.json({ files: [] });
        }

        // Split documentation by "; " and parse each entry
        const files = A3_documentation.split("; ").map((doc, index) => {
          const [url, directUrl, filename] = doc.split("|");
          return {
            id: index,
            url: url,
            directUrl: directUrl || url,
            filename: filename || "Unknown File",
          };
        });

        res.json({ files });
      }
    );
  }
);

// Delete an A3 documentation file from Process 1
app.delete(
  "/api/process1/delete-a3-documentation/:id_plan",
  authenticateToken,
  async (req, res) => {
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

    // Get the current A3 documentation
    mysqlConnection.query(
      "SELECT A3_documentation FROM tb_process_1 WHERE id_plan = ?",
      [id_plan],
      async (err, results) => {
        if (err) {
          console.error("Error fetching A3 documentation:", err);
          return res
            .status(500)
            .json({ success: false, message: "Database error" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ success: false, message: "Process not found" });
        }

        const { A3_documentation } = results[0];

        if (!A3_documentation) {
          return res.status(404).json({ message: "No A3 documentation found" });
        }

        // Split the documentation string and remove the specified entry
        const documentationEntries = A3_documentation.split("; ");

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

              // Update the documentation field
              connection.query(
                "UPDATE tb_process_1 SET A3_documentation = ?, updated_by = ? WHERE id_plan = ?",
                [newDocumentation, updated_by, id_plan],
                (updateErr) => {
                  if (updateErr) {
                    return connection.rollback(() => {
                      connection.release();
                      console.error(
                        "Error updating A3 documentation:",
                        updateErr
                      );
                      res.status(500).json({
                        success: false,
                        message: "Database update error",
                      });
                    });
                  }

                  // Log the action using format consistent with other logs
                  const history_log = `${updated_by} đã xóa tài liệu A3 khắc phục từ quy trình 1 (Nghiên cứu mẫu gốc)`;

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
                              message: "Commit error",
                            });
                          });
                        }

                        connection.release();
                        res.json({
                          success: true,
                          message: "A3 documentation file deleted successfully",
                          documentation: newDocumentation,
                        });
                      });
                    }
                  );
                }
              );
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
  }
);

const PORT = process.env.MYSQL_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
