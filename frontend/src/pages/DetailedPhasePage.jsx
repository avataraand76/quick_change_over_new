// frontend/src/pages/DetailedPhasePage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import API from "../api/api";

const DetailedPhasePage = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [planDate, setPlanDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planResponse, processesResponse] = await Promise.all([
          API.getPlanById(id),
          API.getProcesses(),
        ]);

        if (planResponse.success === false) {
          alert("Không tìm thấy kế hoạch");
          navigate("/create-phase");
          return;
        }
        setPlan(planResponse);
        setProcesses(processesResponse);
        setPlanDate(formatDate(planResponse.plan_date));
        setActualDate(formatDate(planResponse.actual_date));
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Không thể tải thông tin chi tiết");
        navigate("/create-phase");
      }
    };
    fetchData();
  }, [id, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleUpdate = async () => {
    const updatedPlan = {
      ...plan,
      plan_date: planDate,
      actual_date: actualDate,
    };
    await API.updatePlan(id, updatedPlan);
    alert("Plan updated successfully");
  };

  if (!plan) return <div>Loading...</div>;

  return (
    <Container component="main">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, borderRadius: 5 }}>
        <Typography
          component="h1"
          variant="h5"
          sx={{ marginBottom: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          CHI TIẾT KẾ HOẠCH CHUYỂN ĐỔI
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Chuyền"
              value={`Chuyền ${plan.line || ""}`}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Mã Hàng"
              value={plan.style || ""}
              fullWidth
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Chọn Thời Gian CĐ Dự Kiến"
              type="datetime-local"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Chọn Thời Gian CĐ Thực Tế"
              type="datetime-local"
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" onClick={handleUpdate}>
              Cập Nhật
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, borderRadius: 5 }}>
        <Typography
          component="h2"
          variant="h5"
          sx={{ marginBottom: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          DANH SÁCH QUY TRÌNH
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên Quy Trình</TableCell>
              <TableCell>Thời Hạn (phút)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {processes.map((process, index) => (
              <TableRow key={process.id_process}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{process.name_process}</TableCell>
                <TableCell>{process.deadline}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default DetailedPhasePage;
