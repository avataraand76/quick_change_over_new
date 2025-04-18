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
  Pagination,
  TableFooter,
  useTheme,
  useMediaQuery,
  Stack,
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
  LockOpen as LockOpenIcon,
  Lock as LockIcon,
  KeyboardDoubleArrowUp as KeyboardDoubleArrowUpIcon,
  KeyboardDoubleArrowDown as KeyboardDoubleArrowDownIcon,
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

  const updatePlanCardRef = React.useRef(null);
  const planListCardRef = React.useRef(null);

  const [searchLine, setSearchLine] = useState("");
  const [searchStyle, setSearchStyle] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

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

  // Hàm xử lý scroll đến các card
  const scrollToCard = (ref) => {
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
          production_style: plan.production_style,
          buyer: plan.buyer,
          quantity: plan.quantity,
          plan_date: plan.plan_date,
          SAM: plan.SAM,
          DinhMuc: plan.DinhMuc,
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

  // Modify the filteredPlans function to use pagination
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

  // Tính toán số trang và dữ liệu cho trang hiện tại
  const totalPages = Math.ceil(filteredPlans.length / rowsPerPage);
  const currentPageData = filteredPlans.slice(
    page * rowsPerPage,
    (page + 1) * rowsPerPage
  );

  // Xử lý thay đổi trang
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

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

  const handleToggleInactive = async (id_plan) => {
    try {
      const response = await API.togglePlanInactive(id_plan);
      if (response.success) {
        // Update the plans list
        const updatedPlans = plans.map((plan) =>
          plan.id_plan === id_plan
            ? { ...plan, inactive: response.inactive }
            : plan
        );
        setPlans(updatedPlans);
        showNotification(
          "Thành công",
          `Đã ${response.inactive === 1 ? "khóa" : "mở khóa"} kế hoạch`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error toggling plan inactive status:", error);
      showNotification(
        "Lỗi",
        "Không thể thay đổi trạng thái kế hoạch",
        "error"
      );
    }
  };

  // Mobile view components
  const MobileUpdatePlanCard = ({ item }) => (
    <Card sx={{ mb: 2, position: "relative" }}>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          Chuyền {item.line}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Mã Hàng:</strong> {item.style}{" "}
          {item.is_synced && (
            <Chip
              label="Đã đồng bộ"
              color="success"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>PO:</strong> {item.PO}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Số Lượng:</strong> {item.quantity}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Ngày CĐ Dự Kiến:</strong> {formatDateTime(item.plan_date)}
        </Typography>
        <Button
          variant="contained"
          color={
            selectedPlans.some((p) => p.KHTId === item.KHTId)
              ? "success"
              : "primary"
          }
          fullWidth
          onClick={() => handleSelectPlan(item)}
          sx={{ mt: 1 }}
        >
          {selectedPlans.some((p) => p.KHTId === item.KHTId)
            ? "Đã Chọn"
            : "Chọn"}
        </Button>
      </CardContent>
    </Card>
  );

  const MobilePlanListCard = ({ plan }) => (
    <Card sx={{ mb: 2, opacity: plan.inactive === 1 ? 0.5 : 1 }}>
      <CardContent>
        <Typography variant="h6" color="primary" gutterBottom>
          Chuyền {plan.line}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Mã Hàng:</strong> {plan.style}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Thời Gian CĐ Dự Kiến:</strong>
          <br />
          {formatDateTime(plan.plan_date)}
        </Typography>
        <Typography variant="body2" gutterBottom>
          <strong>Thời Gian CĐ Thực Tế:</strong>
          <br />
          {plan.actual_date ? formatDateTime(plan.actual_date) : "..."}
        </Typography>
        {/* <Typography variant="body2" gutterBottom>
          <strong>Người Cập Nhật:</strong> {plan.updated_by}
        </Typography> */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            color={plan.inactive === 1 ? "error" : "success"}
            onClick={() => handleToggleInactive(plan.id_plan)}
            startIcon={plan.inactive === 1 ? <LockIcon /> : <LockOpenIcon />}
            fullWidth
          >
            {plan.inactive === 1 ? "Đã khóa" : "Đang mở"}
          </Button>
          <Button
            variant="contained"
            size="small"
            color="primary"
            onClick={() => navigate(`/detailed-phase/${plan.id_plan}`)}
            disabled={plan.inactive === 1}
            fullWidth
          >
            Xem chi tiết
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  // Mobile action buttons
  const MobileActionButtons = () => (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "white",
        borderTop: "1px solid rgba(0, 0, 0, 0.12)",
        p: 2,
        zIndex: 1000,
      }}
    >
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          color="error"
          onClick={() => setSelectedPlans([])}
          disabled={selectedPlans.length === 0 || isCreating}
          fullWidth
        >
          Bỏ chọn ({selectedPlans.length})
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreatePlan}
          disabled={selectedPlans.length === 0 || isCreating}
          fullWidth
        >
          {isCreating
            ? "Đang cập nhật..."
            : `Cập nhật (${selectedPlans.length})`}
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Container component="main" maxWidth="xl" sx={{ pb: isMobile ? 8 : 0 }}>
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

      {/* Nút nổi */}
      <Box
        sx={{
          position: "fixed",
          bottom: isMobile ? 80 : 20,
          right: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Tooltip title="Lướt đến Cập nhật kế hoạch" placement="left">
          <IconButton
            onClick={() => scrollToCard(updatePlanCardRef)}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              "&:hover": {
                bgcolor: "primary.dark",
              },
              boxShadow: 3,
            }}
          >
            <KeyboardDoubleArrowUpIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Lướt đến Danh sách kế hoạch" placement="left">
          <IconButton
            onClick={() => scrollToCard(planListCardRef)}
            sx={{
              bgcolor: "secondary.main",
              color: "white",
              "&:hover": {
                bgcolor: "secondary.dark",
              },
              boxShadow: 3,
            }}
          >
            <KeyboardDoubleArrowDownIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Card
        ref={updatePlanCardRef}
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
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
                flexDirection: isMobile ? "column" : "row",
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
                sx={{ width: isMobile ? "100%" : 200 }}
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
                sx={{ width: isMobile ? "100%" : 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Hiển thị dữ liệu dựa trên viewport */}
            {isMobile ? (
              // Mobile view
              <Box>
                {groupedData.map(([line, items]) => (
                  <Box key={line} sx={{ mb: 3 }}>
                    <Button
                      fullWidth
                      onClick={() => toggleLineCollapse(line)}
                      sx={{
                        justifyContent: "flex-start",
                        backgroundColor: "#e3f2fd",
                        mb: 1,
                        "&:hover": { backgroundColor: "#bbdefb" },
                      }}
                      startIcon={
                        collapsedLines[line] ? <ExpandMore /> : <ChevronRight />
                      }
                    >
                      <Typography sx={{ fontWeight: "bold", color: "#1976d2" }}>
                        Chuyền {line} ({items.length} kế hoạch)
                      </Typography>
                    </Button>
                    <Collapse in={!collapsedLines[line]}>
                      {items.map((item) => (
                        <MobileUpdatePlanCard key={item.KHTId} item={item} />
                      ))}
                    </Collapse>
                  </Box>
                ))}
              </Box>
            ) : (
              // Desktop view - Original table layout
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
                          <TableCell colSpan={6}>
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
                                  width: "15%",
                                }}
                              >
                                Mã Hàng
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: "bold",
                                  width: "15%",
                                }}
                              >
                                PO
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
                                  width: "25%",
                                }}
                              >
                                Thời Gian CĐ Dự Kiến
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: "bold",
                                  width: "15%",
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
                                <TableCell>{item.PO}</TableCell>
                                <TableCell align="center">
                                  {item.quantity}
                                </TableCell>
                                <TableCell>
                                  {formatDateTime(item.plan_date)}
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
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
                                    {item.is_synced && (
                                      <Chip
                                        label="Đã đồng bộ"
                                        color="success"
                                        size="small"
                                      />
                                    )}
                                  </Box>
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
            )}

            {/* Action buttons */}
            {isMobile ? (
              <MobileActionButtons />
            ) : (
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
                  variant="contained"
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
            )}
          </Box>
        </CardContent>
      </Card>

      <Card
        ref={planListCardRef}
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            DANH SÁCH CÁC KẾ HOẠCH
          </Typography>
        </Box>
        <Box sx={{ overflow: "auto", padding: 2 }}>
          {isMobile ? (
            // Mobile view for plan list
            <Box>
              {currentPageData.map((plan) => (
                <MobilePlanListCard key={plan.id_plan} plan={plan} />
              ))}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(e, newPage) => handleChangePage(e, newPage - 1)}
                  color="primary"
                  size="small"
                />
              </Box>
            </Box>
          ) : (
            // Desktop view - Original table with filters
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
                    Người Cập Nhật
                  </TableCell>
                  <TableCell
                    sx={{ color: "white", fontWeight: "bold", width: "10%" }}
                  >
                    Trạng Thái
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
                      onChange={(event, newValue) =>
                        setPlanDateFilter(newValue)
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
                          placeholder="Lọc người cập nhật..."
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
                  <TableCell sx={{ backgroundColor: "#f5f5f5" }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPageData.length > 0 ? (
                  currentPageData.map((plan, index) => (
                    <TableRow
                      key={plan.id_plan || `plan-${index}`}
                      sx={{
                        "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                        opacity: plan.inactive === 1 ? 0.5 : 1,
                      }}
                    >
                      <TableCell>Chuyền {plan.line || ""}</TableCell>
                      <TableCell>{plan.style || ""}</TableCell>
                      <TableCell>{formatDateTime(plan.plan_date)}</TableCell>
                      <TableCell>{formatDateTime(plan.actual_date)}</TableCell>
                      <TableCell>{plan.updated_by || ""}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          color={plan.inactive === 1 ? "error" : "success"}
                          onClick={() => handleToggleInactive(plan.id_plan)}
                          startIcon={
                            plan.inactive === 1 ? (
                              <LockIcon />
                            ) : (
                              <LockOpenIcon />
                            )
                          }
                          sx={{
                            fontSize: "0.75rem",
                            whiteSpace: "nowrap",
                            textTransform: "none",
                            mr: 1,
                          }}
                        >
                          {plan.inactive === 1 ? "Đã khóa" : "Đang mở"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() =>
                            navigate(`/detailed-phase/${plan.id_plan}`)
                          }
                          disabled={plan.inactive === 1}
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
                    <TableCell colSpan={7} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 2,
                        gap: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Tổng số: {filteredPlans.length} kế hoạch
                      </Typography>
                      <Pagination
                        count={totalPages}
                        page={page + 1}
                        onChange={(e, newPage) =>
                          handleChangePage(e, newPage - 1)
                        }
                        color="primary"
                        showFirstButton
                        showLastButton
                        size="large"
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              </TableFooter>
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

export default CreatePhasePage;
