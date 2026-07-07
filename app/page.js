"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";
import { api, getToken, setToken } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    api("/rbac/me")
      .then(() => router.push("/dashboard"))
      .catch(() => {});
  }, [router]);

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const tokens = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      setToken(tokens.access_token);
      await api("/rbac/me");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      confirm_password: form.get("confirm_password"),
    };
    if (payload.password !== payload.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });
      setMode("login");
      setError("Registration successful. Sign in to continue.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <section className="auth-card">
        <h1>RBAC Studio</h1>
        <p className="muted">Sign in to manage users, roles, reports, and blogs.</p>
        <div className="tabs">
          <button className={mode === "login" ? "tab active" : "tab"} type="button" onClick={() => setMode("login")}>Login</button>
          <button className={mode === "register" ? "tab active" : "tab"} type="button" onClick={() => setMode("register")}>Register</button>
        </div>
        {mode === "login" ? (
          <form onSubmit={submitLogin}>
            <div className="field"><label htmlFor="login-email">Email</label><input id="login-email" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="login-password">Password</label><PasswordInput id="login-password" name="password" required /></div>
            <div className="error">{error}</div>
            <button className="btn primary" disabled={loading} type="submit">{loading ? "Signing in..." : "Login"}</button>
            <div style={{ textAlign: "right", marginTop: "0.5rem" }}>
              <Link href="/forgot-password" style={{ fontSize: "0.85rem" }}>Forgot Password?</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={submitRegister}>
            <div className="field"><label htmlFor="register-name">Full Name</label><input id="register-name" name="name" required /></div>
            <div className="field"><label htmlFor="register-email">Email</label><input id="register-email" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="register-password">Password</label><PasswordInput id="register-password" name="password" minLength={8} required /></div>
            <div className="field"><label htmlFor="register-confirm-password">Confirm Password</label><PasswordInput id="register-confirm-password" name="confirm_password" minLength={8} required /></div>
            <div className="error">{error}</div>
            <button className="btn primary" disabled={loading} type="submit">{loading ? "Creating..." : "Register"}</button>
          </form>
        )}
      </section>
    </div>
  );
}
