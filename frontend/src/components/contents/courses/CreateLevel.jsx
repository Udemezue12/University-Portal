import React, { useEffect, useState } from "react";
import {
  Container, Card, Form, Toast, ToastContainer, Modal
} from "react-bootstrap";
import axios from "axios";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { role } from "../../constants/localStorage";
import { API_URL } from "../../api_route/api";

export default function CreateLevel() {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ name: "", department_id: "" });
  const [toast, setToast] = useState({ show: false, message: "", variant: "dark" });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const csrf_token = await fetchFastCsrfToken();
        const res = await axios.get(`${API_URL}/departments`, {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        });
        setDepartments(res.data);
      } catch {
        setToast({ show: true, message: "Failed to load departments", variant: "danger" });
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async () => {
    if (role !== "admin") {
      setToast({ show: true, message: "Only admins can create levels.", variant: "danger" });
      return;
    }

    if (!formData.name || !formData.department_id) {
      setToast({ show: true, message: "All fields are required.", variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      const csrf_token = await fetchFastCsrfToken();
      await axios.post(`${API_URL}/school/levels/create`, formData, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      setFormData({ name: "", department_id: "" });
      setShowModal(true);
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.detail || "Failed to create level.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 rounded-4 shadow-sm border-0 mx-auto" style={{ maxWidth: "600px" }}>
        <h4 className="mb-4 text-center fw-bold text-primary">Create Level</h4>
        <Form>
          <InputComponent
            label="Level Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Level 1"
            required
          />

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Select Department</Form.Label>
            <Form.Select
              name="department_id"
              value={formData.department_id}
              onChange={(e) => setFormData((prev) => ({ ...prev, department_id: e.target.value }))}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dpt) => (
                <option key={dpt.id} value={dpt.id}>
                  {dpt.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="text-center">
            <ButtonComponent
              type="button"
              onClick={handleSubmit}
              variant="success"
              disabled={loading || !formData.name || !formData.department_id}
            >
              {loading ? "Creating..." : "Create Level"}
            </ButtonComponent>
          </div>
        </Form>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-success">Success</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">Level created successfully!</Modal.Body>
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
          <Toast.Body className="text-white text-center fw-semibold">
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
