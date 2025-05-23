import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:5000/auth/patient';

function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorUsername: '', dateTime: '', reason: '' });
  const [updateForm, setUpdateForm] = useState({ email: '', phone: '', address: '', oldPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => {
        if (res.status === 401) {
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProfile(data.profile);
          setPrescriptions(data.prescriptions || []);
          fetchAppointments();
        }
      })
      .catch(() => setMessage('Error loading profile'));
  }, []);

  const fetchAppointments = () => {
    fetch(`${BASE_URL}/appointments`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => setMessage('Error loading appointments'));
  };

  const bookAppointment = (e) => {
    e.preventDefault();
    fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message) setMessage(data.message);
        if (data.appointment) {
          setAppointments((prev) => [...prev, data.appointment]);
          setForm({ doctorUsername: '', dateTime: '', reason: '' });
        }
      })
      .catch(() => setMessage('Failed to book appointment'));
  };

  const updateProfile = (e) => {
    e.preventDefault();
    fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateForm),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message || 'Profile updated');
        if (data.message === 'Profile updated successfully') {
          fetch(`${BASE_URL}/profile`, {
            method: 'GET',
            credentials: 'include',
          })
            .then((res) => res.json())
            .then((data) => setProfile(data.profile));
        }
      })
      .catch(() => setMessage('Failed to update profile'));
  };

  const cancelAppointment = (id) => {
    fetch(`${BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      })
      .catch(() => setMessage('Failed to cancel appointment'));
  };

  if (!profile) return <div>Loading...</div>;

  const containerStyle = {
    maxWidth: '800px',
    margin: 'auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  };

  const sectionStyle = {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    marginTop: '10px',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    marginLeft: '10px',
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ textAlign: 'center' }}>Patient Dashboard</h1>

      {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}

      <section style={sectionStyle}>
        <h2>Profile</h2>
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Contact Info:</strong></p>
        <p>Phone: {profile.contactInfo?.phone || '-'}</p>
        <p>Address: {profile.contactInfo?.address || '-'}</p>
      </section>

      <section style={sectionStyle}>
        <h2>Prescriptions</h2>
        {prescriptions.length === 0 ? (
          <p>No prescriptions found.</p>
        ) : (
          <ul>
            {prescriptions.map((pres) => (
              <li key={pres.id}>
                <strong>{pres.medicationName || pres.medication || 'Medication'}</strong> by{' '}
                {pres.doctor?.username || 'Unknown doctor'} - {pres.dosage || ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={sectionStyle}>
        <h2>Book Appointment</h2>
        <form onSubmit={bookAppointment}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Doctor Username"
            value={form.doctorUsername}
            onChange={(e) => setForm({ ...form, doctorUsername: e.target.value })}
            required
          />
          <input
            style={inputStyle}
            type="datetime-local"
            value={form.dateTime}
            onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
            required
          />
          <input
            style={inputStyle}
            type="text"
            placeholder="Reason for appointment"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
          />
          <button type="submit" style={buttonStyle}>Book</button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2>Update Profile</h2>
        <form onSubmit={updateProfile}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Phone"
            value={updateForm.phone}
            onChange={(e) => setUpdateForm({ ...updateForm, phone: e.target.value })}
          />
          <input
            style={inputStyle}
            type="text"
            placeholder="Address"
            value={updateForm.address}
            onChange={(e) => setUpdateForm({ ...updateForm, address: e.target.value })}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Old Password"
            value={updateForm.oldPassword}
            onChange={(e) => setUpdateForm({ ...updateForm, oldPassword: e.target.value })}
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="New Password"
            value={updateForm.newPassword}
            onChange={(e) => setUpdateForm({ ...updateForm, newPassword: e.target.value })}
          />
          <button type="submit" style={buttonStyle}>Update Profile</button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2>My Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments booked.</p>
        ) : (
          <ul>
            {appointments.map((appt) => (
              <li key={appt.id}>
                With Dr. {appt.doctorUsername} on {new Date(appt.dateTime).toLocaleString()} - {appt.reason}
                <button
                  onClick={() => cancelAppointment(appt.id)}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default PatientDashboard;
