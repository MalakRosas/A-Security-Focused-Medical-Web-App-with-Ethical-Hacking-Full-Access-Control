import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Setup2FA from "./Setup2FA";
import Verify2FA from "./Verify2FA";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [tempToken, setTempToken] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/login", formData, {
        withCredentials: true,
      });

      const { data } = res.data;

      if (data.qr_code) {
        setTwoFASetup(data);
        setTwoFARequired(true);
      } else if (data.token && !data.user?.role) {
        setTempToken(data.token);
        setTwoFARequired(true);
      } else if (data.user?.role) {
        const role = data.user.role;
        if (role === "Patient") {
          navigate("/patient");
        } else if (role === "Doctor") {
          navigate("/doctor");
        } else if (role === "Admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (twoFARequired) {
    if (twoFASetup) {
      return (
        <Setup2FA
          qrCode={twoFASetup.qr_code}
          user={twoFASetup.user}
          onSuccess={() => window.location.reload()}
          onCancel={() => setTwoFARequired(false)}
        />
      );
    } else if (tempToken) {
      return (
        <Verify2FA
          tempToken={tempToken}
          onSuccess={() => window.location.reload()}
          onCancel={() => setTwoFARequired(false)}
        />
      );
    }
  }

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{ minHeight: "90vh" }}
    >
      <div className="card shadow p-5 w-100" style={{ maxWidth: "700px" }}>
        <h2 className="mb-4 text-center">
          <Shield className="mb-1 me-2" size={32} /> Secure Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              <Mail className="me-1" size={18} /> Email
            </label>
            <input
              name="email"
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              <Lock className="me-1" size={18} /> Password
            </label>
            <div className="input-group">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                className="input-group-text"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ cursor: "pointer" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}{" "}
            <ArrowRight className="ms-2" size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
