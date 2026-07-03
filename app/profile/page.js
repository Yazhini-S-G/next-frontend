"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import RequireAuth from "@/components/RequireAuth";
import PasswordInput from "@/components/PasswordInput";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

export default function ProfilePage() {
  return (
    <RequireAuth>
      {(user) => <Profile user={user} />}
    </RequireAuth>
  );
}

function Profile({ user }) {
  const [message, setMessage] = useState("");

  async function changePassword(event) {
    event.preventDefault();
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: form.get("old_password"),
          new_password: form.get("new_password"),
          confirm_password: form.get("confirm_password"),
        }),
      });
      formElement.reset();
      setMessage("Password changed successfully.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <>
      <PageHeader title="Profile" />
      <section className="grid two-col">
        <div className="card">
          <p><b>Name:</b> {user.name}</p>
          <p><b>Email:</b> {user.email}</p>
          <p><b>Role:</b> {user.roles.join(", ")}</p>
          <p><b>Account Status:</b> {user.is_active ? "Active" : "Inactive"}</p>
        </div>
        <form className="card" onSubmit={changePassword}>
          <h2>Change Password</h2>
          <div className="field"><label htmlFor="old-password">Current Password</label><PasswordInput id="old-password" name="old_password" required /></div>
          <div className="field"><label htmlFor="new-password">New Password</label><PasswordInput id="new-password" name="new_password" minLength={8} required /></div>
          <div className="field"><label htmlFor="confirm-password">Confirm Password</label><PasswordInput id="confirm-password" name="confirm_password" minLength={8} required /></div>
          <div className="error">{message}</div>
          <button className="btn primary" type="submit">Change Password</button>
        </form>
      </section>
    </>
  );
}

Profile.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string).isRequired,
    is_active: PropTypes.bool,
  }).isRequired,
};
