// frontend/src/api/api.jsx

import axios from "axios";

// Lấy URL backend từ biến môi trường (.env: VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";

const httpConnect = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Gắn token vào mọi request nếu đã đăng nhập
httpConnect.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // Nếu data là FormData, KHÔNG set Content-Type để axios tự điền
    // 'multipart/form-data' kèm 'boundary'.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

httpConnect.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      const message =
        error.response.data?.message || "Phiên đăng nhập hết hạn.";

      // Chỉ tự logout nếu lỗi KHÔNG đến từ chính trang login - nếu không, gõ
      // sai mật khẩu sẽ gây vòng lặp reload vô tận.
      if (!error.config.url.includes("/api/auth/login")) {
        console.error("Authentication Error:", message);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Dùng window.location.href để reset toàn bộ state React (AuthContext)
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export const api = {
  // MARK: LOGIN
  login: async (data) => {
    const response = await httpConnect.post("/api/auth/login", data);
    return response.data;
  },

  auth: {
    /**
     * Hồ sơ đầy đủ của người đang đăng nhập: thông tin nhân viên + quyền +
     * vai trò + xưởng. Dùng khi mở lại app để làm mới phân quyền thay vì tin
     * vào bản đã lưu trong localStorage.
     */
    me: async () => {
      const response = await httpConnect.get("/api/auth/me");
      return response.data;
    },

    /** Chỉ mảng TÊN quyền, ví dụ ["ADMIN"]. Giữ cho tương thích với TPM. */
    getPermissions: async () => {
      const response = await httpConnect.get("/api/auth/permissions");
      return response.data;
    },
  },

  admin: {
    getAllPermissions: async () => {
      const response = await httpConnect.get("/api/admin/permissions");
      return response.data;
    },
    searchUsers: async (query) => {
      const response = await httpConnect.get("/api/admin/users/search", {
        params: { query },
      });
      return response.data;
    },
    getAssignedUsers: async () => {
      const response = await httpConnect.get("/api/admin/users/assigned");
      return response.data;
    },
    getUserPermissions: async (ma_nv) => {
      const response = await httpConnect.get("/api/admin/users/permissions", {
        params: { ma_nv },
      });
      return response.data;
    },
    updateUserPermissions: async (ma_nv, permissions) => {
      const response = await httpConnect.put("/api/admin/users/permissions", {
        ma_nv,
        permissions,
      });
      return response.data;
    },
  },
};

export default api;
