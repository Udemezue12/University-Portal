// AdminStudentDepartments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner } from "react-bootstrap";
import { fetchFastCsrfToken } from './../../constants/fetchCsrfToken';
import { API_URL } from "../../api_route/api";
const AdminStudentDepartments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDepartments = async () => {
      try {
        const csrf_token = await fetchFastCsrfToken();
        const res = await axios.get(
          `${API_URL}/admin/students/departments`,
          {
            headers: { "X-CSRF-TOKEN": csrf_token },
            withCredentials: true,
          }
        );
        setData(res.data);
      } catch (err) {
        console.error("Error loading student departments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDepartments();
  }, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="mt-3">
      <h4>Students and Their Departments</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Student</th>
            <th>Departments</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.student}</td>
              <td>{item.departments.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminStudentDepartments;
