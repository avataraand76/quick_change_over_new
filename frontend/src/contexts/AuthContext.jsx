// frontend/src/contexts/AuthContext.jsx
//
// Phân quyền của QCO có MỘT trục, giống TPM:
//   permissions   admin / edit / view   -> được làm gì
//
// Đi kèm trong `user` mà backend trả về (bảng tb_permission +
// tb_user_permission của qco_database).

import { useState, useEffect, useMemo, useCallback } from "react";
import { Box, CircularProgress, sx as preset } from "../ui";
import { api } from "../api/api";
import { AuthContext } from "./AuthContextDefinition";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên đăng nhập khi mở lại app.
  //
  // Hiển thị NGAY bản user đã lưu để không phải chờ mạng, rồi gọi
  // /api/auth/me để làm mới phân quyền ở nền - quyền có thể đã bị đổi kể từ
  // lần đăng nhập trước. Nếu token hỏng hoặc quyền đã bị thu hồi, backend trả
  // 401/403 và interceptor trong api.jsx sẽ tự đá về /login.
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");

        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);

          const res = await api.auth.me();
          if (res?.success) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Đồng bộ lại quyền tài khoản ở nền khi quay lại tab / mở F12 (giống ERP Dashboard)
  useEffect(() => {
    let lastCheckAt = Date.now();
    const MIN_SYNC_GAP_MS = 10000; // Cách tối thiểu 10 giây

    const syncSession = async () => {
      if (document.visibilityState !== "visible") return;
      if (!localStorage.getItem("token")) return;
      if (Date.now() - lastCheckAt < MIN_SYNC_GAP_MS) return;
      lastCheckAt = Date.now();

      try {
        const res = await api.auth.me();
        if (res?.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
      } catch {
        // Bỏ qua lỗi nền để không làm gián đoạn người dùng
      }
    };

    window.addEventListener("focus", syncSession);
    document.addEventListener("visibilitychange", syncSession);
    return () => {
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", syncSession);
    };
  }, []);

  const login = useCallback(async (ma_nv, password) => {
    try {
      const response = await api.login({ ma_nv, password });

      if (response.success) {
        // Phản hồi đăng nhập đã kèm sẵn quyền / vai trò / xưởng nên không cần
        // gọi thêm lần nào nữa.
        const { token: newToken, user: newUser } = response.data;

        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);

        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          // Không có response = không kết nối được backend
          (error.request
            ? "Không kết nối được máy chủ. Vui lòng thử lại."
            : "Đăng nhập thất bại"),
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => {
    const permissions = user?.permissions ?? [];

    return {
      user,
      token,
      permissions,

      // Ba câu hỏi phân quyền hay dùng nhất, đặt tên MỘT LẦN ở đây để các
      // trang không tự so chuỗi "admin" rải rác khắp nơi.
      isAdmin: permissions.includes("admin"),
      canEdit: permissions.includes("admin") || permissions.includes("edit"),
      canView: permissions.length > 0,

      login,
      logout,
      isAuthenticated: !!token && !!user,
      loading,
    };
  }, [user, token, loading, login, logout]);

  // Hiển thị loading trong khi chờ xác thực
  if (loading) {
    return (
      <Box sx={preset.centerFull}>
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
