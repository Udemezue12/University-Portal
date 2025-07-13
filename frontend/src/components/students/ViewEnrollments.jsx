import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Spinner, Row, Col } from "react-bootstrap";
import { API_URL } from "../api_route/api";

const ViewEnrolledCourses = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/student/enrolled-courses`, {
        withCredentials: true,
      })
      .then((res) => setCourses(res.data))
      .catch((err) => console.error("Failed to load enrolled courses", err));
  }, []);

  if (!courses.length) return <Spinner animation="border" variant="primary" />;

  return (
    <Row className="mt-4">
      {courses.map((course) => (
        <Col md={6} lg={4} key={course.id} className="mb-4">
          <Card className="shadow h-100">
            <Card.Body>
              <Card.Title>{course.title}</Card.Title>
              <Card.Text>
                <strong>Description:</strong> {course.description}
                <br />
                <strong>Lecturer:</strong> {course.lecturer_name}
                <br />
                <strong>Department:</strong> {course.department_name}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ViewEnrolledCourses;
