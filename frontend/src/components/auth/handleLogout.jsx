import axios from "axios";
import { toast } from "react-toastify";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { API_URL } from "../api_route/api";


export const handleAutoLogout = async (navigate) => {
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
};
