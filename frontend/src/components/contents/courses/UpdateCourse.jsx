import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Form, Card, Container, Toast, ToastContainer } from "react-bootstrap";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import axios from "axios";
import { fetchFastCsrfToken } from "../../constants/fetchCsrfToken";
import { role } from "../../constants/localStorage";
import { extractErrorMessage } from "../../constants/toastFailed";
import { API_URL } from "../../api_route/api";

export default function UpdateCourse() {
  const { courseId } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    syllabus: null,
  });
  // const [levels, setLevels] = useState([])
  const [levelName, setLevelName] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  // const fetchLevels = async (departmentId) => {
  //   try {
  //     const csrf_token = await fetchFastCsrfToken();
  //     const res = await axios.get(
  //       `${API_URL}/levels/by-department/${departmentId}`,
  //       {
  //         headers: { "X-CSRF-TOKEN": csrf_token },
  //         withCredentials: true,
  //       }
  //     );
  //     setLevels(res.data || []);
  //   } catch {
  //     setToastMsg("Failed to load levels.");
  //     setShowToast(true);
  //     setLevels([]);
  //   }
  // };

  const validateFiles = () => {
    if (formData.syllabus) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(formData.syllabus.type)) {
        setToastMsg("Syllabus must be a PDF or DOCX file.");
        setShowToast(true);
        return false;
      }
    }
    return true;
  };

  const fetchCourse = React.useCallback(async () => {
    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.get(`${API_URL}/courses/`, {
        headers: { "X-CSRF-TOKEN": csrf_token },
        withCredentials: true,
      });
      const course = res.data.find((c) => c.id === Number(courseId));
      if (course) {
        setFormData({
          title: course.title,
          description: course.description,
          syllabus: null,
        });
        setLevelName(course.level?.name || "N/A");
        // fetchLevels(course.department_id);
      } else {
        setToastMsg("Course not found.");
        setShowToast(true);
      }
    } catch (error) {
      setToastMsg("Failed to fetch course details.");
      setShowToast(true);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async () => {
    if (role !== "lecturer") {
      setToastMsg("Only lecturers can update courses.");
      setShowToast(true);
      return;
    }

    if (!validateFiles()) return;

    const data = new FormData();
    data.append("title", formData.title);
    data.append("level_id", formData.level_id);
    data.append("description", formData.description);
    if (formData.syllabus) data.append("syllabus", formData.syllabus);

    try {
      const csrf_token = await fetchFastCsrfToken();
      const res = await axios.put(
        `${API_URL}/courses/${courseId}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );

      setToastMsg(res.data.message || "Course updated successfully.");
    } catch (error) {
      console.error("Error updating course:", error);
      setToastMsg(extractErrorMessage(error, "Failed to update course."));
    } finally {
      setShowToast(true);
    }
  };

  return (
    <Container className="mt-5">
      <Card
        className="p-4 rounded-4 shadow-sm border-0 mx-auto"
        style={{ maxWidth: "600px" }}
      >
        <h4 className="mb-4 text-center fw-bold text-info">Update Course</h4>
        <Form>
          <InputComponent
            label="Course Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
          <InputComponent
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Level (Read-Only)</Form.Label>
            <Form.Control type="text" value={levelName} disabled />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-semibold">
              Upload New Syllabus (optional)
            </Form.Label>
            <Form.Control type="file" name="syllabus" onChange={handleChange} />
          </Form.Group>
          <div className="text-center">
            <ButtonComponent
              type="button"
              onClick={handleSubmit}
              variant="primary"
            >
              Update Course
            </ButtonComponent>
          </div>
        </Form>
      </Card>
      <ToastContainer position="top-center">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="secondary"
        >
          <Toast.Body className="text-white fw-bold text-center">
            {toastMsg}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
}
