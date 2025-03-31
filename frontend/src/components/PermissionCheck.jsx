// frontend/src/components/PermissionCheck.jsx

import React from "react";

const PermissionCheck = ({ requiredPermission, children }) => {
  const checkUserPermission = () => {
    try {
      // Get user data from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) return false;

      const user = JSON.parse(userStr);

      // Check if user is admin
      if (user.isAdmin) return true;

      // Check direct permissions
      if (user.permissions && user.permissions.includes(requiredPermission)) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  };

  // Return children only if user has permission
  return checkUserPermission() ? children : null;
};

export default PermissionCheck;
