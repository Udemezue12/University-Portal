
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner } from "react-bootstrap";
import { fetchFastCsrfToken } from './../../constants/fetchCsrfToken';
import { API_URL } from "../../api_route/api";

const AdminStudentAssignments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchAssignments = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/admin/students/assignments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error loading student assignments", err);
    } finally {
      setLoading(false);
    }
  };

  fetchAssignments();
}, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="mt-3">
      <h4>Student Assignment Submissions</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Assignment</th>
            <th>Grade</th>
            <th>Submitted Text</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.student}</td>
              <td>{item.course}</td>
              <td>{item.title}</td>
              <td>{item.grade ?? "Not graded"}</td>
              <td>{item.text_submission || "N/A"}</td>
              <td>
                {item.submission_path ? (
                  <a href={`http://localhost:8000/${item.submission_path}`} target="_blank" rel="noreferrer">View File</a>
                ) : (
                  "N/A"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminStudentAssignments;
