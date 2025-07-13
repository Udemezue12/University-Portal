import React, { useState } from "react";
import axios from "axios";
import { Button, Toast, ToastContainer } from "react-bootstrap";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { extractErrorMessage } from "../../constants/toastFailed";
import { API_URL } from "../../api_route/api";
export default function ApproveButton({ enrollmentId, onSuccess }) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleApprove = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.put(
        `${API_URL}/enrollments/${enrollmentId}/approve`,
        {},
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setToastMsg(res.data.message || "Enrollment approved successfully");
      onSuccess?.(); 
    } catch (err) {
      setToastMsg(extractErrorMessage(err, "Approval failed"));
    } finally {
      setShowToast(true);
    }
  };

  return (
    <>
      <Button variant="success" size="sm" onClick={handleApprove}>
        Approve
      </Button>
      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="success"
        >
          <Toast.Body className="text-white text-center fw-bold">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
