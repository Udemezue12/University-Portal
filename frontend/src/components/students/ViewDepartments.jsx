import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner,Alert } from "react-bootstrap";
import EnrollButton from "../contents/enrollments/EnrolButton";
import { role } from "../constants/localStorage";
import { API_URL } from "../api_route/api";

const ViewDepartmentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/my/department/courses`, {
        withCredentials: true,
      })
      .then((res) => {
       
        setCourses(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading department courses", err);
        setError("Failed to load courses");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-4">
        <Spinner animation="border" variant="primary" />
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!Array.isArray(courses) || courses.length === 0) {
    return <Alert variant="warning">No courses found in your department.</Alert>;
  }

  return (
    <div className="mt-3">
      <h4>Courses Offered by Your Department</h4>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>CREDIT UNIT</th>
            <th>Lecturer</th>
            <th>Department</th>
            {role === "student" && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td>{course.title}</td>
              <td>{course.description}</td>
              <td>{course.grade_point}</td>
              <td>{course.lecturer_name}</td>
              <td>{course.department_name}</td>
              {role === "student" && (
                <td>
                  <EnrollButton courseId={course.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ViewDepartmentCourses;
