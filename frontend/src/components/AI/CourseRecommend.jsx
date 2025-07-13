import React, { useState } from "react";
import axios from "axios";
import {
  Container,
  Form,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { API_URL } from "../api_route/api";
const CourseRecommendation = () => {
  const [interests, setInterests] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRecommend = async () => {
    setLoading(true);
    setRecommendations(null);
    setErrorMsg("");

    try {
      const csrf_token = await fetchFastCsrfToken();
      const response = await axios.post(
        `${API_URL}/recommend`,
        {
          interests: interests,
        },
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setRecommendations(response.data.recommendations);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.detail || "Failed to fetch recommendations"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center fw-bold text-primary mb-4">
        AI Course Recommendations
      </h4>

      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Enter your interests (comma-separated)</Form.Label>
          <Form.Control
            type="text"
            placeholder="e.g., web development, AI, cybersecurity"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
        </Form.Group>
        <div className="d-grid">
          <Button onClick={handleRecommend} disabled={loading}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Get Recommendations"
            )}
          </Button>
        </div>
      </Form>

      {recommendations && (
        <Alert variant="success" className="mt-4">
          <h5>Recommended Courses:</h5>
          <ul>
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
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

export default CourseRecommendation;

export const UnifiedCourseRecommendation = () => {
  const [interests, setInterests] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [provider, setProvider] = useState("gemini");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRecommend = async () => {
    setLoading(true);
    setRecommendations([]);
    setMessage("");

    try {
      const csrf_token = await fetchFastCsrfToken();

      const response = await axios.post(
        `${API_URL}/${provider}/recommend`,
        {
          interests: interests.split(",").map((i) => i.trim()),
        },
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data?.status === "success") {
        const raw = response.data.suggestions || "";

        const parsed =
          typeof raw === "string"
            ? raw
                .split("\n")
                .map((line) => line.replace(/^\d+\.\s*/, "").trim())
                .filter(Boolean)
            : [];

        setRecommendations(parsed);
        setMessage("Success: Course recommendations generated.");
      } else {
        setMessage("Error: Failed to generate course recommendations.");
      }
    } catch (error) {
      console.error("Recommendation error:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "An unknown error occurred.";
      setMessage(`Error: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center fw-bold text-primary mb-4">
        AI Course Recommendations
      </h4>

      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Enter your interests (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., AI, web development, design"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Select AI Provider</Form.Label>
              <Form.Select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <div className="d-grid mt-2">
          <Button onClick={handleRecommend} disabled={loading || !interests}>
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Get Recommendations"
            )}
          </Button>
        </div>
      </Form>

      {message && (
        <Alert
          variant={message.startsWith("Success") ? "success" : "danger"}
          className="mt-4 text-center fw-bold"
        >
          {message}
        </Alert>
      )}

      {recommendations.length > 0 && (
        <Alert variant="info" className="mt-4">
          <h5>Recommended Courses:</h5>
          <ul>
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </Alert>
      )}
    </Container>
  );
};
