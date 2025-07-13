import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Toast, ToastContainer } from "react-bootstrap";
import { API_URL } from "../../api_route/api";
import DropButton from "./DropButton";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { extractErrorMessage } from "../../constants/toastFailed";

export default function EnrollmentList() {
  const [enrollments, setEnrollments] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const fetchEnrollments = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/enrollments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setEnrollments(res.data);
    } catch (err) {
      setToastMsg(extractErrorMessage(err, "Failed to load enrollments"));
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  return (
    <Container className="mt-5">
      <h4 className="mb-4 text-center fw-bold text-primary">My Enrollments</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Lecturer</th>
            <th>Department</th>
            <th>Course Title</th>
            <th>Course Description</th>
            <th>Grade Point</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {enrollments.length > 0 ? (
            enrollments.map((enroll, idx) => (
              <tr key={enroll.id}>
                <td>{idx + 1}</td>
                <td>{enroll.course?.lecturer_name || "N/A"}</td>
                <td>{enroll.course?.department_name || "N/A"}</td>
                <td>{enroll.course?.title || "N/A"}</td>
                <td>{enroll.course?.description || "N/A"}</td>
                <td>{enroll.course?.grade_point ?? "N/A"}</td>
                <td>{enroll.status}</td>
                <td>
                  {enroll.status === "pending" ? (
                    <DropButton enrollmentId={enroll.id} />
                  ) : (
                    <em>Cannot drop course</em>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">
                No enrollments found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="danger"
        >
          <Toast.Body className="text-white fw-bold text-center">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
