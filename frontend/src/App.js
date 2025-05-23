import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/LoginPage";        
import Setup2FA from "./pages/Setup2FA";    
import Verify2FA from "./pages/Verify2FA";  
import PatientDashboard from "./pages/PatientDashboard";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />
        <Route path="/patient" element={<PatientDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
