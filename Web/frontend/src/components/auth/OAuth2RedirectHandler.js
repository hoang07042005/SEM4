// src/components/auth/OAuth2RedirectHandler.js

import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const OAuth2RedirectHandler = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleRedirect = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const error = params.get("error");

      if (token) {
        try {
          // Store the token
          localStorage.setItem("token", token);
          
          // Get user info with the token
          const response = await axios.get("http://localhost:8080/api/auth/user-info", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Store user info
          localStorage.setItem("email", response.data.email);
          localStorage.setItem("role", response.data.role);
          
          // Redirect based on role
          if (response.data.role === "ADMIN") {
            navigate("/admin-dashboard");
          } else {
            navigate("/dashboard");
          }
        } catch (err) {
          setError("Không thể lấy thông tin người dùng");
          navigate("/login", { state: { error: "Không thể lấy thông tin người dùng" } });
        }
      } else if (error) {
        navigate("/login", { state: { error } });
      } else {
        navigate("/login", { state: { error: "Đăng nhập không thành công" } });
      }
    };

    handleRedirect();
  }, [navigate, location]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div>Đang xử lý đăng nhập...</div>
      )}
    </div>
  );
};

export default OAuth2RedirectHandler;