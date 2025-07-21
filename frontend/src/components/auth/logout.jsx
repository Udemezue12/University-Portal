import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Spinner } from "react-bootstrap";
import axios from "axios";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import { API_URL } from "../api_route/api";
import { toast } from "react-toastify";
import "../auth/styles/Login.css";
const LogoutModal = () => {
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setShow(false);
    navigate(-1);
  };

  const handleConfirmLogout = async () => {
    setLoading(true);
    try {
      const csrf_token = await fetchFastCsrfToken();
      await axios.post(
        `${API_URL}/logout`,
        {},
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );

      localStorage.clear();
      sessionStorage.clear();
      toast.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error("Logout failed. Please try again.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop={false}      
      keyboard={false}
      className="modal-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>Confirm Logout</Modal.Title>
      </Modal.Header>
      <Modal.Body>Do you wish to logout?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirmLogout} disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" /> Logging out...
            </>
          ) : (
            "Logout"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LogoutModal;