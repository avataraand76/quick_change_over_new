// frontend/src/api/api.jsx

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

//////API//////
let API = {
  login: async (username, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },
};
//////API//////

export default API;
