// frontend/src/pages/CreatePhasePage.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Autocomplete,
  IconButton,
  Box,
  Card,
  InputAdornment,
  Chip,
  TableContainer,
  CircularProgress,
  Collapse,
} from "@mui/material";
import API from "../api/api";
import {
  Sync as SyncIcon,
  Search as SearchIcon,
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [collapsedLines, setCollapsedLines] = useState({});

  const [notification, setNotification] = useState({
    open: false,
    title: "",
    message: "",
    severity: "info",
  });

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

        // Initialize collapsed state for each line
        const lines = [...new Set(response.map((plan) => plan.line))];
        const initialCollapsedState = {};
        lines.forEach((line) => {
          initialCollapsedState[line] = true; // true means collapsed
        });
        setCollapsedLines(initialCollapsedState);
      } catch (error) {
        console.error("Error fetching plans:", error);
        showNotification("Lỗi", "Không thể tải danh sách kế hoạch", "error");
      }
    };
    fetchPlans();
  }, []);

  const handleSyncHigmf = async () => {
    setIsSyncing(true);
    try {
      const result = await API.syncHigmfData();
      if (result.success) {
        // Refresh plans after sync
        const updatedPlans = await API.getPlans();
        setPlans(updatedPlans);
        showNotification("Thành công", result.message, "success");
      } else {
        showNotification("Lỗi", "Không thể đồng bộ dữ liệu", "error");
      }
    } catch (error) {
      console.error("Error syncing HIGMF data:", error);
      showNotification("Lỗi", "Có lỗi xảy ra khi đồng bộ dữ liệu", "error");
    } finally {
      setIsSyncing(false);
    }
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

  const getFilteredOptions = () => {
    const preFilteredPlans = plans.filter((plan) => {
      return (
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

    const filteredLineOptions = [
      ...new Set(preFilteredPlans.map((plan) => plan.line.toString())),
    ].sort((a, b) => a - b);

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

  // Group plans by line
  const groupedPlans = useMemo(() => {
    const groups = {};
    filteredPlans.forEach((plan) => {
      const line = plan.line;
      if (!groups[line]) {
        groups[line] = [];
      }
      groups[line].push(plan);
    });

    // Sort plans within each group by plan_date
    Object.values(groups).forEach((plans) => {
      plans.sort((a, b) => {
        const dateA = new Date(a.plan_date);
        const dateB = new Date(b.plan_date);
        return dateA - dateB;
      });
    });

    // Sort lines numerically
    return Object.entries(groups).sort((a, b) => {
      const lineA = parseInt(a[0]);
      const lineB = parseInt(b[0]);
      return lineA - lineB;
    });
  }, [filteredPlans]);

  const toggleLineCollapse = (line) => {
    setCollapsedLines((prev) => ({
      ...prev,
      [line]: !prev[line],
    }));
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
          mt: 2,
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
          <Button
            variant="contained"
            color="success"
            onClick={handleSyncHigmf}
            disabled={isSyncing}
            startIcon={
              isSyncing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SyncIcon />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: "medium",
              bgcolor: "#2e7d32",
              "&:hover": {
                bgcolor: "#1b5e20",
              },
            }}
          >
            {isSyncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
          </Button>
        </Box>
        <Box sx={{ overflow: "auto", padding: 2 }}>
          {/* Filters */}
          <Box sx={{ mb: 2 }}>
            <TableContainer>
              <Table>
                <TableHead>
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
                            placeholder="Lọc thời gian dự kiến..."
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
                            placeholder="Lọc thời gian thực tế..."
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
              </Table>
            </TableContainer>
          </Box>

          {/* Grouped Plans */}
          <TableContainer>
            <Table>
              <TableBody>
                {groupedPlans.map(([line, plans]) => (
                  <React.Fragment key={line}>
                    {/* Line Header */}
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
                            Chuyền {line} ({plans.length} kế hoạch)
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Line Content */}
                    <TableRow>
                      <TableCell colSpan={6} sx={{ padding: 0 }}>
                        <Collapse in={!collapsedLines[line]}>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: "15%" }}
                                >
                                  Chuyền
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: "20%" }}
                                >
                                  Mã Hàng
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: "20%" }}
                                >
                                  Thời Gian CĐ Dự Kiến
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: "20%" }}
                                >
                                  Thời Gian CĐ Thực Tế
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: "20%" }}
                                >
                                  Người Tạo
                                </TableCell>
                                <TableCell
                                  sx={{ fontWeight: "bold", width: "5%" }}
                                >
                                  Thao Tác
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {plans.map((plan) => (
                                <TableRow
                                  key={plan.id_plan}
                                  sx={{
                                    "&:nth-of-type(odd)": {
                                      backgroundColor: "#fafafa",
                                    },
                                  }}
                                >
                                  <TableCell>Chuyền {plan.line}</TableCell>
                                  <TableCell>{plan.style}</TableCell>
                                  <TableCell>
                                    {formatDateTime(plan.plan_date)}
                                  </TableCell>
                                  <TableCell>
                                    {formatDateTime(plan.actual_date)}
                                  </TableCell>
                                  <TableCell>{plan.updated_by}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        navigate(
                                          `/detailed-phase/${plan.id_plan}`
                                        )
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
                              ))}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                {groupedPlans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
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
