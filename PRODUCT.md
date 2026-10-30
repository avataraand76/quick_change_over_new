# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Kỹ thuật QCO / IE / Kế hoạch (quyền `edit`)**: Trực tiếp lập và cập nhật kế hoạch chuyển đổi mã hàng theo từng chuyền may, chuẩn bị thiết bị/máy móc và công đoạn may mẫu trên PC/Laptop tại văn phòng kỹ thuật và xưởng.
- **Ban giám đốc & Quản lý xưởng (quyền `view`)**: Theo dõi trực quan tiến độ chuyển đổi và hiệu suất 3 ngày đầu (HSBQ, tỷ lệ đạt ramp-up) trên màn hình lớn / TV treo tại xưởng may (bố cục 100vh không cuộn) hoặc trên máy tính tại phòng họp.
- **Quản trị viên IT / Nhân sự (quyền `admin`)**: Tra cứu cán bộ công nhân viên từ cơ sở dữ liệu nhân sự đồng bộ toàn công ty và cấp/thu hồi quyền truy cập hệ thống theo mã thẻ nhân viên (`ma_nv`).

## Product Purpose

Hệ thống Quản lý Chuyển đổi Nhanh (**QCO — Quick Change Over**) của **Công ty May Việt Long Hưng** giúp chuẩn hóa kế hoạch chuẩn bị chuyển đổi mã hàng trên các chuyền may và đo lường hiệu suất 3 ngày đầu sau chuyển đổi (N1, N2, N3) theo thời gian thực.

Thành công của sản phẩm được đo bằng:
- Giảm thời gian chết và sự cố thiếu hụt thiết bị/máy móc khi chuyền may đổi sang mã hàng mới hoặc mã lặp lại.
- Minh bạch hóa tiến độ ramp-up của từng tổ/chuyền và từng nhóm chuyền (`NHÓM 1` – `NHÓM 5`), hướng tới đạt và vượt ngưỡng mục tiêu hiệu suất từng ngày (N1: 60%, N2: 70%, N3: 80%) và hiệu suất bình quân 3 ngày (HSBQ ≥ 70%).

## Positioning

Khác với báo cáo sản lượng cuối tháng hoặc bảng tính rời rạc, QCO kết nối trực tiếp **kế hoạch chuẩn bị chuyển đổi mã hàng – chuyền (`tb_plan`)** với **đo lường hiệu suất 3 ngày đầu sau chuyển đổi (N1/N2/N3)** và phân tách rõ **Mã mới (`maMoi`)** với **Mã lặp lại (`maLap`)**, đồng thời tích hợp trực tiếp với CSDL Nhân sự (`sync_data_hi_time_sheet`) và hệ thống sản xuất (`eGMF`).

## Operating Context

- **Môi trường nhà máy may công nghiệp**:
  - **Màn hình TV / Màn hình lớn tại xưởng (`100vh`)**: Treo cố định tại xưởng sản xuất và phòng điều hành; cần độ tương phản cao, chữ và số liệu rõ nét từ khoảng cách xa, tự động co giãn số dòng (`useFitRows`) để hiển thị trọn vẹn trong một khung hình mà không cần cuộn trang.
  - **Máy trạm PC / Laptop văn phòng xưởng**: Phục vụ nhập liệu kế hoạch chuyển đổi, tra cứu lịch sử chuyển đổi theo kỳ báo cáo, lọc theo nhóm chuyền và phân quyền nhân sự.
  - **Màn hình cảm ứng tại nhà máy**: Hỗ trợ thao tác chạm (touch tooltip, nút bấm rõ ràng) khi tra cứu tại hiện trường.
- **Ngôn ngữ & Thuật ngữ chuyên ngành may**:
  - Sử dụng tiếng Việt 100% với hệ thống thuật ngữ chuẩn của nhà máy: **Chuyền / Tổ** (`to`), **Nhóm chuyền** (`NHÓM 1 - DUNG`, `NHÓM 2 - HƯƠNG`, ...), **Mã hàng mới** (`maMoi`), **Mã lặp lại** (`maLap`), **Hiệu suất ngày 1 / 2 / 3** (`N1`, `N2`, `N3`), **Hiệu suất bình quân 3 ngày** (`HSBQ`), **Tỷ lệ đạt Ramp-up**, **Số thẻ nhân viên** (`ma_nv`).

## Capabilities and Constraints

- **Kiến trúc kỹ thuật hiện có**:
  - **Frontend (`frontend/`)**: React 19, Vite 8, Material UI (MUI v7), React Router v7. Toàn bộ hệ thống token màu sắc, typography và component override tập trung tại `frontend/src/theme.js` và xuất qua `frontend/src/ui/index.js`.
  - **Backend (`backend/`)**: Node.js + Express 5 theo kiến trúc phân tầng module (`routes` → `controller` → `service` → `repository`), phản hồi chuẩn `{ success, message, data }`.
  - **Cơ sở dữ liệu 3 nguồn (`backend/src/database/`)**:
    1. `db.app` (`qco_database` - MySQL, đọc + ghi): Lưu phân quyền (`tb_permission`, `tb_user_permission`) và kế hoạch chuyển đổi mã hàng - chuyền (`tb_plan`).
    2. `db.hr` (`sync_data_hi_time_sheet` - MySQL, **chỉ đọc**): CSDL nhân sự dùng chung toàn công ty để xác thực số thẻ, mật khẩu và phòng ban.
    3. `db.legacy` (`eGMF` - MSSQL, **chỉ đọc**, tùy chọn): Nguồn dữ liệu sản xuất nhà máy để đồng bộ kết quả thực tế.
- **Mô hình phân quyền 1 trục (đồng bộ với hệ thống TPM)**:
  - 3 quyền: `admin` (quản trị & phân quyền), `edit` (nhập/sửa kế hoạch chuyển đổi & thông số kỹ thuật), `view` (xem báo cáo & dashboard).
- **Lộ trình nghiệp vụ trọng tâm**:
  - Xây dựng chức năng quản lý **Kế hoạch chuyển đổi** (`tb_plan`: mã hàng, chuyền may, chuẩn bị thiết bị/máy móc, công đoạn may mẫu).
  - Thay thế dữ liệu mẫu tại `frontend/src/pages/dashboard/dashboardMockData.js` bằng API kết nối dữ liệu thực tế từ `qco_database` và `eGMF`.

## Brand Commitments

- **Định danh sản phẩm**: `QCO System` — Hệ thống Quản lý Chuyển đổi Nhanh – Công ty May Việt Long Hưng.
- **Đồng bộ hệ sinh thái nội bộ**: Chia sẻ triết lý kiến trúc backend modular, cơ chế đăng nhập theo mã thẻ nhân viên và quy ước quản lý token tập trung trong `theme.js` với hệ thống **TPM** của nhà máy.

## Evidence on Hand

- **Giao diện đã vận hành**:
  - Trang Đăng nhập (`frontend/src/pages/LoginPage.jsx`): Xác thực theo Số thẻ nhân viên (`ma_nv`) + Mật khẩu, cảnh báo Caps Lock.
  - Trang Chủ (`frontend/src/pages/HomePage.jsx`): Tổng quan hệ thống, thẻ KPI tóm tắt, lối tắt điều hướng và bảng giải thích 3 cấp phân quyền.
  - Dashboard Báo cáo QCO (`frontend/src/pages/dashboard/DashboardPage.jsx`): Giao diện tổng quan hiệu suất chuyển đổi 3 ngày đầu, biểu đồ đường xu hướng 6 tháng (`LineChartSvg.jsx`), biểu đồ cột đối chiếu mục tiêu (`BarChartSvg.jsx`), bảng tổng hợp theo nhóm và bảng chi tiết từng lần chuyển đổi.
  - Trang Quản trị (`frontend/src/pages/AdminPage.jsx`): Tìm kiếm nhân viên từ DB nhân sự và gán/thu hồi quyền `admin` / `edit` / `view` với cơ chế tự động làm mới ngầm.
- **Dữ liệu hiện tại**:
  - Phân quyền và xác thực nhân sự dùng dữ liệu thật qua API `/api/auth` và `/api/admin`.
  - Số liệu trên Dashboard hiện đang dùng dữ liệu giả lập tại `frontend/src/pages/dashboard/dashboardMockData.js` (23 lần chuyển đổi kỳ 01/08/2026 – 31/08/2026 của 5 nhóm chuyền) để cố định bố cục trước khi nối API thật.

## Product Principles

1. **Đọc nhanh từ xa, thao tác gọn tại chỗ**: Màn hình Dashboard treo xưởng phải hiển thị trọn vẹn trong `100vh` trên màn hình lớn với tín hiệu màu trạng thái nhất quán (Đạt ≥ ngưỡng, Cảnh báo ≥ 75% ngưỡng, Kém < 75% ngưỡng), trong khi màn hình nhập liệu kế hoạch và quản trị phải rõ ràng, ít bước thừa cho kỹ thuật viên IE/QCO.
2. **Mọi chỉ số đều gắn với ngưỡng mục tiêu thực tế**: Không hiển thị phần trăm hiệu suất đơn lẻ mà luôn đặt cạnh mục tiêu ngày (N1: 60%, N2: 70%, N3: 80%, HSBQ: 70%) và phân biệt rõ Mã mới với Mã lặp lại để đánh giá công bằng năng lực chuyển đổi của từng chuyền.
3. **Tập trung hóa giao diện, tách bạch tầng dữ liệu**: Mọi quy ước màu sắc, cỡ chữ, bo góc và bóng đổ phải đi qua `frontend/src/theme.js` (`../ui`); mọi module backend tuân thủ nghiêm ngặt 4 tầng `routes` → `controller` → `service` → `repository` và tuyệt đối chỉ đọc đối với DB nhân sự (`db.hr`) cùng DB sản xuất (`db.legacy`).

