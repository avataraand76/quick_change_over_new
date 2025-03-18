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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import API from "../api/api";

// Danh sách khách hàng
const BUYERS = [
  "SIV-NIKE",
  "ASC-DRI DUCK",
  "ASC-LE COQ",
  "TAHSHIN",
  "TIEN TIEN",
  "MITSU",
  "NAM YANG",
  "VIETTIEN",
  "THIENTHANH",
  "VIETTHINH",
  "TEXGIANG",
  "VANS",
  "SKECHERS",
  "ORVIS-TASHIN",
  "RUSSELL",
  "DESCENTE",
];

// Danh sách loại sản xuất
const PRODUCTION_STYLES = ["JACKET", "VEST", "PANTS", "SHORTS"];

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

  // Add calculation functions
  const calculateTargetOfCOPT = (sam) => {
    if (!sam) return "";
    return (parseFloat(sam) * 3).toString();
  };

  const calculateTargetOfCOT = (productionStyle) => {
    if (!productionStyle) return "";
    if (["JACKET", "VEST"].includes(productionStyle)) return "30";
    if (["PANTS", "SHORTS"].includes(productionStyle)) return "20";
    return "";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plan details
        const planData = await API.getPlanById(id);
        setPlan(planData);

        // Fetch CO data
        try {
          const coData = await API.getCoDataByPlanId(id);
          setCoData({
            id_plan: id,
            CO_begin_date: coData.CO_begin_date || planData.actual_date || "",
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
          // If CO data doesn't exist yet, use plan's actual_date for CO_begin_date
          setCoData((prev) => ({
            ...prev,
            CO_begin_date: planData.actual_date || "",
          }));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Không thể tải thông tin chi tiết");
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
      // Save CO data to the backend
      await API.updateCoData(id, coData);
      alert("Dữ liệu đã được lưu thành công!");
    } catch (error) {
      console.error("Error saving CO data:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      alert("Lỗi khi lưu dữ liệu. Vui lòng thử lại!");
    }
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
            </Grid>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Thời gian chuyển đổi
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
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
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Thời gian kết thúc mã hàng cũ"
                  type="datetime-local"
                  name="last_garment_of_old_style"
                  value={formatDateForInput(coData.last_garment_of_old_style)}
                  onChange={handleDateChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{ mb: 2 }}
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
                <TextField
                  select
                  label="Khách hàng"
                  name="buyer"
                  value={coData.buyer}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">
                    <em>Chọn khách hàng</em>
                  </MenuItem>
                  {BUYERS.map((buyer) => (
                    <MenuItem key={buyer} value={buyer}>
                      {buyer}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Loại"
                  name="production_style"
                  value={coData.production_style}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  <MenuItem value="">
                    <em>Chọn loại</em>
                  </MenuItem>
                  {PRODUCTION_STYLES.map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SAM"
                  name="SAM"
                  value={coData.SAM}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="text"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Sơ đồ chuyền"
                  name="staff"
                  value={coData.staff}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Định mức"
                  name="quota"
                  value={coData.quota}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="text"
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
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
                  }}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={coData.carry_over === 1}
                      onChange={handleSwitchChange}
                    />
                  }
                  label="Lặp lại (Carry Over)"
                  sx={{ mt: 1 }}
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
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CoPage;
