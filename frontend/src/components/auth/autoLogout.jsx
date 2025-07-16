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
      }, 4 * 60 * 1000); 
    };

    // const pingBackend = async () => {
    //   try {
    //     const csrf_token = await fetchFastCsrfToken();
    //     await axios.get(`${API_URL}/ping`, {
    //       headers: { "X-CSRF-TOKEN": csrf_token },
    //       withCredentials: true,
    //     });
    //   } catch (err) {
    //     console.error("Ping failed:", err);
    //   }
    // };

    const activityEvents = [
      "mousemove",
      "keydown",
      "scroll",
      "click",
      "mousedown",
      "touchstart",
    ];

    const handleActivity = () => {
      resetTimer();
      // pingBackend();
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, handleActivity)
    );
    resetTimer();

    // const pingInterval = setInterval(pingBackend, 60000); // ping every 1 min

    return () => {
      clearTimeout(logoutTimer);
      // clearInterval(pingInterval);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
    };
  }, [handleAutoLogout]);
  return children;
};

export default AutoLogoutManager;
