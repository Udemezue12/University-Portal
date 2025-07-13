import React, { useState, useEffect } from "react";
import { Form, Container, Card, Row, Col, Alert } from "react-bootstrap";
import ButtonComponent from "../../common/ButtonComponent";
import SelectComponent from "../../common/SelectComponent";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { API_URL } from "../../api_route/api";
const CreateAssignmentForm = () => {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    weight: "",
  });
  const [message, setMessage] = useState({ type: "", content: "" });

  useEffect(() => {
    const fetchCourses = async () => {
      const csrf_token = await fetchFastCsrfToken();
      try {
        const response = await axios.get(`${API_URL}/my/courses`, {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        });
        const courseOptions = response.data.data.map((course) => ({
          value: course.id,
          label: `${course.title})`,
        }));
        setCourses(courseOptions);
      } catch (error) {
        console.error("Error fetching courses:", error);
        setMessage({ type: "danger", content: "Failed to load courses." });
      }
    };

    fetchCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const csrf_token = await fetchFastCsrfToken();

    try {
      const payload = {
        course_id: parseInt(formData.course_id),
        title: formData.title.trim(),
        description: formData.description.trim(),
        weight: parseFloat(formData.weight),
      };

      const res = await axios.post(`${API_URL}/assignment/create`, payload, {
        headers: {
          "X-CSRF-TOKEN": csrf_token,
        },
        withCredentials: true,
      });
      setMessage({ type: "success", content: res.data.message });

      setFormData({
        course_id: "",
        title: "",
        description: "",
        weight: "",
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail || "Failed to create assignment.";
      setMessage({ type: "danger", content: errorMsg });
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="p-4 shadow-sm border-0 rounded-4">
            <h4 className="mb-4 fw-bold text-center text-primary">
              Create Assignment
            </h4>

            {message.content && (
              <Alert variant={message.type}>{message.content}</Alert>
            )}

            <Form>
              <SelectComponent
                name="course_id"
                value={formData.course_id}
                onChange={handleChange}
                label="Course"
                required
                options={courses}
              />

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Final Project"
                  className="rounded-3 shadow-sm"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Write assignment details here..."
                  className="rounded-3 shadow-sm"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Weight (%)</Form.Label>
                <Form.Control
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g., 30"
                  className="rounded-3 shadow-sm"
                  required
                  min={1}
                  max={100}
                />
              </Form.Group>

              <div className="d-grid">
                <ButtonComponent onClick={handleSubmit}>
                  Create Assignment
                </ButtonComponent>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateAssignmentForm;
