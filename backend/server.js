// backend/server.js
//
// DIEM KHOI DONG. Co tinh giu that mong - moi thu thuc su nam trong src/.
//
//   src/config/      doc .env (noi DUY NHAT dung process.env)
//   src/database/    ket noi MySQL / MSSQL        ← copy được nguyên folder
//   src/modules/     nghiep vu, moi module mot folder
//   src/middlewares/ bay loi dung chung
//   src/utils/       tien ich dung chung
//
// Xem backend/README.md de biet cach copy database/ va modules/auth/ sang
// du an moi.

const start = async () => {
  // require ĐẶT TRONG HÀM, không đặt ở đầu file: config/env.js ném lỗi ngay
  // lúc nạp nếu .env thiếu biến bắt buộc. Để ở đầu file thì lỗi đó rơi ra
  // ngoài mọi try/catch và người chạy chỉ thấy một stack trace khó hiểu.
  const env = require("./src/config/env");
  const app = require("./src/app");
  const { connectAll, closeAll } = require("./src/database");
  const auth = require("./src/modules/auth");

  // Thử kết nối trước khi mở cổng, để lỗi cấu hình DB lộ ra ngay lúc khởi
  // động thay vì đợi đến khi có người đăng nhập.
  await connectAll();

  const server = app.listen(env.port, () => {
    console.log(`Server QCO đang chạy trên cổng ${env.port}`);

    if (auth.testAccounts.isEnabled()) {
      console.warn(
        `⚠ Tài khoản test ĐANG BẬT (${auth.testAccounts.names().join(", ")}). ` +
          `Đặt ALLOW_TEST_ACCOUNTS=false trước khi chạy thật.`
      );
    }
  });

  // Tắt êm: đóng cổng, đóng kết nối DB rồi mới thoát. Không có đoạn này thì
  // mỗi lần nodemon restart sẽ bỏ lại kết nối MySQL treo trên server.
  const shutdown = (signal) => {
    console.log(`\nNhận ${signal}, đang tắt server...`);
    server.close(async () => {
      await closeAll();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((err) => {
  // Lỗi ở đây là lỗi KHÔNG khởi động được (thiếu biến .env, cổng bị chiếm...)
  // -> dừng hẳn, đừng để server chạy nửa vời.
  console.error(`\n✖ Không khởi động được server: ${err.message}\n`);
  process.exit(1);
});
