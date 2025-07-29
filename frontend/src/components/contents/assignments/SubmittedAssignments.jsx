import React, { useEffect, useState } from "react";
import {
  Table,
  Container,
  Button,
  Toast,
  ToastContainer,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { useNavigate } from "react-router-dom";
import { Download } from "react-bootstrap-icons"; // icon
import { API_URL } from "./../../api_route/api";
export default function SubmittedAssignments() {
  const [submissions, setSubmissions] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/lecturer/submitted-assignments`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setSubmissions(res.data);
    } catch (err) {
      setToastMsg("Failed to fetch submitted assignments.");
      setShowToast(true);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <Container className="mt-5">
      <h4 className="text-center text-primary fw-bold">
        Submitted Assignments
      </h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Assignment</th>
            <th>Course</th>
            <th>Student</th>
            <th>Submitted On</th>
            <th>Submission</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {submissions.length > 0 ? (
            submissions.map((s, idx) => (
              <tr key={s.submission_id}>
                <td>{idx + 1}</td>
                <td>{s.assignment_title}</td>
                <td>{s.course_title}</td>
                <td>{s.student_name}</td>
                <td>{new Date(s.submitted_at).toLocaleString()}</td>
                <td>
                  <div>
                    <strong>Text:</strong>
                    <p className="mb-1">
                      {s.text_submission || (
                        <span className="text-muted">None</span>
                      )}
                    </p>
                    {s.submission_path ? (
                      <>
                        <strong>File:</strong>{" "}
                        <a
                          href={`${API_URL}${s.submission_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="me-2"
                        >
                          {s.submission_path.split("/").pop()}
                        </a>
                        <OverlayTrigger
                          overlay={<Tooltip>Download File</Tooltip>}
                        >
                          <a
                            href={`${API_URL}${s.submission_path}`}
                            download
                            className="text-decoration-none"
                          >
                            <Download size={18} />
                          </a>
                        </OverlayTrigger>
                      </>
                    ) : (
                      <span className="text-muted">No file</span>
                    )}
                  </div>
                </td>
                <td>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                      navigate(`/lecturer/grade-assignment/${s.submission_id}`)
                    }
                  >
                    Grade
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                No submissions found.
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
          <Toast.Body className="text-white text-center">{toastMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
