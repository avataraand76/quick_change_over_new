// frontend/src/pages/AdminPage.jsx

import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  IconButton,
  InputAdornment,
  Chip,
  TableContainer,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
} from "@mui/material";
import {
  Search as SearchIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import NotificationDialog from "../components/NotificationDialog";

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState({
    direct: [],
    roles: [],
    workshops: [],
  });

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

  const [allUsers, setAllUsers] = useState([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingAllUsers(true);
        const [permissionsData, rolesData, workshopsData, allUsersData] =
          await Promise.all([
            API.getPermissions(),
            API.getRoles(),
            API.getWorkshops(),
            API.getAllUsers(),
          ]);
        setPermissions(permissionsData);
        setRoles(rolesData);
        setWorkshops(workshopsData);
        setAllUsers(allUsersData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        showNotification(
          "Lỗi",
          "Không thể tải dữ liệu quyền và vai trò",
          "error"
        );
      } finally {
        setLoadingAllUsers(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await API.searchUsers(searchTerm);
      setUsers(response);
    } catch (error) {
      console.error("Error searching users:", error);
      showNotification("Lỗi", "Không thể tìm kiếm người dùng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    // Fetch current permissions for the user
    const fetchUserPermissions = async () => {
      try {
        const userPerms = await API.getUserPermissions(user.id_nhan_vien);
        setEditingPermissions({
          direct: userPerms.direct || [],
          roles: userPerms.roles || [],
          workshops: userPerms.workshops || [],
        });
        setEditDialogOpen(true);
      } catch (error) {
        console.error("Error fetching user permissions:", error);
        showNotification(
          "Lỗi",
          "Không thể tải thông tin phân quyền người dùng",
          "error"
        );
      }
    };
    fetchUserPermissions();
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    try {
      await API.saveUserPermissions(
        selectedUser.id_nhan_vien,
        editingPermissions
      );
      setEditDialogOpen(false);
      showNotification("Thành công", "Đã cập nhật phân quyền", "success");

      // Refresh both user lists
      if (searchTerm.trim()) {
        handleSearch();
      }

      // Refresh all users list
      setLoadingAllUsers(true);
      try {
        const allUsersData = await API.getAllUsers();
        setAllUsers(allUsersData);
      } catch (error) {
        console.error("Error refreshing all users:", error);
      } finally {
        setLoadingAllUsers(false);
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      showNotification("Lỗi", "Không thể cập nhật phân quyền", "error");
    }
  };

  const showNotification = (title, message, severity = "info") => {
    setNotification({
      open: true,
      title,
      message,
      severity,
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          Quay lại trang chủ
        </Button>
      </Box>

      <Card
        elevation={4}
        sx={{
          marginTop: 2,
          borderRadius: 2,
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            bgcolor: "#1976d2",
            padding: 2,
            color: "white",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            QUẢN LÝ PHÂN QUYỀN NGƯỜI DÙNG
          </Typography>
        </Box>

        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Tìm Kiếm Người Dùng
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                size="small"
                placeholder="Nhập tên hoặc mã nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                sx={{ width: 400 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Tìm Kiếm"
                )}
              </Button>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Mã NV
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Tên Nhân Viên
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Công Việc
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Bộ Phận
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Quyền Trực Tiếp
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Vai Trò
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    Bộ phận
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                    {/* Thao Tác */}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id_nhan_vien}
                    sx={{
                      "&:nth-of-type(odd)": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    <TableCell>{user.ma_nv}</TableCell>
                    <TableCell>{user.ten_nv}</TableCell>
                    <TableCell>{user.cong_viec_phu_trach}</TableCell>
                    <TableCell>{user.ten_bo_phan}</TableCell>
                    <TableCell>
                      {user.permissions?.direct?.map((perm) => (
                        <Chip
                          key={perm.id_permission}
                          label={perm.name_permission}
                          size="small"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            bgcolor: "#e3f2fd",
                          }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {user.permissions?.byRole?.map((role) => (
                        <Chip
                          key={role.id_role}
                          label={role.name_role}
                          size="small"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            bgcolor: "#f3e5f5",
                          }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {user.permissions?.byWorkshop?.map((workshop) => (
                        <Chip
                          key={workshop.id_workshop}
                          label={workshop.name_workshop}
                          size="small"
                          sx={{
                            mr: 0.5,
                            mb: 0.5,
                            bgcolor: "#e8f5e9",
                          }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEditUser(user)}
                        sx={{ textTransform: "none" }}
                      >
                        Phân Quyền
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography
                        variant="body1"
                        textAlign="center"
                        color="text.secondary"
                      >
                        Chưa có người dùng nào được tìm kiếm
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card elevation={4} sx={{ mt: 2, borderRadius: 2, overflow: "visible" }}>
        <Box
          sx={{
            bgcolor: "#1976d2",
            padding: 2,
            color: "white",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            DANH SÁCH TẤT CẢ NGƯỜI DÙNG
          </Typography>
        </Box>
        <CardContent>
          {loadingAllUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#1976d2" }}>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Mã NV
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Tên Nhân Viên
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Công Việc
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Bộ Phận
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Quyền Trực Tiếp
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Vai Trò
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Bộ phận
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      {/* Thao Tác */}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow
                      key={user.id_nhan_vien}
                      sx={{
                        "&:nth-of-type(odd)": { backgroundColor: "#f5f5f5" },
                      }}
                    >
                      <TableCell>{user.ma_nv}</TableCell>
                      <TableCell>{user.ten_nv}</TableCell>
                      <TableCell>{user.cong_viec_phu_trach}</TableCell>
                      <TableCell>{user.ten_bo_phan}</TableCell>
                      <TableCell>
                        {user.permissions?.direct?.map((perm) => (
                          <Chip
                            key={perm.id_permission}
                            label={perm.name_permission}
                            size="small"
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              bgcolor: "#e3f2fd",
                            }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        {user.permissions?.byRole?.map((role) => (
                          <Chip
                            key={role.id_role}
                            label={role.name_role}
                            size="small"
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              bgcolor: "#f3e5f5",
                            }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        {user.permissions?.byWorkshop?.map((workshop) => (
                          <Chip
                            key={workshop.id_workshop}
                            label={workshop.name_workshop}
                            size="small"
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              bgcolor: "#e8f5e9",
                            }}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditUser(user)}
                          sx={{ textTransform: "none" }}
                        >
                          Phân Quyền
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allUsers.length === 0 && !loadingAllUsers && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography
                          variant="body1"
                          textAlign="center"
                          color="text.secondary"
                        >
                          Không có người dùng nào trong hệ thống
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog phân quyền */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Phân Quyền Cho {selectedUser?.ma_nv}: {selectedUser?.ten_nv}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Quyền trực tiếp */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#1976d2" }}
              >
                Quyền Trực Tiếp
              </Typography>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}
              >
                <Grid container spacing={1}>
                  {permissions.map((permission) => (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={permission.id_permission}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingPermissions.direct.includes(
                              permission.id_permission
                            )}
                            onChange={(e) => {
                              const newPermissions = e.target.checked
                                ? [
                                    ...editingPermissions.direct,
                                    permission.id_permission,
                                  ]
                                : editingPermissions.direct.filter(
                                    (id) => id !== permission.id_permission
                                  );
                              setEditingPermissions({
                                ...editingPermissions,
                                direct: newPermissions,
                              });
                            }}
                            sx={{ "&.Mui-checked": { color: "#1976d2" } }}
                          />
                        }
                        label={permission.name_permission}
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          p: 1,
                          width: "100%",
                          m: 0,
                          bgcolor: "white",
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Vai trò */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#9c27b0" }}
              >
                Vai Trò
              </Typography>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "#fdf7ff", borderRadius: 2 }}
              >
                <Grid container spacing={1}>
                  {roles.map((role) => (
                    <Grid item xs={12} sm={6} md={4} key={role.id_role}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingPermissions.roles.includes(
                              role.id_role
                            )}
                            onChange={(e) => {
                              const newRoles = e.target.checked
                                ? [...editingPermissions.roles, role.id_role]
                                : editingPermissions.roles.filter(
                                    (id) => id !== role.id_role
                                  );
                              setEditingPermissions({
                                ...editingPermissions,
                                roles: newRoles,
                              });
                            }}
                            sx={{ "&.Mui-checked": { color: "#9c27b0" } }}
                          />
                        }
                        label={role.name_role}
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          p: 1,
                          width: "100%",
                          m: 0,
                          bgcolor: "white",
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>

            {/* Bộ phận */}
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: "bold", color: "#2e7d32" }}
              >
                Bộ phận
              </Typography>
              <Paper
                elevation={0}
                sx={{ p: 2, bgcolor: "#f6fbf6", borderRadius: 2 }}
              >
                <Grid container spacing={1}>
                  {workshops.map((workshop) => (
                    <Grid item xs={12} sm={6} md={4} key={workshop.id_workshop}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingPermissions.workshops.includes(
                              workshop.id_workshop
                            )}
                            onChange={(e) => {
                              const newWorkshops = e.target.checked
                                ? [
                                    ...editingPermissions.workshops,
                                    workshop.id_workshop,
                                  ]
                                : editingPermissions.workshops.filter(
                                    (id) => id !== workshop.id_workshop
                                  );
                              setEditingPermissions({
                                ...editingPermissions,
                                workshops: newWorkshops,
                              });
                            }}
                            sx={{ "&.Mui-checked": { color: "#2e7d32" } }}
                          />
                        }
                        label={workshop.name_workshop}
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          p: 1,
                          width: "100%",
                          m: 0,
                          bgcolor: "white",
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            variant="outlined"
            color="inherit"
            sx={{ mr: 1 }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSavePermissions}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Lưu Thay Đổi
          </Button>
        </DialogActions>
      </Dialog>

      <NotificationDialog
        open={notification.open}
        onClose={handleCloseNotification}
        title={notification.title}
        message={notification.message}
        severity={notification.severity}
      />
    </Container>
  );
};

export default AdminPage;
