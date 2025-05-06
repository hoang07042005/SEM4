import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import UserDashboard from "./components/user/UserDashboard";
import ActivateAccount from "./components/auth/ActivateAccount";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import ChangePassword from "./components/auth/ChangePassword";
import AdminDashboard from "./components/admin/AdminDashboard";
import UserIndex from "./components/admin/user/UserIndex";
import DashboardPage from "./components/admin/DashboardPage";
import AdminPage from "./components/admin/AdminPage";

import "./App.css";
import TourDashboard from "./components/tour/TourDashboard";
import TourDetailDashboard from "./components/tour/TourDetailDashboard ";


const App = () => {  
  const isAuthenticated = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("role");
  
  const ProtectedRoute = ({ element, requiredRole }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    
    if (requiredRole && userRole !== requiredRole) {
      return <Navigate to="/dashboard" />;
    }
    
    return element;
  };

  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<ActivateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute element={<UserDashboard />} />}
        />
        <Route
          path="/tour-dashboard"
          element={<ProtectedRoute element={<TourDashboard />} />}
        />    
        <Route
          path="/tour-dashboard/detail/:tourId"
          element={<ProtectedRoute element={<TourDetailDashboard />} />}
        /> 



        {/* Admin routes */}
        <Route
          path="/admin-dashboard"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />}
        />
        <Route
          path="/user"
          element={<ProtectedRoute element={<UserIndex />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute element={<DashboardPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/user"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        {/* <Route
          path="/admin/user/register"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        /> */}


        {/* Destination */}
        <Route
          path="/admin/destination"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/destination/add"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/destination/detail/:destinationId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/destination/edit/:destinationId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/destination/:destinationId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}       
        />

        {/* Event */}
        <Route
          path="/admin/event"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/event/add"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/event/detail/:eventId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/event/edit/:eventId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/event/:eventId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}       
        />


        {/* Tour */}
        <Route
          path="/admin/tour"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/tour/add"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/tour/detail/:tourId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/tour/edit/:tourId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />
        <Route
          path="/admin/tour/:tourId"
          element={<ProtectedRoute element={<AdminPage />} requiredRole="ADMIN" />}
        />

       
      </Routes>
    </Router>
  );
};

export default App;



