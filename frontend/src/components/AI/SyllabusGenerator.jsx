import React, { useState } from "react";
import axios from "axios";
import { Container, Form, Button, Spinner, Alert } from "react-bootstrap";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { API_URL } from "../api_route/api";
const SyllabusGenerator = () => {
  const [topic, setTopic] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setSyllabus("");
    setErrorMsg("");

    try {
      const csrf_token = await fetchFastCsrfToken();
      const response = await axios.post(
        `${API_URL}/syllabus`,
        {
          topic: topic,
        },
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setSyllabus(response.data.syllabus);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.detail || "Failed to generate syllabus"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center fw-bold text-success mb-4">
        AI Syllabus Generator
      </h4>

      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Enter Course Topic</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Introduction to Machine Learning"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </Form.Group>
        <div className="d-grid">
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Generate Syllabus"
            )}
          </Button>
        </div>
      </Form>

      {syllabus && (
        <Alert variant="info" className="mt-4">
          <h5>Generated Syllabus:</h5>
          <pre>{syllabus}</pre>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger" className="mt-4 text-center fw-bold">
          {errorMsg}
        </Alert>
      )}
    </Container>
  );
};

export default SyllabusGenerator;

export const GeminiSyllabusGenerator = () => {
  const [topic, setTopic] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setSyllabus("");
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const csrf_token = await fetchFastCsrfToken();
      const response = await axios.post(
        `${API_URL}/gemini/syllabus`,
        { topic },
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data?.status === "success") {
        setSyllabus(response.data.syllabus);
        setSuccessMsg("Syllabus generated successfully.");
      } else {
        setErrorMsg("Failed to generate syllabus.");
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.detail || "Error: Could not generate syllabus."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center fw-bold text-success mb-4">
        AI Syllabus Generator (Gemini)
      </h4>

      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Enter Course Topic</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., Introduction to Cybersecurity"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </Form.Group>
        <div className="d-grid">
          <Button onClick={handleGenerate} disabled={loading || topic === ""}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Generate Syllabus"
            )}
          </Button>
        </div>
      </Form>

      {successMsg && (
        <Alert variant="success" className="mt-4 text-center">
          {successMsg}
        </Alert>
      )}

      {syllabus && (
        <Alert variant="info" className="mt-4">
          <h5>Generated Syllabus:</h5>
          <pre>{syllabus}</pre>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="danger" className="mt-4 text-center fw-bold">
          {errorMsg}
        </Alert>
      )}
    </Container>
  );
};
