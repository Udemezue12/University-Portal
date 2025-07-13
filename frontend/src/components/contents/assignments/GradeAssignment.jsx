// src/components/lecturer/GradeAssignment.jsx
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

  const handleGradeSubmit = async () => {
    const submission_id = Number(submissionId);
    const parsedScore = Number(score);
    console.log("submissionId:", submissionId);
    console.log("score:", score);

    if (
      !submission_id ||
      isNaN(parsedScore) ||
      parsedScore < 0 ||
      parsedScore > 30
    ) {
      setToastMsg("Please enter a valid score between 0 and 300.");
      setShowToast(true);
      return;
    }

    try {
      const csrf_token = await fetchFastCsrfToken();

      await axios.post(
        `${API_URL}/assignments/grade`,
        {
          submission_id,
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
      const errors = err.response?.data?.detail;
      if (Array.isArray(errors)) {
        const messages = errors.map((e) => e.msg).join(", ");
        setToastMsg(messages);
      } else {
        setToastMsg(err.response?.data?.detail || "Grading failed.");
      }
      setShowToast(true);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-primary fw-bold text-center">Grade Assignment</h4>
      <Form className="mt-4">
        <Form.Group>
          <Form.Label>Score (%)</Form.Label>
          <Form.Control
            type="number"
            min={0}
            max={30}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Feedback (optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </Form.Group>
        <Button
          className="mt-4"
          onClick={handleGradeSubmit}
          disabled={
            !score || isNaN(parseFloat(score)) || parseFloat(score) <= 0
          }
        >
          Submit Grade
        </Button>
      </Form>

      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="success"
        >
          <Toast.Body className="text-white text-center fw-semibold">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
