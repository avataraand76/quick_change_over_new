// frontend/src/components/NotificationDialog.jsx

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Slide,
  Fade,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const NotificationDialog = ({
  open,
  onClose,
  title,
  message,
  severity = "info",
}) => {
  const getIcon = () => {
    const iconStyle = { fontSize: 48 };
    switch (severity) {
      case "success":
        return <CheckCircleIcon sx={{ ...iconStyle, color: "#4caf50" }} />;
      case "error":
        return <ErrorIcon sx={{ ...iconStyle, color: "#f44336" }} />;
      case "warning":
        return <WarningIcon sx={{ ...iconStyle, color: "#ff9800" }} />;
      default:
        return <InfoIcon sx={{ ...iconStyle, color: "#2196f3" }} />;
    }
  };

  const getColor = () => {
    switch (severity) {
      case "success":
        return {
          main: "#4caf50",
          light: "#e8f5e9",
          dark: "#2e7d32",
        };
      case "error":
        return {
          main: "#f44336",
          light: "#ffebee",
          dark: "#c62828",
        };
      case "warning":
        return {
          main: "#ff9800",
          light: "#fff3e0",
          dark: "#ef6c00",
        };
      default:
        return {
          main: "#2196f3",
          light: "#e3f2fd",
          dark: "#1565c0",
        };
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="notification-dialog-title"
      aria-describedby="notification-dialog-description"
      TransitionComponent={Slide}
      TransitionProps={{ direction: "up" }}
      PaperProps={{
        sx: {
          minWidth: { xs: "90%", sm: 400, md: 450 },
          maxWidth: 500,
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        },
      }}
    >
      <Fade in={open}>
        <Box>
          <DialogTitle
            id="notification-dialog-title"
            sx={{
              p: 3,
              pb: 2,
              bgcolor: getColor().light,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              position: "relative",
            }}
          >
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "rgba(0, 0, 0, 0.5)",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
            <Box sx={{ mb: 2 }}>{getIcon()}</Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                color: getColor().dark,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {title}
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ p: 3, pt: 2 }}>
            <DialogContentText
              id="notification-dialog-description"
              sx={{
                textAlign: "center",
                color: "text.primary",
                fontSize: "1rem",
                mb: 1,
              }}
            >
              {message}
            </DialogContentText>
          </DialogContent>

          <DialogActions
            sx={{
              p: 2.5,
              bgcolor: getColor().light,
              justifyContent: "center",
            }}
          >
            <Button
              onClick={onClose}
              variant="contained"
              disableElevation
              sx={{
                minWidth: 120,
                bgcolor: getColor().main,
                color: "#fff",
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
                borderRadius: 2,
                "&:hover": {
                  bgcolor: getColor().dark,
                },
                "&:active": {
                  transform: "scale(0.98)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Đóng
            </Button>
          </DialogActions>
        </Box>
      </Fade>
    </Dialog>
  );
};

export default NotificationDialog;
