import React, { useEffect, useState } from "react";
import {
  Table,
  Container,
  Button,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { Link } from "react-router-dom";
import { API_URL } from "../../api_route/api";
export default function AssignmentViewWithSubmit() {
  const [assignments, setAssignments] = useState([]);

  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const fetchAssignments = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/student/assignments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setAssignments(res.data);
    } catch (err) {
      setToastMsg("Failed to load assignments.");
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <Container className="mt-5">
      <h4 className="mb-4 text-center fw-bold text-primary">My Assignments</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Course</th>
            <th>Title</th>
            <th>Description</th>
            <th>Weight (%)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {assignments.length > 0 ? (
            assignments.map((a, i) => (
              <tr key={a.id}>
                <td>{i + 1}</td>
                <td>{a.course_title}</td>
                <td>{a.title}</td>
                <td>{a.description}</td>
                <td>{a.weight}</td>
                <td>
                  <Button
                    as={Link}
                    to={`/assignments/${a.id}/submit`}
                    variant="success"
                    size="sm"
                    disabled={a.submitted}
                  >
                    {a.submitted ? "Submitted" : "Submit Assignment"}
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                No assignments found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="info"
        >
          <Toast.Body className="text-white text-center fw-semibold">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
