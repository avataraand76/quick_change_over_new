// frontend/src/pages/Process4Page.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
  Tooltip,
  ListItemSecondaryAction,
  CardHeader,
  FormControl,
  Stack,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  DateRange as DateIcon,
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import API from "../api/api";

const Process4Page = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [processInfo, setProcessInfo] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [workSteps, setWorkSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  // File upload states
  const [documentationFiles, setDocumentationFiles] = useState([]);
  const [a3DocumentationFiles, setA3DocumentationFiles] = useState([]);
  const [uploadedDocumentations, setUploadedDocumentations] = useState([]);
  const [uploadedA3Documentations, setUploadedA3Documentations] = useState([]);
  const [uploadingDocumentation, setUploadingDocumentation] = useState(false);
  const [uploadingA3, setUploadingA3] = useState(false);
  const [openFilePreview, setOpenFilePreview] = useState(false);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewDirectUrl, setPreviewDirectUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New state for overdue check
  const [isOverdue, setIsOverdue] = useState(false);

  // New state for dialog
  const [openErrorDialog, setOpenErrorDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  // New function to check if a process is overdue
  const checkIsOverdue = useCallback((actualDate, deadline) => {
    if (!actualDate || !deadline) return false;

    const actualDateTime = new Date(actualDate);
    const deadlineDate = new Date(actualDateTime);
    deadlineDate.setDate(deadlineDate.getDate() - deadline);

    return new Date() > deadlineDate;
  }, []);

  // Fetch documentation files
  const fetchDocumentationFiles = useCallback(async () => {
    try {
      const response = await API.getProcess4Documentation(id);
      setUploadedDocumentations(response.files || []);
    } catch (error) {
      console.error("Error fetching documentation files:", error);
    }
  }, [id]);

  // Fetch A3 documentation files
  const fetchA3DocumentationFiles = useCallback(async () => {
    try {
      const response = await API.getProcess4A3Documentation(id);
      setUploadedA3Documentations(response.files || []);
    } catch (error) {
      console.error("Error fetching A3 documentation files:", error);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch plan details
        const planResponse = await API.getPlanById(id);
        setPlan(planResponse);

        // Fetch all processes to get deadline information
        const processesResponse = await API.getProcesses();
        setProcesses(processesResponse);

        // Fetch process rates to get the completion percentage
        const processRatesResponse = await API.getProcessRates(id);
        const process4Rate = processRatesResponse.find(
          (rate) => rate.id_process === 4
        );
        if (process4Rate) {
          setProcessInfo(process4Rate);
        }

        // Fetch work steps for Process 4
        const workStepsResponse = await API.getWorkSteps(4);
        setWorkSteps(workStepsResponse);

        // Fetch existing documentation files
        await fetchDocumentationFiles();
        await fetchA3DocumentationFiles();

        // Check if Process 1 is overdue
        const process1 = processesResponse.find((p) => p.id_process === 1);
        if (process1 && planResponse.actual_date) {
          const overdue = checkIsOverdue(
            planResponse.actual_date,
            process1.deadline
          );
          setIsOverdue(overdue);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, fetchDocumentationFiles, fetchA3DocumentationFiles, checkIsOverdue]);

  // Calculate deadline date based on actual_date and deadline days
  const calculateDeadlineDate = (actualDateString, deadlineDays) => {
    if (
      !actualDateString ||
      deadlineDays === null ||
      deadlineDays === undefined ||
      deadlineDays === ""
    )
      return "-";

    // Parse the actual date
    const actualDate = new Date(actualDateString);
    // Only use the date part (ignore time)
    const dateOnly = new Date(
      actualDate.getFullYear(),
      actualDate.getMonth(),
      actualDate.getDate()
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

  const getProgressColor = (value) => {
    if (value < 30) return "#f44336"; // red
    if (value < 70) return "#ff9800"; // orange
    return "#4caf50"; // green
  };

  // Get deadline information for Process 4
  const getDeadlineInfo = () => {
    const process4 = processes.find((p) => p.id_process === 4);
    if (!process4) return { text: "Đang tải...", date: null };

    if (!process4.deadline || process4.deadline === 0) {
      return { text: "Cùng ngày với thời gian thực tế", date: null };
    }

    return {
      text: `${process4.deadline} ngày trước thời gian thực tế`,
      date: calculateDeadlineDate(plan?.actual_date, process4.deadline),
    };
  };

  const deadlineInfo = getDeadlineInfo();

  // Format date to match dd/mm/yyyy, hh:mm AM/PM format
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    hours = hours % 12 || 12; // Convert to 12-hour format, making 0 => 12
    hours = String(hours).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  const MAX_FILES = 10;
  const MAX_SIZE = 100;
  const MAX_SIZE_MB = 100 * 1024 * 1024; // 100MB in bytes

  // Handle documentation file selection
  const handleDocumentationFileSelect = (e) => {
    if (!e.target.files) {
      return;
    }

    const newSelectedFiles = Array.from(e.target.files);

    // Phân loại file theo kích thước
    const validFiles = [];
    const oversizedFiles = [];

    newSelectedFiles.forEach((file) => {
      if (file.size > MAX_SIZE_MB) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    // Kiểm tra tổng số file hợp lệ
    const totalValidFiles = documentationFiles.length + validFiles.length;

    if (totalValidFiles > MAX_FILES) {
      // Tính số file có thể thêm
      const remainingSlots = MAX_FILES - documentationFiles.length;

      if (remainingSlots > 0) {
        // Chỉ lấy số file còn có thể thêm
        validFiles.splice(remainingSlots);

        setDialogMessage(
          `Bạn chỉ có thể chọn thêm ${remainingSlots} file. ` +
            `Đã chọn ${validFiles.length} file đầu tiên trong số các file hợp lệ.` +
            (oversizedFiles.length > 0
              ? `\n\nFile ${oversizedFiles.join(
                  ", "
                )} vượt quá giới hạn ${MAX_SIZE}MB.`
              : "")
        );
      } else {
        setDialogMessage(
          `Không thể thêm file mới. Đã đạt giới hạn tối đa ${MAX_FILES} file.` +
            (oversizedFiles.length > 0
              ? `\n\nFile ${oversizedFiles.join(
                  ", "
                )} vượt quá giới hạn ${MAX_SIZE}MB.`
              : "")
        );
      }
      setOpenErrorDialog(true);
    } else if (oversizedFiles.length > 0) {
      // Chỉ thông báo về file vượt kích thước
      setDialogMessage(
        `File ${oversizedFiles.join(", ")} vượt quá giới hạn ${MAX_SIZE}MB. ` +
          (validFiles.length > 0 ? "\n\nCác file còn lại sẽ được chọn." : "")
      );
      setOpenErrorDialog(true);
    }

    // Nếu có file hợp lệ và còn slot trống, cập nhật state
    if (validFiles.length > 0 && totalValidFiles <= MAX_FILES) {
      setDocumentationFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }
  };

  // Handle A3 documentation file selection
  const handleA3DocumentationFileSelect = (e) => {
    if (!e.target.files) {
      return;
    }

    const newSelectedFiles = Array.from(e.target.files);

    // Phân loại file theo kích thước
    const validFiles = [];
    const oversizedFiles = [];

    newSelectedFiles.forEach((file) => {
      if (file.size > MAX_SIZE_MB) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    // Kiểm tra tổng số file hợp lệ
    const totalValidFiles = a3DocumentationFiles.length + validFiles.length;

    if (totalValidFiles > MAX_FILES) {
      // Tính số file có thể thêm
      const remainingSlots = MAX_FILES - a3DocumentationFiles.length;

      if (remainingSlots > 0) {
        // Chỉ lấy số file còn có thể thêm
        validFiles.splice(remainingSlots);

        setDialogMessage(
          `Bạn chỉ có thể chọn thêm ${remainingSlots} file. ` +
            `Đã chọn ${validFiles.length} file đầu tiên trong số các file hợp lệ.` +
            (oversizedFiles.length > 0
              ? `\n\nFile ${oversizedFiles.join(
                  ", "
                )} vượt quá giới hạn ${MAX_SIZE}MB.`
              : "")
        );
      } else {
        setDialogMessage(
          `Không thể thêm file mới. Đã đạt giới hạn tối đa ${MAX_FILES} file.` +
            (oversizedFiles.length > 0
              ? `\n\nFile ${oversizedFiles.join(
                  ", "
                )} vượt quá giới hạn ${MAX_SIZE}MB.`
              : "")
        );
      }
      setOpenErrorDialog(true);
    } else if (oversizedFiles.length > 0) {
      // Chỉ thông báo về file vượt kích thước
      setDialogMessage(
        `File ${oversizedFiles.join(", ")} vượt quá giới hạn ${MAX_SIZE}MB. ` +
          (validFiles.length > 0 ? "\n\nCác file còn lại sẽ được chọn." : "")
      );
      setOpenErrorDialog(true);
    }

    // Nếu có file hợp lệ và còn slot trống, cập nhật state
    if (validFiles.length > 0 && totalValidFiles <= MAX_FILES) {
      setA3DocumentationFiles((prevFiles) => [...prevFiles, ...validFiles]);
    }
  };

  // Upload documentation files
  const uploadDocumentationFiles = async () => {
    if (documentationFiles.length === 0) return;

    setUploadingDocumentation(true);
    try {
      await API.uploadProcess4DocumentationFile(id, documentationFiles);
      setDocumentationFiles([]);
      fetchDocumentationFiles(); // Refresh the list
      // Also refresh the table data since percent_rate could have changed
      const processRatesResponse = await API.getProcessRates(id);
      const process4Rate = processRatesResponse.find(
        (rate) => rate.id_process === 4
      );
      if (process4Rate) {
        setProcessInfo(process4Rate);
      }
    } catch (error) {
      console.error("Error uploading documentation files:", error);
    } finally {
      setUploadingDocumentation(false);
    }
  };

  // Upload A3 documentation files
  const uploadA3DocumentationFiles = async () => {
    if (a3DocumentationFiles.length === 0) return;

    setUploadingA3(true);
    try {
      await API.uploadProcess4A3DocumentationFile(id, a3DocumentationFiles);
      setA3DocumentationFiles([]);
      fetchA3DocumentationFiles(); // Refresh the list
    } catch (error) {
      console.error("Error uploading A3 documentation files:", error);
    } finally {
      setUploadingA3(false);
    }
  };

  // Delete documentation file
  const deleteDocumentationFile = async (index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này không?")) {
      return;
    }

    try {
      const response = await API.deleteProcess4Documentation(id, index);
      if (response.success) {
        setSuccess("Xóa tài liệu thành công");
        fetchDocumentationFiles(); // Refresh the list
        // Also refresh the table data since percent_rate could have changed
        const processRatesResponse = await API.getProcessRates(id);
        const process4Rate = processRatesResponse.find(
          (rate) => rate.id_process === 4
        );
        if (process4Rate) {
          setProcessInfo(process4Rate);
        }
        setTimeout(() => setSuccess(""), 3000); // Clear success message after 3s
      }
    } catch (error) {
      console.error("Error deleting documentation file:", error);
      setError(error.message || "Không thể xóa tài liệu");
      setTimeout(() => setError(""), 3000); // Clear error message after 3s
    }
  };

  // Delete A3 documentation file
  const deleteA3DocumentationFile = async (index) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu A3 này không?")) {
      return;
    }

    try {
      const response = await API.deleteProcess4A3Documentation(id, index);
      if (response.success) {
        setSuccess("Xóa tài liệu A3 thành công");
        fetchA3DocumentationFiles(); // Refresh the list
        setTimeout(() => setSuccess(""), 3000); // Clear success message after 3s
      }
    } catch (error) {
      console.error("Error deleting A3 documentation file:", error);
      setError(error.message || "Không thể xóa tài liệu A3");
      setTimeout(() => setError(""), 3000); // Clear error message after 3s
    }
  };

  // Open file preview
  const openPreview = (directUrl, filename) => {
    // Convert Google Drive URL to preview URL if it's not already a preview URL
    let previewUrl = directUrl;
    if (directUrl.includes("drive.google.com")) {
      const fileId = directUrl.match(/[-\w]{25,}/);
      if (fileId) {
        previewUrl = `https://drive.google.com/file/d/${fileId[0]}/preview`;
      }
    }
    setPreviewDirectUrl(previewUrl);
    setPreviewFileName(filename);
    setOpenFilePreview(true);
  };

  // Close file preview
  const closePreview = () => {
    setOpenFilePreview(false);
    setPreviewFileName("");
    setPreviewDirectUrl("");
  };

  // Hàm xử lý đóng dialog
  const handleCloseErrorDialog = () => {
    setOpenErrorDialog(false);
    setDialogMessage("");
  };

  // Thêm hàm xử lý xóa file đã chọn
  const handleRemoveSelectedFile = (indexToRemove) => {
    setDocumentationFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  // Thêm hàm xử lý xóa file A3 đã chọn
  const handleRemoveSelectedA3File = (indexToRemove) => {
    setA3DocumentationFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  if (loading) {
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
  }

  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/detailed-phase/${id}`)}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          Quay lại
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Basic Plan Information Card */}
      <Card
        elevation={4}
        sx={{
          marginTop: 2,
          borderRadius: 2,
          overflow: "visible",
          mb: 4,
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
            THÔNG TIN KẾ HOẠCH CHUYỂN ĐỔI
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Thông Tin Chung
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" gutterBottom>
                      <strong>Chuyền:</strong> {plan?.line || "..."}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body1">
                      <strong>Mã Hàng:</strong> {plan?.style || "..."}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Thời Gian
                  </Typography>
                  <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                    <DateIcon sx={{ mr: 1, color: "#1976d2" }} />
                    <Typography variant="body1">
                      <strong>Thời Gian Dự Kiến:</strong>{" "}
                      {plan?.plan_date ? formatDateTime(plan.plan_date) : "..."}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <DateIcon sx={{ mr: 1, color: "#1976d2" }} />
                    <Typography variant="body1">
                      <strong>Thời Gian Thực Tế:</strong>{" "}
                      {plan?.actual_date
                        ? formatDateTime(plan.actual_date)
                        : "..."}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Work Steps Card */}
      <Card
        elevation={4}
        sx={{
          borderRadius: 2,
          overflow: "visible",
          mb: 4,
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
            CÁC BƯỚC CÔNG VIỆC LẬP QUY TRÌNH CÔNG NGHỆ, THIẾT KẾ SƠ ĐỒ CHUYỀN,
            CÂN BẰNG YAMAZUMI
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          {workSteps.length > 0 ? (
            <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              {workSteps.map((step, index) => (
                <ListItem
                  key={step.id_work_steps}
                  divider={index < workSteps.length - 1}
                  alignItems="flex-start"
                  sx={{
                    py: 2,
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.04)",
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      width: 36,
                      height: 36,
                      mr: 2,
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1}
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
              ))}
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
                Không có bước công việc nào cho quy trình này
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Process 4 Information Card */}
      <Card
        elevation={4}
        sx={{
          borderRadius: 2,
          overflow: "visible",
          mb: 4,
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
            LẬP QUY TRÌNH CÔNG NGHỆ, THIẾT KẾ SƠ ĐỒ CHUYỀN, CÂN BẰNG YAMAZUMI
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Thông Tin Quy Trình
                  </Typography>
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Thời Hạn:</strong>
                    </Typography>
                    <Typography variant="body1">{deadlineInfo.text}</Typography>
                    {deadlineInfo.date && (
                      <Typography variant="body2" color="text.secondary">
                        Hạn chót: {deadlineInfo.date}
                      </Typography>
                    )}
                  </Box>
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
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body1" fontWeight="medium">
                        Tỉ lệ hoàn thành
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={getProgressColor(processInfo?.percent_rate || 0)}
                      >
                        {processInfo?.percent_rate || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={processInfo?.percent_rate || 0}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        mt: 1,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: getProgressColor(
                            processInfo?.percent_rate || 0
                          ),
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documentation Card */}
      <Card
        elevation={4}
        sx={{
          borderRadius: 2,
          overflow: "visible",
          mb: 4,
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
            TÀI LIỆU MINH CHỨNG
          </Typography>
        </Box>

        <CardContent sx={{ padding: 3 }}>
          <Grid container spacing={3}>
            {/* Evidence Documentation Section */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Tài liệu Minh chứng
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<InsertDriveFileIcon />}
                        disabled={isOverdue}
                        sx={{
                          opacity: isOverdue ? 0.5 : 1,
                        }}
                      >
                        Chọn tập tin
                        <input
                          type="file"
                          hidden
                          multiple
                          onChange={handleDocumentationFileSelect}
                          disabled={isOverdue}
                          onClick={(e) => {
                            // Reset value để có thể chọn lại cùng file
                            e.target.value = null;
                          }}
                        />
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={
                          uploadingDocumentation ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : documentationFiles.length > 0 ? (
                            <CloudUploadIcon />
                          ) : (
                            <CheckIcon />
                          )
                        }
                        onClick={uploadDocumentationFiles}
                        disabled={
                          documentationFiles.length === 0 ||
                          uploadingDocumentation ||
                          isOverdue
                        }
                        sx={{
                          opacity: isOverdue ? 0.5 : 1,
                        }}
                      >
                        {uploadingDocumentation
                          ? "Đang tải lên..."
                          : documentationFiles.length > 0
                          ? "Tải lên"
                          : "Chọn tập tin để tải lên"}
                      </Button>
                    </Stack>

                    {/* Thêm thông báo nếu quá hạn */}
                    {isOverdue && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{
                          mt: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <WarningIcon fontSize="small" />
                        Đã quá hạn nộp tài liệu minh chứng cho quy trình này
                      </Typography>
                    )}

                    {/* Selected Files List */}
                    {documentationFiles.length > 0 && (
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, fontWeight: "medium" }}
                        >
                          Tập tin đã chọn ({documentationFiles.length}):
                        </Typography>
                        <List dense>
                          {Array.from(documentationFiles).map((file, index) => (
                            <ListItem
                              key={index}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() =>
                                    handleRemoveSelectedFile(index)
                                  }
                                  size="small"
                                  sx={{
                                    color: "error.main",
                                    "&:hover": {
                                      backgroundColor: "error.lighter",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={file.name}
                                secondary={`${(
                                  file.size /
                                  (1024 * 1024)
                                ).toFixed(2)} MB`}
                                sx={{
                                  pr: 2,
                                  "& .MuiListItemText-primary": {
                                    fontSize: "0.9rem",
                                  },
                                  "& .MuiListItemText-secondary": {
                                    fontSize: "0.8rem",
                                  },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    )}

                    {!isOverdue && (
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Giới hạn: Tối đa {MAX_FILES} tập tin, mỗi tập tin không
                        quá {MAX_SIZE}MB
                      </Typography>
                    )}
                  </Box>

                  {/* Uploaded Files List */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, fontWeight: "medium" }}
                    >
                      Tài liệu đã tải lên:
                    </Typography>
                    {uploadedDocumentations.length > 0 ? (
                      <List sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}>
                        {uploadedDocumentations.map((doc, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              borderBottom:
                                index < uploadedDocumentations.length - 1
                                  ? "1px solid #e0e0e0"
                                  : "none",
                            }}
                          >
                            <ListItemText
                              primary={doc.filename}
                              sx={{ mr: 2 }}
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="Xem tài liệu">
                                <IconButton
                                  edge="end"
                                  onClick={() =>
                                    openPreview(doc.directUrl, doc.filename)
                                  }
                                  sx={{ mr: 1 }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa tài liệu">
                                <IconButton
                                  edge="end"
                                  onClick={() => deleteDocumentationFile(index)}
                                  disabled={isOverdue}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Chưa có tài liệu nào được tải lên
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* A3 Documentation Section */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Tài liệu A3
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ mb: 2 }}
                    >
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<InsertDriveFileIcon />}
                      >
                        Chọn tập tin
                        <input
                          type="file"
                          hidden
                          multiple
                          onChange={handleA3DocumentationFileSelect}
                          onClick={(e) => {
                            // Reset value để có thể chọn lại cùng file
                            e.target.value = null;
                          }}
                        />
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={
                          uploadingA3 ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : a3DocumentationFiles.length > 0 ? (
                            <CloudUploadIcon />
                          ) : (
                            <CheckIcon />
                          )
                        }
                        onClick={uploadA3DocumentationFiles}
                        disabled={
                          a3DocumentationFiles.length === 0 || uploadingA3
                        }
                      >
                        {uploadingA3
                          ? "Đang tải lên..."
                          : a3DocumentationFiles.length > 0
                          ? "Tải lên"
                          : "Chọn tập tin để tải lên"}
                      </Button>
                    </Stack>

                    {/* Selected Files List */}
                    {a3DocumentationFiles.length > 0 && (
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, mb: 2, bgcolor: "#f5f5f5" }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, fontWeight: "medium" }}
                        >
                          Tập tin đã chọn ({a3DocumentationFiles.length}):
                        </Typography>
                        <List dense>
                          {a3DocumentationFiles.map((file, index) => (
                            <ListItem
                              key={index}
                              secondaryAction={
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() =>
                                    handleRemoveSelectedA3File(index)
                                  }
                                  size="small"
                                  sx={{
                                    color: "error.main",
                                    "&:hover": {
                                      backgroundColor: "error.lighter",
                                    },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemText
                                primary={file.name}
                                secondary={`${(file.size / 1024).toFixed(
                                  2
                                )} KB`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    )}

                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: "block", mt: 1 }}
                    >
                      Giới hạn: Tối đa {MAX_FILES} tập tin, mỗi tập tin không
                      quá {MAX_SIZE}MB
                    </Typography>
                  </Box>

                  {/* Uploaded Files List */}
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 2, fontWeight: "medium" }}
                    >
                      Tài liệu đã tải lên:
                    </Typography>
                    {uploadedA3Documentations.length > 0 ? (
                      <List sx={{ bgcolor: "#f5f5f5", borderRadius: 1 }}>
                        {uploadedA3Documentations.map((doc, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              borderBottom:
                                index < uploadedA3Documentations.length - 1
                                  ? "1px solid #e0e0e0"
                                  : "none",
                            }}
                          >
                            <ListItemText
                              primary={doc.filename}
                              sx={{ mr: 2 }}
                            />
                            <ListItemSecondaryAction>
                              <Tooltip title="Xem tài liệu A3">
                                <IconButton
                                  edge="end"
                                  onClick={() =>
                                    openPreview(doc.directUrl, doc.filename)
                                  }
                                  sx={{ mr: 1 }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Xóa tài liệu A3">
                                <IconButton
                                  edge="end"
                                  onClick={() =>
                                    deleteA3DocumentationFile(index)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Chưa có tài liệu nào được tải lên
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* File Preview Dialog */}
      <Dialog
        open={openFilePreview}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: "90vh",
            maxHeight: "90vh",
            backgroundColor: "white",
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" component="div" sx={{ color: "#1e88e5" }}>
            {previewFileName}
          </Typography>
          <IconButton
            onClick={closePreview}
            sx={{
              color: "#637381",
              "&:hover": { color: "#1e88e5" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: "100%" }}>
          <iframe
            src={previewDirectUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Document Preview"
            allow="autoplay"
            style={{ border: "none" }}
          />
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={openErrorDialog}
        onClose={handleCloseErrorDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: "500px",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          id="alert-dialog-title"
          sx={{
            bgcolor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningIcon color="warning" />
          Thông báo
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            {dialogMessage.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < dialogMessage.split("\n").length - 1 && <br />}
              </React.Fragment>
            ))}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={handleCloseErrorDialog}
            variant="contained"
            autoFocus
            sx={{
              bgcolor: "#1976d2",
              "&:hover": {
                bgcolor: "#115293",
              },
            }}
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Process4Page;
