import React, { useState } from "react";
import axios from "axios";
import { Button, Toast, ToastContainer } from "react-bootstrap";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { extractErrorMessage } from "../../constants/toastFailed";
import { API_URL } from "../../api_route/api";
export default function DeclineButton(props) {
  const { enrollmentId, onSuccess } = props;
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleDecline = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.put(
        `${API_URL}/enrollments/${enrollmentId}/decline`,
        {},
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setToastMsg(res.data.message || "Enrollment declined successfully");
      onSuccess?.(); // Refresh the list in parent if provided
    } catch (err) {
      setToastMsg(extractErrorMessage(err, "Decline failed"));
    } finally {
      setShowToast(true);
    }
  };

  return (
    <>
      <Button variant="danger" size="sm" onClick={handleDecline}>
        Decline
      </Button>
      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="danger"
        >
          <Toast.Body className="text-white text-center fw-bold">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
