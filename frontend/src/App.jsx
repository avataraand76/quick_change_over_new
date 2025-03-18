// frontend/src/App.jsx

import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import CreatePhasePage from "./pages/CreatePhasePage";
import LoginPage from "./pages/LoginPage";
import CalendarViewPage from "./pages/CalendarViewPage";
import ReportPage from "./pages/ReportPage";
import NavBar from "./components/NavigationBar";
import DetailedPhasePage from "./pages/DetailedPhasePage";
import CoPage from "./pages/CoPage";
import Process1Page from "./pages/Process1Page";
import Process2Page from "./pages/Process2Page";
import Process3Page from "./pages/Process3Page";
import Process4Page from "./pages/Process4Page";
import Process5Page from "./pages/Process5Page";
import Process6Page from "./pages/Process6Page";
import Process7Page from "./pages/Process7Page";
import Process8Page from "./pages/Process8Page";

// ScrollToTop component to ensure all page navigations scroll to the top
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Use setTimeout to ensure the scroll happens after the DOM has updated
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "auto", // Using 'auto' instead of 'smooth' for more consistent behavior
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [pathname, navigationType]);

  return null;
}

const PrivateRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
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
        <Route
          path="/detailed-phase/:id"
          element={<PrivateRoute element={<DetailedPhasePage />} />}
        />
        <Route path="/co/:id" element={<PrivateRoute element={<CoPage />} />} />

        {/* Process Routes */}
        <Route
          path="/process1/:id"
          element={<PrivateRoute element={<Process1Page />} />}
        />
        <Route
          path="/process2/:id"
          element={<PrivateRoute element={<Process2Page />} />}
        />
        <Route
          path="/process3/:id"
          element={<PrivateRoute element={<Process3Page />} />}
        />
        <Route
          path="/process4/:id"
          element={<PrivateRoute element={<Process4Page />} />}
        />
        <Route
          path="/process5/:id"
          element={<PrivateRoute element={<Process5Page />} />}
        />
        <Route
          path="/process6/:id"
          element={<PrivateRoute element={<Process6Page />} />}
        />
        <Route
          path="/process7/:id"
          element={<PrivateRoute element={<Process7Page />} />}
        />
        <Route
          path="/process8/:id"
          element={<PrivateRoute element={<Process8Page />} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
