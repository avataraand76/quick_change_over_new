// frontend/src/components/NavigationBar.jsx

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Login as LoginIcon,
  AccountCircle,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo_vlh.jpg";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const [anchorEl, setAnchorEl] = React.useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Ẩn navigation khi ở trang login
  if (location.pathname === "/login") {
    return null;
  }

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#1976d2",
        borderRadius: "20px",
        margin: "10px",
        width: "calc(100% - 20px)",
      }}
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <Avatar
            src={logo}
            alt="Logo"
            component={Link}
            to="/"
            sx={{ width: 40, height: 40, marginRight: 2 }}
          />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: "none",
              color: "white",
              fontWeight: "bold",
              "&:hover": {
                color: "#e3f2fd",
              },
            }}
          >
            Quick Change Over
          </Typography>
        </Box>

        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 1,
            alignItems: "center",
          }}
        >
          {token && (
            <Button
              color="inherit"
              startIcon={<AccountCircle />}
              sx={{
                borderRadius: "15px",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
                marginRight: 1,
                textTransform: "none",
              }}
            >
              {user.ma_nv}: {user.ten_nv}
            </Button>
          )}
          <Button
            color="inherit"
            component={Link}
            to="/"
            startIcon={<i className="fas fa-home" />}
            sx={{
              borderRadius: "15px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Trang chủ
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/create-phase"
            startIcon={<i className="fas fa-plus" />}
            sx={{
              borderRadius: "15px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Quản Lý kế hoạch
          </Button>
          {/* <Button
            color="inherit"
            component={Link}
            to="/calendar"
            startIcon={<i className="fas fa-calendar" />}
            sx={{
              borderRadius: '15px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Kế hoạch
          </Button> */}
          <Button
            color="inherit"
            component={Link}
            to="/report"
            startIcon={<i className="fas fa-chart-bar" />}
            sx={{
              borderRadius: "15px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Báo cáo
          </Button>
          <Button
            color="inherit"
            component="a"
            href="https://drive.google.com/file/d/1a2pABLGmp4h6j98objZ-R5-nASF5CZJE/view?usp=sharing"
            target="_blank"
            startIcon={<i className="fas fa-book" />}
            sx={{
              borderRadius: "15px",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            HDSD
          </Button>
          {token ? (
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<i className="fas fa-sign-out-alt" />}
              sx={{
                borderRadius: "15px",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Đăng xuất
            </Button>
          ) : (
            <Button
              color="inherit"
              component={Link}
              to="/login"
              startIcon={<LoginIcon />}
              sx={{
                borderRadius: "15px",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Đăng nhập
            </Button>
          )}
        </Box>

        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMenu}
            sx={{ borderRadius: "15px" }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: "#fff",
                boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                borderRadius: "15px",
              },
            }}
          >
            {token && (
              <MenuItem sx={{ color: "#1976d2" }}>
                <AccountCircle sx={{ mr: 1 }} />
                {user.ma_nv}: {user.ten_nv}
              </MenuItem>
            )}
            <MenuItem component={Link} to="/" onClick={handleClose}>
              <i className="fas fa-home" style={{ marginRight: 8 }} />
              Trang chủ
            </MenuItem>
            <MenuItem component={Link} to="/create-phase" onClick={handleClose}>
              <i className="fas fa-plus" style={{ marginRight: 8 }} />
              Quản Lý kế hoạch
            </MenuItem>
            <MenuItem component={Link} to="/calendar" onClick={handleClose}>
              <i className="fas fa-calendar" style={{ marginRight: 8 }} />
              Kế hoạch
            </MenuItem>
            <MenuItem component={Link} to="/report" onClick={handleClose}>
              <i className="fas fa-chart-bar" style={{ marginRight: 8 }} />
              Báo cáo
            </MenuItem>
            <MenuItem
              component="a"
              href="https://drive.google.com/file/d/1a2pABLGmp4h6j98objZ-R5-nASF5CZJE/view?usp=sharing"
              target="_blank"
              onClick={handleClose}
            >
              <i className="fas fa-book" style={{ marginRight: 8 }} />
              HDSD
            </MenuItem>
            {token ? (
              <MenuItem
                onClick={() => {
                  handleLogout();
                  handleClose();
                }}
              >
                <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }} />
                Đăng xuất
              </MenuItem>
            ) : (
              <MenuItem component={Link} to="/login" onClick={handleClose}>
                <LoginIcon sx={{ mr: 1 }} />
                Đăng nhập
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
