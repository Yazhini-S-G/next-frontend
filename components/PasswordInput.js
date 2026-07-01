"use client";

import { useState } from "react";

export default function PasswordInput({ name, placeholder, minLength, required, defaultValue, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <input
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        style={{ width: "100%", paddingRight: "40px" }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute",
          right: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: 0,
          color: "#64748b"
        }}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
