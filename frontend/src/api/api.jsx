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
// let API_URL = "https://serverksnb.vietlonghung.com.vn";
//////VLH//////

//////CT//////
// let API_URL = "https://serverksnb.congtien.com.vn";
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

let API = {
  login: async (username, password) => {
    const response = await httpConnect.post("/login", { username, password });
    return response.data;
  },

  getLinesAndStyles: async () => {
    const response = await httpConnect.get("/api/lines-styles");
    return response.data;
  },

  createPlan: async (plan) => {
    const response = await httpConnect.post("/api/create-plan", plan);
    return response.data;
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

  // Upload documentation file to Google Drive and update tb_process_1 documentation field
  uploadDocumentationFile: async (id_plan, files) => {
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
        `${API_URL}/api/process1/upload-documentation`,
        formData,
        config
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading documentation file:", error);
      throw error;
    }
  },

  // Upload A3 documentation file to Google Drive and update tb_process_1 A3_documentation field
  uploadA3DocumentationFile: async (id_plan, files) => {
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
        `${API_URL}/api/process1/upload-a3-documentation`,
        formData,
        config
      );

      return response.data;
    } catch (error) {
      console.error("Error uploading A3 documentation file:", error);
      throw error;
    }
  },

  // Get documentation files for Process 1
  getProcess1Documentation: async (id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process1/documentation/${id_plan}`
      );
      const files = response.data.files.map((file) => ({
        ...file,
        url: file.url,
        directUrl: file.directUrl || file.url,
        filename: file.filename,
      }));
      return { files };
    } catch (error) {
      console.error("Error fetching Process 1 documentation:", error);
      throw error;
    }
  },

  // Delete a documentation file from Process 1
  deleteProcess1Documentation: async (id_plan, index) => {
    try {
      const response = await httpConnect.delete(
        `/api/process1/delete-documentation/${id_plan}?index=${index}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete file");
      }
      return response.data;
    } catch (error) {
      console.error("Error deleting Process 1 documentation:", error);
      throw error;
    }
  },

  // Get A3 documentation files for Process 1
  getProcess1A3Documentation: async (id_plan) => {
    try {
      const response = await httpConnect.get(
        `/api/process1/a3-documentation/${id_plan}`
      );
      const files = response.data.files.map((file) => ({
        ...file,
        url: file.url,
        directUrl: file.directUrl || file.url,
        filename: file.filename,
      }));
      return { files };
    } catch (error) {
      console.error("Error fetching Process 1 A3 documentation:", error);
      throw error;
    }
  },

  // Delete an A3 documentation file from Process 1
  deleteProcess1A3Documentation: async (id_plan, index) => {
    try {
      const response = await httpConnect.delete(
        `/api/process1/delete-a3-documentation/${id_plan}?index=${index}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to delete file");
      }
      return response.data;
    } catch (error) {
      console.error("Error deleting Process 1 A3 documentation:", error);
      throw error;
    }
  },
};

export default API;
