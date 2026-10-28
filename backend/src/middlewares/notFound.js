// backend/src/middlewares/notFound.js
//
// Gan SAU tat ca route, TRUOC errorHandler. Duong dan khong khop route nao se
// roi vao day va nhan 404 dung dang JSON, thay vi trang HTML mac dinh cua
// Express (frontend parse HTML do se bao loi kho hieu).

const ApiError = require("../utils/ApiError");

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Không tìm thấy: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;
