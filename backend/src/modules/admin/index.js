// backend/src/modules/admin/index.js

const routes = require("./admin.routes");
const service = require("./admin.service");
const repository = require("./admin.repository");

module.exports = {
  routes,
  service,
  repository,
};
