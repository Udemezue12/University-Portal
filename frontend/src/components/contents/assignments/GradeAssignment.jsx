// frontend/src/components/lecturer/GradeAssignment.jsx

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";

export default function GradeAssignment() {
  const { submissionId } = useParams();
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    const parsedScore = Number(score);
    if (
      !submissionId ||
      isNaN(parsedScore) ||
      parsedScore < 0 ||
      parsedScore > 30
    ) {
      setToastMsg("Score must be between 0 and 30.");
      setShowToast(true);
      return;
    }

    try {
      const csrf_token = await fetchFastCsrfToken();

      await axios.post(
        `${API_URL}/assignments/grade`,
        {
          submission_id: Number(submissionId),
          score: parsedScore,
          feedback,
        },
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );

      setToastMsg("Graded successfully.");
      setShowToast(true);
      setTimeout(() => navigate("/graded/assignments"), 2000);
    } catch (err) {
      const error = err.response?.data?.detail;
      if (Array.isArray(error)) {
        setToastMsg(error.map(e => e.msg).join(", "));
      } else {
        setToastMsg(error || "Grading failed.");
      }
      setShowToast(true);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center text-primary fw-bold">Grade Assignment</h4>
      <Form className="mt-4">
        <Form.Group>
          <Form.Label>Score (out of 30)</Form.Label>
          <Form.Control
            type="number"
            value={score}
            placeholder="Enter score"
            onChange={(e) => setScore(e.target.value)}
            min={0}
            max={30}
          />
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label>Feedback</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={feedback}
            placeholder="Optional feedback"
            onChange={(e) => setFeedback(e.target.value)}
          />
        </Form.Group>

        <Button className="mt-4" onClick={handleSubmit}>
          Submit Grade
        </Button>
      </Form>

      <ToastContainer position="top-center">
        <Toast
          bg="success"
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white text-center">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
