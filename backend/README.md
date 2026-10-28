# Backend QCO

API cho hệ thống Quick Change Over. Express 5 + MySQL (+ MSSQL tuỳ chọn).

## Chạy

```bash
pnpm install
pnpm start          # nodemon server.js
```

Cấu hình nằm trong `.env` (xem `.env.example`).

## Cấu trúc

```
server.js                 điểm khởi động — mỏng, chỉ nối dây
src/
  app.js                  dựng express app: middleware → route → bẫy lỗi
  config/
    env.js                ★ NƠI DUY NHẤT đọc process.env
  database/               ← COPY ĐƯỢC NGUYÊN FOLDER
    mysql.js              xưởng tạo pool MySQL
    mssql.js              xưởng tạo pool MSSQL
    index.js              sổ đăng bạ: db.app / db.hr / db.legacy
  middlewares/
    notFound.js           404 dạng JSON
    errorHandler.js       bẫy lỗi cuối cùng
  utils/
    ApiError.js           lỗi có mã HTTP
    asyncHandler.js       bọc handler async (Express 5 không tự bắt)
    response.js           dạng phản hồi chung { success, message, data }
  modules/
    auth/                 ← COPY ĐƯỢC NGUYÊN FOLDER (sửa 1 file)
```

Nguyên tắc chia tầng trong mỗi module:

| Tầng | File | Chứa gì | Không chứa gì |
|---|---|---|---|
| Đường dẫn | `*.routes.js` | khai báo URL + chốt chặn | logic |
| HTTP | `*.controller.js` | đọc `req`, gói `res` | nghiệp vụ, SQL |
| Nghiệp vụ | `*.service.js` | quyết định, ném `ApiError` | `req`/`res`, SQL |
| Truy vấn | `*.repository.js` | SQL | quyết định nghiệp vụ |

## Dùng lại cho dự án mới

### 1. Kết nối database → copy `src/database/` + `src/config/env.js`

Tên pool đặt chung chung (`db.app`, `db.hr`, `db.legacy`) chứ không phải
`db.qco`, nên code dùng nó không phải sửa. Chỉ cần:

1. Copy `src/database/` và `src/config/env.js`.
2. Trong `env.js`, đổi tên biến DB riêng (`QCO_DATABASE` → tên dự án mới).
3. Đổi `.env`.

### 2. Cơ chế đăng nhập → copy `src/modules/auth/`

Kèm theo `src/utils/` và `src/middlewares/` (auth dùng `ApiError`,
`asyncHandler`, `response`).

**Chỉ phải viết lại đúng một file: `auth.access.js`.**

Vì cách đăng nhập thì dự án nào cũng như nhau (tra mã thẻ → so bcrypt → ký
JWT), nhưng mô hình phân quyền thì mỗi dự án một kiểu:

- TPM: 1 trục — quyền (`admin` / `edit` / `view`)
- QCO: hiện cũng 1 trục, cùng mô hình với TPM

`auth.access.js` chứa trọn phần khác nhau đó, lộ ra hai hàm:

```js
getUserAccess(idNhanVien)   // → { permissions: string[], ...trục khác nếu có }
hasSystemAccess(access)     // → được vào hệ thống không?
```

`auth.service.js` chỉ gọi qua hai hàm này nên không cần biết dự án có bao
nhiêu trục phân quyền — copy sang là chạy.

### 3. Gắn module vào app

```js
// src/app.js
app.use("/api/auth", auth.routes);
```

Chặn route khác bằng chốt của auth:

```js
const auth = require("./modules/auth");

router.post(
  "/plans",
  auth.authenticateToken,
  auth.requirePermission(auth.PERMISSIONS.ADMIN),
  handler
);
```

## API hiện có

| Method | Đường dẫn | Token | Trả về |
|---|---|---|---|
| GET | `/health` | không | uptime |
| POST | `/api/auth/login` | không | `{ token, user }` |
| GET | `/api/auth/me` | có | `{ user }` — đọc lại từ DB |
| GET | `/api/auth/permissions` | có | `["admin"]` |

Mọi phản hồi đều có dạng `{ success, message, data }`.

## Nguồn dữ liệu

| Pool | Database | Quyền |
|---|---|---|
| `db.app` | `qco_database` | đọc + ghi |
| `db.hr` | `sync_data_hi_time_sheet` | **chỉ đọc** — DB nhân sự dùng chung toàn công ty, do hệ thống nhân sự đồng bộ sang |
| `db.legacy` | `eGMF` (MSSQL) | chỉ đọc; `null` nếu `.env` không khai báo `MSSQL_SERVER` |

## Tài khoản test

Bật bằng `ALLOW_TEST_ACCOUNTS=true` trong `.env` — **mặc định tắt**, và phải
tắt trước khi chạy thật (để bật là mở một cửa hậu đăng nhập).

| Gõ vào ô "Số thẻ" | Quyền |
|---|---|
| `admin` hoặc `99999` | `admin` |
| `edit` hoặc `99990` | `edit` |
| `view` hoặc `99995` | `view` |

Nhận cả hai cách gõ: tên ngắn lẫn mã thẻ ảo. Mật khẩu chung lấy từ
`TEST_ACCOUNT_PASSWORD` (hiện là `123456`).
