// AdminLecturerDepartments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner } from "react-bootstrap";
import { fetchFastCsrfToken } from './../../constants/fetchCsrfToken';
import { API_URL } from "../../api_route/api";
const AdminLecturerDepartments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchLecturerDepartments = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/admin/lecturers/departments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error loading lecturer departments", err);
    } finally {
      setLoading(false);
    }
  };

  fetchLecturerDepartments();
}, []);


  if (loading) return <Spinner animation="border" />;

  return (
    <div className="mt-3">
      <h4>Lecturers and Their Departments</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Lecturer</th>
            <th>Departments</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.lecturer}</td>
              <td>{item.departments.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminLecturerDepartments;
