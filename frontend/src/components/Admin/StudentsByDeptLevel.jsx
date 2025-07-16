import React, { useEffect, useState } from "react";
import { Accordion, Spinner, Container, Table } from "react-bootstrap";
import axios from "axios";
import { fetchFastCsrfToken } from './../constants/fetchCsrfToken';
import { API_URL } from './../api_route/api';

export default function StudentsByDeptLevel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
    const fetchStudentDepartments = async () => {
      setLoading(true);
      const csrf_token = await fetchFastCsrfToken();
      try {
        const res = await axios.get(`${API_URL}/admin/students-by-department-level`, {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        });
  
        setData(res.data)
      } catch (err) {
        setMessage("An Error Occurred");
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchStudentDepartments()
  }, []);

  return (
    <Container className="mt-4">
        {message && <div className="alert alert-info">{message}</div>}
      <h4>Students by Department & Level</h4>
      {loading ? (
        <Spinner />
      ) : (
        <Accordion defaultActiveKey="0" alwaysOpen>
          {data.map((dept, deptIdx) => (
            <Accordion.Item
              eventKey={String(deptIdx)}
              key={dept.department_name}
            >
              <Accordion.Header>{dept.department_name}</Accordion.Header>
              <Accordion.Body>
                <Accordion>
                  {dept.levels.map((level, lvlIdx) => (
                    <Accordion.Item
                      eventKey={String(`${deptIdx}-${lvlIdx}`)}
                      key={level.level_name}
                    >
                      <Accordion.Header>{level.level_name}</Accordion.Header>
                      <Accordion.Body>
                        <Table striped bordered hover variant="dark" responsive>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Department</th>
                              <th>Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {level.students.map((student, idx) => (
                              <tr key={student.id}>
                                <td>{idx + 1}</td>
                                <td>{student.name}</td>
                                <td>{student.email}</td>
                                <td>{student.department}</td>
                                <td>{student.level}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
}
