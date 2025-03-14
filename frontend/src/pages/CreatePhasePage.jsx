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
} from "@mui/material";
import API from "../api/api";
import { Visibility as VisibilityIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FilterListIcon from "@mui/icons-material/FilterList";

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
  const [filterLine, setFilterLine] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterPlanDate, setFilterPlanDate] = useState("");
  const [filterActualDate, setFilterActualDate] = useState("");
  const [filterUpdatedBy, setFilterUpdatedBy] = useState("");
  const [uniqueLines, setUniqueLines] = useState([]);
  const [uniqueStyles, setUniqueStyles] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [uniquePlanDates, setUniquePlanDates] = useState([]);
  const [uniqueActualDates, setUniqueActualDates] = useState([]);

  const [lineAnchorEl, setLineAnchorEl] = useState(null);
  const [styleAnchorEl, setStyleAnchorEl] = useState(null);
  const [dateAnchorEl, setDateAnchorEl] = useState(null);
  const [userAnchorEl, setUserAnchorEl] = useState(null);
  const [actualDateAnchorEl, setActualDateAnchorEl] = useState(null);

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

  useEffect(() => {
    if (plans.length > 0) {
      // Lấy unique values cho chuyền
      const lines = [...new Set(plans.map((plan) => plan.line))].sort(
        (a, b) => a - b
      );
      setUniqueLines(lines);

      // Lấy unique values cho mã hàng
      const styles = [...new Set(plans.map((plan) => plan.style))].sort();
      setUniqueStyles(styles);

      // Lấy unique values cho người tạo
      const users = [...new Set(plans.map((plan) => plan.updated_by))].sort();
      setUniqueUsers(users);

      // Lấy unique values cho ngày dự kiến (chỉ lấy ngày)
      const planDates = [
        ...new Set(plans.map((plan) => formatDateForFilter(plan.plan_date))),
      ].sort();
      setUniquePlanDates(planDates);

      // Lấy unique values cho ngày thực tế (chỉ lấy ngày)
      const actualDates = [
        ...new Set(
          plans.map((plan) =>
            plan.actual_date ? formatDateForFilter(plan.actual_date) : ""
          )
        ),
      ]
        .filter((date) => date !== "")
        .sort();
      setUniqueActualDates(actualDates);
    }
  }, [plans]);

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
      let hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      // Determine AM/PM
      const period = date.getHours() >= 12 ? "PM" : "AM";

      // Format the final string: dd/MM/yyyy HH:mm tt
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

  // Sửa lại hàm filter
  const filteredPlans = plans.filter((plan) => {
    return (
      (!filterLine || plan.line.toString() === filterLine.toString()) &&
      (!filterStyle || plan.style === filterStyle) &&
      (!filterPlanDate ||
        formatDateForFilter(plan.plan_date) === filterPlanDate) &&
      (!filterActualDate ||
        (plan.actual_date &&
          formatDateForFilter(plan.actual_date) === filterActualDate)) &&
      (!filterUpdatedBy || plan.updated_by === filterUpdatedBy)
    );
  });

  const handleFilterClick = (event, setter) => {
    setter(event.currentTarget);
  };

  const handleClose = (setter) => {
    setter(null);
  };

  return (
    <Container component="main">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, borderRadius: 5 }}>
        <Typography
          component="h1"
          variant="h5"
          sx={{ marginBottom: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          TẠO KẾ HOẠCH CHUYỂN ĐỔI
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              value={
                lines.find((line) => line["OID cua Line"] === selectedLine) ||
                null
              }
              onChange={(event, newValue) => {
                setSelectedLine(newValue ? newValue["OID cua Line"] : "");
              }}
              options={lines}
              getOptionLabel={(option) => `Chuyền ${option["stt cua line"]}`}
              renderInput={(params) => (
                <TextField {...params} label="Chọn Chuyền" required fullWidth />
              )}
              isOptionEqualToValue={(option, value) =>
                option["OID cua Line"] === value["OID cua Line"]
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              value={
                filteredStyles.find(
                  (style) => style["OID cua ma hang"] === selectedStyle
                ) || null
              }
              onChange={(event, newValue) => {
                setSelectedStyle(newValue ? newValue["OID cua ma hang"] : "");
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
        </Grid>
        <Button
          variant="contained"
          sx={{
            marginTop: 3,
            backgroundColor: "#1976d2",
            "&:hover": { backgroundColor: "#115293" },
          }}
          onClick={handleCreatePlan}
        >
          Tạo Kế Hoạch
        </Button>
      </Paper>
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4, borderRadius: 5 }}>
        <Typography
          component="h1"
          variant="h5"
          sx={{ marginBottom: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          DANH SÁCH CÁC KẾ HOẠCH ĐÃ TẠO
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: filterLine ? "#e3f2fd" : "inherit",
                  "& .MuiIconButton-root": {
                    color: filterLine ? "#1976d2" : "inherit",
                  },
                }}
              >
                Chuyền
                <IconButton
                  size="small"
                  onClick={(e) => handleFilterClick(e, setLineAnchorEl)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={lineAnchorEl}
                  open={Boolean(lineAnchorEl)}
                  onClose={() => handleClose(setLineAnchorEl)}
                >
                  <MenuItem value="">
                    <Checkbox
                      checked={!filterLine}
                      onChange={() => setFilterLine("")}
                    />
                    <ListItemText primary="Tất cả" />
                  </MenuItem>
                  {uniqueLines.map((line) => (
                    <MenuItem key={line} value={line}>
                      <Checkbox
                        checked={filterLine === line.toString()}
                        onChange={() => setFilterLine(line.toString())}
                      />
                      <ListItemText primary={`Chuyền ${line}`} />
                    </MenuItem>
                  ))}
                </Menu>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: filterStyle ? "#e3f2fd" : "inherit",
                  "& .MuiIconButton-root": {
                    color: filterStyle ? "#1976d2" : "inherit",
                  },
                }}
              >
                Mã Hàng
                <IconButton
                  size="small"
                  onClick={(e) => handleFilterClick(e, setStyleAnchorEl)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={styleAnchorEl}
                  open={Boolean(styleAnchorEl)}
                  onClose={() => handleClose(setStyleAnchorEl)}
                >
                  <MenuItem value="">
                    <Checkbox
                      checked={!filterStyle}
                      onChange={() => setFilterStyle("")}
                    />
                    <ListItemText primary="Tất cả" />
                  </MenuItem>
                  {uniqueStyles.map((style) => (
                    <MenuItem key={style} value={style}>
                      <Checkbox
                        checked={filterStyle === style}
                        onChange={() => setFilterStyle(style)}
                      />
                      <ListItemText primary={style} />
                    </MenuItem>
                  ))}
                </Menu>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: filterPlanDate ? "#e3f2fd" : "inherit",
                  "& .MuiIconButton-root": {
                    color: filterPlanDate ? "#1976d2" : "inherit",
                  },
                }}
              >
                Thời Gian CĐ Dự Kiến
                <IconButton
                  size="small"
                  onClick={(e) => handleFilterClick(e, setDateAnchorEl)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={dateAnchorEl}
                  open={Boolean(dateAnchorEl)}
                  onClose={() => handleClose(setDateAnchorEl)}
                >
                  <MenuItem value="">
                    <Checkbox
                      checked={!filterPlanDate}
                      onChange={() => setFilterPlanDate("")}
                    />
                    <ListItemText primary="Tất cả" />
                  </MenuItem>
                  {uniquePlanDates.map((date) => (
                    <MenuItem key={date} value={date}>
                      <Checkbox
                        checked={filterPlanDate === date}
                        onChange={() => setFilterPlanDate(date)}
                      />
                      <ListItemText primary={date} />
                    </MenuItem>
                  ))}
                </Menu>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: filterActualDate ? "#e3f2fd" : "inherit",
                  "& .MuiIconButton-root": {
                    color: filterActualDate ? "#1976d2" : "inherit",
                  },
                }}
              >
                Thời Gian CĐ Thực Tế
                <IconButton
                  size="small"
                  onClick={(e) => handleFilterClick(e, setActualDateAnchorEl)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={actualDateAnchorEl}
                  open={Boolean(actualDateAnchorEl)}
                  onClose={() => handleClose(setActualDateAnchorEl)}
                >
                  <MenuItem value="">
                    <Checkbox
                      checked={!filterActualDate}
                      onChange={() => setFilterActualDate("")}
                    />
                    <ListItemText primary="Tất cả" />
                  </MenuItem>
                  {uniqueActualDates.map((date) => (
                    <MenuItem key={date} value={date}>
                      <Checkbox
                        checked={filterActualDate === date}
                        onChange={() => setFilterActualDate(date)}
                      />
                      <ListItemText primary={date} />
                    </MenuItem>
                  ))}
                </Menu>
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: filterUpdatedBy ? "#e3f2fd" : "inherit",
                  "& .MuiIconButton-root": {
                    color: filterUpdatedBy ? "#1976d2" : "inherit",
                  },
                }}
              >
                Người Tạo
                <IconButton
                  size="small"
                  onClick={(e) => handleFilterClick(e, setUserAnchorEl)}
                >
                  <FilterListIcon fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={userAnchorEl}
                  open={Boolean(userAnchorEl)}
                  onClose={() => handleClose(setUserAnchorEl)}
                >
                  <MenuItem value="">
                    <Checkbox
                      checked={!filterUpdatedBy}
                      onChange={() => setFilterUpdatedBy("")}
                    />
                    <ListItemText primary="Tất cả" />
                  </MenuItem>
                  {uniqueUsers.map((user) => (
                    <MenuItem key={user} value={user}>
                      <Checkbox
                        checked={filterUpdatedBy === user}
                        onChange={() => setFilterUpdatedBy(user)}
                      />
                      <ListItemText primary={user} />
                    </MenuItem>
                  ))}
                </Menu>
              </TableCell>
              <TableCell>Thao Tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPlans.length > 0 ? (
              filteredPlans.map((plan, index) => (
                <TableRow key={plan.id_plan || `plan-${index}`}>
                  <TableCell>Chuyền {plan.line || ""}</TableCell>
                  <TableCell>{plan.style || ""}</TableCell>
                  <TableCell>{formatDateTime(plan.plan_date)}</TableCell>
                  <TableCell>{formatDateTime(plan.actual_date)}</TableCell>
                  <TableCell>{plan.updated_by || ""}</TableCell>
                  <TableCell>
                    <Tooltip title="Xem chi tiết">
                      <IconButton
                        onClick={() =>
                          navigate(`/detailed-phase/${plan.id_plan}`)
                        }
                        color="primary"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
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
      </Paper>
    </Container>
  );
};

export default CreatePhasePage;
