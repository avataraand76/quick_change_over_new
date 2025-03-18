// frontend/src/pages/CreatePhasePage.jsx

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import API from "../api/api";
import {
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const CreatePhasePage = () => {
  const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [lines, setLines] = useState([]);
  const [allStyles, setAllStyles] = useState([]);
  const [filteredStyles, setFilteredStyles] = useState([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [planDate, setPlanDate] = useState(getCurrentDateTime());
  const [actualDate, setActualDate] = useState(getCurrentDateTime());
  const [plans, setPlans] = useState([]);
  const [lineFilter, setLineFilter] = useState([]);
  const [styleFilter, setStyleFilter] = useState([]);
  const [planDateFilter, setPlanDateFilter] = useState([]);
  const [actualDateFilter, setActualDateFilter] = useState([]);
  const [userFilter, setUserFilter] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLinesAndStyles = async () => {
      try {
        const response = await API.getLinesAndStyles();

        // Lọc và sắp xếp chuyền
        const uniqueLines = response
          .filter(
            (item, index, self) =>
              self.findIndex(
                (t) => t["OID cua Line"] === item["OID cua Line"]
              ) === index
          )
          .sort((a, b) => a["stt cua line"] - b["stt cua line"]);

        setLines(uniqueLines);
        setAllStyles(response);
      } catch (error) {
        console.error("Error fetching lines and styles:", error);
        alert("Không thể tải dữ liệu chuyền và mã hàng");
      }
    };
    fetchLinesAndStyles();
  }, []);

  useEffect(() => {
    if (selectedLine) {
      const stylesForLine = allStyles
        .filter((item) => item["OID cua Line"] === selectedLine)
        .filter(
          (item, index, self) =>
            self.findIndex(
              (t) => t["OID cua ma hang"] === item["OID cua ma hang"]
            ) === index
        )
        .sort((a, b) => a["ma hang"].localeCompare(b["ma hang"]));

      setFilteredStyles(stylesForLine);
      setSelectedStyle("");
    } else {
      setFilteredStyles([]);
      setSelectedStyle("");
    }
  }, [selectedLine, allStyles]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await API.getPlans();
        setPlans(response);
      } catch (error) {
        console.error("Error fetching plans:", error);
        alert("Không thể tải danh sách kế hoạch");
      }
    };
    fetchPlans();
  }, []);

  const handleCreatePlan = async () => {
    // Validate required fields
    if (!selectedLine || !selectedStyle || !planDate) {
      alert(
        "Vui lòng nhập đầy đủ thông tin Chuyền, Mã hàng và Thời gian dự kiến"
      );
      return;
    }

    try {
      const newPlan = {
        SQL_oid_line: selectedLine,
        line: lines.find((line) => line["OID cua Line"] === selectedLine)?.[
          "stt cua line"
        ],
        SQL_oid_ma_hang: selectedStyle,
        style: filteredStyles.find(
          (style) => style["OID cua ma hang"] === selectedStyle
        )?.["ma hang"],
        plan_date: planDate,
        actual_date: actualDate,
      };

      const response = await API.createPlan(newPlan);
      if (response.success) {
        const updatedPlans = await API.getPlans();
        setPlans(updatedPlans);
        alert("Tạo kế hoạch thành công!");
      } else {
        console.error("Failed to create plan:", response.message);
        alert("Lỗi: " + response.message);
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Có lỗi xảy ra khi tạo kế hoạch");
    }
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
            TẠO KẾ HOẠCH CHUYỂN ĐỔI
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Thông Tin Cơ Bản
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Autocomplete
                        value={
                          lines.find(
                            (line) => line["OID cua Line"] === selectedLine
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          setSelectedLine(
                            newValue ? newValue["OID cua Line"] : ""
                          );
                        }}
                        options={lines}
                        getOptionLabel={(option) =>
                          `Chuyền ${option["stt cua line"]}`
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Chọn Chuyền"
                            required
                            fullWidth
                          />
                        )}
                        isOptionEqualToValue={(option, value) =>
                          option["OID cua Line"] === value["OID cua Line"]
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        value={
                          filteredStyles.find(
                            (style) =>
                              style["OID cua ma hang"] === selectedStyle
                          ) || null
                        }
                        onChange={(event, newValue) => {
                          setSelectedStyle(
                            newValue ? newValue["OID cua ma hang"] : ""
                          );
                        }}
                        options={filteredStyles}
                        getOptionLabel={(option) => option["ma hang"]}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Chọn Mã Hàng"
                            required
                            fullWidth
                            disabled={!selectedLine}
                          />
                        )}
                        disabled={!selectedLine}
                        isOptionEqualToValue={(option, value) =>
                          option["OID cua ma hang"] === value["OID cua ma hang"]
                        }
                        noOptionsText={
                          !selectedLine
                            ? "Vui lòng chọn chuyền trước"
                            : "Không có mã hàng cho chuyền này"
                        }
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
                    Thời Gian
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
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
                    <Grid item xs={12}>
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
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreatePlan}
              size="large"
              startIcon={<AddIcon />}
              sx={{
                minWidth: 150,
                borderRadius: 2,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              Tạo Kế Hoạch
            </Button>
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
            DANH SÁCH CÁC KẾ HOẠCH ĐÃ TẠO
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
    </Container>
  );
};

export default CreatePhasePage;
