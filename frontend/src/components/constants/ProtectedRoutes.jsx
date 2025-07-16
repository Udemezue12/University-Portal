import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

export function AuthProtectedRoutes() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;

  if (!role) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function IsStudentProtectedRoutes() {
  const UserRole = localStorage.getItem("role");

  if (UserRole !== "student") {
    return <Navigate to="*" replace />;
  }
  return <Outlet />;
}

export function IsAdminProtectedRoutes() {
  const UserRole = localStorage.getItem("role");

  if (UserRole !== "admin") {
    return <Navigate to="*" replace />;
  }
  return <Outlet />;
}

export function IsLecturerProtectedRoutes() {
  const UserRole = localStorage.getItem("role");
  if (UserRole !== "lecturer") {
    return <Navigate to="*" replace />;
  }
  return <Outlet />;
}
