import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { FaKey } from "react-icons/fa";
import { FiLogOut, FiArrowLeft } from "react-icons/fi";
import "./Navbar.css";
import { role } from "../constants/localStorage";
const getBackLink = () => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "lecturer") return "/lecturer/dashboard";
  if (role === "student") return "/student/dashboard";
  return "/logout";
};

const UniversityNavbar = () => {
  const location = useLocation();
  const navStyle = (path) => ({
    color: location.pathname === path ? "#0d6efd" : "#fff",
    textDecoration: "none",
    marginRight: "1rem",
    display: "flex",
    alignItems: "center",
    fontSize: "1.5rem",
  });

  return (
    <Navbar expand="lg" className="university-navbar py-2" variant="dark">
      <Container className="justify-content-between">
        <Navbar.Brand as={Link} to="/" className="disabled-link">
          <img
            src="https://picsum.photos/seed/logo/40"
            alt="Logo"
            className="navbar-logo disabled-link"
          />
        </Navbar.Brand>

        <Nav className="ms-auto d-flex flex-row align-items-center gap-4">
          <Nav.Link
            as={Link}
            to={getBackLink()}
            style={navStyle(getBackLink())}
          >
            <FiArrowLeft className="me-1" title="Back" />
          </Nav.Link>

          <Nav.Link
            as={Link}
            to="/passkey/register"
            style={navStyle("/passkey/register")}
          >
            <FaKey title="create Passkey" />
          </Nav.Link>

          {/* <Nav.Link as={Link} to="/profile" style={navStyle("/profile")}>
            <FaUserCircle title="Profile" />
          </Nav.Link> */}
          <Nav.Link as={Link} to="/logout" style={navStyle("/logout")}>
            <FiLogOut title="Logout" />
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default UniversityNavbar;
