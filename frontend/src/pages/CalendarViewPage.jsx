// frontend/src/pages/CalendarViewPage.jsx

import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
// import viLocale from "@fullcalendar/core/locales/vi";
import API from "../api/api";
import {
  Box,
  Paper,
  Typography,
  Container,
  CircularProgress,
  Alert,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import EventIcon from "@mui/icons-material/Event";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import InventoryIcon from "@mui/icons-material/Inventory";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PercentIcon from "@mui/icons-material/Percent";

const StyledDialog = styled(Dialog)(() => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    padding: 0,
    minWidth: 800,
    maxWidth: 1000,
    width: "90%",
    overflow: "hidden",
  },
}));

const CalendarViewPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedWorkshops, setSelectedWorkshops] = useState([]);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await API.getAllPlansForCalendar();
        setEvents(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch calendar events:", err);
        setError("Không thể tải dữ liệu lịch. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events based on selected workshop
  const filteredEvents =
    selectedWorkshops.length > 0
      ? events.filter((event) =>
          selectedWorkshops.includes(event.extendedProps.workshop)
        )
      : events;

  // Workshop selection buttons
  const WorkshopButtons = () => (
    <Box sx={{ mb: 2, display: "flex", gap: 1, justifyContent: "right" }}>
      <Button
        variant={selectedWorkshops.length === 0 ? "contained" : "outlined"}
        onClick={() => setSelectedWorkshops([])}
        sx={{ borderRadius: 2 }}
      >
        Tất cả
      </Button>
      {[1, 2, 3, 4].map((workshop) => (
        <Button
          key={workshop}
          variant={
            selectedWorkshops.includes(workshop) ? "contained" : "outlined"
          }
          onClick={() => {
            setSelectedWorkshops((prev) => {
              if (prev.includes(workshop)) {
                // Nếu xưởng đã được chọn, loại bỏ khỏi mảng
                return prev.filter((w) => w !== workshop);
              } else {
                // Nếu xưởng chưa được chọn, thêm vào mảng
                return [...prev, workshop];
              }
            });
          }}
          sx={{
            borderRadius: 2,
            // Màu nền khi button được chọn (variant="contained")
            backgroundColor: selectedWorkshops.includes(workshop)
              ? workshop === 1
                ? "#0373d9"
                : workshop === 2
                ? "#00da8c"
                : workshop === 3
                ? "#180cda"
                : "#3ada14"
              : "transparent",
            // Màu viền khi button không được chọn (variant="outlined")
            borderColor:
              workshop === 1
                ? "#0373d9"
                : workshop === 2
                ? "#00da8c"
                : workshop === 3
                ? "#180cda"
                : "#3ada14",
            // Màu chữ
            color: selectedWorkshops.includes(workshop)
              ? "#fff"
              : workshop === 1
              ? "#0373d9"
              : workshop === 2
              ? "#00da8c"
              : workshop === 3
              ? "#180cda"
              : "#3ada14",
            "&:hover": {
              backgroundColor: selectedWorkshops.includes(workshop)
                ? workshop === 1
                  ? "#025bb5"
                  : workshop === 2
                  ? "#00b374"
                  : workshop === 3
                  ? "#1309b5"
                  : "#2fb310"
                : "rgba(0, 0, 0, 0.04)",
              borderColor:
                workshop === 1
                  ? "#0373d9"
                  : workshop === 2
                  ? "#00da8c"
                  : workshop === 3
                  ? "#180cda"
                  : "#3ada14",
            },
          }}
        >
          Xưởng {workshop}
        </Button>
      ))}
    </Box>
  );

  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      line: clickInfo.event.extendedProps.line,
      style: clickInfo.event.extendedProps.style,
      plan_date: clickInfo.event.extendedProps.plan_date,
      actual_date: clickInfo.event.extendedProps.actual_date,
      total_percent_rate: clickInfo.event.extendedProps.total_percent_rate || 0,
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
  };

  const handleConfirmNavigation = () => {
    navigate(`/detailed-phase/${selectedEvent.id}`);
    handleDialogClose();
  };

  const renderEventContent = (eventInfo) => {
    // Lấy backgroundColor và textColor từ sự kiện
    const backgroundColor = eventInfo.event.backgroundColor || "#808080"; // Mặc định là xám nếu không có màu
    const textColor = eventInfo.event.textColor || "white"; // Mặc định là trắng nếu không có textColor

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          overflow: "hidden",
          backgroundColor: backgroundColor, // Áp dụng backgroundColor cho sự kiện
          borderRadius: "4px", // Bo góc cho sự kiện
          padding: "2px 4px", // Thêm padding để sự kiện trông đẹp hơn
          width: "100%", // Đảm bảo sự kiện chiếm toàn bộ chiều rộng trong listDay
        }}
      >
        {/* Hiển thị chấm trắng trong tất cả các chế độ */}
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "white", // Chấm màu trắng để nổi bật trên nền màu
            flexShrink: 0,
          }}
        />
        <div
          className="fc-event-title"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "0.9rem",
            lineHeight: "1.2",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
            color: textColor, // Áp dụng textColor
          }}
        >
          {eventInfo.event.title}
        </div>
      </Box>
    );
  };

  const getProgressColor = (value) => {
    if (value < 30) return "#f44336"; // red
    if (value < 70) return "#ff9800"; // orange
    return "#4caf50"; // green
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

  // Custom styles for FullCalendar using MUI theme
  const calendarStyles = {
    ".fc .fc-toolbar-title": {
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightBold,
      fontFamily: "Arial, sans-serif",
    },
    ".fc .fc-button": {
      textTransform: "capitalize",
      fontFamily: "Arial, sans-serif",
    },
    ".fc .fc-event": {
      cursor: "pointer",
      fontFamily: "Arial, sans-serif",
      fontSize: "0.9rem",
      border: "none",
      padding: "3px 5px",
      overflow: "hidden",
      lineHeight: "1.2",
      borderRadius: "4px",
    },
    ".fc .fc-event:hover": {
      opacity: 0.9,
    },
    ".fc .fc-daygrid-day-number": {
      fontSize: "1.2rem",
      fontFamily: "Arial, sans-serif",
    },
    ".fc th": {
      fontSize: "1.2rem",
      fontFamily: "Arial, sans-serif",
    },
    ".fc .fc-day-today": {
      backgroundColor: "#ACFFFC !important",
    },
    ".fc-theme-standard .fc-list-day-cushion": {
      backgroundColor: theme.palette.grey[100],
      fontSize: "1.2rem",
      fontFamily: "Arial, sans-serif",
    },
    // Style cho sự kiện trong chế độ listDay
    ".fc .fc-list-event": {
      fontFamily: "Arial, sans-serif",
      fontSize: "0.9rem",
      lineHeight: "1.2",
      padding: "3px 5px",
      border: "none",
    },
    ".fc .fc-list-event-dot": {
      display: "none", // Ẩn chấm màu mặc định
    },
    // Style cho tiêu đề sự kiện trong chế độ listDay
    ".fc .fc-list-event .fc-event-title": {
      fontFamily: "Arial, sans-serif",
      fontSize: "0.9rem",
      lineHeight: "1.2",
      width: "100%",
    },
    // Đảm bảo sự kiện trong dayGridMonth hiển thị dạng thanh
    ".fc .fc-daygrid-day-events .fc-daygrid-event": {
      fontFamily: "Arial, sans-serif",
      fontSize: "0.9rem",
      lineHeight: "1.2",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%",
      padding: "2px 4px",
      borderRadius: "4px",
    },
    ".fc .fc-daygrid-day-events": {
      position: "relative !important",
      minHeight: "auto !important",
      height: "auto !important",
      display: "flex !important",
      flexDirection: "column !important",
      gap: "2px !important",
      margin: "0 !important",
      padding: "2px !important",
    },
    ".fc .fc-daygrid-event-harness": {
      position: "relative !important",
      margin: "0 !important",
      top: "0 !important",
      left: "0 !important",
      right: "0 !important",
    },
    ".fc .fc-daygrid-day-bottom": {
      margin: "0 !important",
      padding: "2px 0 !important",
    },
    ".fc .fc-daygrid-body": {
      width: "100% !important",
    },
    ".fc .fc-daygrid-body table": {
      width: "100% !important",
    },
    ".fc .fc-scrollgrid-sync-table": {
      height: "auto !important",
      width: "100% !important",
    },
    ".fc-view-harness": {
      height: "auto !important",
    },
    "@media (max-width: 600px)": {
      ".fc .fc-toolbar": {
        flexDirection: "column",
      },
      ".fc .fc-toolbar-title": {
        fontSize: theme.typography.h6.fontSize,
        margin: theme.spacing(1, 0),
      },
    },
  };

  return (
    <Container
      sx={{ mt: 4, mb: 4, maxWidth: "100% !important", px: "0 !important" }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: 2,
          overflow: "hidden",
          mx: 1,
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
            LỊCH KẾ HOẠCH SẢN XUẤT
          </Typography>
        </Box>

        <Box sx={{ p: 2, minHeight: "70vh" }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "50vh",
              }}
            >
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Đang tải dữ liệu lịch...</Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              <WorkshopButtons />
              <Box sx={{ ...calendarStyles, ".fc": { width: "100%" } }}>
                <FullCalendar
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    listPlugin,
                    multiMonthPlugin,
                  ]}
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "listDay,dayGridWeek,dayGridMonth,multiMonthYear",
                  }}
                  initialView="dayGridMonth"
                  views={{
                    listDay: {
                      buttonText: "Day",
                      hiddenDays: [0],
                    },
                    dayGridWeek: {
                      buttonText: "Week",
                      hiddenDays: [0],
                      dayMaxEvents: false,
                    },
                    dayGridMonth: {
                      buttonText: "Month",
                      hiddenDays: [0],
                      dayMaxEvents: false,
                    },
                    multiMonthYear: {
                      buttonText: "Year",
                      hiddenDays: [0],
                      multiMonthMaxColumns: 2,
                      dayMaxEvents: false,
                    },
                  }}
                  hiddenDays={[0]}
                  events={filteredEvents}
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  height="auto"
                  // locale={viLocale}
                  contentHeight="auto"
                  timeZone="local"
                  firstDay={1}
                  nowIndicator={true}
                  displayEventTime={false}
                  dayMaxEvents={false}
                  eventDisplay="block"
                />
              </Box>
            </>
          )}
        </Box>
      </Paper>

      <StyledDialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 3,
            pb: 2,
            backgroundColor: theme.palette.primary.main,
            color: "white",
          }}
        >
          <EventIcon />
          <Typography variant="h6" component="span">
            Chi tiết kế hoạch sản xuất
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {selectedEvent && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2, mt: "24px" }}>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: theme.palette.grey[100],
                      borderColor: theme.palette.grey[300],
                    },
                  }}
                >
                  <FormatListNumberedIcon
                    color="primary"
                    sx={{ fontSize: 28 }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Chuyền sản xuất
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedEvent.line}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: theme.palette.grey[100],
                      borderColor: theme.palette.grey[300],
                    },
                  }}
                >
                  <InventoryIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Mã hàng
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedEvent.style}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: theme.palette.grey[100],
                      borderColor: theme.palette.grey[300],
                    },
                  }}
                >
                  <EventIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Ngày dự kiến
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatDateTime(selectedEvent.plan_date) || "Chưa có"}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 2,
                    bgcolor: theme.palette.grey[50],
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.grey[200]}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: theme.palette.grey[100],
                      borderColor: theme.palette.grey[300],
                    },
                  }}
                >
                  <EventIcon color="primary" sx={{ fontSize: 28 }} />
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      Ngày thực hiện
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {formatDateTime(selectedEvent.actual_date) || "Chưa có"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.grey[200]}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: theme.palette.grey[100],
                    borderColor: theme.palette.grey[300],
                  },
                }}
              >
                <PercentIcon color="primary" sx={{ fontSize: 28 }} />
                <Box sx={{ width: "100%" }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Tiến độ hoàn thành
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={selectedEvent.total_percent_rate}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: getProgressColor(
                              selectedEvent.total_percent_rate
                            ),
                          },
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        minWidth: 60,
                        textAlign: "right",
                        color: getProgressColor(
                          selectedEvent.total_percent_rate
                        ),
                      }}
                    >
                      {selectedEvent.total_percent_rate}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 2,
            borderTop: `1px solid ${theme.palette.grey[200]}`,
            gap: 1,
          }}
        >
          <Button
            onClick={handleDialogClose}
            variant="outlined"
            color="inherit"
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Đóng
          </Button>
          <Button
            onClick={handleConfirmNavigation}
            variant="contained"
            color="primary"
            startIcon={<VisibilityIcon />}
            autoFocus
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            Xem chi tiết
          </Button>
        </DialogActions>
      </StyledDialog>
    </Container>
  );
};

export default CalendarViewPage;
