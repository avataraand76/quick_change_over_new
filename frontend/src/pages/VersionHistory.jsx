// frontend/src/pages/VersionHistory.jsx

import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Autocomplete,
  Card,
  CardContent,
  Grid,
  Pagination,
  CircularProgress,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  ExpandMore,
  ExpandLess,
  History as HistoryIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import NotificationDialog from "../components/NotificationDialog";

const VersionHistory = () => {
  const [plans, setPlans] = useState([]);
  const [allVersions, setAllVersions] = useState([]);
  const [filteredVersions, setFilteredVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchLine, setSearchLine] = useState("");
  const [searchStyle, setSearchStyle] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  // Set default to current month
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  const formatDateTime = (datetime) => {
    if (!datetime) return "";
    try {
      const date = new Date(datetime);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      hours = String(hours).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes} ${period}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return datetime;
    }
  };

  const formatDateOnly = (datetime) => {
    if (!datetime) return "";
    try {
      const date = new Date(datetime);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${day}/${month}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return datetime;
    }
  };

  // Fetch data based on selected month
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all plans
        const plansResponse = await API.getPlans();
        setPlans(plansResponse);

        // Get versions by month using new API
        const versionsResponse = await API.getVersionsByMonth(selectedMonth);
        const versions = versionsResponse.versions.map((version) => ({
          ...version,
          // actual_date comes from tb_plan, not tb_version
          plan_info: {
            id_plan: version.id_plan,
            current_line: version.current_line,
            current_style: version.current_style,
            current_quantity: version.current_quantity,
            current_plan_date: version.current_plan_date,
            current_actual_date: version.actual_date, // from tb_plan
          },
        }));

        // Sort by created_at descending (newest first)
        versions.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setAllVersions(versions);
        setFilteredVersions(versions);
      } catch (error) {
        console.error("Error fetching data:", error);
        showNotification(
          "Lỗi",
          "Không thể tải dữ liệu lịch sử version",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  // Filter versions based on search criteria (month is handled at API level)
  useEffect(() => {
    let filtered = allVersions;

    if (searchLine) {
      filtered = filtered.filter((version) =>
        version.line.toString().toLowerCase().includes(searchLine.toLowerCase())
      );
    }

    if (searchStyle) {
      filtered = filtered.filter((version) =>
        version.style.toLowerCase().includes(searchStyle.toLowerCase())
      );
    }

    if (selectedPlan) {
      filtered = filtered.filter(
        (version) => version.plan_info.id_plan === selectedPlan.id_plan
      );
    }

    setFilteredVersions(filtered);
    setPage(1); // Reset to first page when filtering
  }, [searchLine, searchStyle, selectedPlan, allVersions]);

  // Get unique plan options for filter
  const planOptions = plans.map((plan) => ({
    id_plan: plan.id_plan,
    label: `Chuyền ${plan.line} - ${plan.style}`,
    line: plan.line,
    style: plan.style,
  }));

  // Generate month options (current year and previous months)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const monthNames = [
      "Tháng 1",
      "Tháng 2",
      "Tháng 3",
      "Tháng 4",
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "Tháng 10",
      "Tháng 11",
      "Tháng 12",
    ];

    // Add current year months (from current month back to January)
    for (let month = currentMonth; month >= 1; month--) {
      const monthStr = `${currentYear}-${String(month).padStart(2, "0")}`;
      options.push({
        value: monthStr,
        label: `${monthNames[month - 1]} ${currentYear}`,
      });
    }

    // Add previous year months (December to January)
    const previousYear = currentYear - 1;
    for (let month = 12; month >= 1; month--) {
      const monthStr = `${previousYear}-${String(month).padStart(2, "0")}`;
      options.push({
        value: monthStr,
        label: `${monthNames[month - 1]} ${previousYear}`,
      });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  // Group by version number (same version = same time period)
  const groupedByVersion = filteredVersions.reduce((acc, version) => {
    const versionKey = version.version;
    if (!acc[versionKey]) {
      acc[versionKey] = {
        version: versionKey,
        plans: [],
        created_at: version.created_at, // Use first created_at for sorting
      };
    }
    acc[versionKey].plans.push(version);

    // Keep the earliest created_at for this version group
    if (new Date(version.created_at) < new Date(acc[versionKey].created_at)) {
      acc[versionKey].created_at = version.created_at;
    }

    return acc;
  }, {});

  // Group plans within each version by date, then sort by line number
  Object.keys(groupedByVersion).forEach((versionKey) => {
    // Group by date first
    const plansByDate = groupedByVersion[versionKey].plans.reduce(
      (acc, plan) => {
        const dateKey = new Date(plan.plan_date).toDateString();
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(plan);
        return acc;
      },
      {}
    );

    // Sort plans within each date by line number
    Object.keys(plansByDate).forEach((dateKey) => {
      plansByDate[dateKey].sort((a, b) => {
        const lineA = parseInt(a.line.toString().replace(/[^\d]/g, ""));
        const lineB = parseInt(b.line.toString().replace(/[^\d]/g, ""));
        return lineA - lineB;
      });
    });

    // Convert back to array with date grouping info
    groupedByVersion[versionKey].plansByDate = plansByDate;

    // Keep original plans array sorted by date then line for fallback
    groupedByVersion[versionKey].plans.sort((a, b) => {
      const dateA = new Date(a.plan_date);
      const dateB = new Date(b.plan_date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      const lineA = parseInt(a.line.toString().replace(/[^\d]/g, ""));
      const lineB = parseInt(b.line.toString().replace(/[^\d]/g, ""));
      return lineA - lineB;
    });
  });

  // Convert to array and sort by version number (ascending - 1, 2, 3, 4...)
  const groupedArray = Object.values(groupedByVersion).sort(
    (a, b) => a.version - b.version
  );

  // Pagination for grouped data
  const totalPages = Math.ceil(groupedArray.length / rowsPerPage);
  const currentPageData = groupedArray.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const getVersionColor = (version) => {
    if (version === 1) return "primary";
    if (version === 2) return "success";
    if (version === 3) return "warning";
    if (version === 4) return "error";
    if (version === 5) return "info";
    if (version === 6) return "secondary";
    return "default";
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Đang tải lịch sử version...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          <HistoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          Lịch Sử Version Kế Hoạch
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {monthOptions.find((option) => option.value === selectedMonth)
            ?.label || selectedMonth}
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bộ Lọc
          </Typography>
          <Grid container spacing={2}>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm chuyền..."
                value={searchLine}
                onChange={(e) => setSearchLine(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Tìm mã hàng..."
                value={searchStyle}
                onChange={(e) => setSearchStyle(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                size="small"
                options={planOptions}
                value={selectedPlan}
                onChange={(event, newValue) => setSelectedPlan(newValue)}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Chọn kế hoạch cụ thể..."
                  />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                size="small"
                options={monthOptions}
                value={
                  monthOptions.find(
                    (option) => option.value === selectedMonth
                  ) || null
                }
                onChange={(event, newValue) =>
                  setSelectedMonth(newValue ? newValue.value : null)
                }
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Chọn tháng..." />
                )}
              />
            </Grid>
            <Grid item size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchLine("");
                  setSearchStyle("");
                  setSelectedPlan(null);
                  // Keep selectedMonth as is, don't reset to null
                }}
              >
                Xóa bộ lọc
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary">
                {[...new Set(allVersions.map((v) => v.id_plan))].length}
              </Typography>
              <Typography variant="body2">Tổng Kế Hoạch</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="secondary">
                {allVersions.length}
              </Typography>
              <Typography variant="body2">Tổng Version</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {allVersions.filter((v) => v.actual_date !== null).length}
              </Typography>
              <Typography variant="body2">Đã Chuyển Đổi</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                {allVersions.filter((v) => v.actual_date === null).length}
              </Typography>
              <Typography variant="body2">Chưa Chuyển Đổi</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Version History Table */}
      <Card>
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">
              Lịch Sử Chi Tiết ({groupedArray.length} version -{" "}
              {filteredVersions.length} kế hoạch)
            </Typography>
          </Box>

          {isMobile ? (
            // Mobile view - Grouped by version with date sections
            <Stack spacing={3}>
              {currentPageData.map((group) => (
                <Card key={`version-${group.version}`} variant="outlined">
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h5"
                        color="primary"
                        fontWeight="bold"
                      >
                        <Chip
                          label={`Version ${group.version}`}
                          color={getVersionColor(group.version)}
                          size="medium"
                          sx={{ mr: 1 }}
                        />
                        <Typography
                          component="span"
                          variant="h6"
                          color="text.secondary"
                        >
                          ({group.plans.length} kế hoạch -{" "}
                          {
                            group.plans.filter((p) => p.actual_date !== null)
                              .length
                          }{" "}
                          đã CĐ,{" "}
                          {
                            group.plans.filter((p) => p.actual_date === null)
                              .length
                          }{" "}
                          chưa CĐ)
                        </Typography>
                      </Typography>
                    </Box>

                    {/* Dates in horizontal layout for mobile */}
                    <Box
                      sx={{ display: "flex", overflowX: "auto", gap: 2, pb: 2 }}
                    >
                      {Object.keys(group.plansByDate)
                        .sort((a, b) => new Date(a) - new Date(b))
                        .map((dateKey) => {
                          const plansForDate = group.plansByDate[dateKey];
                          return (
                            <Box
                              key={dateKey}
                              sx={{ minWidth: 280, flexShrink: 0 }}
                            >
                              <Typography
                                variant="h6"
                                color="primary"
                                sx={{
                                  mb: 2,
                                  fontWeight: "bold",
                                  textAlign: "center",
                                  p: 1,
                                  backgroundColor: "#e3f2fd",
                                  borderRadius: 1,
                                }}
                              >
                                {formatDateOnly(plansForDate[0].plan_date)}
                              </Typography>
                              <Stack spacing={2}>
                                {plansForDate.map((plan) => (
                                  <Card
                                    key={`${plan.plan_info.id_plan}-${plan.version}`}
                                    variant="outlined"
                                    sx={{
                                      backgroundColor:
                                        plan.actual_date !== null
                                          ? "#e8f5e8"
                                          : "#fff3e0",
                                      border:
                                        plan.actual_date !== null
                                          ? "2px solid #4caf50"
                                          : "2px solid #ff9800",
                                    }}
                                  >
                                    <CardContent sx={{ p: 2 }}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          mb: 1,
                                        }}
                                      >
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="bold"
                                          color="primary"
                                        >
                                          Chuyền {plan.line}
                                        </Typography>
                                        <Chip
                                          label={
                                            plan.actual_date !== null
                                              ? "Đã CĐ"
                                              : "Chưa CĐ"
                                          }
                                          color={
                                            plan.actual_date !== null
                                              ? "success"
                                              : "warning"
                                          }
                                          size="small"
                                        />
                                      </Box>
                                      <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                        color="primary"
                                        gutterBottom
                                      >
                                        <strong>Mã hàng:</strong> {plan.style}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        gutterBottom
                                      >
                                        <strong>Số lượng:</strong>{" "}
                                        {plan.quantity}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        gutterBottom
                                      >
                                        <strong>Giờ:</strong>{" "}
                                        {formatDateTime(plan.plan_date)
                                          .split(" ")
                                          .slice(1)
                                          .join(" ")}
                                      </Typography>
                                      {plan.actual_date && (
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          gutterBottom
                                        >
                                          <strong>Thực tế:</strong>{" "}
                                          {formatDateTime(plan.actual_date)}
                                        </Typography>
                                      )}
                                      <Button
                                        size="small"
                                        variant="contained"
                                        fullWidth
                                        onClick={() =>
                                          navigate(
                                            `/detailed-phase/${plan.plan_info.id_plan}`
                                          )
                                        }
                                        startIcon={<VisibilityIcon />}
                                        sx={{ mt: 1 }}
                                      >
                                        Xem Chi Tiết
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ))}
                              </Stack>
                            </Box>
                          );
                        })}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            // Desktop view - Grouped by version with date columns
            <Stack spacing={3}>
              {currentPageData.map((group) => (
                <Card key={`version-${group.version}`} variant="outlined">
                  <CardContent>
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="h4"
                        color="primary"
                        fontWeight="bold"
                      >
                        <Chip
                          label={`Version ${group.version}`}
                          color={getVersionColor(group.version)}
                          size="large"
                          sx={{ mr: 2, fontSize: "1.1rem" }}
                        />
                        <Typography
                          component="span"
                          variant="h6"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          ({group.plans.length} kế hoạch -{" "}
                          {
                            group.plans.filter((p) => p.actual_date !== null)
                              .length
                          }{" "}
                          đã CĐ,{" "}
                          {
                            group.plans.filter((p) => p.actual_date === null)
                              .length
                          }{" "}
                          chưa CĐ)
                        </Typography>
                      </Typography>
                    </Box>

                    {/* Dates in horizontal layout, plans in vertical layout */}
                    <Grid container spacing={3}>
                      {Object.keys(group.plansByDate)
                        .sort((a, b) => new Date(a) - new Date(b))
                        .map((dateKey) => {
                          const plansForDate = group.plansByDate[dateKey];
                          return (
                            <Grid
                              item
                              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                              key={dateKey}
                            >
                              <Box sx={{ height: "100%" }}>
                                <Typography
                                  variant="h6"
                                  color="primary"
                                  sx={{
                                    mb: 2,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    p: 1,
                                    backgroundColor: "#e3f2fd",
                                    borderRadius: 1,
                                  }}
                                >
                                  {formatDateOnly(plansForDate[0].plan_date)}
                                </Typography>
                                <Stack spacing={2}>
                                  {plansForDate.map((plan) => (
                                    <Card
                                      key={`${plan.plan_info.id_plan}-${plan.version}`}
                                      variant="outlined"
                                      sx={{
                                        backgroundColor:
                                          plan.actual_date !== null
                                            ? "#e8f5e8"
                                            : "#fff3e0",
                                        border:
                                          plan.actual_date !== null
                                            ? "2px solid #4caf50"
                                            : "2px solid #ff9800",
                                      }}
                                    >
                                      <CardContent sx={{ p: 2 }}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            mb: 1,
                                          }}
                                        >
                                          <Typography
                                            variant="subtitle1"
                                            fontWeight="bold"
                                            color="primary"
                                          >
                                            Chuyền {plan.line}
                                          </Typography>
                                          <Chip
                                            label={
                                              plan.actual_date !== null
                                                ? "Đã CĐ"
                                                : "Chưa CĐ"
                                            }
                                            color={
                                              plan.actual_date !== null
                                                ? "success"
                                                : "warning"
                                            }
                                            size="small"
                                          />
                                        </Box>
                                        <Typography
                                          variant="subtitle1"
                                          fontWeight="bold"
                                          color="primary"
                                          gutterBottom
                                        >
                                          <strong>Mã hàng:</strong> {plan.style}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          gutterBottom
                                        >
                                          <strong>Số lượng:</strong>{" "}
                                          {plan.quantity}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          gutterBottom
                                        >
                                          <strong>Giờ:</strong>{" "}
                                          {formatDateTime(plan.plan_date)
                                            .split(" ")
                                            .slice(1)
                                            .join(" ")}
                                        </Typography>
                                        {plan.actual_date && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            gutterBottom
                                          >
                                            <strong>Thực tế:</strong>{" "}
                                            {formatDateTime(plan.actual_date)}
                                          </Typography>
                                        )}
                                        <Button
                                          variant="contained"
                                          size="small"
                                          fullWidth
                                          onClick={() =>
                                            navigate(
                                              `/detailed-phase/${plan.plan_info.id_plan}`
                                            )
                                          }
                                          startIcon={<VisibilityIcon />}
                                          sx={{ mt: 1 }}
                                        >
                                          Xem Chi Tiết
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </Stack>
                              </Box>
                            </Grid>
                          );
                        })}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {groupedArray.length === 0 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                Không tìm thấy version nào phù hợp với bộ lọc
              </Typography>
            </Box>
          )}

          {/* Bottom Pagination */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handleChangePage}
              color="primary"
              showFirstButton
              showLastButton
              size={isMobile ? "small" : "large"}
            />
          </Box>
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

export default VersionHistory;
