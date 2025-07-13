import React, { useState, useEffect } from "react";
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
export default function AssignmentSubmitPage() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [textSubmission, setTextSubmission] = useState("");
  const [file, setFile] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const csrf_token = await fetchFastCsrfToken();
        const res = await axios.get(`${API_URL}/assignments/${id}`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        });
        setAssignment(res.data);
      } catch (err) {
        setToastMsg("Failed to load assignment.");
        setShowToast(true);
      }
    };
    fetchAssignment();
  }, [id]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    const csrf_token = await fetchFastCsrfToken();

    const formData = new FormData();
    formData.append("assignment_id", assignment.id);
    formData.append("course_id", assignment.course_id);
    formData.append("text_submission", textSubmission);
    if (file) {
      formData.append("file", file);
    }

    try {
      await axios.post(`${API_URL}/assignment/submit`, formData, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });
      setToastMsg("Assignment submitted successfully.");
      setShowToast(true);
      setTimeout(() => navigate("/assignments"), 2000);
    } catch (err) {
      setToastMsg(err.response?.data?.detail || "Submission failed.");
      setShowToast(true);
    }
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center text-primary fw-bold">
        Assignment Submission
      </h4>
      {assignment ? (
        <>
          <h5 className="mt-4">{assignment.title}</h5>
          <p>{assignment.description}</p>

          <Form>
            <Form.Group>
              <Form.Label>Write your answer</Form.Label>
              <Form.Control
                as="textarea"
                rows={10}
                value={textSubmission}
                onChange={(e) => setTextSubmission(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mt-3">
              <Form.Label>Attach a file (PDF or DOCX)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
            </Form.Group>

            <Button className="mt-3" onClick={handleSubmit}>
              Submit Assignment
            </Button>
          </Form>
        </>
      ) : (
        <p>Loading assignment...</p>
      )}

      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="info"
        >
          <Toast.Body className="text-white fw-semibold text-center">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
