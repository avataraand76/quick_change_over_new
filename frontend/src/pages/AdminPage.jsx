// frontend/src/pages/AdminPage.jsx
//
// TRANG QUẢN TRỊ - PHÂN QUYỀN NGƯỜI DÙNG ĐỒNG BỘ THEO THEME DEEP NAVY DASHBOARD

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AdminPanelSettings,
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  dash,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormGroup,
  Grid,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  People,
  Person,
  PersonOutline,
  Refresh,
  Save,
  Search,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Warning,
  radii,
  sx as preset,
} from "../ui";
import MainLayout from "../components/MainLayout";
import { api } from "../api/api";
import { useAuth } from "../hooks/useAuth";

const PERMISSION_META = {
  admin: {
    title: "Quản trị hệ thống (ADMIN)",
    description:
      "Toàn quyền quản trị hệ thống, tìm kiếm nhân sự, phân quyền người dùng và cấu hình",
  },
  edit: {
    title: "Kỹ thuật & Kế hoạch (EDIT)",
    description:
      "Được phép nhập liệu, cập nhật kế hoạch chuyển đổi mã hàng và thông số chuyền may",
  },
  view: {
    title: "Xem báo cáo điều hành (VIEW)",
    description:
      "Được phép xem báo cáo tổng hợp và tra cứu dữ liệu HSBQ, Ramp-up trên dashboard",
  },
};

const AdminPage = () => {
  const { user: currentUser } = useAuth();

  // Danh mục tất cả quyền từ hệ thống: ['admin', 'edit', 'view']
  const [allPermissions, setAllPermissions] = useState([]);

  // Tìm kiếm nhân viên
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Tab con danh sách bên trái: 0 = "Đã cấp quyền", 1 = "Tìm kiếm nhân sự"
  const [userListSubTab, setUserListSubTab] = useState(1);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // Người dùng đang được chọn
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState({});
  const [initialUserPermissions, setInitialUserPermissions] = useState({});
  const [loadingUserPermissions, setLoadingUserPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Hộp thoại xác nhận thu hồi toàn bộ quyền hoặc chuyển user khi chưa lưu
  const [confirmRevokeOpen, setConfirmRevokeOpen] = useState(false);
  const [pendingSelectUser, setPendingSelectUser] = useState(null);

  // Thông báo Notification
  const [notification, setNotification] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showNotification = (severity, message) => {
    setNotification({ open: true, severity, message });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification((prev) => ({ ...prev, open: false }));
  };

  // 1. Tải danh sách quyền hệ thống và danh sách người dùng đã được cấp quyền
  const fetchAssignedUsers = useCallback(
    async (isManual = false, isSilent = false) => {
      if (!isSilent) {
        setLoadingAssigned(true);
      }
      try {
        const res = await api.admin.getAssignedUsers();
        if (res.success) {
          setAssignedUsers(res.data || []);
          if (isManual) {
            showNotification("success", "Đã làm mới danh sách phân quyền");
          }
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách người dùng đã phân quyền:", error);
        if (isManual) {
          showNotification("error", "Không thể làm mới danh sách");
        }
      } finally {
        if (!isSilent) {
          setLoadingAssigned(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const initializeData = async () => {
      try {
        const permsRes = await api.admin.getAllPermissions();
        if (permsRes.success) {
          setAllPermissions(permsRes.data || []);
        }
        await fetchAssignedUsers();
      } catch (error) {
        showNotification(
          "error",
          error.response?.data?.message || "Không thể tải dữ liệu phân quyền"
        );
      }
    };

    initializeData();
  }, [fetchAssignedUsers]);

  // ── Cơ chế làm mới nền theo phong cách ERP Dashboard ────────────────────────
  useEffect(() => {
    let lastRefreshAt = Date.now();
    const AUTO_REFRESH_INTERVAL_MS = 3 * 60 * 1000;
    const MIN_VISIBILITY_GAP_MS = 5000;

    const triggerSilentRefresh = (isFocusEvent = false) => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (isFocusEvent && now - lastRefreshAt < MIN_VISIBILITY_GAP_MS) return;
      lastRefreshAt = now;
      fetchAssignedUsers(false, true);
    };

    const handleVisibility = () => triggerSilentRefresh(true);
    const handleFocus = () => triggerSilentRefresh(true);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    const timerId = setInterval(() => {
      triggerSilentRefresh(false);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearInterval(timerId);
    };
  }, [fetchAssignedUsers]);

  // Lọc nhanh danh sách Đã cấp quyền theo từ khóa nhập vào ô tìm kiếm
  const filteredAssignedUsers = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return assignedUsers;
    return assignedUsers.filter(
      (u) =>
        u.ma_nv?.toLowerCase().includes(q) ||
        u.ten_nv?.toLowerCase().includes(q) ||
        u.ten_phong_ban?.toLowerCase().includes(q)
    );
  }, [assignedUsers, userSearchQuery]);

  // 2. Tìm kiếm nhân viên trên toàn hệ thống nhân sự
  const handleSearchSubmit = async () => {
    if (!userSearchQuery || userSearchQuery.trim().length < 2) {
      showNotification("info", "Vui lòng nhập ít nhất 2 ký tự để tìm kiếm");
      return;
    }

    setLoadingUsers(true);
    setHasSearched(true);
    setUserListSubTab(0);

    try {
      const res = await api.admin.searchUsers(userSearchQuery.trim());
      if (res.success) {
        setUserSearchResults(res.data || []);
        if (res.data.length === 0) {
          showNotification("info", "Không tìm thấy người dùng nào phù hợp");
        }
      }
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.message || error.message || "Lỗi khi tìm kiếm"
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  // Kiểm tra có thay đổi quyền chưa lưu hay không
  const hasChanges = Object.keys(selectedUserPermissions).some(
    (key) => selectedUserPermissions[key] !== initialUserPermissions[key]
  );

  // Thực thi tải quyền của nhân viên được chọn
  const loadUserPermissions = async (user) => {
    setSelectedUser(user);
    setLoadingUserPermissions(true);

    try {
      const res = await api.admin.getUserPermissions(user.ma_nv);
      if (res.success) {
        const userPermsArray = res.data || [];
        const permsObj = {};
        allPermissions.forEach((permName) => {
          permsObj[permName] = userPermsArray.includes(permName);
        });

        setSelectedUserPermissions(permsObj);
        setInitialUserPermissions(permsObj);
      }
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.message || "Lỗi khi tải quyền người dùng"
      );
    } finally {
      setLoadingUserPermissions(false);
    }
  };

  // 3. Chọn 1 nhân viên để xem / sửa quyền (có kiểm tra thay đổi chưa lưu)
  const handleSelectUser = (user) => {
    if (selectedUser && selectedUser.ma_nv === user.ma_nv) {
      return;
    }
    if (hasChanges) {
      setPendingSelectUser(user);
      return;
    }
    loadUserPermissions(user);
  };

  const isEditingSelf =
    Boolean(selectedUser?.ma_nv) &&
    Boolean(currentUser?.ma_nv) &&
    String(selectedUser.ma_nv) === String(currentUser.ma_nv);

  // 4. Bật/tắt checkbox quyền (chặn tự gỡ quyền admin của chính mình)
  const handlePermissionToggle = (permName) => {
    if (isEditingSelf && permName === "admin" && selectedUserPermissions.admin) {
      showNotification(
        "warning",
        "Không thể tự gỡ quyền Quản trị (ADMIN) của tài khoản đang đăng nhập"
      );
      return;
    }
    setSelectedUserPermissions((prev) => ({
      ...prev,
      [permName]: !prev[permName],
    }));
  };

  // 5. Thực thi lưu phân quyền lên server
  const executeSavePermissions = async () => {
    if (!selectedUser) return;
    setConfirmRevokeOpen(false);
    setSavingPermissions(true);

    try {
      const activePermissions = Object.keys(selectedUserPermissions).filter(
        (key) => selectedUserPermissions[key] === true
      );

      const res = await api.admin.updateUserPermissions(
        selectedUser.ma_nv,
        activePermissions
      );

      if (res.success) {
        showNotification(
          "success",
          `Cập nhật quyền thành công cho ${selectedUser.ten_nv}`
        );
        setInitialUserPermissions({ ...selectedUserPermissions });
        fetchAssignedUsers();
      }
    } catch (error) {
      showNotification(
        "error",
        error.response?.data?.message || error.message || "Lỗi khi lưu quyền"
      );
    } finally {
      setSavingPermissions(false);
    }
  };

  // 6. Kiểm tra trước khi lưu (hỏi xác nhận nếu thu hồi toàn bộ quyền)
  const handleSavePermissions = () => {
    if (!selectedUser) return;
    const activePermissions = Object.keys(selectedUserPermissions).filter(
      (key) => selectedUserPermissions[key] === true
    );
    if (activePermissions.length === 0) {
      setConfirmRevokeOpen(true);
      return;
    }
    executeSavePermissions();
  };

  // Hoàn tác các thay đổi chưa lưu
  const handleResetPermissions = () => {
    setSelectedUserPermissions({ ...initialUserPermissions });
  };

  return (
    <MainLayout
      title="Trang Quản Trị & Phân Quyền"
      subtitle="Quản lý danh sách cán bộ công nhân viên được cấp quyền truy cập hệ thống QCO"
    >
      <Container maxWidth="xl" disableGutters>
        {/* ── KHUNG NỘI DUNG CHÍNH (GLASSMORPHIC ERP CARD) ────────────── */}
        <Box
          sx={{
            borderRadius: "10px",
            background: dash.panel,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: dash.shadows.panel,
            border: `1px solid ${dash.border}`,
            overflow: "hidden",
          }}
        >
          {/* Thanh tiêu đề phân hệ */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              borderBottom: `1px solid ${dash.border}`,
              px: { xs: 2, sm: 3 },
              py: 1.75,
              bgcolor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  background: dash.gradients.purple,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: dash.shadows.button,
                }}
              >
                <AdminPanelSettings sx={{ color: "#ffffff", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: "#ffffff",
                    fontSize: "1rem",
                    letterSpacing: 0.3,
                  }}
                >
                  PHÂN QUYỀN NGƯỜI DÙNG HỆ THỐNG
                </Typography>
                <Typography sx={{ color: dash.inkMuted, fontSize: "0.75rem" }}>
                  Tra cứu nhân sự theo số thẻ hoặc lọc danh sách tài khoản đã cấp quyền
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<People sx={{ fontSize: "16px !important" }} />}
              label={`${assignedUsers.length} nhân sự đã cấp quyền`}
              size="small"
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                bgcolor: "rgba(59, 130, 246, 0.14)",
                color: dash.status.blue,
                border: `1px solid ${dash.borderStrong}`,
                fontWeight: 700,
                fontSize: "0.75rem",
              }}
            />
          </Stack>

          {/* Nội dung phân quyền */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2.5}>
              {/* ── CỘT TRÁI: TÌM KIẾM & DANH SÁCH NHÂN VIÊN ──────────────── */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: "10px",
                    background: dash.tile,
                    border: `1px solid ${dash.border}`,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={800}
                    color="#ffffff"
                    sx={{ mb: 1.5, fontSize: "1rem" }}
                  >
                    Tìm kiếm &amp; Lọc nhân viên
                  </Typography>

                  {/* Khung tìm kiếm */}
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Nhập Mã NV hoặc Họ tên (vd: 09802)..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSearchSubmit()
                      }
                      inputProps={{
                        "aria-label": "Nhập Mã nhân viên hoặc Họ tên để tìm kiếm",
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "rgba(255, 255, 255, 0.05)",
                          color: "#ffffff",
                          "& fieldset": { borderColor: dash.border },
                          "&:hover fieldset": {
                            borderColor: dash.borderStrong,
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: dash.status.blue,
                          },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: dash.inkMuted,
                          opacity: 1,
                        },
                      }}
                    />
                    <Tooltip title="Tìm trong CSDL Nhân sự">
                      <span>
                        <Button
                          variant="contained"
                          onClick={handleSearchSubmit}
                          disabled={loadingUsers}
                          aria-label="Tìm kiếm nhân sự"
                          sx={{
                            minWidth: 46,
                            height: 40,
                            px: 2,
                            borderRadius: "8px",
                            background: dash.gradients.primary,
                            color: "#ffffff",
                            boxShadow: dash.shadows.button,
                            "&:hover": {
                              background: dash.gradients.primaryHover,
                            },
                          }}
                        >
                          {loadingUsers ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <Search fontSize="small" />
                          )}
                        </Button>
                      </span>
                    </Tooltip>
                  </Box>

                  {/* Thanh chuyển đổi tab con */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: `1px solid ${dash.border}`,
                      mb: 1.5,
                      pb: 0.5,
                    }}
                  >
                    <Tabs
                      value={userListSubTab}
                      onChange={(e, val) => setUserListSubTab(val)}
                      sx={{
                        minHeight: 36,
                        "& .MuiTab-root": {
                          minHeight: 36,
                          py: 0.5,
                          px: 1.5,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          textTransform: "none",
                          color: dash.inkMuted,
                          "&.Mui-selected": { color: "#ffffff" },
                        },
                        "& .MuiTabs-indicator": {
                          bgcolor: dash.status.blue,
                        },
                      }}
                    >
                      <Tab label={`Tìm kiếm (${userSearchResults.length})`} />
                      <Tab
                        label={`Đã cấp quyền (${filteredAssignedUsers.length})`}
                      />
                    </Tabs>

                    {userListSubTab === 1 && (
                      <Tooltip title="Làm mới danh sách">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Làm mới danh sách đã cấp quyền"
                            onClick={() => fetchAssignedUsers(true)}
                            disabled={loadingAssigned}
                            sx={{ color: dash.inkMuted }}
                          >
                            <Refresh
                              fontSize="small"
                              sx={{
                                animation: loadingAssigned
                                  ? "spin 1s linear infinite"
                                  : "none",
                                "@keyframes spin": {
                                  "100%": { transform: "rotate(360deg)" },
                                },
                              }}
                            />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Danh sách nhân viên */}
                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: "auto",
                      maxHeight: "440px",
                      pr: 0.5,
                      "&::-webkit-scrollbar": { width: 5 },
                      "&::-webkit-scrollbar-thumb": {
                        bgcolor: "rgba(255, 255, 255, 0.12)",
                        borderRadius: 3,
                      },
                    }}
                  >
                    {/* Tab 0: Kết quả tìm kiếm */}
                    {userListSubTab === 0 && (
                      <>
                        {loadingUsers ? (
                          <Box sx={{ ...preset.centerFull, py: 6 }}>
                            <CircularProgress
                              size={30}
                              sx={{ color: dash.status.blue }}
                            />
                          </Box>
                        ) : userSearchResults.length > 0 ? (
                          <List dense disablePadding>
                            {userSearchResults.map((user) => {
                              const isSelected =
                                selectedUser?.ma_nv === user.ma_nv;
                              return (
                                <ListItemButton
                                  key={user.ma_nv}
                                  onClick={() => handleSelectUser(user)}
                                  selected={isSelected}
                                  sx={{
                                    borderRadius: "8px",
                                    mb: 1,
                                    p: 1.25,
                                    border: isSelected
                                      ? `1.5px solid ${dash.status.blue}`
                                      : `1px solid rgba(255, 255, 255, 0.08)`,
                                    bgcolor: isSelected
                                      ? "rgba(59, 130, 246, 0.18)"
                                      : "rgba(255, 255, 255, 0.03)",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      bgcolor: "rgba(255, 255, 255, 0.08)",
                                      borderColor: dash.borderStrong,
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: 44 }}>
                                    <Avatar
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        background: isSelected
                                          ? dash.gradients.primary
                                          : "rgba(255, 255, 255, 0.08)",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      {user.ten_nv.charAt(0)}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        color="#ffffff"
                                      >
                                        {user.ten_nv}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: dash.inkMuted,
                                          fontSize: "0.75rem",
                                          display: "block",
                                        }}
                                      >
                                        Mã NV: <strong>{user.ma_nv}</strong>
                                        {user.ten_phong_ban
                                          ? ` · ${user.ten_phong_ban}`
                                          : ""}
                                      </Typography>
                                    }
                                  />
                                </ListItemButton>
                              );
                            })}
                          </List>
                        ) : hasSearched ? (
                          <Box
                            sx={{
                              textAlign: "center",
                              color: dash.inkMuted,
                              py: 6,
                            }}
                          >
                            <PersonOutline sx={{ fontSize: 44, opacity: 0.3 }} />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Không tìm thấy người dùng phù hợp
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              textAlign: "center",
                              color: dash.inkMuted,
                              py: 6,
                            }}
                          >
                            <Search sx={{ fontSize: 44, opacity: 0.25 }} />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Nhập mã NV hoặc tên rồi nhấn Enter để tìm trong CSDL Nhân sự
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}

                    {/* Tab 1: Danh sách người dùng đã được phân quyền */}
                    {userListSubTab === 1 && (
                      <>
                        {loadingAssigned ? (
                          <Box sx={{ ...preset.centerFull, py: 6 }}>
                            <CircularProgress
                              size={30}
                              sx={{ color: dash.status.blue }}
                            />
                          </Box>
                        ) : filteredAssignedUsers.length > 0 ? (
                          <List dense disablePadding>
                            {filteredAssignedUsers.map((user) => {
                              const isSelected =
                                selectedUser?.ma_nv === user.ma_nv;
                              return (
                                <ListItemButton
                                  key={user.ma_nv}
                                  onClick={() => handleSelectUser(user)}
                                  selected={isSelected}
                                  sx={{
                                    borderRadius: "8px",
                                    mb: 1,
                                    p: 1.25,
                                    border: isSelected
                                      ? `1.5px solid ${dash.status.blue}`
                                      : `1px solid rgba(255, 255, 255, 0.08)`,
                                    bgcolor: isSelected
                                      ? "rgba(59, 130, 246, 0.18)"
                                      : "rgba(255, 255, 255, 0.03)",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      bgcolor: "rgba(255, 255, 255, 0.08)",
                                      borderColor: dash.borderStrong,
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: 44 }}>
                                    <Avatar
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        background: isSelected
                                          ? dash.gradients.primary
                                          : "rgba(59, 130, 246, 0.2)",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "0.9rem",
                                      }}
                                    >
                                      {user.ten_nv.charAt(0)}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={
                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        color="#ffffff"
                                      >
                                        {user.ten_nv}
                                      </Typography>
                                    }
                                    secondary={
                                      <Box component="span">
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: dash.inkMuted,
                                            fontSize: "0.75rem",
                                            display: "block",
                                          }}
                                          component="span"
                                        >
                                          Mã NV: <strong>{user.ma_nv}</strong>
                                          {user.ten_phong_ban
                                            ? ` · ${user.ten_phong_ban}`
                                            : ""}
                                        </Typography>
                                        <Stack
                                          direction="row"
                                          spacing={0.5}
                                          sx={{ mt: 0.5 }}
                                          component="span"
                                        >
                                          {user.permissions?.map((p) => (
                                            <Chip
                                              key={p}
                                              label={p.toUpperCase()}
                                              size="small"
                                              sx={{
                                                height: 20,
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                bgcolor:
                                                  p === "admin"
                                                    ? "rgba(139, 92, 246, 0.2)"
                                                    : "rgba(59, 130, 246, 0.2)",
                                                color:
                                                  p === "admin"
                                                    ? dash.status.purple
                                                    : dash.status.blue,
                                                border: `1px solid ${
                                                  p === "admin"
                                                    ? "rgba(139, 92, 246, 0.35)"
                                                    : "rgba(59, 130, 246, 0.35)"
                                                }`,
                                              }}
                                            />
                                          ))}
                                        </Stack>
                                      </Box>
                                    }
                                  />
                                </ListItemButton>
                              );
                            })}
                          </List>
                        ) : (
                          <Box
                            sx={{
                              textAlign: "center",
                              color: dash.inkMuted,
                              py: 6,
                            }}
                          >
                            <People sx={{ fontSize: 44, opacity: 0.25 }} />
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {userSearchQuery.trim()
                                ? "Không có nhân sự đã cấp quyền nào khớp từ khóa lọc"
                                : "Chưa có người dùng nào được cấp quyền"}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* ── CỘT PHẢI: CHI TIẾT PHÂN QUYỀN ───────────────────────── */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Box
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    minHeight: "480px",
                    height: "100%",
                    borderRadius: "10px",
                    background: dash.tile,
                    border: `1px solid ${dash.border}`,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {selectedUser ? (
                    <>
                      {/* Tiêu đề thông tin nhân viên đang chọn */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2.25,
                          mb: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 56,
                            height: 56,
                            background: dash.gradients.primary,
                            border: `1px solid ${dash.borderStrong}`,
                            fontSize: "1.45rem",
                            fontWeight: 800,
                            color: "#ffffff",
                            boxShadow: dash.shadows.button,
                          }}
                        >
                          {selectedUser.ten_nv.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            flexWrap="wrap"
                          >
                            <Typography
                              variant="h5"
                              fontWeight={800}
                              color="#ffffff"
                              sx={{ lineHeight: 1.2 }}
                            >
                              {selectedUser.ten_nv}
                            </Typography>
                            {isEditingSelf && (
                              <Chip
                                label="Tài khoản của bạn"
                                size="small"
                                sx={{
                                  bgcolor: "rgba(245, 158, 11, 0.16)",
                                  color: dash.status.warn,
                                  border: "1px solid rgba(245, 158, 11, 0.35)",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              />
                            )}
                          </Stack>
                          <Typography
                            variant="body2"
                            sx={{ color: dash.inkSoft, mt: 0.3 }}
                          >
                            Mã NV: <strong>{selectedUser.ma_nv}</strong>
                            {selectedUser.cong_viec_phu_trach
                              ? ` · ${selectedUser.cong_viec_phu_trach}`
                              : ""}
                          </Typography>
                          {selectedUser.ten_phong_ban && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: dash.inkMuted,
                                fontSize: "0.75rem",
                                display: "block",
                              }}
                            >
                              {selectedUser.ten_phong_ban}
                              {selectedUser.ten_bo_phan
                                ? ` (${selectedUser.ten_bo_phan})`
                                : ""}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Phân cách QUYỀN HẠN */}
                      <Divider sx={{ my: 2, borderColor: dash.border }}>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: "rgba(255, 255, 255, 0.08)",
                            px: 1.5,
                            py: 0.3,
                            borderRadius: `${radii.pill}px`,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            letterSpacing: 1,
                            color: dash.inkMuted,
                          }}
                        >
                          QUYỀN HẠN TRUY CẬP
                        </Typography>
                      </Divider>

                      {/* Danh sách Checkbox Phân Quyền */}
                      {loadingUserPermissions ? (
                        <Box sx={{ ...preset.centerFull, py: 8 }}>
                          <CircularProgress
                            size={34}
                            sx={{ color: dash.status.blue }}
                          />
                        </Box>
                      ) : (
                        <Box
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <FormGroup sx={{ gap: 1.5 }}>
                            {allPermissions.map((permName) => {
                              const isChecked = Boolean(
                                selectedUserPermissions[permName]
                              );
                              const meta = PERMISSION_META[permName] || {
                                title: permName.toUpperCase(),
                                description: "Quyền hạn trong hệ thống",
                              };
                              const isSelfAdminLocked =
                                isEditingSelf &&
                                permName === "admin" &&
                                isChecked;

                              return (
                                <Box
                                  key={permName}
                                  onClick={() =>
                                    handlePermissionToggle(permName)
                                  }
                                  sx={{
                                    p: 1.5,
                                    borderRadius: "8px",
                                    border: isChecked
                                      ? `1.5px solid ${dash.status.blue}`
                                      : `1px solid rgba(255, 255, 255, 0.08)`,
                                    bgcolor: isChecked
                                      ? "rgba(59, 130, 246, 0.16)"
                                      : "rgba(255, 255, 255, 0.03)",
                                    cursor: isSelfAdminLocked
                                      ? "not-allowed"
                                      : "pointer",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    "&:hover": {
                                      bgcolor: isChecked
                                        ? "rgba(59, 130, 246, 0.22)"
                                        : "rgba(255, 255, 255, 0.07)",
                                      borderColor: dash.status.blue,
                                    },
                                  }}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    disabled={isSelfAdminLocked}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={() =>
                                      handlePermissionToggle(permName)
                                    }
                                    sx={{
                                      p: 0.5,
                                      mr: 1,
                                      mt: 0.1,
                                      color: dash.inkMuted,
                                      "&.Mui-checked": {
                                        color: dash.status.blue,
                                      },
                                    }}
                                  />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="subtitle2"
                                      fontWeight={700}
                                      sx={{
                                        color: isChecked
                                          ? "#ffffff"
                                          : dash.inkSoft,
                                      }}
                                    >
                                      {meta.title}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: dash.inkMuted,
                                        fontSize: "0.75rem",
                                        display: "block",
                                        mt: 0.2,
                                      }}
                                    >
                                      {meta.description}
                                    </Typography>
                                    {isSelfAdminLocked && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: dash.status.warn,
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                          display: "block",
                                          mt: 0.4,
                                        }}
                                      >
                                        Bảo vệ an toàn: Không thể tự gỡ quyền Quản trị của chính mình.
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </FormGroup>

                          {/* Nút hành động */}
                          <Box
                            sx={{
                              mt: 3.5,
                              display: "flex",
                              gap: 1.5,
                              alignItems: "center",
                            }}
                          >
                            <Button
                              variant="contained"
                              startIcon={
                                savingPermissions ? (
                                  <CircularProgress size={18} color="inherit" />
                                ) : (
                                  <Save />
                                )
                              }
                              onClick={handleSavePermissions}
                              disabled={savingPermissions || !hasChanges}
                              sx={{
                                px: 3.5,
                                py: 1.1,
                                borderRadius: "8px",
                                background: dash.gradients.primary,
                                color: "#ffffff",
                                fontWeight: 700,
                                boxShadow: dash.shadows.button,
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  background: dash.gradients.primaryHover,
                                  transform: "translateY(-1px)",
                                  boxShadow: dash.shadows.buttonHover,
                                },
                                "&:disabled": {
                                  background: "rgba(30, 64, 175, 0.35)",
                                  color: "rgba(255, 255, 255, 0.55)",
                                },
                              }}
                            >
                              Lưu thay đổi
                            </Button>

                            {hasChanges && (
                              <Button
                                variant="outlined"
                                onClick={handleResetPermissions}
                                disabled={savingPermissions}
                                sx={{
                                  color: dash.inkSoft,
                                  borderColor: dash.border,
                                  borderRadius: "8px",
                                  "&:hover": {
                                    color: "#ffffff",
                                    borderColor: dash.borderStrong,
                                  },
                                }}
                              >
                                Hoàn tác
                              </Button>
                            )}
                          </Box>
                        </Box>
                      )}
                    </>
                  ) : (
                    /* Trạng thái chưa chọn nhân viên nào */
                    <Box
                      sx={{
                        ...preset.centerFull,
                        flexDirection: "column",
                        color: dash.inkMuted,
                        py: 10,
                      }}
                    >
                      <Box
                        sx={{
                          width: 76,
                          height: 76,
                          borderRadius: `${radii.pill}px`,
                          bgcolor: "rgba(59, 130, 246, 0.12)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                        }}
                      >
                        <Person
                          sx={{
                            fontSize: 40,
                            color: dash.series[0],
                            opacity: 0.8,
                          }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="#ffffff">
                        Chưa chọn nhân viên
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: dash.inkMuted,
                          maxWidth: 360,
                          textAlign: "center",
                          mt: 0.5,
                        }}
                      >
                        Chọn một nhân viên trong danh sách bên trái hoặc tìm kiếm
                        theo số thẻ để thiết lập quyền truy cập hệ thống.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* ── HỘP THOẠI XÁC NHẬN THU HỒI TOÀN BỘ QUYỀN ──────────────────────── */}
      <Dialog
        open={confirmRevokeOpen}
        onClose={() => setConfirmRevokeOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: dash.menu,
            color: dash.ink,
            border: `1px solid ${dash.borderStrong}`,
            borderRadius: "12px",
            boxShadow: dash.shadows.floating,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 800, color: "#ffffff" }}>
          <Warning sx={{ color: dash.status.warn }} />
          Xác nhận thu hồi toàn bộ quyền?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: dash.inkSoft }}>
            Bạn đang bỏ chọn tất cả quyền của nhân viên{" "}
            <strong>{selectedUser?.ten_nv}</strong> ({selectedUser?.ma_nv}). Sau
            khi lưu, nhân viên này sẽ không còn trong danh sách Đã cấp quyền.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmRevokeOpen(false)}
            sx={{ color: dash.inkSoft }}
          >
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={executeSavePermissions}
            sx={{ fontWeight: 700 }}
          >
            Xác nhận thu hồi
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── HỘP THOẠI XÁC NHẬN CHUYỂN NHÂN VIÊN KHI CÓ THAY ĐỔI CHƯA LƯU ─── */}
      <Dialog
        open={Boolean(pendingSelectUser)}
        onClose={() => setPendingSelectUser(null)}
        PaperProps={{
          sx: {
            bgcolor: dash.menu,
            color: dash.ink,
            border: `1px solid ${dash.borderStrong}`,
            borderRadius: "12px",
            boxShadow: dash.shadows.floating,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#ffffff" }}>
          Bỏ qua thay đổi chưa lưu?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: dash.inkSoft }}>
            Bạn có thay đổi phân quyền chưa lưu cho{" "}
            <strong>{selectedUser?.ten_nv}</strong>. Bạn có muốn hủy các thay đổi
            này để chuyển sang <strong>{pendingSelectUser?.ten_nv}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setPendingSelectUser(null)}
            sx={{ color: dash.inkSoft }}
          >
            Ở lại
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const target = pendingSelectUser;
              setPendingSelectUser(null);
              loadUserPermissions(target);
            }}
            sx={{
              background: dash.gradients.primary,
              color: "#ffffff",
              fontWeight: 700,
            }}
          >
            Bỏ thay đổi &amp; Chuyển
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── THÔNG BÁO SNACKBAR ─────────────────────────────────────────── */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: "8px", fontWeight: 600 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default AdminPage;
