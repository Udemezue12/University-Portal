import React, { useEffect, useState } from "react";
import { Container, Table, Spinner, Button, Alert } from "react-bootstrap";
import axios from "axios";
import { exportStudentResultPDF } from "../constants/exportResultSheetPDF";
import { fetchFastCsrfToken } from "./../constants/fetchCsrfToken";
import { API_URL } from "./../api_route/api";

export default function MyResults() {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const MyResults = async () => {
    setLoading(true);
    const csrf_token = await fetchFastCsrfToken();
    try {
      const res = await axios.get(`${API_URL}/student/my-results`, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
        },
        withCredentials: true,
      });

      setResultData(res.data);
    } catch (err) {
      setMessage(
        "An Error Occurred, Failed to load results. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    MyResults();
  }, []);

  return (
    <Container className="mt-4 text-light">
      <h4>My Results</h4>

      {loading && <Spinner animation="border" variant="light" />}
      {message && <Alert variant="danger">{message}</Alert>}

      {resultData && (
        <>
          <p>
            <strong>Name:</strong> {resultData.student_name}
          </p>
          <p>
            <strong>Faculty:</strong> {resultData.faculty}
          </p>
          <p>
            <strong>Department:</strong> {resultData.department}
          </p>
          <p>
            <strong>Level:</strong> {resultData.level}
          </p>
          <p>
            <strong>CGPA:</strong> {resultData.cgpa}
          </p>
          <p>
            <strong>Class of Degree:</strong> {resultData.class_of_degree}
          </p>

          <Table striped bordered hover variant="dark" responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Course Name</th>
                <th>Assignment Score</th>
                <th>Exam Score</th>
                <th>Total</th>
                <th>Letter Grade</th>
              </tr>
            </thead>
            <tbody>
              {resultData.results.map((res, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{res.course_name}</td>
                  <td>{res.assignment_score.toFixed(2)}</td>
                  <td>{res.exam_score.toFixed(2)}</td>
                  <td>{res.total.toFixed(2)}</td>
                  <td>{res.letter_grade}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Button
            variant="secondary"
            onClick={() => exportStudentResultPDF(resultData)}
          >
            Download as PDF
          </Button>
        </>
      )}
    </Container>
  );
}
