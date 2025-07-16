import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import {
  Table,
  Button,
  Container,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { extractErrorMessage } from "../../constants/toastFailed";
import { role } from "../../constants/localStorage";
import EnrollButton from "../enrollments/EnrolButton";
import { API_URL } from "../../api_route/api";

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const csrf_token = await fetchFastCsrfToken();
        const response = await axios.get(`${API_URL}/courses/`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        });

        

        if (Array.isArray(response.data)) {
          setCourses(response.data);
        } else if (Array.isArray(response.data.data)) {
          setCourses(response.data.data);
        } else {
          throw new Error("Invalid response data format, expected an array");
        }
      } catch (error) {
        console.error(error);
        setToastMsg(extractErrorMessage(error, "Failed to fetch courses"));
        setShowToast(true);
      }
    };

    fetchCourses();
  }, []);

  const handleUpdate = (courseId) => {
    navigate(`/courses/update/${courseId}`);
  };

  return (
    <Container className="mt-5">
      <h4 className="text-center mb-4 fw-bold text-primary">All Courses</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Description</th>
            <th>Lecturer</th>
            <th>Department</th>
            <th>Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.length > 0 ? (
            courses.map((course, idx) => (
              <tr key={course.id}>
                <td>{idx + 1}</td>
                <td>{course.title}</td>
                <td>{course.description}</td>
                <td>{course.lecturer_name || "N/A"}</td>
                <td>{course.department_name || "N/A"}</td>
                <td>{course.level_name || "N/A"}</td>
                <td>
                  {role === "lecturer" ? (
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleUpdate(course.id)}
                    >
                      Update
                    </Button>
                  ) : (
                    <EnrollButton courseId={course.id} />
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center">
                No courses available
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
};

export default CourseList;
