import React from "react";
import "./Home.css";
import { Container, Row, Col, Card } from "react-bootstrap";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <Container className="text-center text-white py-5">
          <motion.img
            src="https://picsum.photos/seed/logo/80"
            alt="University Crest"
            className="university-logo mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          <motion.h1
            className="display-4 fw-bold"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
          >
            University of Excellence, Europe
          </motion.h1>
          <motion.p
            className="lead mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            A tradition of knowledge, innovation, and global leadership.
          </motion.p>
        </Container>
      </div>

      <Container className="portal-section py-5">
        <Row className="text-center mb-5">
          <Col>
            <h2 className="fw-bold text-secondary">Access Your Portal</h2>
            <p className="text-muted">
              Select your role to continue to the UniConnect platform
            </p>
          </Col>
        </Row>

        <Row className="justify-content-center g-4">
          <Col md={5}>
            <motion.div
              className="portal-card"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <Card className="shadow-lg h-100">
                <Card.Body>
                  <Card.Title className="fs-4 fw-bold">
                    🎓 Lecturer Portal
                  </Card.Title>
                  <Card.Text className="mb-4 text-muted">
                    Manage your courses, upload materials, and grade student
                    performance.
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link to="/login" className="btn btn-success btn-lg">
                      Login
                    </Link>
                    <Link
                      to="/lecturer/register"
                      className="btn btn-outline-success btn-lg"
                    >
                      Register
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          <Col md={5}>
            <motion.div
              className="portal-card"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            >
              <Card className="shadow-lg h-100">
                <Card.Body>
                  <Card.Title className="fs-4 fw-bold">
                    🧑‍🎓 Student Portal
                  </Card.Title>
                  <Card.Text className="mb-4 text-muted">
                    Enroll in courses, access materials, and track your academic
                    progress.
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <div className="d-grid gap-2">
                      <Link to="/login" className="btn btn-primary btn-lg">
                        Login
                      </Link>
                      <Link
                        to="/student/register"
                        className="btn btn-outline-primary btn-lg"
                      >
                        Register
                      </Link>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>

      <div className="mission-section py-5 bg-light text-dark">
        <Container>
          <Row>
            <Col md={10} className="mx-auto text-center">
              <h3 className="fw-bold text-primary mb-3">Our Mission</h3>
              <p className="fs-5 text-muted">
                Founded in 1962, the University of Excellence in Europe is
                committed to shaping leaders through research, innovation, and a
                strong academic foundation. We partner with institutions
                worldwide to ensure our students thrive in a global academic
                ecosystem.
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* 📌 Noticeboard Banner */}
      <div className="notice-banner bg-warning text-dark py-3">
        <Container className="text-center">
          <strong>📢 Notice:</strong> Course registration closes on{" "}
          <strong>July 30th, 2025</strong>. Exams begin{" "}
          <strong>August 12th</strong>.
        </Container>
      </div>

      {/* 📰 Recent News Section */}
      <div className="news-section py-5 bg-white">
        <Container>
          <h3 className="text-center fw-bold text-secondary mb-4">
            Latest News & Updates
          </h3>
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Img
                  variant="top"
                  src="https://picsum.photos/seed/news1/400/200"
                />
                <Card.Body>
                  <Card.Title className="fw-semibold">
                    Erasmus+ Exchange Program Opens
                  </Card.Title>
                  <Card.Text className="text-muted">
                    Applications for the Fall 2025 Erasmus program are now open.
                    Submit by July 25.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Img
                  variant="top"
                  src="https://picsum.photos/seed/news2/400/200"
                />
                <Card.Body>
                  <Card.Title className="fw-semibold">
                    New AI Research Center Inaugurated
                  </Card.Title>
                  <Card.Text className="text-muted">
                    UOE launches its state-of-the-art AI and Robotics Research
                    Centre in Berlin campus.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="h-100 shadow-sm border-0">
                <Card.Img
                  variant="top"
                  src="https://picsum.photos/seed/news3/400/200"
                />
                <Card.Body>
                  <Card.Title className="fw-semibold">
                    Orientation 2025 Schedule Released
                  </Card.Title>
                  <Card.Text className="text-muted">
                    All freshmen are expected to report for the compulsory
                    orientation program by August 1st.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* <footer className="footer bg-dark text-white text-center py-4">
        <Container>
          <small>
            &copy; {new Date().getFullYear()} University of Excellence, Europe.
            All rights reserved.
          </small>
        </Container>
      </footer> */}
    </div>
  );
};

export default Home;
