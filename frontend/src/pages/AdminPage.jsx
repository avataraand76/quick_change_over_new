// frontend/src/pages/AdminPage.jsx
//
// TRANG QUẢN TRỊ - PHÂN QUYỀN NGƯỜI DÙNG ĐỒNG BỘ THEO THEME DEEP NAVY DASHBOARD

import { useState, useEffect, useCallback } from "react";
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
  radii,
  sx as preset,
} from "../ui";
import MainLayout from "../components/MainLayout";
import { api } from "../api/api";

const PERMISSION_DESCRIPTIONS = {
  admin: "Toàn quyền quản trị hệ thống, phân quyền người dùng và cấu hình",
  edit: "Được phép nhập liệu, chỉnh sửa kế hoạch mã hàng và chuyền",
  view: "Chỉ được phép xem báo cáo và tra cứu dữ liệu dashboard",
};

const AdminPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  // Danh mục tất cả quyền từ hệ thống: ['admin', 'edit', 'view']
  const [allPermissions, setAllPermissions] = useState([]);

  // Tìm kiếm nhân viên
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Tab con danh sách bên trái: 0 = "Tìm kiếm", 1 = "Đã phân quyền"
  const [userListSubTab, setUserListSubTab] = useState(0);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // Người dùng đang được chọn
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState({});
  const [initialUserPermissions, setInitialUserPermissions] = useState({});
  const [loadingUserPermissions, setLoadingUserPermissions] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

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
  const fetchAssignedUsers = useCallback(async (isManual = false, isSilent = false) => {
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
  }, []);

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
  // Tự động fetch lại danh sách khi người dùng mở lại tab / mở F12 hoặc mỗi 3 phút
  useEffect(() => {
    let lastRefreshAt = Date.now();
    const AUTO_REFRESH_INTERVAL_MS = 3 * 60 * 1000; // 3 phút
    const MIN_VISIBILITY_GAP_MS = 5000; // Cách nhau tối thiểu 5s để tránh dồn request

    const triggerSilentRefresh = (isFocusEvent = false) => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (isFocusEvent && now - lastRefreshAt < MIN_VISIBILITY_GAP_MS) return;
      lastRefreshAt = now;
      fetchAssignedUsers(false, true); // Chạy ngầm (silent) không giật skeleton loading
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

  // 2. Tìm kiếm nhân viên
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

  // 3. Chọn 1 nhân viên để xem / sửa quyền
  const handleSelectUser = async (user) => {
    if (selectedUser && selectedUser.ma_nv === user.ma_nv) {
      return;
    }

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

  // 4. Bật/tắt checkbox quyền
  const handlePermissionToggle = (permName) => {
    setSelectedUserPermissions((prev) => ({
      ...prev,
      [permName]: !prev[permName],
    }));
  };

  // 5. Kiểm tra có thay đổi quyền hay không
  const hasChanges = Object.keys(selectedUserPermissions).some(
    (key) => selectedUserPermissions[key] !== initialUserPermissions[key]
  );

  // 6. Lưu phân quyền
  const handleSavePermissions = async () => {
    if (!selectedUser) return;

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

  // Hoàn tác các thay đổi chưa lưu
  const handleResetPermissions = () => {
    setSelectedUserPermissions({ ...initialUserPermissions });
  };

  return (
    <MainLayout
      title="Trang Quản Trị"
      subtitle="Quản lý danh mục & phân quyền hệ thống QCO"
    >
      <Container maxWidth="xl" disableGutters>
        {/* ── 1. TIÊU ĐỀ TRANG QUẢN TRỊ (GLASSMORPHIC ERP BANNER) ────────── */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 3,
            p: { xs: 2, sm: 2.5 },
            background: dash.panel,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "10px",
            boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.28)",
            border: `1px solid ${dash.border}`,
          }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
              flexShrink: 0,
            }}
          >
            <AdminPanelSettings sx={{ color: "white", fontSize: 30 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: 0.5,
                lineHeight: 1.2,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              TRANG QUẢN TRỊ
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: dash.inkMuted, mt: 0.3, fontWeight: 500 }}
            >
              Quản lý danh mục &amp; phân quyền hệ thống QCO
            </Typography>
          </Box>
        </Box>

        {/* ── 2. KHUNG NỘI DUNG CHÍNH (GLASSMORPHIC ERP CARD) ────────────── */}
        <Box
          sx={{
            borderRadius: "10px",
            background: dash.panel,
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.32)",
            border: `1px solid ${dash.border}`,
            overflow: "hidden",
          }}
        >
          {/* Header Tabs */}
          <Box
            sx={{
              borderBottom: `1px solid ${dash.border}`,
              px: 3,
              pt: 1,
              bgcolor: "rgba(255, 255, 255, 0.02)",
            }}
          >
            <Tabs
              value={currentTab}
              onChange={(e, val) => setCurrentTab(val)}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  minHeight: 46,
                  px: 2.5,
                  mr: 1,
                  color: dash.inkMuted,
                  borderRadius: "8px 8px 0 0",
                  "&.Mui-selected": {
                    color: "#ffffff",
                    bgcolor: "rgba(255, 255, 255, 0.06)",
                  },
                },
                "& .MuiTabs-indicator": {
                  height: 3,
                  bgcolor: dash.status.blue,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              <Tab
                icon={<People fontSize="small" />}
                iconPosition="start"
                label="Phân Quyền"
              />
            </Tabs>
          </Box>

          {/* Nội dung tab phân quyền */}
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2.5}>
              {/* ── CỘT TRÁI: TÌM KIẾM NHÂN VIÊN ────────────────────────── */}
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
                    sx={{ mb: 2, fontSize: "1.05rem" }}
                  >
                    Tìm kiếm nhân viên
                  </Typography>

                  {/* Khung tìm kiếm */}
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Nhập Mã NV hoặc Tên (vd: 09802)..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          bgcolor: "rgba(255, 255, 255, 0.05)",
                          color: "#ffffff",
                          "& fieldset": { borderColor: dash.border },
                          "&:hover fieldset": { borderColor: "rgba(59, 130, 246, 0.4)" },
                          "&.Mui-focused fieldset": { borderColor: dash.status.blue },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: dash.inkMuted,
                          opacity: 1,
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSearchSubmit}
                      disabled={loadingUsers}
                      sx={{
                        minWidth: 46,
                        px: 2,
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                        },
                      }}
                    >
                      {loadingUsers ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <Search fontSize="small" />
                      )}
                    </Button>
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
                        minHeight: 34,
                        "& .MuiTab-root": {
                          minHeight: 34,
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
                      <Tab label={`Đã cấp quyền (${assignedUsers.length})`} />
                    </Tabs>

                    {userListSubTab === 1 && (
                      <Tooltip title="Làm mới danh sách">
                        <IconButton
                          size="small"
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
                            <CircularProgress size={30} sx={{ color: dash.status.blue }} />
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
                                      borderColor: "rgba(59, 130, 246, 0.35)",
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: 44 }}>
                                    <Avatar
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        bgcolor: isSelected
                                          ? dash.status.blue
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
                                        sx={{ color: dash.inkMuted, display: "block" }}
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
                              Nhập mã NV hoặc tên để tìm kiếm
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
                            <CircularProgress size={30} sx={{ color: dash.status.blue }} />
                          </Box>
                        ) : assignedUsers.length > 0 ? (
                          <List dense disablePadding>
                            {assignedUsers.map((user) => {
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
                                      borderColor: "rgba(59, 130, 246, 0.35)",
                                    },
                                  }}
                                >
                                  <ListItemAvatar sx={{ minWidth: 44 }}>
                                    <Avatar
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        bgcolor: isSelected
                                          ? dash.status.blue
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
                                          sx={{ color: dash.inkMuted, display: "block" }}
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
                                                height: 18,
                                                fontSize: "0.65rem",
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
                              Chưa có người dùng nào được cấp quyền
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
                            background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                            fontSize: "1.45rem",
                            fontWeight: 800,
                            boxShadow: "0 4px 16px rgba(37, 99, 235, 0.4)",
                          }}
                        >
                          {selectedUser.ten_nv.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h5"
                            fontWeight={800}
                            color="#ffffff"
                            sx={{ lineHeight: 1.2 }}
                          >
                            {selectedUser.ten_nv}
                          </Typography>
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
                              sx={{ color: dash.inkMuted, display: "block" }}
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
                      <Divider sx={{ my: 2.5, borderColor: dash.border }}>
                        <Typography
                          variant="caption"
                          sx={{
                            bgcolor: "rgba(255, 255, 255, 0.08)",
                            px: 1.5,
                            py: 0.3,
                            borderRadius: `${radii.pill}px`,
                            fontWeight: 700,
                            letterSpacing: 1,
                            color: dash.inkMuted,
                          }}
                        >
                          QUYỀN HẠN
                        </Typography>
                      </Divider>

                      {/* Danh sách Checkbox Phân Quyền */}
                      {loadingUserPermissions ? (
                        <Box sx={{ ...preset.centerFull, py: 8 }}>
                          <CircularProgress size={34} sx={{ color: dash.status.blue }} />
                        </Box>
                      ) : (
                        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                          <FormGroup sx={{ gap: 1.5 }}>
                            {allPermissions.map((permName) => {
                              const isChecked = Boolean(
                                selectedUserPermissions[permName]
                              );
                              const description =
                                PERMISSION_DESCRIPTIONS[permName] ||
                                "Quyền hạn trong hệ thống";

                              return (
                                <Box
                                  key={permName}
                                  onClick={() => handlePermissionToggle(permName)}
                                  sx={{
                                    p: 1.5,
                                    borderRadius: "8px",
                                    border: isChecked
                                      ? `1.5px solid ${dash.status.blue}`
                                      : `1px solid rgba(255, 255, 255, 0.08)`,
                                    bgcolor: isChecked
                                      ? "rgba(59, 130, 246, 0.16)"
                                      : "rgba(255, 255, 255, 0.03)",
                                    cursor: "pointer",
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
                                    onChange={() => handlePermissionToggle(permName)}
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
                                        textTransform: "uppercase",
                                        color: isChecked ? "#ffffff" : dash.inkSoft,
                                      }}
                                    >
                                      {permName}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ color: dash.inkMuted, display: "block", mt: 0.2 }}
                                    >
                                      {description}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </FormGroup>

                          {/* Nút hành động */}
                          <Box sx={{ mt: 3.5, display: "flex", gap: 1.5, alignItems: "center" }}>
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
                              disabled={savingPermissions}
                              sx={{
                                px: 4,
                                py: 1.1,
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                                color: "#ffffff",
                                fontWeight: 700,
                                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                                  transform: "translateY(-1px)",
                                },
                              }}
                            >
                              Lưu thay đổi
                            </Button>

                            {hasChanges && (
                              <Button
                                variant="text"
                                onClick={handleResetPermissions}
                                disabled={savingPermissions}
                                sx={{ color: dash.inkMuted, borderRadius: "8px", "&:hover": { color: "#ffffff" } }}
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
                        <Person sx={{ fontSize: 40, color: dash.series[0], opacity: 0.8 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} color="#ffffff">
                        Chưa chọn nhân viên
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: dash.inkMuted, maxWidth: 360, textAlign: "center", mt: 0.5 }}
                      >
                        Tìm kiếm nhân viên theo mã hoặc tên ở cột bên trái để xem và phân quyền sử dụng hệ thống.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* ── 3. THÔNG BÁO SNACKBAR ─────────────────────────────────────────── */}
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
