import { useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  UserPlus,
  ArrowRight,
  Shield,
  UserCircle,
  Stethoscope,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRole, setSelectedRole] = useState("Patient");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "Patient",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    setSelectedRole(capitalizedRole);
    setFormData((prev) => ({ ...prev, role: capitalizedRole }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:5000/signup",
        formData,
        { withCredentials: true }
      );
      setSuccess("Account created successfully!");

      if (formData.role === "Admin") navigate("/adminDashboard");
      else if (formData.role === "Doctor") navigate("/doctorDashboard");
      else navigate("/patient");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "An error occurred. Please try again."
      );
      console.error("Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="bg-white rounded shadow-lg w-100" style={{ maxWidth: "500px" }}>
        <div className="bg-primary text-white p-4 d-flex justify-content-between align-items-center">
          <h1 className="h4 fw-bold mb-0">Create Account</h1>
          <Link
            to="/login"
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-2"
          >
            <span>Login</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="px-4 py-4">
          <p className="text-primary mb-4">Fill in your details to get started</p>
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="mb-3">
              <label htmlFor="username" className="form-label fw-medium">
                Username
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <User size={18} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your username"
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-medium">
                Email Address
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-medium">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  className="form-control"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn btn-outline-secondary"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="mb-4">
              <label className="form-label fw-medium">Account Type</label>
              <div className="d-flex gap-2">
                {[
                  { role: "admin", icon: <Shield size={18} />, label: "Admin" },
                  { role: "doctor", icon: <Stethoscope size={18} />, label: "Doctor" },
                  { role: "patient", icon: <UserCircle size={18} />, label: "Patient" },
                ].map(({ role, icon, label }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`flex-grow-1 btn ${
                      selectedRole.toLowerCase() === role
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    } d-flex align-items-center justify-content-center gap-2`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success py-2" role="alert">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
            >
              {isLoading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-4 text-secondary small">
            Already have an account?{" "}
            <Link to="/login" className="text-primary fw-medium text-decoration-none">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
