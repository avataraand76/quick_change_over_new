// frontend/src/pages/Process5Page.jsx

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
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  DateRange as DateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Clear as ClearIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import API from "../api/api";
import PermissionCheck from "../components/PermissionCheck";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const Process5Page = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the plan ID from URL
  const [plan, setPlan] = useState(null);
  const [processInfo, setProcessInfo] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [workSteps, setWorkSteps] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for preparing machines
  const [preparingMachines, setPreparingMachines] = useState([]);
  const [preparingMachineDialog, setPreparingMachineDialog] = useState(false);
  const [preparingMachineData, setPreparingMachineData] = useState({
    id_plan: id,
    id_process: 5,
    adjust_date: null,
    SQL_oid_thiet_bi: "",
    name_machine: "",
    quantity: 0,
    prepared: 0,
    pass: 0,
    fail: 0,
  });
  const [editingPreparingMachine, setEditingPreparingMachine] = useState(null);
  const [deletePreparingMachineDialog, setDeletePreparingMachineDialog] =
    useState(false);
  const [selectedPreparingMachine, setSelectedPreparingMachine] =
    useState(null);

  // States for backup machines
  const [backupMachines, setBackupMachines] = useState([]);
  const [backupMachineDialog, setBackupMachineDialog] = useState(false);
  const [backupMachineData, setBackupMachineData] = useState({
    id_plan: id,
    id_process: 5,
    adjust_date: null,
    name_machine: "",
    quantity: 0,
    prepared: 0,
    pass: 0,
    fail: 0,
  });
  const [editingBackupMachine, setEditingBackupMachine] = useState(null);
  const [deleteBackupMachineDialog, setDeleteBackupMachineDialog] =
    useState(false);
  const [selectedBackupMachine, setSelectedBackupMachine] = useState(null);

  // Add state for sync dialog
  const [syncDialog, setSyncDialog] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Add state for overdue check
  const [isOverdue, setIsOverdue] = useState(false);

  // Add new state for copy dialog
  const [copyDialog, setCopyDialog] = useState(false);
  const [sourcePlanId, setSourcePlanId] = useState("");
  const [availablePlans, setAvailablePlans] = useState([]);
  const [copyLoading, setCopyLoading] = useState(false);

  // Add new state for preview data
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Add useCallback for checkIsOverdue
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const MobilePreparingMachineCard = ({
    machine,
    index,
    onEdit,
    onDelete,
    hasPermission,
  }) => {
    return (
      <Card sx={{ mb: 2, position: "relative" }}>
        <CardContent>
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(machine)}
              disabled={!hasPermission}
              sx={{ mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(machine)}
              disabled={!hasPermission}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="subtitle1" color="primary" gutterBottom>
            Máy #{index + 1}
          </Typography>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Ngày điều chỉnh
              </Typography>
              <Typography variant="body2">
                {machine.adjust_date
                  ? formatDateShort(machine.adjust_date)
                  : "..."}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Tên máy
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                {machine.name_machine}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Số lượng
              </Typography>
              <Typography variant="body2">{machine.quantity}</Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Đã chuẩn bị
              </Typography>
              <Typography variant="body2">{machine.prepared}</Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Đạt
              </Typography>
              <Typography variant="body2" color="success.main">
                {machine.pass}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Không đạt
              </Typography>
              <Typography variant="body2" color="error.main">
                {machine.fail}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Tỉ lệ đạt
              </Typography>
              <Typography variant="body2">{machine.pass_rate}%</Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Tỉ lệ chuẩn bị
              </Typography>
              <Typography variant="body2">{machine.prepare_rate}%</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const MobileBackupMachineCard = ({
    machine,
    index,
    onEdit,
    onDelete,
    hasPermission,
  }) => {
    return (
      <Card sx={{ mb: 2, position: "relative" }}>
        <CardContent>
          <Box sx={{ position: "absolute", top: 12, right: 12 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => onEdit(machine)}
              disabled={!hasPermission}
              sx={{ mr: 1 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(machine)}
              disabled={!hasPermission}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="subtitle1" color="primary" gutterBottom>
            Máy #{index + 1}
          </Typography>

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Ngày điều chỉnh
              </Typography>
              <Typography variant="body2">
                {machine.adjust_date
                  ? formatDateShort(machine.adjust_date)
                  : "..."}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Tên máy
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                {machine.name_machine}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Số lượng
              </Typography>
              <Typography variant="body2">{machine.quantity}</Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Đã chuẩn bị
              </Typography>
              <Typography variant="body2">{machine.prepared}</Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Đạt
              </Typography>
              <Typography variant="body2" color="success.main">
                {machine.pass}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Không đạt
              </Typography>
              <Typography variant="body2" color="error.main">
                {machine.fail}
              </Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Tỉ lệ đạt
              </Typography>
              <Typography variant="body2">{machine.pass_rate}%</Typography>
            </Grid>

            <Grid item xs={4}>
              <Typography variant="caption" color="textSecondary">
                Tỉ lệ chuẩn bị
              </Typography>
              <Typography variant="body2">{machine.prepare_rate}%</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

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

        // Check if Process 5 is overdue
        const process5 = processesResponse.find((p) => p.id_process === 5);
        if (process5) {
          const overdue = checkIsOverdue(
            planResponse.actual_date,
            planResponse.plan_date,
            process5.deadline
          );
          setIsOverdue(overdue);
        }

        // Fetch process rates to get the completion percentage
        const processRatesResponse = await API.getProcessRates(id);
        const process5Rate = processRatesResponse.find(
          (rate) => rate.id_process === 5
        );
        if (process5Rate) {
          setProcessInfo(process5Rate);
        }

        // Fetch work steps for Process 5
        const workStepsResponse = await API.getWorkSteps(5);
        setWorkSteps(workStepsResponse);

        // Fetch preparing machines data
        const preparingMachinesResponse =
          await API.getProcess5PreparingMachines(id);
        setPreparingMachines(preparingMachinesResponse);

        // Fetch backup machines data
        const backupMachinesResponse = await API.getProcess5BackupMachines(id);
        setBackupMachines(backupMachinesResponse);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, checkIsOverdue]);

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

  // Get deadline information for Process 5
  const getDeadlineInfo = () => {
    const process5 = processes.find((p) => p.id_process === 5);
    if (!process5) return { text: "Đang tải...", date: null };

    if (!process5.deadline || process5.deadline === 0) {
      return {
        text: `Cùng ngày với ${
          plan?.actual_date ? "thời gian thực tế" : "thời gian dự kiến"
        }`,
        date: null,
      };
    }

    return {
      text: `${process5.deadline} ngày trước ${
        plan?.actual_date ? "thời gian thực tế" : "thời gian dự kiến"
      }`,
      date: calculateDeadlineDate(
        plan?.actual_date,
        plan?.plan_date,
        process5.deadline
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

  // Format date to match dd/mm/yyyy format (without time)
  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Format date for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateForInput = (date) => {
    if (!date) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Add validation function for checking required fields in dialog
  const isDialogDataValid = (machineData) => {
    // Only require name_machine to be non-empty
    return machineData.name_machine && machineData.name_machine.trim() !== "";
  };

  // Preparing Machine handling functions
  const handleOpenPreparingMachineDialog = (machine = null) => {
    const currentTime = new Date(); // Get current time
    if (machine) {
      setPreparingMachineData({
        ...machine,
        adjust_date: machine.adjust_date
          ? formatDateForInput(new Date(machine.adjust_date))
          : formatDateForInput(currentTime), // Default to current time if null
      });
      setEditingPreparingMachine(machine.id_process_5_preparing_machine);
    } else {
      setPreparingMachineData({
        id_plan: id,
        id_process: 5,
        adjust_date: formatDateForInput(currentTime), // Default to current time
        SQL_oid_thiet_bi: "",
        name_machine: "",
        quantity: 0,
        prepared: 0,
        pass: 0,
        fail: 0,
      });
      setEditingPreparingMachine(null);
    }
    setPreparingMachineDialog(true);
  };

  const handleClosePreparingMachineDialog = () => {
    setPreparingMachineDialog(false);
  };

  const handlePreparingMachineChange = (event) => {
    const { name, value } = event.target;
    setPreparingMachineData((prev) => {
      // Check if this is a numeric field
      if (name === "quantity" || name === "prepared" || name === "pass") {
        // Parse the input value to integer for numeric fields
        const numValue = parseInt(value, 10) || 0;

        // Create a new state with the updated field
        const newState = {
          ...prev,
          [name]: numValue,
        };

        // Apply validations and calculate fail automatically
        if (name === "prepared" && numValue > prev.quantity) {
          // Ensure prepared doesn't exceed quantity
          newState.prepared = prev.quantity;

          // If pass is greater than the new prepared value, adjust it
          if (prev.pass > prev.quantity) {
            newState.pass = prev.quantity;
          }
        } else if (name === "pass" && numValue > prev.prepared) {
          // Ensure pass doesn't exceed prepared
          newState.pass = prev.prepared;
        }

        // Calculate fail automatically
        newState.fail = newState.prepared - newState.pass;

        return newState;
      } else {
        // For non-numeric fields like name_machine, just update the value directly
        return {
          ...prev,
          [name]: value,
        };
      }
    });
  };

  const handlePreparingMachineDateChange = (event) => {
    setPreparingMachineData((prev) => ({
      ...prev,
      adjust_date: event.target.value,
    }));
  };

  const handleSavePreparingMachine = async () => {
    try {
      // When editing an existing machine, we need to include the ID
      const dataToSave = {
        ...preparingMachineData,
        id_plan: id,
      };

      // If editing, include the id_process_5_preparing_machine property
      if (editingPreparingMachine) {
        dataToSave.id_process_5_preparing_machine = editingPreparingMachine;
      }

      await API.saveProcess5PreparingMachine(dataToSave);

      // Refresh the machine list
      const preparingMachinesResponse = await API.getProcess5PreparingMachines(
        id
      );
      setPreparingMachines(preparingMachinesResponse);

      // Update process info to reflect the new rate
      const processRatesResponse = await API.getProcessRates(id);
      const process5Rate = processRatesResponse.find(
        (rate) => rate.id_process === 5
      );
      if (process5Rate) {
        setProcessInfo(process5Rate);
      }

      handleClosePreparingMachineDialog();
    } catch (error) {
      console.error("Error saving preparing machine:", error);
    }
  };

  const handleDeletePreparingMachine = (machine) => {
    setSelectedPreparingMachine(machine);
    setDeletePreparingMachineDialog(true);
  };

  const confirmDeletePreparingMachine = async () => {
    try {
      await API.deleteProcess5PreparingMachine(
        selectedPreparingMachine.id_process_5_preparing_machine
      );

      // Refresh the machine list
      const preparingMachinesResponse = await API.getProcess5PreparingMachines(
        id
      );
      setPreparingMachines(preparingMachinesResponse);

      // Update process info to reflect the new rate
      const processRatesResponse = await API.getProcessRates(id);
      const process5Rate = processRatesResponse.find(
        (rate) => rate.id_process === 5
      );
      if (process5Rate) {
        setProcessInfo(process5Rate);
      }

      setDeletePreparingMachineDialog(false);
      setSelectedPreparingMachine(null);
    } catch (error) {
      console.error("Error deleting preparing machine:", error);
    }
  };

  // Backup Machine handling functions
  const handleOpenBackupMachineDialog = (machine = null) => {
    const currentTime = new Date(); // Get current time
    if (machine) {
      setBackupMachineData({
        ...machine,
        adjust_date: machine.adjust_date
          ? formatDateForInput(new Date(machine.adjust_date))
          : formatDateForInput(currentTime), // Default to current time if null
      });
      setEditingBackupMachine(machine.id_process_5_backup_machine);
    } else {
      setBackupMachineData({
        id_plan: id,
        id_process: 5,
        adjust_date: formatDateForInput(currentTime), // Default to current time
        name_machine: "",
        quantity: 0,
        prepared: 0,
        pass: 0,
        fail: 0,
      });
      setEditingBackupMachine(null);
    }
    setBackupMachineDialog(true);
  };

  const handleCloseBackupMachineDialog = () => {
    setBackupMachineDialog(false);
  };

  const handleBackupMachineChange = (event) => {
    const { name, value } = event.target;
    setBackupMachineData((prev) => {
      // Check if this is a numeric field
      if (name === "quantity" || name === "prepared" || name === "pass") {
        // Parse the input value to integer for numeric fields
        const numValue = parseInt(value, 10) || 0;

        // Create a new state with the updated field
        const newState = {
          ...prev,
          [name]: numValue,
        };

        // Apply validations and calculate fail automatically
        if (name === "prepared" && numValue > prev.quantity) {
          // Ensure prepared doesn't exceed quantity
          newState.prepared = prev.quantity;

          // If pass is greater than the new prepared value, adjust it
          if (prev.pass > prev.quantity) {
            newState.pass = prev.quantity;
          }
        } else if (name === "pass" && numValue > prev.prepared) {
          // Ensure pass doesn't exceed prepared
          newState.pass = prev.prepared;
        }

        // Calculate fail automatically
        newState.fail = newState.prepared - newState.pass;

        return newState;
      } else {
        // For non-numeric fields like name_machine, just update the value directly
        return {
          ...prev,
          [name]: value,
        };
      }
    });
  };

  const handleBackupMachineDateChange = (event) => {
    setBackupMachineData((prev) => ({
      ...prev,
      adjust_date: event.target.value,
    }));
  };

  const handleSaveBackupMachine = async () => {
    try {
      // When editing an existing machine, we need to include the ID
      const dataToSave = {
        ...backupMachineData,
        id_plan: id,
      };

      // If editing, include the id_process_5_backup_machine property
      if (editingBackupMachine) {
        dataToSave.id_process_5_backup_machine = editingBackupMachine;
      }

      await API.saveProcess5BackupMachine(dataToSave);

      // Refresh the machine list
      const backupMachinesResponse = await API.getProcess5BackupMachines(id);
      setBackupMachines(backupMachinesResponse);

      // Update process info to reflect the new rate
      const processRatesResponse = await API.getProcessRates(id);
      const process5Rate = processRatesResponse.find(
        (rate) => rate.id_process === 5
      );
      if (process5Rate) {
        setProcessInfo(process5Rate);
      }

      handleCloseBackupMachineDialog();
    } catch (error) {
      console.error("Error saving backup machine:", error);
    }
  };

  const handleDeleteBackupMachine = (machine) => {
    setSelectedBackupMachine(machine);
    setDeleteBackupMachineDialog(true);
  };

  const confirmDeleteBackupMachine = async () => {
    try {
      await API.deleteProcess5BackupMachine(
        selectedBackupMachine.id_process_5_backup_machine
      );

      // Refresh the machine list
      const backupMachinesResponse = await API.getProcess5BackupMachines(id);
      setBackupMachines(backupMachinesResponse);

      // Update process info to reflect the new rate
      const processRatesResponse = await API.getProcessRates(id);
      const process5Rate = processRatesResponse.find(
        (rate) => rate.id_process === 5
      );
      if (process5Rate) {
        setProcessInfo(process5Rate);
      }

      setDeleteBackupMachineDialog(false);
      setSelectedBackupMachine(null);
    } catch (error) {
      console.error("Error deleting backup machine:", error);
    }
  };

  // Add function to handle sync with Hi-Line
  const handleSyncWithHiLine = async () => {
    try {
      setSyncLoading(true);
      const result = await API.syncProcess5MachinesFromHiLine(
        id,
        plan?.line,
        plan?.style
      );
      setSyncResult(result);
      setSyncDialog(true);

      // If sync was successful, refresh the preparing machines list
      if (result.success) {
        const preparingMachinesResponse =
          await API.getProcess5PreparingMachines(id);
        setPreparingMachines(preparingMachinesResponse);

        // Update process info to reflect the new rate
        const processRatesResponse = await API.getProcessRates(id);
        const process5Rate = processRatesResponse.find(
          (rate) => rate.id_process === 5
        );
        if (process5Rate) {
          setProcessInfo(process5Rate);
        }
      }
    } catch (error) {
      console.error("Error syncing with Hi-Line:", error);
      setSyncResult({
        success: false,
        message:
          "Lỗi khi đồng bộ dữ liệu: " + (error.message || "Không xác định"),
      });
      setSyncDialog(true);
    } finally {
      setSyncLoading(false);
    }
  };

  // Close sync dialog function
  const handleCloseSyncDialog = () => {
    setSyncDialog(false);
  };

  // Add new useEffect to fetch available plans with machine data
  useEffect(() => {
    const fetchAvailablePlans = async () => {
      try {
        const plans = await API.getPlans();
        // Get all plans with machine data
        const plansWithMachineData = await Promise.all(
          plans
            .filter(
              (plan) =>
                plan.id_plan !== id && (!plan.inactive || plan.inactive === 0)
            )
            .map(async (plan) => {
              try {
                const [preparingMachines, backupMachines] = await Promise.all([
                  API.getProcess5PreparingMachines(plan.id_plan),
                  API.getProcess5BackupMachines(plan.id_plan),
                ]);
                return {
                  ...plan,
                  hasMachines:
                    preparingMachines.length > 0 || backupMachines.length > 0,
                };
              } catch (error) {
                console.error(
                  `Error fetching machines for plan ${plan.id_plan}:`,
                  error
                );
                return { ...plan, hasMachines: false };
              }
            })
        );

        // Filter plans that have machines
        const filteredPlans = plansWithMachineData.filter(
          (plan) => plan.hasMachines
        );
        setAvailablePlans(filteredPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };

    fetchAvailablePlans();
  }, [id]);

  // Add new function to handle copying machines
  const handleCopyMachines = async () => {
    if (!sourcePlanId) {
      return;
    }

    try {
      setCopyLoading(true);
      await API.copyProcess5Machines(sourcePlanId, id);

      // Refresh the machine lists
      const preparingMachinesResponse = await API.getProcess5PreparingMachines(
        id
      );
      setPreparingMachines(preparingMachinesResponse);

      const backupMachinesResponse = await API.getProcess5BackupMachines(id);
      setBackupMachines(backupMachinesResponse);

      // Update process info to reflect the new rate
      const processRatesResponse = await API.getProcessRates(id);
      const process5Rate = processRatesResponse.find(
        (rate) => rate.id_process === 5
      );
      if (process5Rate) {
        setProcessInfo(process5Rate);
      }

      // Show success message
      setCopyDialog(false);
      setSourcePlanId("");
    } catch (error) {
      console.error("Error copying machines:", error);
    } finally {
      setCopyLoading(false);
    }
  };

  // Add function to handle preview
  const handlePreview = async (selectedPlan) => {
    if (!selectedPlan) {
      setPreviewData(null);
      return;
    }

    try {
      setPreviewLoading(true);
      const data = await API.getProcess5MachinesPreview(selectedPlan.id_plan);
      setPreviewData(data);
    } catch (error) {
      console.error("Error getting preview:", error);
    } finally {
      setPreviewLoading(false);
    }
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
            CÁC BƯỚC CÔNG VIỆC CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP
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

      {/* Process 5 Information Card */}
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
            CHUẨN BỊ MÁY MÓC THIẾT BỊ, CỮ GÁ LẮP
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

      <PermissionCheck
        requiredRole={[4, 5]}
        renderContent={(hasPermission) => (
          <>
            {/* Preparing Machines Card */}
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                  THÔNG TIN MÁY CHUẨN BỊ
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexDirection: isMobile ? "column" : "row",
                    width: isMobile ? "35%" : "auto",
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={handleSyncWithHiLine}
                    disabled={syncLoading || !hasPermission /* || isOverdue */}
                    fullWidth={isMobile}
                    sx={{
                      bgcolor: "#4caf50",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "#388e3c" },
                      opacity: !hasPermission /* || isOverdue */ ? 0.5 : 1,
                    }}
                  >
                    {syncLoading ? "Đang đồng bộ..." : "Đồng bộ Hi-Line"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => setCopyDialog(true)}
                    disabled={!hasPermission /* || isOverdue */}
                    fullWidth={isMobile}
                    sx={{
                      bgcolor: "#ff9800",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "#f57c00" },
                      opacity: !hasPermission /* || isOverdue */ ? 0.5 : 1,
                    }}
                  >
                    Sao chép máy
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenPreparingMachineDialog()}
                    disabled={!hasPermission /* || isOverdue */}
                    fullWidth={isMobile}
                    sx={{
                      bgcolor: "#ffffff",
                      color: "#1976d2",
                      "&:hover": { bgcolor: "#f5f5f5" },
                      opacity: !hasPermission /* || isOverdue */ ? 0.5 : 1,
                    }}
                  >
                    Thêm máy
                  </Button>
                </Box>
              </Box>
              {!hasPermission && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    mt: 1,
                    mx: isMobile ? 2 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  <WarningIcon fontSize={isMobile ? "small" : "medium"} />
                  Không có quyền cập nhật
                </Typography>
              )}
              {isOverdue && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    mt: 1,
                    mx: isMobile ? 2 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  <WarningIcon fontSize={isMobile ? "small" : "medium"} />
                  Đã quá hạn chỉnh sửa thông tin cho quy trình này
                </Typography>
              )}

              <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
                {preparingMachines.length > 0 ? (
                  isMobile ? (
                    // Mobile view - Card layout
                    <Box>
                      {preparingMachines.map((machine, index) => (
                        <MobilePreparingMachineCard
                          key={machine.id_process_5_preparing_machine}
                          machine={machine}
                          index={index}
                          onEdit={handleOpenPreparingMachineDialog}
                          onDelete={handleDeletePreparingMachine}
                          hasPermission={hasPermission}
                        />
                      ))}
                    </Box>
                  ) : (
                    // Desktop view - Table layout
                    <TableContainer
                      component={Paper}
                      sx={{
                        mb: 2,
                        overflow: "auto",
                        "& .MuiTable-root": {
                          minWidth: 800,
                        },
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell>STT</TableCell>
                            <TableCell>Ngày điều chỉnh</TableCell>
                            <TableCell>Tên máy</TableCell>
                            <TableCell align="center">Số lượng</TableCell>
                            <TableCell align="center">Đã chuẩn bị</TableCell>
                            <TableCell align="center">Đạt</TableCell>
                            <TableCell align="center">Không đạt</TableCell>
                            <TableCell align="center">Tỉ lệ đạt (%)</TableCell>
                            <TableCell align="center">Chưa chuẩn bị</TableCell>
                            <TableCell align="center">
                              Tỉ lệ chuẩn bị (%)
                            </TableCell>
                            <TableCell>{/* Thao tác */}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preparingMachines.map((machine, index) => (
                            <TableRow
                              key={machine.id_process_5_preparing_machine}
                            >
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {machine.adjust_date
                                  ? formatDateShort(machine.adjust_date)
                                  : "..."}
                              </TableCell>
                              <TableCell>{machine.name_machine}</TableCell>
                              <TableCell align="center">
                                {machine.quantity}
                              </TableCell>
                              <TableCell align="center">
                                {machine.prepared}
                              </TableCell>
                              <TableCell align="center">
                                {machine.pass}
                              </TableCell>
                              <TableCell align="center">
                                {machine.fail}
                              </TableCell>
                              <TableCell align="center">
                                {machine.pass_rate}%
                              </TableCell>
                              <TableCell align="center">
                                {machine.not_prepared}
                              </TableCell>
                              <TableCell align="center">
                                {machine.prepare_rate}%
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex" }}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() =>
                                      handleOpenPreparingMachineDialog(machine)
                                    }
                                    disabled={!hasPermission /* || isOverdue */}
                                    sx={{
                                      opacity: !hasPermission /* || isOverdue */
                                        ? 0.5
                                        : 1,
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleDeletePreparingMachine(machine)
                                    }
                                    disabled={!hasPermission /* || isOverdue */}
                                    sx={{
                                      opacity: !hasPermission /* || isOverdue */
                                        ? 0.5
                                        : 1,
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                ) : (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      Chưa có thông tin máy chuẩn bị nào được thêm vào
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Backup Machines Card */}
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                  THÔNG TIN MÁY DỰ PHÒNG
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenBackupMachineDialog()}
                  disabled={!hasPermission /* || isOverdue */}
                  sx={{
                    bgcolor: "#ffffff",
                    color: "#1976d2",
                    "&:hover": { bgcolor: "#f5f5f5" },
                    opacity: !hasPermission /* || isOverdue */ ? 0.5 : 1,
                  }}
                >
                  Thêm máy
                </Button>
              </Box>
              {!hasPermission && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    mt: 1,
                    mx: isMobile ? 2 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  <WarningIcon fontSize={isMobile ? "small" : "medium"} />
                  Không có quyền cập nhật
                </Typography>
              )}
              {isOverdue && (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{
                    mt: 1,
                    mx: isMobile ? 2 : 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: isMobile ? "0.75rem" : "0.875rem",
                  }}
                >
                  <WarningIcon fontSize={isMobile ? "small" : "medium"} />
                  Đã quá hạn chỉnh sửa thông tin cho quy trình này
                </Typography>
              )}

              <CardContent sx={{ padding: isMobile ? 2 : 3 }}>
                {backupMachines.length > 0 ? (
                  isMobile ? (
                    // Mobile view - Card layout
                    <Box>
                      {backupMachines.map((machine, index) => (
                        <MobileBackupMachineCard
                          key={machine.id_process_5_backup_machine}
                          machine={machine}
                          index={index}
                          onEdit={handleOpenBackupMachineDialog}
                          onDelete={handleDeleteBackupMachine}
                          hasPermission={hasPermission}
                        />
                      ))}
                    </Box>
                  ) : (
                    // Desktop view - Table layout
                    <TableContainer
                      component={Paper}
                      sx={{
                        mb: 2,
                        overflow: "auto",
                        "& .MuiTable-root": {
                          minWidth: 800,
                        },
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                            <TableCell>STT</TableCell>
                            <TableCell>Ngày điều chỉnh</TableCell>
                            <TableCell>Tên máy</TableCell>
                            <TableCell align="center">Số lượng</TableCell>
                            <TableCell align="center">Đã chuẩn bị</TableCell>
                            <TableCell align="center">Đạt</TableCell>
                            <TableCell align="center">Không đạt</TableCell>
                            <TableCell align="center">Tỉ lệ đạt (%)</TableCell>
                            <TableCell align="center">Chưa chuẩn bị</TableCell>
                            <TableCell align="center">
                              Tỉ lệ chuẩn bị (%)
                            </TableCell>
                            <TableCell>{/* Thao tác */}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {backupMachines.map((machine, index) => (
                            <TableRow key={machine.id_process_5_backup_machine}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {machine.adjust_date
                                  ? formatDateShort(machine.adjust_date)
                                  : "..."}
                              </TableCell>
                              <TableCell>{machine.name_machine}</TableCell>
                              <TableCell align="center">
                                {machine.quantity}
                              </TableCell>
                              <TableCell align="center">
                                {machine.prepared}
                              </TableCell>
                              <TableCell align="center">
                                {machine.pass}
                              </TableCell>
                              <TableCell align="center">
                                {machine.fail}
                              </TableCell>
                              <TableCell align="center">
                                {machine.pass_rate}%
                              </TableCell>
                              <TableCell align="center">
                                {machine.not_prepared}
                              </TableCell>
                              <TableCell align="center">
                                {machine.prepare_rate}%
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex" }}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() =>
                                      handleOpenBackupMachineDialog(machine)
                                    }
                                    disabled={!hasPermission /* || isOverdue */}
                                    sx={{
                                      opacity: !hasPermission /* || isOverdue */
                                        ? 0.5
                                        : 1,
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleDeleteBackupMachine(machine)
                                    }
                                    disabled={!hasPermission /* || isOverdue */}
                                    sx={{
                                      opacity: !hasPermission /* || isOverdue */
                                        ? 0.5
                                        : 1,
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                ) : (
                  <Box sx={{ py: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="text.secondary">
                      Chưa có thông tin máy dự phòng nào được thêm vào
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </>
        )}
      />

      {/* Preparing Machine Dialog */}
      <Dialog
        open={preparingMachineDialog}
        onClose={handleClosePreparingMachineDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            margin: isMobile ? 2 : "auto",
            width: isMobile ? "calc(100% - 32px)" : undefined,
          },
        }}
      >
        <DialogTitle>
          {editingPreparingMachine
            ? "Cập nhật thông tin máy chuẩn bị"
            : "Thêm máy chuẩn bị"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={isMobile ? 2 : 2}>
            <Grid item xs={12}>
              <TextField
                label="Ngày điều chỉnh"
                type="datetime-local"
                value={preparingMachineData.adjust_date}
                onChange={handlePreparingMachineDateChange}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: preparingMachineData.adjust_date ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          setPreparingMachineData((prev) => ({
                            ...prev,
                            adjust_date: "",
                          }));
                        }}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên máy"
                name="name_machine"
                value={preparingMachineData.name_machine}
                onChange={handlePreparingMachineChange}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Số lượng"
                name="quantity"
                type="text"
                value={preparingMachineData.quantity}
                onChange={handlePreparingMachineChange}
                variant="outlined"
                margin="normal"
                required
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*", min: 0 }}
                helperText="Tổng số máy"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Đã chuẩn bị"
                name="prepared"
                type="text"
                value={preparingMachineData.prepared}
                onChange={handlePreparingMachineChange}
                variant="outlined"
                margin="normal"
                required
                inputProps={{
                  min: 0,
                  max: preparingMachineData.quantity,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                helperText={
                  preparingMachineData.quantity > 0
                    ? `Tối đa: ${preparingMachineData.quantity}`
                    : "Nhập số lượng trước"
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Đạt"
                name="pass"
                type="text"
                value={preparingMachineData.pass}
                onChange={handlePreparingMachineChange}
                variant="outlined"
                margin="normal"
                required
                inputProps={{
                  min: 0,
                  max: preparingMachineData.prepared,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                helperText={
                  preparingMachineData.prepared > 0
                    ? `Tối đa: ${preparingMachineData.prepared}`
                    : "Nhập đã chuẩn bị trước"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Không đạt: {preparingMachineData.fail} (Tự động tính: Đã chuẩn
                bị - Đạt)
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreparingMachineDialog}>Hủy</Button>
          <Button
            onClick={handleSavePreparingMachine}
            variant="contained"
            color="primary"
            disabled={!isDialogDataValid(preparingMachineData)}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Preparing Machine Confirmation Dialog */}
      <Dialog
        open={deletePreparingMachineDialog}
        onClose={() => setDeletePreparingMachineDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa thông tin máy chuẩn bị "
            {selectedPreparingMachine?.name_machine}" này không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePreparingMachineDialog(false)}>
            Hủy
          </Button>
          <Button onClick={confirmDeletePreparingMachine} color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backup Machine Dialog */}
      <Dialog
        open={backupMachineDialog}
        onClose={handleCloseBackupMachineDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingBackupMachine
            ? "Cập nhật thông tin máy dự phòng"
            : "Thêm máy dự phòng"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={isMobile ? 2 : 2}>
            <Grid item xs={12}>
              <TextField
                label="Ngày điều chỉnh"
                type="datetime-local"
                value={backupMachineData.adjust_date}
                onChange={handleBackupMachineDateChange}
                fullWidth
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  endAdornment: backupMachineData.adjust_date ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          setBackupMachineData((prev) => ({
                            ...prev,
                            adjust_date: "",
                          }));
                        }}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên máy"
                name="name_machine"
                value={backupMachineData.name_machine}
                onChange={handleBackupMachineChange}
                variant="outlined"
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Số lượng"
                name="quantity"
                type="text"
                value={backupMachineData.quantity}
                onChange={handleBackupMachineChange}
                variant="outlined"
                margin="normal"
                required
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  min: 0,
                }}
                helperText="Tổng số máy"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Đã chuẩn bị"
                name="prepared"
                type="text"
                value={backupMachineData.prepared}
                onChange={handleBackupMachineChange}
                variant="outlined"
                margin="normal"
                required
                inputProps={{
                  min: 0,
                  max: backupMachineData.quantity,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                helperText={
                  backupMachineData.quantity > 0
                    ? `Tối đa: ${backupMachineData.quantity}`
                    : "Nhập số lượng trước"
                }
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Đạt"
                name="pass"
                type="text"
                value={backupMachineData.pass}
                onChange={handleBackupMachineChange}
                variant="outlined"
                margin="normal"
                required
                inputProps={{
                  min: 0,
                  max: backupMachineData.prepared,
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                }}
                helperText={
                  backupMachineData.prepared > 0
                    ? `Tối đa: ${backupMachineData.prepared}`
                    : "Nhập đã chuẩn bị trước"
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Không đạt: {backupMachineData.fail} (Tự động tính: Đã chuẩn bị -
                Đạt)
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBackupMachineDialog}>Hủy</Button>
          <Button
            onClick={handleSaveBackupMachine}
            variant="contained"
            color="primary"
            disabled={!isDialogDataValid(backupMachineData)}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Backup Machine Confirmation Dialog */}
      <Dialog
        open={deleteBackupMachineDialog}
        onClose={() => setDeleteBackupMachineDialog(false)}
      >
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa thông tin máy dự phòng "
            {selectedBackupMachine?.name_machine}" này không?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteBackupMachineDialog(false)}>
            Hủy
          </Button>
          <Button onClick={confirmDeleteBackupMachine} color="error">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sync Result Dialog */}
      <Dialog
        open={syncDialog}
        onClose={handleCloseSyncDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            margin: isMobile ? 2 : "auto",
            width: isMobile ? "calc(100% - 32px)" : undefined,
          },
        }}
      >
        <DialogTitle>
          {syncResult?.success ? (
            <Box
              sx={{ display: "flex", alignItems: "center", color: "#4caf50" }}
            >
              <SyncIcon sx={{ mr: 1 }} />
              Đồng bộ dữ liệu thành công
            </Box>
          ) : (
            <Box
              sx={{ display: "flex", alignItems: "center", color: "#f44336" }}
            >
              <SyncIcon sx={{ mr: 1 }} />
              Đồng bộ dữ liệu thất bại
            </Box>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            {syncResult?.message}
          </Typography>
          {syncResult?.count > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Đã đồng bộ {syncResult.count} máy từ Hi-Line
              </Typography>
            </Box>
          )}
          {syncResult?.errors && syncResult.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="error">
                Có lỗi xảy ra với {syncResult.errors.length} máy:
              </Typography>
              <List>
                {syncResult.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={error.machine}
                      secondary={error.error}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSyncDialog} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy Machines Dialog */}
      <Dialog
        open={copyDialog}
        onClose={() => setCopyDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            margin: isMobile ? 2 : "auto",
            width: isMobile ? "calc(100% - 32px)" : undefined,
          },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ContentCopyIcon sx={{ mr: 1 }} />
            Sao chép máy móc từ kế hoạch khác
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Chọn kế hoạch nguồn để sao chép tất cả máy móc (cả máy chuẩn bị và
            máy dự phòng) sang kế hoạch hiện tại.
          </Typography>

          <Autocomplete
            fullWidth
            options={availablePlans}
            value={
              availablePlans.find((plan) => plan.id_plan === sourcePlanId) ||
              null
            }
            onChange={(event, newValue) => {
              setSourcePlanId(newValue ? newValue.id_plan : "");
              handlePreview(newValue);
            }}
            getOptionLabel={(option) =>
              `Chuyền ${option.line} - ${option.style}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tìm kiếm theo chuyền hoặc mã hàng"
                variant="outlined"
              />
            )}
            noOptionsText="Không tìm thấy kết quả phù hợp"
            filterOptions={(options, { inputValue }) => {
              const searchLower = inputValue.toLowerCase();
              return options.filter(
                (plan) =>
                  plan.line.toString().toLowerCase().includes(searchLower) ||
                  plan.style.toLowerCase().includes(searchLower)
              );
            }}
          />

          {previewLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {previewData && !previewLoading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Danh sách máy sẽ được sao chép:
              </Typography>

              {previewData.preparing_machines.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Máy chuẩn bị:
                  </Typography>
                  <List dense>
                    {previewData.preparing_machines.map((machine, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={machine.name_machine}
                          secondary={`Số lượng: ${machine.quantity}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {previewData.backup_machines.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Máy dự phòng:
                  </Typography>
                  <List dense>
                    {previewData.backup_machines.map((machine, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={machine.name_machine}
                          secondary={`Số lượng: ${machine.quantity}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {previewData.preparing_machines.length === 0 &&
                previewData.backup_machines.length === 0 && (
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 2, textAlign: "center" }}
                  >
                    Không có dữ liệu máy móc để sao chép
                  </Typography>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyDialog(false)}>Hủy</Button>
          <Button
            onClick={handleCopyMachines}
            variant="contained"
            color="primary"
            disabled={!sourcePlanId || copyLoading}
            startIcon={
              copyLoading ? <CircularProgress size={20} /> : <ContentCopyIcon />
            }
          >
            {copyLoading ? "Đang sao chép..." : "Sao chép"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Process5Page;
