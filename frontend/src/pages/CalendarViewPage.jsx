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
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
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
  const filteredEvents = selectedWorkshop
    ? events.filter(
        (event) => event.extendedProps.workshop === selectedWorkshop
      )
    : events;

  // Workshop selection buttons
  const WorkshopButtons = () => (
    <Box sx={{ mb: 2, display: "flex", gap: 1, justifyContent: "right" }}>
      <Button
        variant={selectedWorkshop === null ? "contained" : "outlined"}
        onClick={() => setSelectedWorkshop(null)}
        sx={{ borderRadius: 2 }}
      >
        Tất cả
      </Button>
      {[1, 2, 3, 4].map((workshop) => (
        <Button
          key={workshop}
          variant={selectedWorkshop === workshop ? "contained" : "outlined"}
          onClick={() => setSelectedWorkshop(workshop)}
          sx={{ borderRadius: 2 }}
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
    return (
      <>
        <div className="fc-event-title">
          Chuyền: {eventInfo.event.extendedProps.line} - Mã hàng:{" "}
          {eventInfo.event.extendedProps.style}
        </div>
      </>
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
    },
    ".fc .fc-button": {
      textTransform: "capitalize",
    },
    ".fc .fc-event": {
      cursor: "pointer",
      fontSize: "1.2rem",
    },
    ".fc .fc-event:hover": {
      opacity: 0.9,
    },
    ".fc .fc-daygrid-day-number": {
      fontSize: "1.2rem",
    },
    ".fc th": {
      fontSize: "1.2rem",
    },
    ".fc .fc-day-today": {
      backgroundColor: "#ACFFFC !important",
    },
    ".fc-theme-standard .fc-list-day-cushion": {
      backgroundColor: theme.palette.grey[100],
      fontSize: "1.2rem",
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
                    },
                    dayGridMonth: {
                      buttonText: "Month",
                      hiddenDays: [0],
                    },
                    multiMonthYear: {
                      buttonText: "Year",
                      hiddenDays: [0],
                      multiMonthMaxColumns: 2,
                    },
                  }}
                  hiddenDays={[0]}
                  events={filteredEvents}
                  eventClick={handleEventClick}
                  eventContent={renderEventContent}
                  height="auto"
                  // locale={viLocale}
                  timeZone="local"
                  firstDay={1}
                  nowIndicator={true}
                  displayEventTime={false}
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
