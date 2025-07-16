import React, { useState } from "react";
import axios from "axios";
import { fetchFastCsrfToken } from "./../constants/fetchCsrfToken";
import ButtonComponent from "../common/ButtonComponent";

import { API_URL } from "../api_route/api";
import "../auth/styles/Login.css";

export default function FastLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    const csrf_token = await fetchFastCsrfToken();
    if (!csrf_token) {
      setError("Failed to fetch CSRF token. Please try again.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        { ...form },
        {
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );

      const userData = response.data;
      if (userData) {
        localStorage.setItem("username", userData.username);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("userId", userData.user_id);
        localStorage.setItem("department", userData.department);

        setMessage(userData.msg || "Login successful");

        setTimeout(() => {
          window.location.href =
            userData.role === "admin"
              ? "/admin/dashboard"
              : userData.role === "lecturer"
              ? "/lecturer/dashboard"
              : userData.role === "student"
              ? "/student/dashboard"
              : "/logout";
        }, 1000);
      }
    } catch (error) {
      const response = error.response?.data;
      setError(response?.msg || "Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h4 className="text-center mb-3">Student Login</h4>
        {message && (
          <div className="alert alert-info text-center">{message}</div>
        )}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        <form>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-control"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <ButtonComponent
            type="button"
            variant="primary"
            className="w-100"
            onClick={handleLogin}
          >
            Login
          </ButtonComponent>

          <p className="mt-3 text-center">
            {/* Want to Login with Passkey{" "} */}
            <a href="/passkey/login">Login with Passkey</a>
          </p>
          <p className="mt-3 text-center">
            Don’t have an account? <a href="/">Register</a>
          </p>
          <p className="text-center">
            Forgot password? <a href="/forgot-password">Reset here</a>
          </p>
        </form>
      </div>
    </div>
  );
}
