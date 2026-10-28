// frontend/src/pages/LoginPage.jsx
//
// Giao diện đăng nhập của QCO đồng bộ theo theme Deep Navy ERP Glassmorphism

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  dash,
  fontSizes,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Visibility,
  VisibilityOff,
  Warning,
  Speed,
} from "../ui";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    ma_nv: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const checkCapsLock = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.ma_nv || !formData.password) {
      setError("Vui lòng nhập đầy đủ số thẻ và mật khẩu");
      setLoading(false);
      return;
    }

    const result = await login(formData.ma_nv, formData.password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        bgcolor: dash.bg,
        color: dash.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── AMBIENT GLOWS ─────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "55vw",
          height: "55vh",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0) 70%)",
          pointerEvents: "none",
          transform: "translateZ(0)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-15%",
          right: "-10%",
          width: "50vw",
          height: "50vh",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(139, 92, 246, 0) 70%)",
          pointerEvents: "none",
          transform: "translateZ(0)",
        }}
      />

      <Container component="main" maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 3, sm: 5 },
            borderRadius: "14px",
            background: dash.panel,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${dash.borderStrong}`,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
          }}
        >
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Avatar
              sx={{
                width: 72,
                height: 72,
                background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.5)",
              }}
            >
              <Speed sx={{ fontSize: 36, color: "white" }} />
            </Avatar>

            <Box>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: 1,
                  mb: 0.5,
                }}
              >
                QCO SYSTEM
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: dash.inkMuted, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
              >
                Hệ thống Quản lý Chuyển đổi Nhanh &ndash; Việt Long Hưng
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                variant="filled"
                sx={{
                  width: "100%",
                  borderRadius: "8px",
                  bgcolor: "rgba(239, 68, 68, 0.2)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  fontWeight: 600,
                }}
              >
                {error}
              </Alert>
            )}

            {capsLockOn && (
              <Alert
                severity="warning"
                icon={<Warning />}
                sx={{
                  width: "100%",
                  borderRadius: "8px",
                  bgcolor: "rgba(245, 158, 11, 0.15)",
                  color: "#fde68a",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                }}
              >
                Caps Lock đang được bật
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ width: "100%", mt: 1 }}
            >
              <Stack spacing={2.5}>
                <TextField
                  required
                  fullWidth
                  id="ma_nv"
                  label="Số thẻ nhân viên"
                  name="ma_nv"
                  autoComplete="username"
                  autoFocus
                  value={formData.ma_nv}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#ffffff",
                      "& fieldset": { borderColor: dash.border },
                      "&:hover fieldset": { borderColor: "rgba(59, 130, 246, 0.45)" },
                      "&.Mui-focused fieldset": { borderColor: dash.status.blue },
                    },
                    "& .MuiInputLabel-root": { color: dash.inkMuted },
                    "& .MuiInputLabel-root.Mui-focused": { color: dash.status.blue },
                  }}
                />

                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  onKeyDown={checkCapsLock}
                  onKeyUp={checkCapsLock}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePassword}
                          onMouseDown={(e) => e.preventDefault()}
                          edge="end"
                          disabled={loading}
                          sx={{ color: dash.inkMuted, "&:hover": { color: "#ffffff" } }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      color: "#ffffff",
                      "& fieldset": {
                        borderColor: capsLockOn
                          ? dash.status.warn
                          : dash.border,
                      },
                      "&:hover fieldset": {
                        borderColor: capsLockOn
                          ? dash.status.warn
                          : "rgba(59, 130, 246, 0.45)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: capsLockOn
                          ? dash.status.warn
                          : dash.status.blue,
                      },
                    },
                    "& .MuiInputLabel-root": { color: dash.inkMuted },
                    "& .MuiInputLabel-root.Mui-focused": { color: dash.status.blue },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 1.5,
                    py: 1.6,
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                    fontSize: fontSizes.lead,
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 8px 25px rgba(37, 99, 235, 0.6)",
                    },
                    "&:disabled": {
                      background: "rgba(59, 130, 246, 0.3)",
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                    transition: "all 0.25s ease",
                  }}
                >
                  {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={22} color="inherit" />
                      <Typography>Đang đăng nhập...</Typography>
                    </Stack>
                  ) : (
                    "Đăng Nhập"
                  )}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
