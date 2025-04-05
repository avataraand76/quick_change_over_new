// frontend/src/pages/CoPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  LinearProgress,
  FormControlLabel,
  Switch,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import API from "../api/api";
import NotificationDialog from "../components/NotificationDialog";
import PermissionCheck from "../components/PermissionCheck";

// Helper function to format dates for datetime-local input
const formatDateForInput = (dateString) => {
  if (!dateString) return "";

  try {
    // Handle both formats: ISO string and MySQL datetime format
    let date;

    // If it already has the "T" delimiter, it's in ISO format
    if (typeof dateString === "string" && dateString.includes("T")) {
      date = new Date(dateString);
    }
    // If it has the MySQL format (YYYY-MM-DD HH:MM:SS)
    else if (typeof dateString === "string" && dateString.includes(" ")) {
      // Replace space with 'T' to create valid ISO format
      date = new Date(dateString.replace(" ", "T"));
    }
    // Try to parse it as a regular date string
    else {
      date = new Date(dateString);
    }

    // Check if date is valid
    if (isNaN(date.getTime())) return "";

    // Format as YYYY-MM-DDThh:mm (format required by datetime-local input)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error("Date formatting error:", error, "for date:", dateString);
    return "";
  }
};

const CoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [coData, setCoData] = useState({
    id_plan: id,
    CO_begin_date: "",
    CO_end_date: "",
    last_garment_of_old_style: "",
    carry_over: 0,
    buyer: "",
    production_style: "",
    SAM: "",
    staff: "",
    quota: "",
    eff_1: "",
    target_of_COPT: "",
    COPT: "",
    target_of_COT: "",
    COT: "",
  });
  const [loading, setLoading] = useState(true);
  const [downtimeIssues, setDowntimeIssues] = useState([]);
  const [loadingDowntime, setLoadingDowntime] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

  // Add calculation functions
  const calculateTargetOfCOPT = (sam) => {
    if (!sam) return "";
    return (parseFloat(sam) * 3).toString();
  };

  const calculateTargetOfCOT = (productionStyle) => {
    if (!productionStyle) return "";
    switch (productionStyle.toUpperCase()) {
      case "JACKET":
        return "30";
      case "VEST":
        return "30";
      case "PANTS":
        return "20";
      case "SHORTS":
        return "20";
      case "SKIRT":
        return "20";
      default:
        return "0"; // Giá trị mặc định cho các loại khác
    }
  };

  const calculateTimeDifference = (endDate, startDate) => {
    if (!endDate || !startDate) return "";
    const end = new Date(endDate);
    const start = new Date(startDate);
    const diffInHours = Math.abs(end - start) / (1000 * 60);
    return Math.round(diffInHours).toString();
  };

  // Update useEffect to recalculate values when dependencies change
  useEffect(() => {
    // Calculate target_of_COPT when SAM changes
    if (coData.SAM) {
      setCoData((prev) => ({
        ...prev,
        target_of_COPT: calculateTargetOfCOPT(prev.SAM),
      }));
    }

    // Calculate target_of_COT when production_style changes
    if (coData.production_style) {
      setCoData((prev) => ({
        ...prev,
        target_of_COT: calculateTargetOfCOT(prev.production_style),
      }));
    }

    // Calculate COPT when dates change
    if (coData.CO_end_date && coData.CO_begin_date) {
      setCoData((prev) => ({
        ...prev,
        COPT: calculateTimeDifference(prev.CO_end_date, prev.CO_begin_date),
      }));
    }

    // Calculate COT when dates change
    if (coData.CO_end_date && coData.last_garment_of_old_style) {
      setCoData((prev) => ({
        ...prev,
        COT: calculateTimeDifference(
          prev.CO_end_date,
          prev.last_garment_of_old_style
        ),
      }));
    }
  }, [
    coData.SAM,
    coData.production_style,
    coData.CO_end_date,
    coData.CO_begin_date,
    coData.last_garment_of_old_style,
  ]);

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const showNotification = (title, message, severity = "info") => {
    setNotification({
      open: true,
      title,
      message,
      severity,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plan details
        const planData = await API.getPlanById(id);
        setPlan(planData);

        // Fetch staff options if workshop is determined
        if (planData.workshop) {
          try {
            const allUsers = await API.getAllUsers();
            // Filter users who have role_id=1 and matching workshop_id
            const filteredUsers = allUsers.filter(
              (user) =>
                user.permissions.byRole.some((role) => role.id_role === 1) &&
                user.permissions.byWorkshop.some(
                  (workshop) => workshop.id_workshop === planData.workshop
                )
            );
            setStaffOptions(filteredUsers);
          } catch (error) {
            console.error("Error fetching staff options:", error);
          }
        }

        // Fetch CO data
        try {
          const coData = await API.getCoDataByPlanId(id);
          setCoData({
            id_plan: id,
            CO_begin_date: coData.CO_begin_date || "",
            CO_end_date: coData.CO_end_date || "",
            last_garment_of_old_style: coData.last_garment_of_old_style || "",
            carry_over: coData.carry_over || 0,
            buyer: coData.buyer || "",
            production_style: coData.production_style || "",
            SAM: coData.SAM || "",
            staff: coData.staff || "",
            quota: coData.quota || "",
            eff_1: coData.eff_1 || "",
            target_of_COPT: coData.target_of_COPT || "",
            COPT: coData.COPT || "",
            target_of_COT: coData.target_of_COT || "",
            COT: coData.COT || "",
          });
        } catch (error) {
          console.error("Error fetching CO data:", error);
          setCoData((prev) => ({
            ...prev,
            CO_begin_date: planData.actual_date || "",
            buyer: planData.buyer || "",
            production_style: planData.production_style || "",
          }));
        }

        setLoading(false);

        // Fetch downtime issues after getting plan and CO data
        try {
          const downtimeData = await API.getDowntimeIssues(id);
          setDowntimeIssues(downtimeData);
        } catch (error) {
          console.error("Error fetching downtime issues:", error);
        } finally {
          setLoadingDowntime(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showNotification("Lỗi", "Không thể tải thông tin chi tiết", "error");
        navigate("/create-phase");
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Danh sách các trường kiểu số
    const numericFields = [
      "SAM",
      "quota",
      "eff_1",
      "target_of_COPT",
      "COPT",
      "target_of_COT",
      "COT",
    ];

    // Danh sách các trường dropdown
    const dropdownFields = ["buyer", "production_style"];

    // Nếu là trường kiểu số, chỉ cho phép nhập số
    if (numericFields.includes(name)) {
      // Trường hợp input là rỗng hoặc là số
      if (value === "" || /^[0-9]*$/.test(value)) {
        // Nếu value rỗng, sẽ lưu là 0 khi submit
        setCoData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }
    // Nếu là trường dropdown, cập nhật giá trị bình thường
    else if (dropdownFields.includes(name)) {
      setCoData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Đối với các trường khác, giữ nguyên xử lý
    else {
      setCoData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSwitchChange = (e) => {
    setCoData((prev) => ({
      ...prev,
      carry_over: e.target.checked ? 1 : 0,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // For datetime-local inputs, keep the ISO format for sending to the backend
    // but the display value will be formatted by formatDateForInput
    if (value) {
      // Add seconds to the time to match MySQL datetime format
      const formattedValue = value + ":00";
      setCoData((prev) => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setCoData((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSave = async () => {
    try {
      await API.updateCoData(id, coData);
      showNotification(
        "Thành công",
        "Dữ liệu đã được lưu thành công!",
        "success"
      );

      setLoadingDowntime(true);
      try {
        const downtimeData = await API.getDowntimeIssues(id);
        setDowntimeIssues(downtimeData);
      } catch (error) {
        console.error("Error fetching downtime issues:", error);
      } finally {
        setLoadingDowntime(false);
      }
    } catch (error) {
      console.error("Error saving CO data:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      showNotification(
        "Lỗi",
        "Lỗi khi lưu dữ liệu. Vui lòng thử lại!",
        "error"
      );
    }
  };

  // Helper function to format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  // Calculate total downtime
  const calculateTotalDowntime = (issues) => {
    return issues.reduce((total, issue) => {
      return total + (parseInt(issue.downtime_minutes) || 0);
    }, 0);
  };

  // Format downtime minutes to hours and minutes
  const formatDowntime = (minutes) => {
    if (!minutes || isNaN(minutes)) return "0 phút";

    // if (minutes < 60) {
    //   return `${minutes} phút`;
    // }

    // const hours = Math.floor(minutes / 60);
    // const remainingMinutes = minutes % 60;

    // if (remainingMinutes === 0) {
    //   return `${hours} giờ`;
    // }

    // return `${hours} giờ ${remainingMinutes} phút`;
    return `${minutes} phút`;
  };

  // Calculate downtime by category
  const calculateDowntimeByCategory = (issues) => {
    const categories = {};

    issues.forEach((issue) => {
      const category = issue.name_category || "Không phân loại";
      const downtime = parseInt(issue.downtime_minutes) || 0;

      if (!categories[category]) {
        categories[category] = {
          totalDowntime: 0,
          count: 0,
        };
      }

      categories[category].totalDowntime += downtime;
      categories[category].count += 1;
    });

    // Convert to array for sorting
    return Object.entries(categories)
      .map(([name, data]) => ({
        name,
        totalDowntime: data.totalDowntime,
        count: data.count,
      }))
      .sort((a, b) => b.totalDowntime - a.totalDowntime);
  };

  if (loading || !plan) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LinearProgress sx={{ width: "50%" }} />
      </Box>
    );
  }

  // Calculate total downtime and category stats
  const totalDowntime = calculateTotalDowntime(downtimeIssues);
  const downtimeByCategory = calculateDowntimeByCategory(downtimeIssues);

  // Get unique categories for filter dropdown
  const uniqueCategories = [
    "all",
    ...new Set(
      downtimeIssues.map((issue) => issue.name_category).filter(Boolean)
    ),
  ];

  // Filter issues based on selected category
  const filteredIssues =
    categoryFilter === "all"
      ? downtimeIssues
      : downtimeIssues.filter(
          (issue) => issue.name_category === categoryFilter
        );

  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/detailed-phase/${id}`)}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          Quay lại
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
            THÔNG TIN CHUYỂN ĐỔI (CO)
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Thông tin chuyền/mã hàng
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Chuyền"
                  value={`Chuyền ${plan.line || ""}`}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mã Hàng"
                  value={plan.style || ""}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Loại"
                  value={coData.production_style || ""}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Khách Hàng"
                  value={coData.buyer || ""}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Thời gian chuyển đổi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      label="Thời gian bắt đầu chuyển đổi"
                      type="datetime-local"
                      name="CO_begin_date"
                      value={formatDateForInput(coData.CO_begin_date)}
                      onChange={handleDateChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                      InputProps={{
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      label="Thời gian hoàn thành chuyển đổi"
                      type="datetime-local"
                      name="CO_end_date"
                      value={formatDateForInput(coData.CO_end_date)}
                      onChange={handleDateChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                      InputProps={{
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      label="Thời gian kết thúc mã hàng cũ"
                      type="datetime-local"
                      name="last_garment_of_old_style"
                      value={formatDateForInput(
                        coData.last_garment_of_old_style
                      )}
                      onChange={handleDateChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                      InputProps={{
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Thông tin sản xuất
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      label="SAM"
                      name="SAM"
                      value={coData.SAM || ""}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      type="text"
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      sx={{ mb: 2 }}
                      InputProps={{
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      select
                      label="Nhân Viên Sơ đồ chuyền"
                      name="staff"
                      value={coData.staff}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      sx={{ mb: 2 }}
                      InputProps={{
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                    >
                      <MenuItem value="">
                        <em>Chọn nhân viên SĐC</em>
                      </MenuItem>
                      {staffOptions.map((user) => (
                        <MenuItem
                          key={user.id_nhan_vien}
                          value={`${user.ten_nv}`}
                        >
                          {user.ten_nv}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      label="Định mức"
                      name="quota"
                      value={coData.quota || ""}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      type="text"
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      sx={{ mb: 2 }}
                      InputProps={{
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <TextField
                      label="Eff ngày 1"
                      name="eff_1"
                      value={coData.eff_1}
                      onChange={handleChange}
                      fullWidth
                      type="text"
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">%</InputAdornment>
                        ),
                        readOnly: !hasPermission,
                        sx: {
                          backgroundColor: !hasPermission
                            ? "#ffffcc"
                            : "inherit",
                        },
                      }}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <PermissionCheck
                  requiredRole={[1]}
                  renderContent={(hasPermission) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={coData.carry_over === 1}
                          onChange={handleSwitchChange}
                          disabled={!hasPermission}
                        />
                      }
                      label="Lặp lại (Carry Over)"
                      sx={{ mt: 1 }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Mục tiêu chuyển đổi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Mục tiêu COPT"
                  name="target_of_COPT"
                  value={coData.target_of_COPT}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="COPT (Thời gian chuyển đổi trong)"
                  name="COPT"
                  value={coData.COPT}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Mục tiêu COT"
                  name="target_of_COT"
                  value={coData.target_of_COT}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="COT (Thời gian chuyển đổi)"
                  name="COT"
                  value={coData.COT}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2, backgroundColor: "#ffffcc" }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <PermissionCheck
              requiredRole={[1]}
              renderContent={(hasPermission) =>
                hasPermission && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    size="large"
                    sx={{
                      minWidth: 150,
                      borderRadius: 2,
                      boxShadow: 2,
                      "&:hover": {
                        boxShadow: 4,
                      },
                    }}
                  >
                    Lưu Thông Tin
                  </Button>
                )
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* New Card for Downtime Issues */}
      <Card
        elevation={4}
        sx={{
          marginTop: 4,
          marginBottom: 4,
          borderRadius: 2,
          overflow: "visible",
        }}
      >
        <Box
          sx={{
            bgcolor: "#d32f2f",
            padding: 2,
            color: "white",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            DOWNTIME CHUYỂN ĐỔI
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          {loadingDowntime ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <LinearProgress sx={{ width: "50%" }} />
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  mb: 4,
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    flex: 1,
                    minWidth: 220,
                    borderRadius: 2,
                    background: "linear-gradient(to right, #d32f2f, #ef5350)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 8,
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Tổng thời gian Downtime
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatDowntime(totalDowntime)}
                  </Typography>
                </Paper>

                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    flex: 1,
                    minWidth: 220,
                    borderRadius: 2,
                    background: "linear-gradient(to right, #1976d2, #42a5f5)",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: 8,
                    },
                  }}
                >
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    Tổng số sự cố
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {downtimeIssues.length}
                  </Typography>
                </Paper>
              </Box>

              {downtimeIssues.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    color="primary"
                    gutterBottom
                    sx={{
                      pb: 1,
                      borderBottom: "2px solid #1976d2",
                      display: "inline-block",
                      fontWeight: "bold",
                    }}
                  >
                    Thống kê theo phạm vi vấn đề
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {downtimeByCategory.map((category) => {
                      // Assign specific colors based on category type
                      let darkColor, lightColor;

                      // Match category names to their corresponding colors
                      const categoryLower = category.name.toLowerCase();

                      if (
                        categoryLower.includes("máy") ||
                        categoryLower.includes("machine") ||
                        categoryLower.includes("thiết bị")
                      ) {
                        // Machine issues - Red
                        darkColor = "#d32f2f";
                        lightColor = "#ef5350";
                      } else if (
                        categoryLower.includes("người") ||
                        categoryLower.includes("nhân viên") ||
                        categoryLower.includes("nhân sự") ||
                        categoryLower.includes("human") ||
                        categoryLower.includes("person")
                      ) {
                        // People issues - Orange
                        darkColor = "#f57c00";
                        lightColor = "#ffb74d";
                      } else if (
                        categoryLower.includes("nguyên") ||
                        categoryLower.includes("vật liệu") ||
                        categoryLower.includes("phụ liệu") ||
                        categoryLower.includes("material")
                      ) {
                        // Material issues - Blue
                        darkColor = "#1976d2";
                        lightColor = "#42a5f5";
                      } else if (
                        categoryLower.includes("phương pháp") ||
                        categoryLower.includes("quy trình") ||
                        categoryLower.includes("method") ||
                        categoryLower.includes("process")
                      ) {
                        // Method issues - Green
                        darkColor = "#388e3c";
                        lightColor = "#66bb6a";
                      } else {
                        // Default fallback - Purple
                        darkColor = "#7b1fa2";
                        lightColor = "#ab47bc";
                      }

                      return (
                        <Grid item xs={12} sm={6} md={4} key={category.name}>
                          <Paper
                            elevation={3}
                            sx={{
                              p: 2,
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                              position: "relative",
                              overflow: "hidden",
                              borderRadius: 2,
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "translateY(-3px)",
                                boxShadow: 4,
                              },
                            }}
                          >
                            {/* Background accent */}
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "8px",
                                background: `linear-gradient(to right, ${darkColor}, ${lightColor})`,
                              }}
                            />

                            <Box sx={{ mt: 1 }}>
                              <Typography variant="h6" fontWeight="bold">
                                {category.name}
                              </Typography>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  mt: 2,
                                  mb: 1,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1,
                                    width: "48%",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Số lượng
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{ color: darkColor }}
                                  >
                                    {category.count}
                                  </Typography>
                                </Box>

                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    borderRadius: 1,
                                    px: 2,
                                    py: 1,
                                    width: "48%",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Downtime
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    sx={{ color: darkColor }}
                                  >
                                    {formatDowntime(category.totalDowntime)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {downtimeIssues.length > 0 ? (
                <>
                  <Box
                    sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}
                  >
                    <TextField
                      select
                      label="Lọc theo phạm vi vấn đề"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 200 }}
                    >
                      <MenuItem value="all">Tất cả</MenuItem>
                      {uniqueCategories
                        .filter((cat) => cat !== "all")
                        .map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Box>
                  <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{
                      mb: 3,
                      maxWidth: "100%",
                      overflowX: "auto",
                    }}
                  >
                    <Table
                      aria-label="downtime issues table"
                      size="small"
                      stickyHeader
                    >
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: "bold" }}>STT</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Thời gian bắt đầu
                          </TableCell>

                          <TableCell sx={{ fontWeight: "bold" }}>
                            Vị trí
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Phạm vi vấn đề
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Loại máy
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Mã thiết bị
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Mô tả lỗi
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Giải pháp
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Thời gian kết thúc
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Thời gian Downtime
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Mã hàng cũ
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Mã hàng mới
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Trạng thái
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredIssues.map((issue, index) => (
                          <TableRow key={issue.id_logged_issue}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              {formatDateDisplay(issue.submission_time)}
                            </TableCell>
                            <TableCell>{`${issue.line_number} - ${
                              issue.station_number || ""
                            }`}</TableCell>
                            <TableCell>{issue.name_category || ""}</TableCell>
                            <TableCell>{issue.machinery_type || ""}</TableCell>
                            <TableCell>{issue.machinery_code || ""}</TableCell>
                            <TableCell
                              sx={{ maxWidth: 200, overflowWrap: "break-word" }}
                            >
                              {issue.issue_description || ""}
                            </TableCell>
                            <TableCell
                              sx={{ maxWidth: 200, overflowWrap: "break-word" }}
                            >
                              {issue.solution_description || ""}
                            </TableCell>
                            <TableCell>
                              {formatDateDisplay(issue.end_time)}
                            </TableCell>
                            <TableCell>
                              {formatDowntime(issue.downtime_minutes)}
                            </TableCell>
                            <TableCell>
                              {issue.old_product_code || ""}
                            </TableCell>
                            <TableCell>
                              {issue.new_product_code || ""}
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={
                                  issue.status_logged_issue === "resolved" ? (
                                    <CheckCircleIcon />
                                  ) : (
                                    <ErrorIcon />
                                  )
                                }
                                label={
                                  issue.status_logged_issue === "resolved"
                                    ? "Đã giải quyết"
                                    : "Đang xử lý"
                                }
                                color={
                                  issue.status_logged_issue === "resolved"
                                    ? "success"
                                    : "error"
                                }
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    <p>
                      Không có sự cố nào được ghi nhận trong thời gian chuyển
                      đổi này.
                    </p>
                    <p>
                      (Vui lòng cập nhật Thời gian bắt đầu và hoàn thành chuyển
                      đổi để cập nhật dữ liệu Downtime)
                    </p>
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
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

export default CoPage;
