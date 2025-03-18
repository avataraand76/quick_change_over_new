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
            "INSERT INTO tb_co (id_plan, updated_by) VALUES (?, ?)",
            [id_plan, updated_by],
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
                      res
                        .status(500)
                        .json({ success: false, message: "Database error" });
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

// API lấy tỉ lệ hoàn thành của các quy trình cho một kế hoạch cụ thể
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

// API lấy các bước công việc của một quy trình
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

const PORT = process.env.MYSQL_PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
