import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash, FaFacebook, FaGoogle } from "react-icons/fa";
import '../css/Login.css';
export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function validatePassword(password) {
    if (password.length < 8) {
      return "password must be at least 8 characters";
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9\s]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
      return "Password must contain at least one uppercase letter, lowercase letter, number, and special character.";
    }

    return null;
  }

  async function register(ev) {
    ev.preventDefault();
    const validation = validatePassword(password);
    if (validation) {
      alert(validation);
      return;
    }
    //https://comp1682be.onrender.com
    const response = await fetch('https://comp1682be.onrender.com/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, role }), // Bao gồm trường role trong dữ liệu gửi đi
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 200) {
      alert('registration successful');
    } else if (response.status === 400) {
      alert('Email is already in use');
    } else {
      alert('registration failed');
    }
  }
  return (
    <div className="login-page">
      <div className="login-page-background"></div>
      <div className="form-container">
        <form className="register" onSubmit={register}>
          <h1>Register</h1>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={ev => setEmail(ev.target.value)} />
          <input
            type="text"
            placeholder="User Name"
            value={username}
            onChange={ev => setUserName(ev.target.value)} />
          <select
            className="select-container"
            type="text"
            placeholder="Role"
            value={role}
            onChange={ev => setRole(ev.target.value)}>
              <option value="">Select role</option>
                        <option value="Admin">Admin</option>
                        <option value="Blogger">Blogger</option>
                        <option value="Guest">Guest</option>
          </select>
          <div className="password-input-container" style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create password"
              value={password}
              onChange={ev => setPassword(ev.target.value)}
            />
            <span
              className="toggle-password custom-span-style"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {validatePassword(password) && (
            <p className="validation-error">{validatePassword(password)}</p>
          )}
          <button className="custom-button">Register</button>
          <p>Already have an account? <Link to="/Login">Login</Link></p>
          {/* <div className="alternative-login-options">
            <p>Or</p>
            <button className="facebook-custom"><FaFacebook /></button>
            <button className="google-custom"><FaGoogle /></button>
          </div> */}
        </form>
      </div>
    </div>
  );
}
