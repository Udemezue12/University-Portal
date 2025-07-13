import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";

import { role } from "./../constants/localStorage";

const ErrorPage = ({ code = 404, message = "Page Not Found" }) => {
  const navigate = useNavigate();
  const errorImg = "https://picsum.photos/seed/error/400/300";

  const getBackLink = () => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "lecturer") return "/lecturer/dashboard";
    if (role === "student") return "/student/dashboard";
    return "/logout";
  };

  const handleGoBack = () => {
    navigate(getBackLink(), { replace: true });
  };

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center text-center vh-100">
      <img
        src={errorImg}
        alt="Error Illustration"
        className="img-fluid mb-4"
        style={{ maxWidth: "300px" }}
      />
      <h1 className="display-4 fw-bold text-danger mb-2">{code}</h1>
      <p className="lead mb-4">{message}</p>
      <Button
        variant="primary"
        className="rounded-pill px-4"
        onClick={handleGoBack}
      >
        Go Back
      </Button>
    </div>
  );
};

export default ErrorPage;
