import React, { useState } from "react";
import { Container, Card, Form, Toast, ToastContainer, Modal } from "react-bootstrap";
import axios from "axios";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { role } from "../../constants/localStorage";
import { API_URL } from "../../api_route/api";
export default function CreateFaculty() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", variant: "dark" });
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async () => {
    if (role !== "admin") {
      setToast({ show: true, message: "Only admins can create faculties.", variant: "danger" });
      return;
    }

    if (!name.trim()) {
      setToast({ show: true, message: "Faculty name is required.", variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const csrf_token = await fetchFastCsrfToken();
      await axios.post(`${API_URL}/create/faculty`, { name }, {
        headers: { "X-CSRF-TOKEN": csrf_token  },
        withCredentials: true,
      });
      setShowModal(true);
      setName("");
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.detail || "Failed to create faculty.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 rounded-4 shadow-sm border-0 mx-auto" style={{ maxWidth: "600px" }}>
        <h4 className="mb-4 text-center fw-bold text-success">Create Faculty</h4>
        <Form>
          <InputComponent
            label="Faculty Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Faculty of Science"
            required
          />
          <div className="text-center mt-4">
            <ButtonComponent
              type="button"
              onClick={handleSubmit}
              variant="primary"
              disabled={loading || !name}
            >
              {loading ? "Creating..." : "Create Faculty"}
            </ButtonComponent>
          </div>
        </Form>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-success">Success</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">Faculty created successfully!</Modal.Body>
        <Modal.Footer>
          <ButtonComponent variant="success" onClick={() => setShowModal(false)}>
            Close
          </ButtonComponent>
        </Modal.Footer>
      </Modal>

      <ToastContainer position="top-center" className="mt-3">
        <Toast
          show={toast.show}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Body className="text-white text-center fw-semibold">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
