import React from "react";
import { Container } from "react-bootstrap";

import "../home/Home.css"
const Footer = () => {
  return (
    <footer className="footer text-white text-center py-4 mt-auto">
      <Container>
        <small>
          &copy; {new Date().getFullYear()} University of Excellence, Europe. All rights reserved.
        </small>
      </Container>
    </footer>
  );
};

export default Footer;
