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
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import API from "../api/api";

const CoPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [coData, setCoData] = useState({
    id_plan: id,
    CO_begin_date: "",
    CO_end_date: "",
    first_garment_of_new_style: "",
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plan details
        const planData = await API.getPlanById(id);
        setPlan(planData);

        // In a real app, you would fetch the CO data here
        // For now, we'll simulate it with a timeout
        setTimeout(() => {
          setLoading(false);
        }, 500);
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
    setCoData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (e) => {
    setCoData((prev) => ({
      ...prev,
      carry_over: e.target.checked ? 1 : 0,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setCoData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // In a real app, this would save the CO data to the backend
    console.log("Saving CO data:", coData);
    alert("Dữ liệu đã được lưu thành công!");
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
                  sx={{ mb: 2 }}
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
                  sx={{ mb: 2 }}
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
                  label="Ngày bắt đầu CO"
                  type="datetime-local"
                  name="CO_begin_date"
                  value={coData.CO_begin_date}
                  onChange={handleDateChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Ngày kết thúc CO"
                  type="datetime-local"
                  name="CO_end_date"
                  value={coData.CO_end_date}
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
                  name="first_garment_of_new_style"
                  value={coData.first_garment_of_new_style}
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
                  label="Khách hàng"
                  name="buyer"
                  value={coData.buyer}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Loại sản xuất"
                  name="production_style"
                  value={coData.production_style}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SAM"
                  name="SAM"
                  value={coData.SAM}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nhân sự"
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
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="COPT (Thời gian chuyển đổi trong)"
                  name="COPT"
                  value={coData.COPT}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Mục tiêu COT"
                  name="target_of_COT"
                  value={coData.target_of_COT}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="COT (Thời gian chuyển đổi)"
                  name="COT"
                  value={coData.COT}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
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
