import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner } from "react-bootstrap";
import { role } from "./../../constants/localStorage";
import ApproveButton from "./ApproveButton";
import DeclineButton from "./DeclineButton";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";
const AdminEnrollmentView = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/admin/enrollments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setEnrollments(res.data);
    } catch (err) {
      console.error("Error loading enrollments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  if (loading) return <Spinner animation="border" />;

  return (
    <div className="mt-3">
      <h4>All Student Enrollments</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Lecturer</th>
            <th>Department</th>
            <th>Status</th>
            {role === "admin" && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {enrollments.map((enroll) => (
            <tr key={enroll.id}>
              <td>{enroll.student_name}</td>
              <td>{enroll.course_title}</td>
              <td>{enroll.lecturer_name}</td>
              <td>{enroll.department_name}</td>
              <td>{enroll.status}</td>
              {enroll.status === "pending" && role === "admin" && (
                <td>
                  <ApproveButton
                    enrollmentId={enroll.id}
                    onSuccess={fetchEnrollments}
                  />
                  <DeclineButton
                    enrollmentId={enroll.id}
                    onSuccess={fetchEnrollments}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminEnrollmentView;
