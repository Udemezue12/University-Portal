import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import DashboardCard from "../common/Card";

const AdminDashboard = () => {
  return (
    <div
      className="py-5"
      style={{
        background: "linear-gradient(to right, #f6f9fc, #dbeafe)",
        minHeight: "100vh",
      }}
    >
      <Container>
        <h2 className="text-primary fw-bold mb-4 text-center">
          <i className="bi bi-speedometer2 me-2"></i>Admin Dashboard
        </h2>
        <Row className="g-4">
          <Col md={4}>
            <DashboardCard
              title="Create Session"
              value="1,208"
              icon="bi-people-fill"
              bg="#4e73df"
              link='/session/create'
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Create Departments"
              value="12"
              icon="bi-building"
              bg="#1cc88a"
              link='/department/create'
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Create Faculty"
              value="87"
              icon="bi-journal-bookmark-fill"
              bg="#36b9cc"
              link="/faculty/create"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Create Levels"
              value="87"
              icon="bi-journal-bookmark-fill"
              bg="#36b9cc"
              link="/levels/create"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Students Enrollments"
              value="87"
              icon="bi-journal-bookmark-fill"
              bg="#36b9cc"
              link="/admin/students/enrollments"
            />
          </Col>
          <Col md={4}>
            <DashboardCard
              title="Assign Lecturer to Departments and Levels"
              value="87"
              icon="bi-journal-bookmark-fill"
              bg="#36b9cc"
              link="/assign/lecturer"
            />
          </Col>
         
          <Col md={4}>
            <DashboardCard
              title="Assign Students to Departments and Levels"
              value="87"
              icon="bi-journal-bookmark-fill"
              bg="#36b9cc"
              link="/assign/student"
            />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;