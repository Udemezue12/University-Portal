import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Card,
  Form,
  Modal,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { role } from "../../constants/localStorage";
import { API_URL } from "../../api_route/api";

const CreateDepartment = () => {
  const [sessions, setSessions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    session_id: "",
    faculty_id: "",
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "dark",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      const csrf_token = await fetchFastCsrfToken();
      try {
        const [sessionsRes, facultiesRes] = await Promise.all([
      
        axios.get(`${API_URL}/school/`, {
            headers: { "X-CSRF-TOKEN": csrf_token },
            withCredentials: true,
        }),
          axios.get(`${API_URL}/faculties`, {
            headers: { "X-CSRF-TOKEN": csrf_token },
            withCredentials: true,
          }),
        ]);
        const sessionList = sessionsRes.data || [];
        const facultyList = facultiesRes.data || [];

        setSessions(sessionList);
        setFaculties(facultyList);

        const activeSession = sessionList.find((s) => s.is_active);
        if (activeSession) {
          setFormData((prev) => ({
            ...prev,
            session_id: activeSession.id.toString(),
          }));
        }
      } catch {
        setToast({
          show: true,
          message: "Failed to load sessions or faculties",
          variant: "danger",
        });
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (role !== "admin") {
      setToast({
        show: true,
        message: "Only admins can create departments.",
        variant: "danger",
      });
      return;
    }

   
    if (!formData.name.trim()) {
      setToast({
        show: true,
        message: "Department name is required.",
        variant: "warning",
      });
      return;
    }

    if (!formData.session_id || isNaN(parseInt(formData.session_id))) {
      setToast({
        show: true,
        message: "Please select a valid session.",
        variant: "warning",
      });
      return;
    }

    if (!formData.faculty_id || isNaN(parseInt(formData.faculty_id))) {
      setToast({
        show: true,
        message: "Please select a valid faculty.",
        variant: "warning",
      });
      return;
    }

    setLoading(true);

    try {
      const csrf_token = await fetchFastCsrfToken();

      const payload = {
        name: formData.name.trim(),
        session_id: parseInt(formData.session_id),
        faculty_id: parseInt(formData.faculty_id),
      };

      await axios.post(
        `${API_URL}/departments/create`,
        payload,
        {
          headers: { "X-CSRF-TOKEN": csrf_token },
          withCredentials: true,
        }
      );

      setToast({ show: false });
      setShowModal(true);
    } catch (err) {
      const error = err.response?.data?.detail;

      if (Array.isArray(error)) {
        
        setToast({
          show: true,
          message: `${error[0].loc[1]}: ${error[0].msg}`,
          variant: "danger",
        });
      } else {
        setToast({
          show: true,
          message: error || "Failed to create department.",
          variant: "danger",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const redirectToDepartments = () => {
    setShowModal(false);
    navigate("/departments");
  };

  return (
    <Container className="mt-5">
      <Card className="p-4 rounded-4 shadow-sm border-0 mx-auto" style={{ maxWidth: "600px" }}>
        <h4 className="mb-4 text-center fw-bold text-success">Create Department</h4>
        <Form>
          <InputComponent
            label="Department Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Computer Science"
            required
          />

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Faculty</Form.Label>
            <Form.Select
              name="faculty_id"
              value={formData.faculty_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">Academic Session</Form.Label>
            <Form.Select
              name="session_id"
              value={formData.session_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Session</option>
              {sessions.map(({ id, name, start_date, end_date }) => (
                <option key={id} value={id}>
                  {name} ({start_date} - {end_date})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <div className="text-center">
            <ButtonComponent
              type="button"
              onClick={handleSubmit}
              variant="primary"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Department"}
            </ButtonComponent>
          </div>
        </Form>
      </Card>

      <Modal show={showModal} onHide={redirectToDepartments} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-success">Success</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">Department created successfully!</Modal.Body>
        <Modal.Footer>
          <ButtonComponent variant="success" onClick={redirectToDepartments}>
            Go to Departments
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
};

export default CreateDepartment;
