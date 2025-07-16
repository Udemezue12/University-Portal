import React, { useEffect, useState } from "react";
import axios from "axios";
import { Spinner, Alert, Table, Badge } from "react-bootstrap";
import { API_URL } from "../../api_route/api";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssignments = async () => {
    const csrf_token = await fetchFastCsrfToken()
    try {
      const response = await axios.get(`${API_URL}/student/assignments`, {
        headers:{
            'X-CSRF-TOKEN': csrf_token

        },
        withCredentials: true,
      });
      setAssignments(response.data);
    } catch (err) {
      setError("Failed to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  return (
    <div className="container mt-4">
      <h3 className="mb-4 text-center">📚 My Course Assignments</h3>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div>Loading assignments...</div>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && assignments.length === 0 && (
        <Alert variant="info" className="text-center">
          You have no assignments yet.
        </Alert>
      )}

      {!loading && assignments.length > 0 && (
        <Table striped bordered hover responsive className="shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Course</th>
              <th>Lecturer</th>
              <th>Weight (%)</th>
              <th>Created At</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a, idx) => (
              <tr key={a.id}>
                <td>{idx + 1}</td>
                <td>{a.title}</td>
                <td>{a.course_title}</td>
                <td>{a.lecturer_id}</td>
                <td>{a.weight}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td>
                  {a.submitted ? (
                    <Badge bg="success">Submitted</Badge>
                  ) : (
                    <Badge bg="warning text-dark">Pending</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default StudentAssignments;
