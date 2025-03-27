// frontend/src/pages/CreatePhasePage.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  MenuItem,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  IconButton,
  Tooltip,
  Menu,
  Checkbox,
  ListItemText,
  Box,
  Card,
  CardContent,
  LinearProgress,
  InputAdornment,
  Chip,
  Collapse,
  TableContainer,
  CircularProgress,
} from "@mui/material";
import API from "../api/api";
import {
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore,
  ChevronRight,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import NotificationDialog from "../components/NotificationDialog";

const CreatePhasePage = () => {
  const [plans, setPlans] = useState([]);
  const [lineFilter, setLineFilter] = useState([]);
  const [styleFilter, setStyleFilter] = useState([]);
  const [planDateFilter, setPlanDateFilter] = useState([]);
  const [actualDateFilter, setActualDateFilter] = useState([]);
  const [userFilter, setUserFilter] = useState([]);
  const [higmfData, setHigmfData] = useState([]);

  const [searchLine, setSearchLine] = useState("");
  const [searchStyle, setSearchStyle] = useState("");

  const [selectedPlans, setSelectedPlans] = useState([]);

  const [collapsedLines, setCollapsedLines] = useState({});

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

  const [isCreating, setIsCreating] = useState(false);

  const navigate = useNavigate();

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
    const fetchPlans = async () => {
      try {
        const response = await API.getPlans();
        setPlans(response);
      } catch (error) {
        console.error("Error fetching plans:", error);
        showNotification("Lỗi", "Không thể tải danh sách kế hoạch", "error");
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchHigmfData = async () => {
      try {
        const response = await API.getHigmfLinesAndStyles();
        setHigmfData(response);
      } catch (error) {
        console.error("Error fetching HIGMF data:", error);
        showNotification("Lỗi", "Không thể tải dữ liệu từ HIGMF", "error");
      }
    };
    fetchHigmfData();
  }, []);

  useEffect(() => {
    if (higmfData.length > 0) {
      const initialState = {};
      higmfData.forEach((item) => {
        initialState[item.line] = true; // true = collapsed
      });
      setCollapsedLines(initialState);
    }
  }, [higmfData]);

  const handleCreatePlan = async () => {
    if (selectedPlans.length === 0) {
      showNotification(
        "Cảnh báo",
        "Vui lòng chọn ít nhất một kế hoạch để cập nhật",
        "warning"
      );
      return;
    }

    setIsCreating(true);
    try {
      const createPromises = selectedPlans.map((plan) => {
        const newPlan = {
          KHTId: plan.KHTId,
          line: plan.line,
          style: plan.style,
          quantity: plan.quantity,
          plan_date: plan.plan_date,
          actual_date: plan.plan_date,
        };
        return API.createPlan(newPlan);
      });

      const results = await Promise.all(createPromises);

      const hasError = results.some((result) => !result.success);
      if (!hasError) {
        const updatedPlans = await API.getPlans();
        setPlans(updatedPlans);
        setSelectedPlans([]);
        showNotification(
          "Thành công",
          "Cập nhật kế hoạch thành công!",
          "success"
        );
      } else {
        showNotification(
          "Lỗi",
          "Có lỗi xảy ra khi cập nhật một số kế hoạch",
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating plans:", error);
      showNotification("Lỗi", "Có lỗi xảy ra khi cập nhật kế hoạch", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlans((prev) => {
      const isSelected = prev.some((p) => p.KHTId === plan.KHTId);
      if (isSelected) {
        // Nếu đã chọn thì bỏ chọn
        return prev.filter((p) => p.KHTId !== plan.KHTId);
      } else {
        // Nếu chưa chọn thì thêm vào
        return [...prev, plan];
      }
    });
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return "";
    try {
      const date = new Date(datetime);

      // Get day, month, year (with padding)
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      // Get hours and minutes (with padding)
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");

      // Determine AM/PM
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12; // Convert to 12-hour format, making 0 => 12
      hours = String(hours).padStart(2, "0");

      // Format the final string: dd/MM/yyyy hh:mm AM/PM
      return `${day}/${month}/${year} ${hours}:${minutes} ${period}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return datetime; // Return original value if formatting fails
    }
  };

  // Thêm hàm format để hiển thị trong menu filter
  const formatDateForFilter = (datetime) => {
    if (!datetime) return "";
    try {
      const date = new Date(datetime);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return datetime;
    }
  };

  // Modify the filteredPlans function to use the new filter inputs with multi-select
  const filteredPlans = plans.filter((plan) => {
    return (
      (lineFilter.length === 0 || lineFilter.includes(plan.line.toString())) &&
      (styleFilter.length === 0 || styleFilter.includes(plan.style)) &&
      (planDateFilter.length === 0 ||
        planDateFilter.some((filter) =>
          formatDateTime(plan.plan_date).includes(filter)
        )) &&
      (actualDateFilter.length === 0 ||
        (plan.actual_date &&
          actualDateFilter.some((filter) =>
            formatDateTime(plan.actual_date).includes(filter)
          ))) &&
      (userFilter.length === 0 || userFilter.includes(plan.updated_by))
    );
  });

  // Get filtered unique values for dropdown options based on current filtered results
  const getFilteredOptions = () => {
    // First, create a filtered set of plans based on the currently applied filters
    const preFilteredPlans = plans.filter((plan) => {
      return (
        // Apply all filters except the one we're getting options for
        (userFilter.length === 0 || userFilter.includes(plan.updated_by)) &&
        (styleFilter.length === 0 || styleFilter.includes(plan.style)) &&
        (planDateFilter.length === 0 ||
          planDateFilter.some((filter) =>
            formatDateTime(plan.plan_date).includes(filter)
          )) &&
        (actualDateFilter.length === 0 ||
          (plan.actual_date &&
            actualDateFilter.some((filter) =>
              formatDateTime(plan.actual_date).includes(filter)
            )))
      );
    });

    // Get unique values from pre-filtered plans for line options
    const filteredLineOptions = [
      ...new Set(preFilteredPlans.map((plan) => plan.line.toString())),
    ].sort((a, b) => a - b);

    // Apply all filters except style filter for style options
    const plansForStyleOptions = plans.filter((plan) => {
      return (
        (lineFilter.length === 0 ||
          lineFilter.includes(plan.line.toString())) &&
        (userFilter.length === 0 || userFilter.includes(plan.updated_by)) &&
        (planDateFilter.length === 0 ||
          planDateFilter.some((filter) =>
            formatDateTime(plan.plan_date).includes(filter)
          )) &&
        (actualDateFilter.length === 0 ||
          (plan.actual_date &&
            actualDateFilter.some((filter) =>
              formatDateTime(plan.actual_date).includes(filter)
            )))
      );
    });
    const filteredStyleOptions = [
      ...new Set(plansForStyleOptions.map((plan) => plan.style)),
    ].sort();

    // Apply all filters except user filter for user options
    const plansForUserOptions = plans.filter((plan) => {
      return (
        (lineFilter.length === 0 ||
          lineFilter.includes(plan.line.toString())) &&
        (styleFilter.length === 0 || styleFilter.includes(plan.style)) &&
        (planDateFilter.length === 0 ||
          planDateFilter.some((filter) =>
            formatDateTime(plan.plan_date).includes(filter)
          )) &&
        (actualDateFilter.length === 0 ||
          (plan.actual_date &&
            actualDateFilter.some((filter) =>
              formatDateTime(plan.actual_date).includes(filter)
            )))
      );
    });
    const filteredUserOptions = [
      ...new Set(plansForUserOptions.map((plan) => plan.updated_by)),
    ].sort();

    // Apply all filters except plan date filter for plan date options
    const plansForPlanDateOptions = plans.filter((plan) => {
      return (
        (lineFilter.length === 0 ||
          lineFilter.includes(plan.line.toString())) &&
        (styleFilter.length === 0 || styleFilter.includes(plan.style)) &&
        (userFilter.length === 0 || userFilter.includes(plan.updated_by)) &&
        (actualDateFilter.length === 0 ||
          (plan.actual_date &&
            actualDateFilter.some((filter) =>
              formatDateTime(plan.actual_date).includes(filter)
            )))
      );
    });
    const filteredPlanDateOptions = [
      ...new Set(
        plansForPlanDateOptions.map((plan) =>
          formatDateForFilter(plan.plan_date)
        )
      ),
    ].sort();

    // Apply all filters except actual date filter for actual date options
    const plansForActualDateOptions = plans.filter((plan) => {
      return (
        (lineFilter.length === 0 ||
          lineFilter.includes(plan.line.toString())) &&
        (styleFilter.length === 0 || styleFilter.includes(plan.style)) &&
        (userFilter.length === 0 || userFilter.includes(plan.updated_by)) &&
        (planDateFilter.length === 0 ||
          planDateFilter.some((filter) =>
            formatDateTime(plan.plan_date).includes(filter)
          ))
      );
    });
    const filteredActualDateOptions = [
      ...new Set(
        plansForActualDateOptions
          .map((plan) =>
            plan.actual_date ? formatDateForFilter(plan.actual_date) : ""
          )
          .filter((date) => date !== "")
      ),
    ].sort();

    return {
      lines: filteredLineOptions,
      styles: filteredStyleOptions,
      users: filteredUserOptions,
      planDates: filteredPlanDateOptions,
      actualDates: filteredActualDateOptions,
    };
  };

  const filteredOptions = getFilteredOptions();

  // Thêm hàm filter data
  const filteredHigmfData = higmfData.filter((item) => {
    const lineMatch = item.line
      .toString()
      .toLowerCase()
      .includes(searchLine.toLowerCase());
    const styleMatch = item.style
      .toLowerCase()
      .includes(searchStyle.toLowerCase());
    return lineMatch && styleMatch;
  });

  // Thêm hàm toggle collapse
  const toggleLineCollapse = (line) => {
    setCollapsedLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }));
  };

  // Thay đổi cách tạo groupedData
  const groupedData = useMemo(() => {
    // Sắp xếp filteredHigmfData trước khi nhóm
    const sortedData = [...filteredHigmfData].sort((a, b) => {
      // Lấy số chuyền
      const getLineNumber = (line) => {
        const num = parseInt(line.toString().replace(/[^\d]/g, ""));
        // Thêm padding 0 cho số < 10 để sort đúng thứ tự 01, 02, 03...
        return num < 10 ? `0${num}` : num.toString();
      };

      const lineA = getLineNumber(a.line);
      const lineB = getLineNumber(b.line);

      // Ưu tiên sắp xếp chuyền 1-9 lên đầu
      const numA = parseInt(lineA);
      const numB = parseInt(lineB);

      // Sắp xếp theo số
      return numA - numB;
    });

    // Tạo một object để nhóm các items theo line
    const grouped = sortedData.reduce((acc, item) => {
      const line = item.line;
      if (!acc[line]) {
        acc[line] = [];
      }
      acc[line].push(item);
      return acc;
    }, {});

    // Tạo mảng các cặp [line, items] để giữ thứ tự đã sắp xếp
    const orderedLines = Object.keys(grouped).sort((a, b) => {
      const numA = parseInt(a.replace(/[^\d]/g, ""));
      const numB = parseInt(b.replace(/[^\d]/g, ""));
      return numA - numB;
    });

    return orderedLines.map((line) => [line, grouped[line]]);
  }, [filteredHigmfData]);

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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            CẬP NHẬT KẾ HOẠCH CHUYỂN ĐỔI
          </Typography>
        </Box>

        <CardContent sx={{ padding: 0 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Chọn Kế Hoạch Từ Hi-Garment
            </Typography>

            {/* Phần tìm kiếm */}
            <Box
              sx={{
                mb: 2,
                display: "flex",
                gap: 2,
                backgroundColor: "#f8f9fa",
                p: 2,
                borderRadius: 1,
              }}
            >
              <TextField
                size="small"
                placeholder="Tìm chuyền"
                value={searchLine}
                onChange={(e) => setSearchLine(e.target.value)}
                sx={{ width: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                size="small"
                placeholder="Tìm mã hàng"
                value={searchStyle}
                onChange={(e) => setSearchStyle(e.target.value)}
                sx={{ width: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Header cột */}
            <TableContainer>
              <Table>
                <TableBody>
                  {groupedData.map(([line, items]) => (
                    <React.Fragment key={line}>
                      {/* Header chuyền */}
                      <TableRow
                        sx={{
                          backgroundColor: "#e3f2fd",
                          "&:hover": { backgroundColor: "#bbdefb" },
                          cursor: "pointer",
                        }}
                        onClick={() => toggleLineCollapse(line)}
                      >
                        <TableCell colSpan={5}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <IconButton size="small">
                              {collapsedLines[line] ? (
                                <ExpandMore />
                              ) : (
                                <ChevronRight />
                              )}
                            </IconButton>
                            <Typography
                              sx={{ fontWeight: "bold", color: "#1976d2" }}
                            >
                              Chuyền {line} ({items.length} kế hoạch)
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Chi tiết các đợt */}
                      {!collapsedLines[line] && (
                        <>
                          {/* Header columns cho mỗi phần collapse */}
                          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                            <TableCell
                              sx={{
                                fontWeight: "bold",
                                width: "15%",
                                pl: 6,
                              }}
                            >
                              Chuyền
                            </TableCell>
                            <TableCell
                              sx={{
                                fontWeight: "bold",
                                width: "20%",
                              }}
                            >
                              Mã Hàng
                            </TableCell>
                            <TableCell
                              sx={{
                                fontWeight: "bold",
                                width: "15%",
                                textAlign: "center",
                              }}
                            >
                              Số Lượng
                            </TableCell>
                            <TableCell
                              sx={{
                                fontWeight: "bold",
                                width: "30%",
                              }}
                            >
                              Thời Gian CĐ Dự Kiến
                            </TableCell>
                            <TableCell
                              sx={{
                                fontWeight: "bold",
                                width: "20%",
                                textAlign: "left",
                              }}
                            >
                              Thao Tác
                            </TableCell>
                          </TableRow>

                          {/* Dữ liệu */}
                          {items.map((item) => (
                            <TableRow
                              key={item.KHTId}
                              selected={selectedPlans.some(
                                (p) => p.KHTId === item.KHTId
                              )}
                              hover
                              sx={{
                                "& td": { borderBottom: "1px solid #e0e0e0" },
                                "&.Mui-selected": {
                                  backgroundColor: "#e8f5e9",
                                },
                                "&.Mui-selected:hover": {
                                  backgroundColor: "#c8e6c9",
                                },
                              }}
                            >
                              <TableCell sx={{ pl: 6 }}>
                                Chuyền {item.line}
                              </TableCell>
                              <TableCell>{item.style}</TableCell>
                              <TableCell align="center">
                                {item.quantity}
                              </TableCell>
                              <TableCell>
                                {formatDateTime(item.plan_date)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="contained"
                                  color={
                                    selectedPlans.some(
                                      (p) => p.KHTId === item.KHTId
                                    )
                                      ? "success"
                                      : "primary"
                                  }
                                  size="small"
                                  onClick={() => handleSelectPlan(item)}
                                  sx={{
                                    textTransform: "none",
                                    minWidth: 80,
                                    boxShadow: "none",
                                    "&:hover": { boxShadow: 1 },
                                  }}
                                >
                                  {selectedPlans.some(
                                    (p) => p.KHTId === item.KHTId
                                  )
                                    ? "Đã Chọn"
                                    : "Chọn"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                display: "flex",
                justifyContent: "right",
                gap: 2,
                position: "sticky",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2,
                padding: "16px",
                // background: "transparent",
                // backdropFilter: "blur(5px)",
                marginTop: 2,
                marginX: 2,
                borderRadius: 1,
                // "&::before": {
                //   content: '""',
                //   position: "absolute",
                //   top: 0,
                //   left: 0,
                //   right: 0,
                //   bottom: 0,
                //   background: "rgba(255, 255, 255, 0.3)",
                //   borderRadius: "inherit",
                //   zIndex: -1,
                // },
              }}
            >
              <Button
                variant="outlined"
                color="error"
                onClick={() => setSelectedPlans([])}
                disabled={selectedPlans.length === 0 || isCreating}
                size="large"
                startIcon={<ClearIcon />}
                sx={{
                  minWidth: 180,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: "medium",
                  borderWidth: 2,
                  "&:hover": {
                    borderWidth: 2,
                  },
                }}
              >
                Bỏ Chọn {selectedPlans.length} Kế Hoạch
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreatePlan}
                disabled={selectedPlans.length === 0 || isCreating}
                size="large"
                startIcon={
                  isCreating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AddIcon />
                  )
                }
                sx={{
                  minWidth: 200,
                  borderRadius: 2,
                  boxShadow: 2,
                  "&:hover": {
                    boxShadow: 4,
                  },
                  textTransform: "none",
                  bgcolor: "#1976d2",
                  color: "white",
                  fontWeight: "medium",
                }}
              >
                {isCreating
                  ? "Đang cập nhật..."
                  : `Cập Nhật ${selectedPlans.length} Kế Hoạch`}
              </Button>
            </Box>
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            DANH SÁCH CÁC KẾ HOẠCH
          </Typography>
        </Box>
        <Box sx={{ overflow: "auto", padding: 2 }}>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1976d2" }}>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", width: "15%" }}
                >
                  Chuyền
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", width: "20%" }}
                >
                  Mã Hàng
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", width: "20%" }}
                >
                  Thời Gian CĐ Dự Kiến
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", width: "20%" }}
                >
                  Thời Gian CĐ Thực Tế
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", width: "20%" }}
                >
                  Người Tạo
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: "bold", width: "5%" }}
                >
                  {/* Thao Tác */}
                </TableCell>
              </TableRow>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell
                  sx={{
                    backgroundColor:
                      lineFilter.length > 0 ? "#ffee8c" : "#f5f5f5",
                    padding: "8px",
                  }}
                >
                  <Autocomplete
                    multiple
                    size="small"
                    options={filteredOptions.lines}
                    value={lineFilter}
                    onChange={(event, newValue) => setLineFilter(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...chipProps } = tagProps;
                        return (
                          <Chip
                            key={key}
                            label={`Chuyền ${option}`}
                            {...chipProps}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Lọc chuyền..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor:
                      styleFilter.length > 0 ? "#ffee8c" : "#f5f5f5",
                    padding: "8px",
                  }}
                >
                  <Autocomplete
                    multiple
                    size="small"
                    options={filteredOptions.styles}
                    value={styleFilter}
                    onChange={(event, newValue) => setStyleFilter(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...chipProps } = tagProps;
                        return (
                          <Chip
                            key={key}
                            label={option}
                            {...chipProps}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Lọc mã hàng..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor:
                      planDateFilter.length > 0 ? "#ffee8c" : "#f5f5f5",
                    padding: "8px",
                  }}
                >
                  <Autocomplete
                    multiple
                    size="small"
                    options={filteredOptions.planDates}
                    value={planDateFilter}
                    onChange={(event, newValue) => setPlanDateFilter(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...chipProps } = tagProps;
                        return (
                          <Chip
                            key={key}
                            label={option}
                            {...chipProps}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Lọc thời gian..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor:
                      actualDateFilter.length > 0 ? "#ffee8c" : "#f5f5f5",
                    padding: "8px",
                  }}
                >
                  <Autocomplete
                    multiple
                    size="small"
                    options={filteredOptions.actualDates}
                    value={actualDateFilter}
                    onChange={(event, newValue) =>
                      setActualDateFilter(newValue)
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...chipProps } = tagProps;
                        return (
                          <Chip
                            key={key}
                            label={option}
                            {...chipProps}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Lọc thời gian..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    backgroundColor:
                      userFilter.length > 0 ? "#ffee8c" : "#f5f5f5",
                    padding: "8px",
                  }}
                >
                  <Autocomplete
                    multiple
                    size="small"
                    options={filteredOptions.users}
                    value={userFilter}
                    onChange={(event, newValue) => setUserFilter(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const tagProps = getTagProps({ index });
                        const { key, ...chipProps } = tagProps;
                        return (
                          <Chip
                            key={key}
                            label={option}
                            {...chipProps}
                            size="small"
                          />
                        );
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Lọc người tạo..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell sx={{ backgroundColor: "#f5f5f5" }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan, index) => (
                  <TableRow
                    key={plan.id_plan || `plan-${index}`}
                    sx={{
                      "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                    }}
                  >
                    <TableCell>Chuyền {plan.line || ""}</TableCell>
                    <TableCell>{plan.style || ""}</TableCell>
                    <TableCell>{formatDateTime(plan.plan_date)}</TableCell>
                    <TableCell>{formatDateTime(plan.actual_date)}</TableCell>
                    <TableCell>{plan.updated_by || ""}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() =>
                          navigate(`/detailed-phase/${plan.id_plan}`)
                        }
                        sx={{
                          fontSize: "0.75rem",
                          whiteSpace: "nowrap",
                          textTransform: "none",
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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

export default CreatePhasePage;
