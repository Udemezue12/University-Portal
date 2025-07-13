
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner } from "react-bootstrap";
import { API_URL } from "../api_route/api";

const ViewAssignments = () => {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/student/assignments`, {
      withCredentials: true,
    })
    .then(res => setAssignments(res.data))
    .catch(err => console.error("Error fetching assignments:", err));
  }, []);

  if (!assignments.length) return <Spinner animation="border" variant="primary" />;

  return (
    <div className="mt-3">
      <h4>Your Assignments</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Course</th>
            <th>Grade</th>
            <th>Submitted On</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.course_title}</td>
              <td>{a.grade || "Pending"}</td>
              <td>{new Date(a.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ViewAssignments;