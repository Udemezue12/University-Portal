import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "./../api_route/api";
import { fetchFastCsrfToken } from "./../constants/fetchCsrfToken";
import ButtonComponent from "../common/ButtonComponent";
import { Link} from "react-router-dom";

const PasskeyLogin = () => {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  

  const base64urlToBuffer = (base64url) => {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleFingerprintLogin = async () => {
    const csrf_token = await fetchFastCsrfToken();

    setError("");

    try {
      const response = await axios.get(`${API_URL}/verify/login`, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      const publicKey = response.data.publicKey;

      publicKey.challenge = base64urlToBuffer(publicKey.challenge);
      publicKey.allowCredentials = publicKey.allowCredentials.map((cred) => ({
        ...cred,
        id: base64urlToBuffer(cred.id),
      }));

      const credential = await navigator.credentials.get({ publicKey });

      const credentialId = credential.id;
      const authResponse = await axios.post(
        `${API_URL}/passkey/authenticate`,
        {
          credential_id: credentialId,
        },
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );
      const userData = authResponse.data;
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
    } catch (err) {
      console.error("Fingerprint login failed:", err);
      if (err.response && err.response.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Fingerprint login failed. Try again.");
      }
    }
  };

  return (
    <div className="container-fluid fringer min-vh-100 d-flex justify-content-center align-items-center">
      <div
        className="card shadow-lg p-4 rounded-4 border-0 w-100"
        style={{ maxWidth: "420px", transition: "all 0.3s ease-in-out" }}
      >
        {error && (
          <div className="mb-3">
            <p style={{ color: "red" }}>{error}</p>
          </div>
        )}
        {message && (
          <div className="alert alert-info text-center">{message}</div>
        )}

        <div className="d-grid mb-3">
          <ButtonComponent
            onClick={handleFingerprintLogin}
            label="Authenticate Passkey"
            type="button"
            className="btn btn-primary rounded-pill"
          >
            Authenticate
          </ButtonComponent>
        </div>
        <div className="text-center">
          <small>
            <Link to="/login" className="text-decoration-non">
              Login Manually
            </Link>
          </small>
        </div>
      </div>
    </div>
  );
};
export default PasskeyLogin;
