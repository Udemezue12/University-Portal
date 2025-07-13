import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import DashboardCard from "../common/Card";

const LecturerDashboard = () => {
  return (
    <div
      className="py-5"
      style={{
        background: "linear-gradient(to right, #e0ecff, #f7faff)",
        minHeight: "100vh",
      }}
    >
      <Container>
        <h2 className="text-dark fw-bold mb-4 text-center">
          <i className="bi bi-person-workspace me-2"></i>Lecturer Dashboard
        </h2>
        <Row className="g-4">
          <Col md={4}>
            <DashboardCard
              title="Create Courses"
              value="5"
              icon="bi-journal-check"
              bg="#6610f2"
              link="/courses/create"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Generate Syllabus"
              value="5"
              icon="bi-journal-check"
              bg="#6610f2"
              link="/gemini/syllabus/generate"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Create Assignment"
              value="5"
              icon="bi-journal-check"
              bg="#6610f2"
              link="/create/assignment"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="All Submitted Assignments"
              value="5"
              icon="bi-journal-check"
              bg="#6610f2"
              link="/all/assignments"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Create Courses"
              value="5"
              icon="bi-journal-check"
              bg="#6610f2"
              link="/courses"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Courses Taught"
              value="5"
              icon="bi-journal-check"
              bg="#6610f2"
              link="/courses"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Assignments Graded"
              value="120"
              icon="bi-pencil-square"
              bg="#6f42c1"
              link="/graded/assignments"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Students"
              value="300+"
              icon="bi-person-lines-fill"
              bg="#fd7e14"
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LecturerDashboard;
