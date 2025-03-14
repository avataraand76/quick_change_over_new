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
};

export default API;
