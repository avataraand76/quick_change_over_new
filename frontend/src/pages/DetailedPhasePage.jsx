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
  LinearProgress,
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  Edit as EditIcon,
  Update as UpdateIcon,
  DateRange as DateIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import API from "../api/api";
import NotificationDialog from "../components/NotificationDialog";
import PermissionCheck from "../components/PermissionCheck";

const DetailedPhasePage = () => {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [processRates, setProcessRates] = useState([]);
  const [planDate, setPlanDate] = useState("");
  const [actualDate, setActualDate] = useState("");
  const [percentRate, setPercentRate] = useState(0);
  const [expandedProcess, setExpandedProcess] = useState(null);
  const [workSteps, setWorkSteps] = useState({});
  const [loadingWorkSteps, setLoadingWorkSteps] = useState({});
  const [processRoles, setProcessRoles] = useState({});
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
        const [planResponse, processesResponse, processRatesResponse] =
          await Promise.all([
            API.getPlanById(id),
            API.getProcesses(),
            API.getProcessRates(id),
          ]);

        if (planResponse.success === false) {
          showNotification("Lỗi", "Không tìm thấy kế hoạch", "error");
          navigate("/create-phase");
          return;
        }
        setPlan(planResponse);
        setProcesses(processesResponse);
        setProcessRates(processRatesResponse);
        setPlanDate(formatDate(planResponse.plan_date));
        setActualDate(formatDate(planResponse.actual_date));
        setPercentRate(planResponse.total_percent_rate || 0);

        // Fetch roles for each process
        const rolesPromises = processesResponse.map((process) =>
          API.getProcessRoles(process.id_process)
        );
        const rolesResults = await Promise.all(rolesPromises);
        const rolesMap = {};
        processesResponse.forEach((process, index) => {
          rolesMap[process.id_process] = rolesResults[index];
        });
        setProcessRoles(rolesMap);
      } catch (error) {
        console.error("Error fetching data:", error);
        showNotification("Lỗi", "Không thể tải thông tin chi tiết", "error");
        navigate("/create-phase");
      }
    };
    fetchData();
  }, [id, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Calculate deadline date based on actual_date and deadline days
  const calculateDeadlineDate = (
    actualDateString,
    planDateString,
    deadlineDays
  ) => {
    if (
      deadlineDays === null ||
      deadlineDays === undefined ||
      deadlineDays === ""
    ) {
      return "-";
    }

    // Sử dụng actual_date nếu có, nếu không thì dùng plan_date
    const dateToUse = actualDateString || planDateString;
    if (!dateToUse) return "-";

    // Parse the date
    const baseDate = new Date(dateToUse);
    // Only use the date part (ignore time)
    const dateOnly = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate()
    );

    // Subtract the deadline days
    const deadlineDate = new Date(dateOnly);
    deadlineDate.setDate(dateOnly.getDate() - parseInt(deadlineDays));

    // Format the deadline date as DD/MM/YYYY
    const day = String(deadlineDate.getDate()).padStart(2, "0");
    const month = String(deadlineDate.getMonth() + 1).padStart(2, "0");
    const year = deadlineDate.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleUpdate = async () => {
    const updatedPlan = {
      ...plan,
      plan_date: planDate,
      actual_date: actualDate,
    };
    try {
      await API.updatePlan(id, updatedPlan);
      showNotification("Thành công", "Cập nhật kế hoạch thành công", "success");
    } catch (error) {
      console.error("Error updating plan:", error);
      showNotification("Lỗi", "Không thể cập nhật kế hoạch", "error");
    }
  };

  const getProgressColor = (value) => {
    if (value < 30) return "#f44336"; // red
    if (value < 70) return "#ff9800"; // orange
    return "#4caf50"; // green
  };

  const handleToggleProcess = async (processId) => {
    if (expandedProcess === processId) {
      setExpandedProcess(null);
    } else {
      setExpandedProcess(processId);

      // If we haven't loaded the work steps for this process yet
      if (!workSteps[processId]) {
        setLoadingWorkSteps((prev) => ({ ...prev, [processId]: true }));

        try {
          const stepsData = await API.getWorkSteps(processId);
          setWorkSteps((prev) => ({ ...prev, [processId]: stepsData }));
        } catch (error) {
          console.error(
            `Error fetching work steps for process ${processId}:`,
            error
          );
        } finally {
          setLoadingWorkSteps((prev) => ({ ...prev, [processId]: false }));
        }
      }
    }
  };

  // Mobile view components
  const MobileProcessCard = ({ process, index, rate }) => {
    const isExpanded = expandedProcess === process.id_process;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" color="primary">
              {index + 1}. {process.name_process}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleToggleProcess(process.id_process)}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Người Đảm Nhận:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {processRoles[process.id_process]?.map((role) => (
                <Typography
                  key={role.id_role}
                  variant="body2"
                  sx={{
                    backgroundColor: "#e3f2fd",
                    color: "#1976d2",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.8rem",
                    fontWeight: "medium",
                  }}
                >
                  {role.name_role}
                </Typography>
              ))}
              {(!processRoles[process.id_process] ||
                processRoles[process.id_process].length === 0) && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  Chưa phân công
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Thời Hạn:
            </Typography>
            {process.deadline ? (
              <>
                <Typography variant="body2" fontWeight="medium">
                  {process.deadline > 0
                    ? `${process.deadline} ngày trước ${
                        plan.actual_date
                          ? "thời gian thực tế"
                          : "thời gian dự kiến"
                      }`
                    : `Cùng ngày với ${
                        plan.actual_date
                          ? "thời gian thực tế"
                          : "thời gian dự kiến"
                      }`}
                </Typography>
                {process.deadline > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Hạn chót:{" "}
                    {calculateDeadlineDate(
                      plan.actual_date,
                      plan.plan_date,
                      process.deadline
                    )}
                  </Typography>
                )}
              </>
            ) : (
              <Typography
                variant="body2"
                fontStyle="italic"
                color="text.secondary"
              >
                Không có hạn chót
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Tỉ Lệ Hoàn Thành:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ flexGrow: 1, mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={rate}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#e0e0e0",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: getProgressColor(rate),
                    },
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                fontWeight="bold"
                color={getProgressColor(rate)}
              >
                {rate}%
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(`/process${process.id_process}/${id}`)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Chi Tiết
          </Button>

          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, bgcolor: "#f5f5f5", borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Các Bước Công Việc
              </Typography>
              {loadingWorkSteps[process.id_process] ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                  <LinearProgress sx={{ width: "100%" }} />
                </Box>
              ) : workSteps[process.id_process]?.length > 0 ? (
                <List sx={{ p: 0 }}>
                  {workSteps[process.id_process].map((step, stepIndex) => (
                    <ListItem key={step.id_work_steps} divider sx={{ py: 1 }}>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {`${index + 1}.${stepIndex + 1}. ${
                              step.name_work_steps
                            }`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 2 }}
                >
                  Không có bước công việc nào
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  if (!plan)
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

  return (
    <Container component="main" maxWidth="xl">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/create-phase")}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          Quay lại
        </Button>
        <Button
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(`/co/${id}`)}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          CO
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            THÔNG TIN CHI TIẾT KẾ HOẠCH CHUYỂN ĐỔI
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Thông Tin Cơ Bản
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
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Tiến Độ
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        Tỉ lệ hoàn thành tổng
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={getProgressColor(percentRate)}
                      >
                        {percentRate}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentRate}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        mt: 1,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getProgressColor(percentRate),
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Thời Gian
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <PermissionCheck
                        requiredRole={[1, 3]}
                        renderContent={(hasPermission) => (
                          <TextField
                            label="Thời Gian Chuyển Đổi Dự Kiến"
                            type="datetime-local"
                            value={planDate}
                            onChange={(e) => setPlanDate(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
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
                    <Grid item xs={12} md={6}>
                      <PermissionCheck
                        requiredRole={[1, 3]}
                        renderContent={(hasPermission) => (
                          <TextField
                            label="Thời Gian Chuyển Đổi Thực Tế"
                            type="datetime-local"
                            value={actualDate || ""}
                            onChange={(e) => setActualDate(e.target.value)}
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                            placeholder="dd/mm/yyyy --:-- --"
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
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <PermissionCheck
              requiredRole={[1, 3]}
              renderContent={(hasPermission) =>
                hasPermission && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpdate}
                    size="large"
                    startIcon={<UpdateIcon />}
                    sx={{
                      minWidth: 150,
                      borderRadius: 2,
                      boxShadow: 2,
                      "&:hover": {
                        boxShadow: 4,
                      },
                    }}
                  >
                    Cập Nhật
                  </Button>
                )
              }
            />
          </Box>
        </CardContent>
      </Card>

      <Card
        elevation={4}
        sx={{
          mt: 4,
          mb: 4,
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            DANH SÁCH QUY TRÌNH
          </Typography>
        </Box>
        <Box sx={{ overflow: "auto", padding: isMobile ? 2 : 3 }}>
          {isMobile ? (
            // Mobile view - Card layout
            <Box>
              {processes.map((process, index) => {
                const rateObj = processRates.find(
                  (rate) => rate.id_process === process.id_process
                );
                const rate = rateObj ? rateObj.percent_rate : 0;

                return (
                  <MobileProcessCard
                    key={process.id_process}
                    process={process}
                    index={index}
                    rate={rate}
                  />
                );
              })}
            </Box>
          ) : (
            // Desktop view - Original table layout
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#1976d2" }}>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "5%" }}
                  >
                    STT
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "32%" }}
                  >
                    Tên Quy Trình
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "15%" }}
                  >
                    Người Đảm Nhận
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "15%" }}
                  >
                    Thời Hạn (ngày)
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "20%" }}
                  >
                    Tỉ Lệ Hoàn Thành
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "13%" }}
                  >
                    {/* Thao Tác */}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processes.map((process, index) => {
                  // Find the corresponding rate for this process
                  const rateObj = processRates.find(
                    (rate) => rate.id_process === process.id_process
                  );
                  const rate = rateObj ? rateObj.percent_rate : 0;
                  const isExpanded = expandedProcess === process.id_process;

                  return (
                    <React.Fragment key={process.id_process}>
                      <TableRow
                        sx={{
                          "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "#f0f8ff" },
                        }}
                        onClick={() => handleToggleProcess(process.id_process)}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="body1" fontWeight="medium">
                              {process.name_process}
                            </Typography>
                            <IconButton size="small" sx={{ ml: 1 }}>
                              {isExpanded ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {processRoles[process.id_process]?.map((role) => (
                              <Typography
                                key={role.id_role}
                                variant="body2"
                                sx={{
                                  backgroundColor: "#e3f2fd",
                                  color: "#1976d2",
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                  fontSize: "0.8rem",
                                  fontWeight: "medium",
                                  display: "inline-block",
                                }}
                              >
                                {role.name_role}
                              </Typography>
                            ))}
                            {(!processRoles[process.id_process] ||
                              processRoles[process.id_process].length ===
                                0) && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontStyle: "italic" }}
                              >
                                Chưa phân công
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {process.deadline ? (
                            <>
                              <Typography variant="body2" fontWeight="medium">
                                {process.deadline > 0
                                  ? `${process.deadline} ngày trước ${
                                      plan.actual_date
                                        ? "thời gian thực tế"
                                        : "thời gian dự kiến"
                                    }`
                                  : `Cùng ngày với ${
                                      plan.actual_date
                                        ? "thời gian thực tế"
                                        : "thời gian dự kiến"
                                    }`}
                              </Typography>
                              {process.deadline > 0 && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Hạn chót:{" "}
                                  {calculateDeadlineDate(
                                    plan.actual_date,
                                    plan.plan_date,
                                    process.deadline
                                  )}
                                </Typography>
                              )}
                            </>
                          ) : (
                            <Typography
                              variant="body2"
                              fontStyle="italic"
                              color="text.secondary"
                            >
                              Không có hạn chót
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Box sx={{ width: "100%", mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={rate}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: "#e0e0e0",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: getProgressColor(rate),
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={getProgressColor(rate)}
                              >{`${rate}%`}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              navigate(`/process${process.id_process}/${id}`);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              boxShadow: 1,
                              "&:hover": {
                                boxShadow: 3,
                              },
                            }}
                          >
                            Chi Tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={6}
                        >
                          <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box
                              sx={{
                                margin: 2,
                                backgroundColor: "#f5f5f5",
                                borderRadius: 2,
                                p: 2,
                                pb: 0,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  borderBottom: "1px solid #e0e0e0",
                                  pb: 1,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  component="div"
                                  sx={{ fontWeight: "bold", color: "#1976d2" }}
                                >
                                  CÁC BƯỚC CÔNG VIỆC
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Quy trình {index + 1}
                                </Typography>
                              </Box>
                              {loadingWorkSteps[process.id_process] ? (
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    my: 3,
                                  }}
                                >
                                  <LinearProgress sx={{ width: "70%" }} />
                                </Box>
                              ) : workSteps[process.id_process]?.length > 0 ? (
                                <List
                                  sx={{
                                    bgcolor: "background.paper",
                                    borderRadius: 1,
                                    p: 0,
                                  }}
                                >
                                  {workSteps[process.id_process].map(
                                    (step, stepIndex) => (
                                      <ListItem
                                        key={step.id_work_steps}
                                        divider
                                        alignItems="flex-start"
                                        sx={{
                                          py: 1.5,
                                          "&:hover": {
                                            backgroundColor:
                                              "rgba(25, 118, 210, 0.04)",
                                          },
                                        }}
                                      >
                                        <Avatar
                                          sx={{
                                            bgcolor: "#1976d2",
                                            color: "white",
                                            width: 32,
                                            height: 32,
                                            mr: 2,
                                            fontSize: "0.875rem",
                                            fontWeight: "bold",
                                            mt: 0.5,
                                          }}
                                        >
                                          {`${index + 1}.${stepIndex + 1}`}
                                        </Avatar>
                                        <ListItemText
                                          primary={
                                            <Typography
                                              variant="body1"
                                              component="div"
                                              sx={{ fontWeight: "medium" }}
                                            >
                                              {step.name_work_steps}
                                            </Typography>
                                          }
                                        />
                                      </ListItem>
                                    )
                                  )}
                                </List>
                              ) : (
                                <Box sx={{ py: 3, textAlign: "center" }}>
                                  <Typography
                                    variant="body1"
                                    color="text.secondary"
                                    sx={{
                                      fontStyle: "italic",
                                    }}
                                  >
                                    Không có bước công việc nào cho quy trình
                                    này
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Box>
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

export default DetailedPhasePage;
