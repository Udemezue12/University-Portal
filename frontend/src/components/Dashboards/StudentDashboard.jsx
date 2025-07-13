import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import DashboardCard from "../common/Card";


const StudentDashboard = () => {
  return (
    <div
      className="py-5"
      style={{
        background: "linear-gradient(to right, #fef9f8, #e8f0fe)",
        minHeight: "100vh",
      }}
    >
      <Container>
        <h2 className="text-dark fw-bold mb-4 text-center">
          <i className="bi bi-person-fill me-2"></i>Student Dashboard
        </h2>
        <Row className="g-4">
          <Col md={4}>
            <DashboardCard
              title="Enrolled Courses"
              value="6"
              icon="bi-mortarboard-fill"
              bg="#20c997"
              link="/student/courses"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="View Assignments"
              value="14"
              icon="bi-upload"
              bg="#0d6efd"
              link="/student/assignments"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Enroll Course"
              value="A+"
              icon="bi-bar-chart-fill"
              bg="#198754"
              link="/student/department-courses"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Recommend Course"
              value="A+"
              icon="bi-bar-chart-fill"
              bg="#198754"
              link="/course/recommend"
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default StudentDashboard;


