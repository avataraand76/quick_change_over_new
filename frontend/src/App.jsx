// frontend/src/App.jsx

import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import CreatePhasePage from "./pages/CreatePhasePage";
import LoginPage from "./pages/LoginPage";
import CalendarViewPage from "./pages/CalendarViewPage";
import ReportPage from "./pages/ReportPage";
import NavBar from "./components/NavigationBar";

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<PrivateRoute element={<HomePage />} />} />
        <Route
          path="/create-phase"
          element={<PrivateRoute element={<CreatePhasePage />} />}
        />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/calendar"
          element={<PrivateRoute element={<CalendarViewPage />} />}
        />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
