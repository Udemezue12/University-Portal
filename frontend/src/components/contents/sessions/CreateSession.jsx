import React, { useState } from "react";
import { Container, Card, Form, Toast, ToastContainer } from "react-bootstrap";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { role } from "./../../constants/localStorage";
import { API_URL } from "../../api_route/api";
export default function CreateSession() {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async () => {
    if (role !== "admin") {
      setToastMsg("Only admins can create sessions.");
      setShowToast(true);
      return;
    }

    if (!name || !startDate || !endDate) {
      setToastMsg("Please fill in all fields.");
      setShowToast(true);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      setToastMsg("End date must be after start date.");
      setShowToast(true);
      return;
    }

    const diffInYears = (end - start) / (1000 * 60 * 60 * 24 * 365);
    if (diffInYears > 1) {
      setToastMsg("Session duration cannot exceed 1 year.");
      setShowToast(true);
      return;
    }

    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.post(
        `${API_URL}/sessions/create`,
        {
          name,
          start_date: startDate,
          end_date: endDate,
        },
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setToastMsg(res.data.message || "Session created successfully.");
    } catch (error) {
      console.error(error);
      setToastMsg(error.response?.data?.detail || "Failed to create session.");
    } finally {
      setShowToast(true);
    }
  };

  return (
    <Container className="mt-5">
      <Card
        className="p-4 rounded-4 shadow-sm mx-auto"
        style={{ maxWidth: "500px" }}
      >
        <h5 className="text-center fw-bold text-success mb-3">
          Create Session
        </h5>
        <Form>
          <InputComponent
            label="Session Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <InputComponent
            label="Start Date"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <InputComponent
            label="End Date"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
          <div className="text-center">
            <ButtonComponent onClick={handleSubmit}>
              Create Session
            </ButtonComponent>
          </div>
        </Form>
      </Card>
      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="success"
        >
          <Toast.Body className="text-white fw-bold text-center">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
