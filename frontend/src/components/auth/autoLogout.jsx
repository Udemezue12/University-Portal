import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { handleAutoLogout } from './handleLogout';

const AutoLogoutManager = ({ children }) => {
  const navigate = useNavigate();

   const logoutCallback = useCallback(() => {
    handleAutoLogout(navigate);
  }, [navigate]);

  useEffect(() => {
    let logoutTimer;

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(() => {
        logoutCallback();
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
  }, [logoutCallback]);
  return children;
};

export default AutoLogoutManager;