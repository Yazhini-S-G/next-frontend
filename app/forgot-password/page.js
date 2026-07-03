"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setLoading(true);
    setMessage("");
    setIsError(false);
    
    const form = new FormData(formElement);
    try {
      const result = await api("/auth/forgot-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email: form.get("email") }),
      });
      setMessage(result.message || "If your email is registered, a password reset link has been sent.");
      formElement?.reset();
    } catch (err) {
      setMessage(err.message || "An error occurred. Please try again later.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <section className="auth-card">
        <h1>Forgot Password</h1>
        <p className="muted">Enter your email address and we will send you a link to reset your password.</p>
        
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" name="email" type="email" required />
          </div>
          
          {message && (
            <div className={isError ? "error" : ""} style={{ 
              color: isError ? "#ef4444" : "#10b981", 
              marginBottom: "1rem", 
              fontSize: "0.85rem",
              fontWeight: 600,
              padding: "0.5rem",
              backgroundColor: isError ? "#fef2f2" : "#ecfdf5",
              borderRadius: "4px"
            }}>
              {message}
            </div>
          )}
          
          <button className="btn primary" disabled={loading} type="submit" style={{ width: "100%", marginBottom: "1rem" }}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/" style={{ fontSize: "0.85rem", color: "#64748b", textDecoration: "none" }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
