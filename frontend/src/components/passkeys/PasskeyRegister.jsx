
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Button } from "@mui/material";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { RP_ID } from "./../api_route/api";
import { Name } from "./../api_route/api";
import { fetchFastCsrfToken } from "../constants/fetchCsrfToken";
import "./material.css";
import { API_URL } from "./../api_route/api";

const RegisterFingerprint = () => {
  const [deviceFingerprint, setDeviceFingerprint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const userId = localStorage.getItem("userId");
 

  useEffect(() => {
    const loadFingerprintAndCheck = async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const fingerprint = result.visitorId;
        setDeviceFingerprint(fingerprint);
        const csrf_token = await fetchFastCsrfToken();

        const res = await axios.get(`${API_URL}/passkey/devices`, {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        });

        if (res.data.some((cred) => cred.device_fingerprint === fingerprint)) {
          setAlreadyRegistered(true);
        }
      } catch (error) {
        console.error("Error checking existing passkey:", error);
      }
    };

    loadFingerprintAndCheck();
  });

  const registerFingerprint = async () => {
    setIsSubmitting(true);

    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          rp: { name: Name, id: RP_ID },
          user: {
            id: new TextEncoder().encode(userId.toString()),
            name: userId,
            displayName: userId,
          },
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          timeout: 70000,
          attestation: "direct",
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
        },
      });

      const csrf_token = await fetchFastCsrfToken();
      if (!csrf_token) {
        throw new Error("Failed to fetch CSRF token");
      }

      const credentialId = credential.id;
      const attestationObject = credential.response.attestationObject;
      const publicKey = btoa(
        String.fromCharCode(...new Uint8Array(attestationObject))
      );

      console.log("Sending POST with CSRF Token:", csrf_token);
      const response = await axios.post(
        `${API_URL}/register/passkey`,
        {
          credential_id: credentialId,
          public_key: publicKey,
          device_fingerprint: deviceFingerprint,
        },
        {
          headers: {
            "X-CSRF-TOKEN": csrf_token,
          },
          withCredentials: true,
        }
      );

      console.log("Backend response:", response.data);
      alert("Passkey created successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error creating Passkey:", error);
      if (
        error.message === "Failed to fetch CSRF token" ||
        error.message === "Invalid response from CSRF endpoint"
      ) {
        alert("Failed to fetch CSRF token. Please refresh and try again.");
      } else if (error.response && error.response.status === 403) {
        alert("CSRF token error. Please refresh and try again.");
      } else if (
        error.response &&
        error.response.status === 400 &&
        error.response.data
      ) {
        const messages = Object.values(error.response.data).flat().join(" ");
        alert(`Error: ${messages}`);
      } else {
        alert("Passkey creation failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="finger">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 2,
        }}
      >
        <Box sx={{ textAlign: "center", width: "100%", maxWidth: 400 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            Create Passkey
          </Typography>

          {alreadyRegistered ? (
            <Box className="itemBox">
              <Typography color="error">
                You have already created a Passkey
              </Typography>
            </Box>
          ) : (
            <Box className="itemBox" mt={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={registerFingerprint}
                disabled={isSubmitting}
                fullWidth
              >
                {isSubmitting ? "Registering..." : "Register"}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </div>
  );
};

export default RegisterFingerprint;
