// frontend/src/api/api.jsx

import axios from "axios";

//////local host//////
let API_URL = "";

if (window.location.hostname === "localhost") {
  API_URL = "http://localhost:8081"; // localhost
} else if (window.location.hostname === "192.168.1.61") {
  API_URL = "http://192.168.1.61:8081"; // for mobile test
}
//////local host//////

//////VLH//////
// let API_URL = "https://sveffmachine.vietlonghung.com.vn/api/qco";
//////VLH//////

//////CT//////
// let API_URL = "https://svqco.congtien.com.vn";
//////CT//////

// Tạo một instance của axios
const httpConnect = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor để tự động thêm token vào headers
httpConnect.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi từ server
httpConnect.interceptors.response.use(
  (response) => response, // Trả về response bình thường nếu không có lỗi
  (error) => {
    // Kiểm tra nếu lỗi là 401 (Unauthorized) hoặc 403 (Forbidden)
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // Xóa token khỏi localStorage
      localStorage.removeItem("token");
      // Chuyển hướng về trang login
      window.location.href = "/login";
    }
    // Trả về lỗi để các hàm gọi API có thể xử lý tiếp nếu cần
    return Promise.reject(error);
  }
);

let API = {
  login: async (username, password) => {
    const response = await httpConnect.post("/login", { username, password });
    return response.data;
  },

  // getLinesAndStyles: async () => {
  //   const response = await httpConnect.get("/api/lines-styles");
  //   return response.data;
  // },

  getHigmfLinesAndStyles: async () => {
    const response = await httpConnect.get("/api/higmf-lines-styles");
    return response.data;
  },

  // syncHigmfData: async () => {
  //   try {
  //     const response = await httpConnect.post("/api/sync-higmf-data");
  //     return response.data;
  //   } catch (error) {
  //     console.error("Error syncing HIGMF data:", error);
  //     throw error;
  //   }
  // },

  createPlan: async (plan) => {
    const response = await httpConnect.post("/api/create-plan", plan);
    return response.data;
  },

  togglePlanInactive: async (id_plan) => {
    try {
      const response = await httpConnect.put(
        `/api/plans/${id_plan}/toggle-inactive`
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling plan inactive status:", error);
      throw error;
    }
  },

  getPlans: async () => {
    const response = await httpConnect.get("/api/plans");
    return response.data;
  },

  getPlanById: async (id) => {
    try {
      const response = await httpConnect.get(`/api/plans/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  },

  getProcesses: async () => {
    const response = await httpConnect.get("/api/processes");
    return response.data;
  },

  updatePlan: async (id, updatedPlan) => {
    const response = await httpConnect.put(`/api/plans/${id}`, updatedPlan);
    return response.data;
  },

  getProcessRates: async (id_plan) => {
    const response = await httpConnect.get(`/api/process-rates/${id_plan}`);
    return response.data;
  },

  getWorkSteps: async (id_process) => {
    const response = await httpConnect.get(`/api/work-steps/${id_process}`);
    return response.data;
  },

  // Get CO data by id_plan
  getCoDataByPlanId: async (id_plan) => {
    try {
      const response = await httpConnect.get(`/api/co/${id_plan}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching CO data:", error);
      throw error;
    }
  },

  // Update CO data
  updateCoData: async (id_plan, coData) => {
    try {
      const response = await httpConnect.put(`/api/co/${id_plan}`, coData);
      return response.data;
    } catch (error) {
      console.error("Error updating CO data:", error);
      throw error;
    }
  },

  // Get downtime issues for a plan
  getDowntimeIssues: async (id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/plans/${id_plan}/downtime-issues`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching downtime issues:", error);
      throw error;
    }
  },

  // Generic documentation methods for all processes

  // Upload documentation file to Google Drive and update the process table
  uploadProcessDocumentation: async (processNum, id_plan, files) => {
    try {
      const formData = new FormData();

      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      } else {
        formData.append("files", files);
      }

      formData.append("id_plan", id_plan);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      };

      const response = await axios.post(
        `${API_URL}/api/process${processNum}/upload-documentation`,
        formData,
        config
      );

      return response.data;
    } catch (error) {
      console.error(
        `Error uploading documentation file for process ${processNum}:`,
        error
      );
      throw error;
    }
  },

  // Upload A3 documentation file to Google Drive and update process table
  uploadProcessA3Documentation: async (processNum, id_plan, files) => {
    try {
      const formData = new FormData();

      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append("files", file);
        });
      } else {
        formData.append("files", files);
      }

      formData.append("id_plan", id_plan);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      };

      const response = await axios.post(
        `${API_URL}/api/process${processNum}/upload-a3-documentation`,
        formData,
        config
      );

      return response.data;
    } catch (error) {
      console.error(
        `Error uploading A3 documentation file for process ${processNum}:`,
        error
      );
      throw error;
    }
  },

  // Get documentation files
  getProcessDocumentation: async (processNum, id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process${processNum}/documentation/${id_plan}`
      );
      const files = response.data.files.map((file) => ({
        ...file,
        url: file.url,
        directUrl: file.directUrl || file.url,
        filename: file.filename,
      }));
      return { files };
    } catch (error) {
      console.error(
        `Error fetching process ${processNum} documentation:`,
        error
      );
      throw error;
    }
  },

  // Get A3 documentation files
  getProcessA3Documentation: async (processNum, id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process${processNum}/a3-documentation/${id_plan}`
      );
      const files = response.data.files.map((file) => ({
        ...file,
        url: file.url,
        directUrl: file.directUrl || file.url,
        filename: file.filename,
      }));
      return { files };
    } catch (error) {
      console.error(
        `Error fetching process ${processNum} A3 documentation:`,
        error
      );
      throw error;
    }
  },

  // Delete a documentation file
  deleteProcessDocumentation: async (processNum, id_plan, index) => {
    try {
      const response = await httpConnect.delete(
        `/api/process${processNum}/delete-documentation/${id_plan}?index=${index}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete file");
      }
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting process ${processNum} documentation:`,
        error
      );
      throw error;
    }
  },

  // Delete an A3 documentation file
  deleteProcessA3Documentation: async (processNum, id_plan, index) => {
    try {
      const response = await httpConnect.delete(
        `/api/process${processNum}/delete-a3-documentation/${id_plan}?index=${index}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete file");
      }
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting process ${processNum} A3 documentation:`,
        error
      );
      throw error;
    }
  },

  // Process 5 preparing machines API methods
  getProcess5PreparingMachines: async (id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process5/preparing-machines/${id_plan}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Process 5 preparing machines:", error);
      throw error;
    }
  },

  saveProcess5PreparingMachine: async (machineData) => {
    try {
      let response;
      // Check if this is an update (id present) or create (no id)
      if (machineData.id_process_5_preparing_machine) {
        // Update existing record
        response = await httpConnect.put(
          `/api/process5/preparing-machines/${machineData.id_process_5_preparing_machine}`,
          machineData
        );
      } else {
        // Create new record
        response = await httpConnect.post(
          "/api/process5/preparing-machines",
          machineData
        );
      }
      return response.data;
    } catch (error) {
      console.error("Error saving Process 5 preparing machine:", error);
      throw error;
    }
  },

  deleteProcess5PreparingMachine: async (id) => {
    try {
      const response = await httpConnect.delete(
        `/api/process5/preparing-machines/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting Process 5 preparing machine:", error);
      throw error;
    }
  },

  // Process 5 backup machines API methods
  getProcess5BackupMachines: async (id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process5/backup-machines/${id_plan}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching Process 5 backup machines:", error);
      throw error;
    }
  },

  saveProcess5BackupMachine: async (machineData) => {
    try {
      let response;
      // Check if this is an update (id present) or create (no id)
      if (machineData.id_process_5_backup_machine) {
        // Update existing record
        response = await httpConnect.put(
          `/api/process5/backup-machines/${machineData.id_process_5_backup_machine}`,
          machineData
        );
      } else {
        // Create new record
        response = await httpConnect.post(
          "/api/process5/backup-machines",
          machineData
        );
      }
      return response.data;
    } catch (error) {
      console.error("Error saving Process 5 backup machine:", error);
      throw error;
    }
  },

  deleteProcess5BackupMachine: async (id) => {
    try {
      const response = await httpConnect.delete(
        `/api/process5/backup-machines/${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting Process 5 backup machine:", error);
      throw error;
    }
  },

  // Process 5 Hi-Line data synchronization
  syncProcess5MachinesFromHiLine: async (id_plan, line, style) => {
    try {
      const response = await httpConnect.post(
        `/api/process5/sync-machines-from-hiline`,
        {
          id_plan,
          line,
          style,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error synchronizing machines:", error);
      throw error;
    }
  },

  // Get Process 5 machines preview
  getProcess5MachinesPreview: async (id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process5/machines-preview/${id_plan}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting machines preview:", error);
      throw error;
    }
  },

  // Process 5 copy machines from another plan
  copyProcess5Machines: async (source_plan_id, target_plan_id) => {
    try {
      const response = await httpConnect.post("/api/process5/copy-machines", {
        source_plan_id,
        target_plan_id,
      });
      return response.data;
    } catch (error) {
      console.error("Error copying machines:", error);
      throw error;
    }
  },

  getAllPlansForCalendar: async () => {
    try {
      const response = await httpConnect.get("/api/plans-for-calendar");
      return response.data;
    } catch (error) {
      console.error("Error fetching plans for calendar:", error);
      throw error;
    }
  },

  // User permission management APIs
  searchUsers: async (searchTerms) => {
    try {
      const response = await httpConnect.get(
        `/api/users/search?terms=${encodeURIComponent(searchTerms)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  getPermissions: async () => {
    try {
      const response = await httpConnect.get("/api/tb_permission");
      return response.data;
    } catch (error) {
      console.error("Error fetching permissions:", error);
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await httpConnect.get("/api/tb_role");
      return response.data;
    } catch (error) {
      console.error("Error fetching roles:", error);
      throw error;
    }
  },

  getWorkshops: async () => {
    try {
      const response = await httpConnect.get("/api/tb_workshop");
      return response.data;
    } catch (error) {
      console.error("Error fetching workshops:", error);
      throw error;
    }
  },

  getUserPermissions: async (userId) => {
    try {
      const response = await httpConnect.get(
        `/api/users/${userId}/all-permissions`
      );
      return {
        direct: response.data.direct || [],
        roles: response.data.roles || [],
        workshops: response.data.workshops || [],
      };
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      throw error;
    }
  },

  saveUserPermissions: async (userId, { direct, roles, workshops }) => {
    try {
      const response = await httpConnect.post(
        `/api/users/${userId}/permissions`,
        {
          permissions: direct || [],
          roles: roles || [],
          workshops: workshops || [],
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error saving user permissions:", error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await httpConnect.get("/api/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  },

  getProcessRoles: async (id_process) => {
    try {
      const response = await httpConnect.get(
        `/api/processes/${id_process}/roles`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching process roles:", error);
      throw error;
    }
  },
};

// Tự động tạo phương thức API cho tất cả các quy trình (1, 2, 3, 4, 6, 7, 8)
// Cách này sẽ tạo ra các phương thức như uploadProcess1DocumentationFile, getProcess7Documentation, ...
// mà không cần phải viết thủ công cho từng quy trình
[1, 2, 3, 4, 6, 7, 8].forEach((processNum) => {
  // Phương thức tải lên tài liệu thông thường
  API[`uploadProcess${processNum}DocumentationFile`] = async (
    id_plan,
    files
  ) => {
    return API.uploadProcessDocumentation(processNum, id_plan, files);
  };

  // Phương thức tải lên tài liệu A3
  API[`uploadProcess${processNum}A3DocumentationFile`] = async (
    id_plan,
    files
  ) => {
    return API.uploadProcessA3Documentation(processNum, id_plan, files);
  };

  // Phương thức lấy tài liệu thông thường
  API[`getProcess${processNum}Documentation`] = async (id_plan) => {
    return API.getProcessDocumentation(processNum, id_plan);
  };

  // Phương thức lấy tài liệu A3
  API[`getProcess${processNum}A3Documentation`] = async (id_plan) => {
    return API.getProcessA3Documentation(processNum, id_plan);
  };

  // Phương thức xóa tài liệu thông thường
  API[`deleteProcess${processNum}Documentation`] = async (id_plan, index) => {
    return API.deleteProcessDocumentation(processNum, id_plan, index);
  };

  // Phương thức xóa tài liệu A3
  API[`deleteProcess${processNum}A3Documentation`] = async (id_plan, index) => {
    return API.deleteProcessA3Documentation(processNum, id_plan, index);
  };
});

export default API;
