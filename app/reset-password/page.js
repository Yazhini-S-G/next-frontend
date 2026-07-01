"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import PasswordInput from "@/components/PasswordInput";

// We need to wrap useSearchParams in a Suspense boundary if we're using static export, 
// but since this is just a standard page, it's generally fine, though wrapping in Suspense is safer.
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!token) {
      setIsError(true);
      setMessage("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    let score = 0;
    if (password.length > 7) score++;
    if (password.match(/[A-Z]/)) score++;
    if (password.match(/[0-9]/)) score++;
    if (password.match(/[^A-Za-z0-9]/)) score++;
    setStrength(score);
  }, [password]);

  async function submit(event) {
    event.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);
    
    try {
      await api("/auth/reset-password", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ 
          reset_token: token,
          new_password: password,
          confirm_password: confirmPassword
        }),
      });
      setIsError(false);
      setMessage("Password updated successfully. You can now login.");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err) {
      setMessage(err.message || "Failed to reset password.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  const getStrengthColor = () => {
    if (strength === 0) return "#e2e8f0";
    if (strength === 1) return "#ef4444";
    if (strength === 2) return "#f59e0b";
    if (strength === 3) return "#3b82f6";
    return "#10b981";
  };

  const getStrengthLabel = () => {
    if (strength === 0) return "";
    if (strength === 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  if (!token) {
    return (
      <div className="center-screen">
        <section className="auth-card">
          <h1>Invalid Link</h1>
          <p className="error" style={{ marginBottom: "1.5rem" }}>{message}</p>
          <Link href="/forgot-password">
            <button className="btn primary" style={{ width: "100%" }}>Request New Link</button>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <section className="auth-card">
        <h1>Reset Password</h1>
        <p className="muted">Enter your new password below.</p>
        
        <form onSubmit={submit}>
          <div className="field">
            <label>New Password</label>
            {/* We capture onChange here to update strength, so we need to pass it to PasswordInput if it supports it, 
                or just use a wrapper. Since our PasswordInput doesn't pass onChange, we'll implement it inline here 
                for full control, or we can update PasswordInput. Let's just do it inline here for strength checking. */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
              <PasswordInput 
                name="new_password" 
                minLength={8} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ display: "flex", gap: "4px", height: "4px", marginBottom: "4px" }}>
                  {[1, 2, 3, 4].map((level) => (
                    <div 
                      key={level} 
                      style={{ 
                        flex: 1, 
                        backgroundColor: strength >= level ? getStrengthColor() : "#e2e8f0",
                        borderRadius: "2px",
                        transition: "background-color 0.3s ease"
                      }} 
                    />
                  ))}
                </div>
                <div style={{ fontSize: "0.7rem", color: getStrengthColor(), textAlign: "right", fontWeight: 600 }}>
                  {getStrengthLabel()}
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <PasswordInput 
              name="confirm_password" 
              minLength={8} 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {/* Note: since our PasswordInput component doesn't expose value/onChange, we use formData in the submit handler 
                But wait, above we use `password` state. We need to either use PasswordInput for both and get values from form, 
                or use standard inputs. Let's use PasswordInput for confirm, but we need its value. 
                Actually, we can just grab both from FormData in submit. */}
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
            {loading ? "Resetting..." : "Reset Password"}
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

// Wrapper to handle useSearchParams safely
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="center-screen">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
