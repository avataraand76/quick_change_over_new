// backend/src/utils/asyncHandler.js
//
// Boc mot handler async de loi bi nem ra duoc chuyen sang errorHandler.
//
// Vi sao can: Express 5 KHONG tu bat promise bi reject. Khong boc thi mot
// cau query loi se treo request mai mai, client cho den timeout ma khong
// nhan duoc gi. Boc roi thi chi can `throw` la xong:
//
//     router.get("/me", asyncHandler(async (req, res) => {
//       const user = await service.getMe(req.user.id);   // loi -> tu ve 500
//       res.json(ok(user));
//     }));

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

module.exports = asyncHandler;
