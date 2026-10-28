// backend/src/modules/auth/index.js
//
// CUA VAO CUA MODULE. Ben ngoai chi import tu day, khong voi tay vao tung
// file con - nho vay doi cau truc ben trong module khong lam vo cho khac.
//
//   const auth = require("./modules/auth");
//   app.use("/api/auth", auth.routes);
//   router.get("/plans", auth.authenticateToken, ...)

const routes = require("./auth.routes");
const { authenticateToken, requirePermission } = require("./auth.middleware");
const { PERMISSIONS } = require("./auth.access");
const testAccounts = require("./auth.testAccounts");

module.exports = {
  routes,
  authenticateToken,
  requirePermission,
  PERMISSIONS,
  testAccounts,
};
