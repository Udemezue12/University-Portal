import React from "react";
import { Card } from "react-bootstrap";
import { Link } from "react-router-dom";

const DashboardCard = ({ title, value, icon, bg, link = "#" }) => {
  return (
    <Link to={link} style={{ textDecoration: "none" }}>
      <Card
        className="shadow rounded-4 text-white h-100"
        style={{
          background: bg,
          transition: "transform 0.3s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center">
          <div className="fs-1 mb-3">
            <i className={`bi ${icon}`}></i>
          </div>
          <h5 className="fw-bold">{title}</h5>
          <h2 className="fw-bold">{value}</h2>
        </Card.Body>
      </Card>
    </Link>
  );
};

export default DashboardCard;
