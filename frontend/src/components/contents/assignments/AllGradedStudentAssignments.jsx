import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Container, Toast, ToastContainer } from "react-bootstrap";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";

export default function LecturerGradedAssignments() {
  const [gradedAssignments, setGradedAssignments] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchGradedAssignments = async () => {
      try {
        const csrf_token = await fetchFastCsrfToken();
        const res = await axios.get(`${API_URL}/lecturer/graded-assignments`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        });
        setGradedAssignments(res.data.results);
      } catch (err) {
        setToastMsg("Failed to load graded assignments.");
        setShowToast(true);
      }
    };

    fetchGradedAssignments();
  }, []);

  return (
    <Container className="mt-5">
      <h4 className="text-center text-primary fw-bold">Graded Assignments</h4>
      <Table striped bordered hover responsive className="mt-4">
        <thead>
          <tr>
            <th>#</th>
            <th>Assignment</th>
            <th>Course</th>
            <th>Student</th>
            <th>Score (%)</th>
            <th>Grade</th>
            <th>Feedback</th>
            <th>Level</th>
            <th>Department</th>
            <th>Graded On</th>
          </tr>
        </thead>
        <tbody>
          {gradedAssignments.length > 0 ? (
            gradedAssignments.map((g, idx) => (
              <tr key={g.id}>
                <td>{idx + 1}</td>
                <td>{g.assignment_title}</td>
                <td>{g.course_title}</td>
                <td>{g.student_name}</td>
                <td>{g.score}</td>
                <td>{g.letter_grade}</td>
                <td>{g.feedback || "—"}</td>
                <td>{g.level}</td>
                <td>{g.department}</td>
                <td>{new Date(g.graded_at).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center">
                No graded assignments found.
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
          bg="danger"
        >
          <Toast.Body className="text-white text-center">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
