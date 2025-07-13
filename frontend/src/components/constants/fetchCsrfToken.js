import axios from "axios";
import { API_URL } from "./../api_route/api";

export const fetchFastCsrfToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/csrf_token`, {
      withCredentials: true,
    });
    const csrf_token = response.data.csrf_token;

    if (!csrf_token) {
      // setError("CSRF token not found in response");
      // return null;
    }
    return csrf_token;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    //   setError("Failed to fetch CSRF token. Please try again.");
    return null;
  }
};
