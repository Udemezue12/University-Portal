import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Table,
  Form,
  Button,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "./../../api_route/api";

export default function StudentResultSheet() {
  const [results, setResults] = useState([]);
  const [level, setLevel] = useState("");
  const [session, setSession] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const fetchResults = async () => {
    try {
      const csrfToken = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/student/results`, {
        params: { level, session },
        headers: { "X-CSRF-TOKEN": csrfToken },
        withCredentials: true,
      });
      setResults(res.data.results);
    } catch (err) {
      setToastMsg("Failed to load results.");
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchResults();
  });

  const handleFilter = (e) => {
    e.preventDefault();
    fetchResults();
  };

  const calculateGPA = () => {
    if (!results.length) return 0;
    const totalPoints = results.reduce(
      (acc, r) => acc + r.score * r.grade_point,
      0
    );
    const totalUnits = results.reduce((acc, r) => acc + r.grade_point, 0);
    return totalUnits ? (totalPoints / totalUnits).toFixed(2) : 0;
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center text-primary fw-bold">Academic Transcript</h4>
      <Form className="row mt-3" onSubmit={handleFilter}>
        <Form.Group className="col-md-5">
          <Form.Label>Filter by Session</Form.Label>
          <Form.Control
            type="text"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="e.g. 2023/2024"
          />
        </Form.Group>
        <Form.Group className="col-md-5">
          <Form.Label>Filter by Level</Form.Label>
          <Form.Control
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="e.g. 100"
          />
        </Form.Group>
        <Form.Group className="col-md-2 d-flex align-items-end">
          <Button type="submit" className="w-100">
            Apply
          </Button>
        </Form.Group>
      </Form>

      <Table striped bordered hover responsive className="mt-4">
        <thead>
          <tr>
            <th>Course</th>
            <th>Score (%)</th>
            <th>Grade</th>
            <th>Grade Point</th>
          </tr>
        </thead>
        <tbody>
          {results.length > 0 ? (
            results.map((r) => (
              <tr key={r.assignment_id}>
                <td>{r.course}</td>
                <td>{r.score}</td>
                <td>{r.grade}</td>
                <td>{r.grade_point}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="text-end fw-bold">
        GPA: {calculateGPA()} | CGPA: {calculateGPA()} {/* Placeholder */}
      </div>

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
