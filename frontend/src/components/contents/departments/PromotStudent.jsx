import React, { useEffect, useState } from "react";
import axios from "axios";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";
export default function PromoteStudents() {
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const csrf_token = await fetchFastCsrfToken();
    const res = await axios.get(`${API_URL}/students`, {
      headers: { "X-CSRF-TOKEN": csrf_token },
      withCredentials: true,
    });
    setStudents(res.data);
  };

  const handlePromote = async (studentId) => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.post(
        `${API_URL}/promote-student/${studentId}`,
        {},
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Promotion failed.");
    }
  };

  return (
    <div className="container mt-4">
      <h4>Promote Students After 2 Sessions</h4>
      {message && <div className="alert alert-info">{message}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Promote</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>
                <ButtonComponent
                  onClick={() => handlePromote(student.id)}
                  label="Promote"
                  className="btn btn-primary"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
