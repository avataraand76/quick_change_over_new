// frontend/src/pages/Process3Page.jsx

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
import PermissionCheck from "../components/PermissionCheck";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const Process3Page = () => {
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

  // New state for delete confirmation
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [deletingFileIndex, setDeletingFileIndex] = useState(null);

  // New state for A3 delete confirmation
  const [deleteA3ConfirmDialog, setDeleteA3ConfirmDialog] = useState(false);
  const [deletingA3FileIndex, setDeletingA3FileIndex] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // New function to check if a process is overdue
  const checkIsOverdue = useCallback((actualDate, planDate, deadline) => {
    if (!deadline) return false;
    if (!actualDate && !planDate) return false;

    // Sử dụng actual_date nếu có, nếu không thì dùng plan_date
    const dateToUse = actualDate || planDate;
    const baseDateTime = new Date(dateToUse);
    const deadlineDate = new Date(baseDateTime);
    deadlineDate.setDate(deadlineDate.getDate() - deadline);

    // Đặt thời gian của deadlineDate thành 23:59:59
    deadlineDate.setHours(23, 59, 59, 999);

    return new Date() > deadlineDate;
  }, []);

  // Fetch documentation files
  const fetchDocumentationFiles = useCallback(async () => {
    try {
      const response = await API.getProcess3Documentation(id);
      setUploadedDocumentations(response.files || []);
    } catch (error) {
      console.error("Error fetching documentation files:", error);
    }
  }, [id]);

  // Fetch A3 documentation files
  const fetchA3DocumentationFiles = useCallback(async () => {
    try {
      const response = await API.getProcess3A3Documentation(id);
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
        const process3Rate = processRatesResponse.find(
          (rate) => rate.id_process === 3
        );
        if (process3Rate) {
          setProcessInfo(process3Rate);
        }

        // Fetch work steps for Process 3
        const workStepsResponse = await API.getWorkSteps(3);
        setWorkSteps(workStepsResponse);

        // Fetch existing documentation files
        await fetchDocumentationFiles();
        await fetchA3DocumentationFiles();

        // Check if Process 3 is overdue
        const process3 = processesResponse.find((p) => p.id_process === 3);
        if (process3) {
          const overdue = checkIsOverdue(
            planResponse.actual_date,
            planResponse.plan_date,
            process3.deadline
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
  const calculateDeadlineDate = (
    actualDateString,
    planDateString,
    deadlineDays
  ) => {
    if (
      deadlineDays === null ||
      deadlineDays === undefined ||
      deadlineDays === ""
    ) {
      return "-";
    }

    // Sử dụng actual_date nếu có, nếu không thì dùng plan_date
    const dateToUse = actualDateString || planDateString;
    if (!dateToUse) return "-";

    // Parse the date
    const baseDate = new Date(dateToUse);
    // Only use the date part (ignore time)
    const dateOnly = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate()
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

  // Get deadline information for Process 3
  const getDeadlineInfo = () => {
    const process3 = processes.find((p) => p.id_process === 3);
    if (!process3) return { text: "Đang tải...", date: null };

    if (!process3.deadline || process3.deadline === 0) {
      return {
        text: `Cùng ngày với ${
          plan?.actual_date ? "thời gian thực tế" : "thời gian dự kiến"
        }`,
        date: null,
      };
    }

    return {
      text: `${process3.deadline} ngày trước ${
        plan?.actual_date ? "thời gian thực tế" : "thời gian dự kiến"
      }`,
      date: calculateDeadlineDate(
        plan?.actual_date,
        plan?.plan_date,
        process3.deadline
      ),
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
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // Chuyển 0 thành 12
    hours = String(hours).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

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
      await API.uploadProcess3DocumentationFile(id, documentationFiles);
      setDocumentationFiles([]);
      fetchDocumentationFiles(); // Refresh the list
      // Also refresh the table data since percent_rate could have changed
      const processRatesResponse = await API.getProcessRates(id);
      const process3Rate = processRatesResponse.find(
        (rate) => rate.id_process === 3
      );
      if (process3Rate) {
        setProcessInfo(process3Rate);
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
      await API.uploadProcess3A3DocumentationFile(id, a3DocumentationFiles);
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
    setDeletingFileIndex(index);
    setDeleteConfirmDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      const response = await API.deleteProcess3Documentation(
        id,
        deletingFileIndex
      );
      if (response.success) {
        setSuccess("Xóa tài liệu thành công");
        fetchDocumentationFiles(); // Refresh the list
        // Also refresh the table data since percent_rate could have changed
        const processRatesResponse = await API.getProcessRates(id);
        const process3Rate = processRatesResponse.find(
          (rate) => rate.id_process === 3
        );
        if (process3Rate) {
          setProcessInfo(process3Rate);
        }
        setTimeout(() => setSuccess(""), 3000); // Clear success message after 3s
      }
    } catch (error) {
      console.error("Error deleting documentation file:", error);
      setError(error.message || "Không thể xóa tài liệu");
      setTimeout(() => setError(""), 3000); // Clear error message after 3s
    } finally {
      setDeleteConfirmDialog(false);
      setDeletingFileIndex(null);
    }
  };

  // Delete A3 documentation file
  const deleteA3DocumentationFile = async (index) => {
    setDeletingA3FileIndex(index);
    setDeleteA3ConfirmDialog(true);
  };

  // Handle confirm A3 delete
  const handleConfirmA3Delete = async () => {
    try {
      const response = await API.deleteProcess3A3Documentation(
        id,
        deletingA3FileIndex
      );
      if (response.success) {
        setSuccess("Xóa tài liệu A3 thành công");
        fetchA3DocumentationFiles(); // Refresh the list
        setTimeout(() => setSuccess(""), 3000); // Clear success message after 3s
      }
    } catch (error) {
      console.error("Error deleting A3 documentation file:", error);
      setError(error.message || "Không thể xóa tài liệu A3");
      setTimeout(() => setError(""), 3000); // Clear error message after 3s
    } finally {
      setDeleteA3ConfirmDialog(false);
      setDeletingA3FileIndex(null);
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            THÔNG TIN KẾ HOẠCH CHUYỂN ĐỔI
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 3}>
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            CÁC BƯỚC CÔNG VIỆC LÀM RẬP SẢN XUẤT MAY MẪU ĐỐI, MẪU MOCKUP
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
          {workSteps.length > 0 ? (
            <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
              {workSteps.map((step, index) => (
                <ListItem
                  key={step.id_work_steps}
                  divider={index < workSteps.length - 1}
                  alignItems="flex-start"
                  sx={{
                    py: isMobile ? 1 : 2,
                    // flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 1 : 0,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      width: isMobile ? 28 : 36,
                      height: isMobile ? 28 : 36,
                      mr: isMobile ? 1 : 2,
                      fontSize: isMobile ? "0.75rem" : "0.875rem",
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

      {/* Process 3 Information Card */}
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            LÀM RẬP SẢN XUẤT MAY MẪU ĐỐI, MẪU MOCKUP
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 3}>
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
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            TÀI LIỆU MINH CHỨNG
          </Typography>
        </Box>

        <PermissionCheck
          requiredRole={[6]}
          renderContent={(hasPermission) => (
            <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
              <Grid container spacing={isMobile ? 2 : 3}>
                {/* Evidence Documentation Section */}
                <Grid item xs={12} md={isMobile ? 12 : 6}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Tài liệu Minh chứng
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        <Stack
                          direction={isMobile ? "column" : "row"}
                          spacing={2}
                          alignItems={isMobile ? "stretch" : "center"}
                          sx={{ mb: 2 }}
                        >
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                            fullWidth={isMobile}
                            size={isMobile ? "medium" : "large"}
                            disabled={!hasPermission /* || isOverdue */}
                            sx={{
                              opacity: !hasPermission /* || isOverdue */
                                ? 0.5
                                : 1,
                            }}
                          >
                            Chọn tập tin
                            <input
                              type="file"
                              hidden
                              multiple
                              onChange={handleDocumentationFileSelect}
                              disabled={!hasPermission /* || isOverdue */}
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
                              !hasPermission ||
                              documentationFiles.length === 0 ||
                              uploadingDocumentation /* ||
                              isOverdue */
                            }
                            sx={{
                              opacity: !hasPermission /* || isOverdue */
                                ? 0.5
                                : 1,
                            }}
                          >
                            {uploadingDocumentation
                              ? "Đang tải lên..."
                              : documentationFiles.length > 0
                              ? "Tải lên"
                              : "Chọn tập tin để tải lên"}
                          </Button>
                        </Stack>

                        {/* Thêm thông báo nếu không có quyền */}
                        {!hasPermission && (
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
                            Không có quyền cập nhật
                          </Typography>
                        )}

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
                            sx={{
                              p: isMobile ? 1 : 2,
                              mb: 2,
                              bgcolor: "#f5f5f5",
                              width: isMobile ? "100%" : "auto",
                            }}
                          >
                            <Typography
                              variant="subtitle2"
                              sx={{ mb: 1, fontWeight: "medium" }}
                            >
                              Tập tin đã chọn ({documentationFiles.length}):
                            </Typography>
                            <List dense>
                              {Array.from(documentationFiles).map(
                                (file, index) => (
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
                                )
                              )}
                            </List>
                          </Paper>
                        )}

                        {!isOverdue && (
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ display: "block", mt: 1 }}
                          >
                            Giới hạn: Tối đa {MAX_FILES} tập tin, mỗi tập tin
                            không quá {MAX_SIZE}MB
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
                                      onClick={() =>
                                        deleteDocumentationFile(index)
                                      }
                                      disabled={
                                        !hasPermission /* || isOverdue */
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

                {/* A3 Documentation Section */}
                <Grid item xs={12} md={isMobile ? 12 : 6}>
                  <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Tài liệu A3
                      </Typography>

                      <Box sx={{ mb: 3 }}>
                        <Stack
                          direction={isMobile ? "column" : "row"}
                          spacing={2}
                          alignItems={isMobile ? "stretch" : "center"}
                          sx={{ mb: 2 }}
                        >
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<InsertDriveFileIcon />}
                            fullWidth={isMobile}
                            size={isMobile ? "medium" : "large"}
                            disabled={!hasPermission}
                            sx={{
                              opacity: !hasPermission ? 0.5 : 1,
                            }}
                          >
                            Chọn tập tin
                            <input
                              type="file"
                              hidden
                              multiple
                              onChange={handleA3DocumentationFileSelect}
                              disabled={!hasPermission}
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
                              !hasPermission ||
                              a3DocumentationFiles.length === 0 ||
                              uploadingA3
                            }
                            sx={{
                              opacity: !hasPermission ? 0.5 : 1,
                            }}
                          >
                            {uploadingA3
                              ? "Đang tải lên..."
                              : a3DocumentationFiles.length > 0
                              ? "Tải lên"
                              : "Chọn tập tin để tải lên"}
                          </Button>
                        </Stack>

                        {/* Thêm thông báo nếu không có quyền */}
                        {!hasPermission && (
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
                            Không có quyền cập nhật
                          </Typography>
                        )}

                        {/* Selected Files List */}
                        {a3DocumentationFiles.length > 0 && (
                          <Paper
                            variant="outlined"
                            sx={{
                              p: isMobile ? 1 : 2,
                              mb: 2,
                              bgcolor: "#f5f5f5",
                              width: isMobile ? "100%" : "auto",
                            }}
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
                          Giới hạn: Tối đa {MAX_FILES} tập tin, mỗi tập tin
                          không quá {MAX_SIZE}MB
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
                                      disabled={!hasPermission}
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
          )}
        />
      </Card>

      {/* File Preview Dialog */}
      <Dialog
        open={openFilePreview}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: isMobile ? "100vh" : "90vh",
            maxHeight: isMobile ? "100vh" : "90vh",
            margin: isMobile ? 0 : 2,
            borderRadius: isMobile ? 0 : 2,
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
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
          Xác nhận xóa
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Bạn có chắc chắn muốn xóa tài liệu "
            {uploadedDocumentations[deletingFileIndex]?.filename}" không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteConfirmDialog(false)}
            variant="outlined"
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete A3 Documentation Confirmation Dialog */}
      <Dialog
        open={deleteA3ConfirmDialog}
        onClose={() => setDeleteA3ConfirmDialog(false)}
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
          Xác nhận xóa
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Bạn có chắc chắn muốn xóa tài liệu A3 "
            {uploadedA3Documentations[deletingA3FileIndex]?.filename}" không?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteA3ConfirmDialog(false)}
            variant="outlined"
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmA3Delete}
            variant="contained"
            color="error"
            autoFocus
          >
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Process3Page;
