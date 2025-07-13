import React, { useState } from "react";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { Button, Toast, ToastContainer } from "react-bootstrap";
import { userId } from "../../constants/localStorage";
import { API_URL } from "../../api_route/api";
export default function EnrollButton(props) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const { courseId } = props;

  const handleEnroll = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const payload = { student_id: parseInt(userId), course_id: courseId };

      const res = await axios.post(`${API_URL}/enrol`, payload, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      setToastMsg(res.data.message || "Enrollment requested successfully");
    } catch (err) {
      setToastMsg(err.response?.data?.detail || "Enrollment failed");
    } finally {
      setShowToast(true);
    }
  };

  return (
    <>
      <Button variant="success" onClick={handleEnroll}>
        Enroll
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
