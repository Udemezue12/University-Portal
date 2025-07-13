// src/components/student/ViewProfile.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, Spinner } from "react-bootstrap";
import { API_URL } from "../api_route/api";

const ViewProfile = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axios.get(`${API_URL}/student/profile`, {
        withCredentials: true,
      });
      setProfile(res.data);
    };
    fetchProfile();
  }, []);

  if (!profile) return <Spinner animation="border" variant="primary" />;

  return (
    <Card className="shadow p-4 mt-3">
      <h4>Student Profile</h4>
      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Username:</strong> {profile.username}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Role:</strong> {profile.role}</p>
      <p><strong>Joined:</strong> {new Date(profile.created_at).toLocaleString()}</p>
    </Card>
  );
};

export default ViewProfile;








