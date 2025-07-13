import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { username, role } from "./localStorage";

export function AuthProtectedRoutes() {
  const isLoggedIn = () => username !== null;
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export function IsStudentProtectedRoutes() {
  if (role !== "student") {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

export function IsAdminProtectedRoutes() {
  if (role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

export function IsLecturerProtectedRoutes() {
  if (role !== "lecturer") {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
