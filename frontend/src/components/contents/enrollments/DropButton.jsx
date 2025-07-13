import React, { useState } from "react";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { Button, Toast, ToastContainer } from "react-bootstrap";
import { API_URL } from "../../api_route/api";
export default function DropButton(props) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const { enrollmentId } = props;
  const handleDrop = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();

      const res = await axios.delete(
        `${API_URL}/${enrollmentId}/drop`,
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );
      setToastMsg(res.data.message || "Enrollment dropped successfully");
    } catch (err) {
      setToastMsg(err.response?.data?.detail || "Drop failed");
    } finally {
      setShowToast(true);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={handleDrop}>
        Drop
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
