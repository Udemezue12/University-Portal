import { useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { API_URL } from "../api_route/api";

const AutoLogoutManager = ({ children }) => {
  const navigate = useNavigate();

  const handleAutoLogout = useCallback(async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      await axios.post(
        `${API_URL}/logout`,
        {},
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );
      localStorage.clear();
      sessionStorage.clear();
      toast.info("Logged out due to inactivity");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Auto logout failed:", err);
    }
  }, [navigate]);

  useEffect(() => {
    let logoutTimer;

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        handleAutoLogout();
      }, 5 * 60 * 1000);
    };

    const events = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "mousedown",
      "touchstart",
    ];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(logoutTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [handleAutoLogout]);

  return children;
};

export default AutoLogoutManager;
