---
name: qco
description: Kiến thức riêng của dự án QCO (Quick Change Over - Việt Long Hưng) - database qco_database, mô hình phân quyền một trục admin/edit/view giống TPM, quy ước frontend dùng token trong theme.js và barrel src/ui, cách chạy hai đầu, và các cạm bẫy đã biết. Dùng skill này khi làm bất cứ việc gì trong thư mục dự án QCO - thêm trang, thêm API, sửa truy vấn, hay đụng tới phân quyền.
---

# Dự án QCO (Quick Change Over)

Hệ thống theo dõi tiến độ chuẩn bị **chuyển đổi mã hàng** trên chuyền may.
Dự án đã **làm lại từ đầu** — database mới là `qco_database`, hiện mới có phần
đăng nhập và phân quyền, chưa có bảng nghiệp vụ nào.

Cấu trúc backend tuân theo skill toàn cục **`backend-express-modular`** — đọc
skill đó trước khi thêm module hay sửa tầng. File này chỉ ghi phần RIÊNG của QCO.

## Chạy

```bash
cd backend  && pnpm start    # http://localhost:8081
cd frontend && pnpm start    # http://localhost:3000
```

Hai cổng phải khớp: `backend/.env` → `PORT`, `frontend/.env` → `VITE_API_URL`.
TPM cũng dùng 8081, nên không chạy đồng thời hai backend trên cùng một máy.

Kiểm tra trước khi báo xong:

```bash
cd frontend && pnpm lint && pnpm build
cd backend  && for f in $(find . -name "*.js" -not -path "./node_modules/*"); do node --check "$f"; done
```

## Ba nguồn dữ liệu

| Pool | Database | Quyền | Nội dung |
|---|---|---|---|
| `db.app` | `qco_database` | đọc + ghi | phân quyền + nghiệp vụ QCO |
| `db.hr` | `sync_data_hi_time_sheet` | **CHỈ ĐỌC** | nhân viên toàn công ty, do hệ thống nhân sự đồng bộ sang. TPM cũng đọc DB này. Ghi vào đây là phá dữ liệu phòng khác. |
| `db.legacy` | `eGMF` (MSSQL) | chỉ đọc | hệ thống cũ, chưa dùng tới |

## Phân quyền — MỘT trục, giống hệt TPM

```
tb_permission        id_permission, uuid_permission, name_permission
                     + created_at / created_by / updated_at / updated_by
                     3 dòng: admin · edit · view

tb_user_permission   id_permission, id_nhan_vien
                     + created_at / created_by / updated_at / updated_by
```

`id_nhan_vien` = `sync_nhan_vien.id` bên DB nhân sự.

Tên quyền **viết thường**: `admin`, `edit`, `view`. Không phải `ADMIN`.

Toàn bộ logic nằm trong `backend/src/modules/auth/auth.access.js` — file duy
nhất phải sửa nếu mô hình phân quyền đổi. Frontend lấy qua `useAuth()`:
`permissions`, `isAdmin`, `canEdit`, `canView`.

Được vào hệ thống khi có **ít nhất một quyền** (`hasSystemAccess`). Nhân viên
hợp lệ trong DB nhân sự chưa đủ — cả công ty đều có trong đó.

Dùng hằng thay vì gõ chuỗi:

```js
const auth = require("../auth");
router.post("/", auth.requirePermission(auth.PERMISSIONS.ADMIN), handler);
```

## Quy ước frontend

- **Mọi màu / bo góc / bóng đổ / cỡ chữ lấy từ token trong `src/theme.js`.**
  Không viết mã màu thẳng trong trang. Đổi giao diện toàn app = sửa `theme.js`.
- **Import qua barrel `src/ui`**, không import trực tiếp `@mui/material`:
  ```js
  import { Box, Card, Search, sx as preset, radii, gradients } from "../ui";
  ```
  Barrel đã gỡ 7 tên trùng giữa `@mui/material` và `@mui/icons-material`
  (component giữ tên gốc, icon thêm hậu tố `Icon`: `MenuIcon`, `ListIcon`...).
- Bo góc chỉ dùng 3 bậc: `radii.sm` (8) · `radii.md` (12, chuẩn) · `radii.lg` (20).
- Chiều cao toàn màn hình dùng `100dvh`, không dùng `100vh` (mobile bị thanh
  địa chỉ cắt).
- `FLUID_TYPE` trong `theme.js` là công tắc cỡ chữ cố định / co giãn, chi phối
  cả `typography`, `fontSizes` và style component. Hiện `false`.
- Cấu trúc: `pages/` · `components/` · `contexts/` · `hooks/` ·
  `api/api.jsx` (axios + interceptor token/401).

## Cạm bẫy đã biết

- **`ALLOW_TEST_ACCOUNTS` trong `backend/.env` đang là `true`.** Phải đặt
  `false` trước khi chạy thật — để `true` là mở cửa hậu đăng nhập.
  Gõ `admin` / `edit` / `view` (hoặc mã thẻ ảo `99999` / `99990` / `99995`),
  mật khẩu trong `TEST_ACCOUNT_PASSWORD`.
- **Chưa test được đăng nhập bằng mã thẻ nhân viên thật** (môi trường chặn truy
  vấn DB nhân sự). Nhánh bcrypt cần người dùng tự xác nhận.
- **`tb_user_permission` mới có đúng 1 dòng** (`id_nhan_vien = 2344` → `admin`).
  Người khác đăng nhập sẽ bị 403 cho tới khi được cấp quyền.
- **Database cũ `quick_change_over_database` CHỈ ĐỂ THAM KHẢO.** Nó chứa bản
  trước khi làm lại: 23 bảng, phân quyền 3 trục (`tb_role`, `tb_workshop`), cột
  khoá tên `id_sync_nhan_vien`, quyền viết hoa `ADMIN`/`CHỈNH SỬA`, và 8 công
  đoạn trong `tb_process`. **Không trỏ code vào DB đó.** Nếu cần xem lại mô
  hình nghiệp vụ cũ thì đọc, nhưng mọi tên cột và tên quyền đều đã đổi.

## Khi thêm chức năng mới

Theo skill `backend-express-modular`: mỗi chức năng là một folder trong
`backend/src/modules/`, chia tầng `routes → controller → service → repository`,
rồi thêm một dòng vào `src/app.js`.

Bảng nghiệp vụ chưa có — khi thiết kế, giữ quy ước audit đang dùng trong
`qco_database`: `created_at`, `created_by`, `updated_at`, `updated_by`, và
`uuid_*` bên cạnh khoá chính tự tăng.
