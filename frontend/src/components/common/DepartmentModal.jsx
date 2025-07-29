import React from "react";
import { Modal } from "react-bootstrap";
import ButtonComponent from "./ButtonComponent";
import { handleAutoLogout } from "./../auth/handleLogout";
import { useNavigate } from "react-router-dom";

const DepartmentCheckModal = ({ show, onContinue }) => {
  const navigate = useNavigate();
  const onLogout = () => {
    handleAutoLogout(navigate);
  };

  return (
    <Modal show={show} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Notice</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-danger fw-bold">
          You have not been assigned to any department...Contact the Admin
        </p>
        <p>Do you wish to continue?</p>
      </Modal.Body>
      <Modal.Footer>
        <ButtonComponent
          variant="secondary"
          onClick={onLogout}
          className="me-2"
        >
          No (Logout)
        </ButtonComponent>

        <ButtonComponent variant="primary" onClick={onContinue}>
          Yes (Continue)
        </ButtonComponent>
      </Modal.Footer>
    </Modal>
  );
};

export default DepartmentCheckModal;
