import React, { useState } from "react";
import axios from "axios";
import {validateRegisterForm} from "../constants/validators"
import { useNavigate } from "react-router-dom";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import ButtonComponent from "../common/ButtonComponent"; 
import { API_URL } from "../api_route/api";

export default function AdminRegister() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    role: "ADMIN",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    const validation = validateRegisterForm(form);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const { username, email, password, name, role } = form;
    const payload = { username, email, password, name, role };

    try {
      const csrf_token = await fetchFastCsrfToken();
      if (!csrf_token) {
        setError("CSRF token not found in response.");
        return;
      }

      const response = await axios.post(`${API_URL}/register`, payload, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrf_token,
        },
        withCredentials: true,
      });

      setMessage(response.data.message || "Registration successful");

      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      const response = error.response?.data;
      console.error("Registration Failed:", error);

      if (response) {
        if (response.msg === "Username already exists") {
          setError("Username already taken.");
        } else if (response.msg === "Email already exists") {
          setError("Email already in use.");
        } else if (response.msg === "Name already exists") {
          setError("Name already in use.");
        } else if (response.errors) {
          setError(`Validation failed: ${JSON.stringify(response.errors)}`);
        } else {
          setError(response.msg || "Registration failed. Please check your inputs.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow p-4 rounded-4 w-100" style={{ maxWidth: "400px" }}>
        <h4 className="text-center mb-3">Register</h4>

        {message && <div className="alert alert-info text-center">{message}</div>}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        <form>
          <div className="mb-3">
            <label className="form-label fw-semibold">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              className="form-control"
              value={form.username}
              onChange={handleChange}
              required
              name="username"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Name</label>
            <input
              type="text"
              placeholder="Enter name"
              className="form-control"
              value={form.name}
              onChange={handleChange}
              required
              name="name"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              placeholder="Enter email"
              className="form-control"
              value={form.email}
              onChange={handleChange}
              required
              name="email"
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
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

          <div className="mb-3">
            <label className="form-label fw-semibold">Confirm Password</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                placeholder="Confirm password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          
          <ButtonComponent
            type="button"
            variant="primary"
            className="w-100"
            onClick={handleRegister}
          >
            Register
          </ButtonComponent>

          <p className="mt-3 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-decoration-none">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
}
