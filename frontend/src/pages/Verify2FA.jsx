import { useState } from "react";
import axios from "axios";

export default function Verify2FA({ tempToken, onSuccess, onCancel }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      // Send OTP with temporary token (cookie set by backend during login)
      const res = await axios.post(
        "http://localhost:5000/verify-2FA",
        { token: otp },
        { withCredentials: true }
      );
      if (res.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "OTP verification failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Enter OTP</h2>
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
        placeholder="Enter OTP"
      />
      <button onClick={handleVerify} disabled={loading}>
        {loading ? "Verifying..." : "Verify OTP"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={onCancel} disabled={loading}>Cancel</button>
    </div>
  );
}
