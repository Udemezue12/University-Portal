import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Spinner,
  Table,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import axios from "axios";
import { API_URL } from "../api_route/api";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { exportResultSheetPDF } from "../constants/exportResultSheetPDF";
import StudentRow from "./StudentRow";
import { calculateGrade } from "./StudentRow";

export default function ResultSheet() {
  const [departments, setDepartments] = useState([]);
  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const [deptRes, levelRes, courseRes] = await Promise.all([
        axios.get(`${API_URL}/assigned/departments`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
        axios.get(`${API_URL}/levels`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
        axios.get(`${API_URL}/my/courses`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }),
      ]);

      setDepartments(deptRes.data || []);
      setLevels(levelRes.data || []);
      setCourses(courseRes.data?.data || []);
    } catch (error) {
      setMessage("Failed to fetch initial data.");
    }
  };

  const fetchStudents = async () => {
    
    if (!selectedDepartment || !selectedLevel || !selectedCourse) return;
    setLoading(true);
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(
        `${API_URL}/results/course/${selectedCourse}/level/${selectedLevel}/department/${selectedDepartment}`,
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      
      setStudents(Array.isArray(res.data) ? res.data : []);
      setResults({});
    } catch (error) {
      setMessage("Failed to fetch students.");
    }
    setLoading(false);
  };
  const unsavedStudents = students.filter((s) => !s.has_result);
  const canSubmit =
    unsavedStudents.length > 0 &&
    Object.keys(results).length === unsavedStudents.length;

  const handleScoreChange = (
    studentId,
    examScore,
    assignmentScore,
    total,
    grade
  ) => {
    setResults((prev) => ({
      ...prev,
      [studentId]: {
        student_id: studentId,
        course_id: selectedCourse,
        exam_score: parseFloat(examScore || 0),
        assignment_score: parseFloat(assignmentScore || 0),
        total,
        grade,
      },
    }));
  };

  const handleSubmit = async () => {
    const studentIds = students.map((s) => s.id);
    studentIds.some((id) => !results[id] || results[id].exam_score === 0);

    // if (missingScores) {
    //   setMessage(
    //     "Please enter exam scores for all students before submitting."
    //   );
    //   return;
    // }

    try {
      const csrf_token = await fetchFastCsrfToken();
      const payload = Object.values(results);
      await axios.post(`${API_URL}/results/submit`, payload, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setToastMessage("Results submitted successfully!");
      setShowToast(true);
    } catch (error) {
      setMessage("Failed to submit results.");
    }
  };

  return (
    <Container>
      <h4 className="text-center mt-4 mb-3">📘 Result Sheet Management</h4>

      {message && <div className="alert alert-danger">{message}</div>}

      <Row className="mb-3">
        <Col md={4}>
          <Form.Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="">Select Level</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">Select Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Button onClick={fetchStudents} disabled={loading || !selectedCourse}>
        {loading ? <Spinner size="sm" /> : "Fetch Students"}
      </Button>

      {students.length > 0 && (
        <>
          <Table striped bordered hover responsive className="mt-4 shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Exam Score</th>
                <th>Assignment Score</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <StudentRow
                  key={student.id}
                  student={student}
                  onScoreChange={handleScoreChange}
                />
              ))}
            </tbody>
          </Table>

          <Button
            variant="success"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Submit Results
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              exportResultSheetPDF(
                students.map((student) => {
                  const examScore = results[student.id]?.exam_score || 0;
                  const assignmentScore =
                    results[student.id]?.assignment_score || 0;
                  const total = examScore + assignmentScore;
                  const grade = calculateGrade(total);
                  return {
                    name: student.name,
                    examScore,
                    assignmentScore,
                    total,
                    grade,
                  };
                }),
                departments.find((d) => d.id === selectedDepartment)?.name ||
                  "",
                levels.find((l) => l.id === selectedLevel)?.name || "",
                courses.find((c) => c.id === selectedCourse)?.title || ""
              )
            }
          >
            Export as PDF
          </Button>
        </>
      )}

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          bg="success"
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
