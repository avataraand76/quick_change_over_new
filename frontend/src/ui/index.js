// frontend/src/ui/index.js
//
// ════════════════════════════════════════════════════════════════════════════
// CỬA VÀO DUY NHẤT CHO MỌI THỨ LIÊN QUAN GIAO DIỆN
// ════════════════════════════════════════════════════════════════════════════
//
// Thay vì mỗi trang phải viết 4-5 khối import dài:
//
//   import { Box, Card, Typography, ... } from "@mui/material";
//   import { Close, Search, ... } from "@mui/icons-material";
//   import { sx as preset, radii, gradients } from "../theme";
//   import { useResponsive } from "../hooks/useResponsive";
//
// giờ chỉ cần MỘT khối:
//
//   import { Box, Card, Typography, Close, Search,
//            sx as preset, radii, useResponsive } from "../ui";
//
// ---------------------------------------------------------------------------
// MỘT LUẬT BẮT BUỘC: component MUI lấy qua `export *` được, nhưng ICON thì
// PHẢI liệt kê từng cái (mục 2). @mui/icons-material có 21.550 file; `export *`
// khiến Vite dev gộp hết thành một file 6.7 MB nạp lại mỗi lần F5.
// ---------------------------------------------------------------------------

// 1) Toàn bộ component MUI (Box, Card, Dialog, Table, ...)
export * from "@mui/material";

// 2) ICON MUI - LIỆT KÊ TỪNG CÁI, TUYỆT ĐỐI KHÔNG `export *`
//
//    `export * from "@mui/icons-material"` kéo CẢ 21.550 file icon vào. Ở dev,
//    Vite gộp chúng thành MỘT file pre-bundle 6.7 MB (kèm sourcemap 8.2 MB) mà
//    trình duyệt phải tải + chạy lại MỖI LẦN F5 - mở F12 còn phải tải thêm
//    sourcemap, nên trang đứng hình vài chục giây. Tree-shaking chỉ cứu bản
//    production, không cứu được dev.
//
//    Thêm icon mới: thêm MỘT dòng vào đây (tên lấy từ mui.com/material-ui/
//    material-icons). Giữ danh sách này đúng bằng số icon thực dùng.
export { default as AdminPanelSettings } from "@mui/icons-material/AdminPanelSettings";
export { default as ArrowBack } from "@mui/icons-material/ArrowBack";
export { default as ArrowForward } from "@mui/icons-material/ArrowForward";
export { default as Assessment } from "@mui/icons-material/Assessment";
export { default as BarChart } from "@mui/icons-material/BarChart";
export { default as CalendarMonth } from "@mui/icons-material/CalendarMonth";
export { default as Category } from "@mui/icons-material/Category";
export { default as ChevronLeft } from "@mui/icons-material/ChevronLeft";
export { default as ChevronRight } from "@mui/icons-material/ChevronRight";
export { default as ExitToApp } from "@mui/icons-material/ExitToApp";
export { default as Fullscreen } from "@mui/icons-material/Fullscreen";
export { default as FullscreenExit } from "@mui/icons-material/FullscreenExit";
export { default as Home } from "@mui/icons-material/Home";
export { default as InfoOutlined } from "@mui/icons-material/InfoOutlined";
export { default as People } from "@mui/icons-material/People";
export { default as Person } from "@mui/icons-material/Person";
export { default as PersonOutline } from "@mui/icons-material/PersonOutline";
export { default as PlaylistAddCheck } from "@mui/icons-material/PlaylistAddCheck";
export { default as Refresh } from "@mui/icons-material/Refresh";
export { default as Save } from "@mui/icons-material/Save";
export { default as Search } from "@mui/icons-material/Search";
export { default as Security } from "@mui/icons-material/Security";
export { default as ShowChart } from "@mui/icons-material/ShowChart";
export { default as Speed } from "@mui/icons-material/Speed";
export { default as TrackChanges } from "@mui/icons-material/TrackChanges";
export { default as TrendingUp } from "@mui/icons-material/TrendingUp";
export { default as Visibility } from "@mui/icons-material/Visibility";
export { default as VisibilityOff } from "@mui/icons-material/VisibilityOff";
export { default as Warning } from "@mui/icons-material/Warning";

// 3) 7 tên TRÙNG giữa @mui/material và @mui/icons-material.
//    Quy ước: COMPONENT giữ tên gốc (đã có sẵn qua `export *` ở mục 1),
//    ICON thêm hậu tố `Icon`.
export { default as BadgeIcon } from "@mui/icons-material/Badge";
export { default as InputIcon } from "@mui/icons-material/Input";
export { default as LinkIcon } from "@mui/icons-material/Link";
export { default as ListIcon } from "@mui/icons-material/List";
export { default as MenuIcon } from "@mui/icons-material/Menu";
export { default as RadioIcon } from "@mui/icons-material/Radio";
export { default as TabIcon } from "@mui/icons-material/Tab";

// 4) Design token + preset (src/theme.js - MOT file duy nhat)
export * from "../theme";
export { default as theme } from "../theme";

//    `colors` cũng là tên một export của @mui/material (bảng màu Material).
//    Cùng cơ chế như 7 tên trùng ở trên: phải chỉ định tường minh. Ta lấy
//    bảng màu CỦA DỰ ÁN.
export { colors } from "../theme";
//    Bảng màu gốc của Material, nếu cần: muiColors.red[500] ...
export { colors as muiColors } from "@mui/material";

// 5) Hook responsive duy nhất của dự án
export { useResponsive } from "../hooks/useResponsive";
