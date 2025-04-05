// frontend/src/components/PermissionCheck.jsx

import React from "react";

const PermissionCheck = ({
  requiredPermission,
  requiredRole,
  requiredWorkshop,
  children,
  renderContent,
}) => {
  const checkUserPermission = () => {
    try {
      // Get user data from localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) return false;

      const user = JSON.parse(userStr);

      // Check if user is admin
      if (user.isAdmin) return true;

      // Check roles directly from user.roles array
      if (requiredRole) {
        // Handle both single role and array of roles
        const roles = Array.isArray(requiredRole)
          ? requiredRole
          : [requiredRole];
        // Check if any of the required roles exist in user.roles array
        const hasRole = user.roles?.some((role) =>
          roles.includes(role.id_role)
        );
        if (hasRole) return true;
      }

      // Check permissions
      if (requiredPermission) {
        // Handle both single permission and array of permissions
        const permissions = Array.isArray(requiredPermission)
          ? requiredPermission
          : [requiredPermission];
        const hasPermission = user.permissions?.some((perm) =>
          permissions.includes(perm.id_permission)
        );
        if (hasPermission) return true;
      }

      // Check workshop permissions
      if (requiredWorkshop) {
        // Handle both single workshop and array of workshops
        const workshops = Array.isArray(requiredWorkshop)
          ? requiredWorkshop
          : [requiredWorkshop];
        const hasWorkshop = user.workshops?.some((workshop) =>
          workshops.includes(workshop.id_workshop)
        );
        if (hasWorkshop) return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  };

  const hasPermission = checkUserPermission();

  // If renderContent function is provided, use it with the permission result
  if (renderContent) {
    return renderContent(hasPermission);
  }

  // Otherwise just conditionally render children
  return hasPermission ? children : null;
};

export default PermissionCheck;
