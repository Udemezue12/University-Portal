import React, { useEffect, useState } from "react";
import { Container, Table, Spinner } from "react-bootstrap";
import axios from "axios";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { API_URL } from "../api_route/api";

export default function LecturersList() {
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLecturers = async () => {
    setLoading(true);
    const csrf_token = await fetchFastCsrfToken();
    try {
      const res = await axios.get(`${API_URL}/admin/lecturers`, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
        },
        withCredentials: true,
      });

      setLecturers(res.data);
    } catch (err) {
      setMessage("An Error Occurred");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLecturers();
  }, []);

  return (
    <Container className="mt-4">
      {message && <div className="alert alert-info">{message}</div>}
      <h4>Lecturers List</h4>
      {loading ? (
        <Spinner />
      ) : (
        <Table striped bordered hover variant="dark" responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {lecturers.map((lecturer, idx) => (
              <tr key={lecturer.id}>
                <td>{idx + 1}</td>
                <td>{lecturer.name}</td>
                <td>{lecturer.email}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
