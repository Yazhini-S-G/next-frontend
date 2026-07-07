"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";

function fmt(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "0.2rem 0.6rem", borderRadius: 9999,
      fontSize: "0.75rem", fontWeight: 700,
      backgroundColor: isActive ? "#ecfdf5" : "#f8fafc",
      color: isActive ? "#059669" : "#64748b",
      border: `1px solid ${isActive ? "#a7f3d0" : "#e2e8f0"}`,
    }}>
      {isActive ? "🟢 Active" : "⚫ Ended"}
    </span>
  );
}

StatusBadge.propTypes = {
  isActive: PropTypes.bool.isRequired,
};

function SessionRow({ session }) {
  const sessionKey = `${session.admin_email || session.admin_name || "session"}-${session.login_time || session.logout_time || session.ip_address || "active"}`;

  return (
    <tr key={sessionKey} style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: "0.85rem 1rem" }}>
        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{session.admin_name}</div>
        {session.admin_email && (
          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{session.admin_email}</div>
        )}
      </td>
      <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem" }}>{fmt(session.login_time)}</td>
      <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem" }}>
        {session.logout_time ? fmt(session.logout_time) : <span style={{ color: "#10b981", fontWeight: 600 }}>Still active</span>}
      </td>
      <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem" }}>
        {session.session_duration
          ? <span style={{ fontWeight: 600, color: "#0f172a" }}>{session.session_duration}</span>
          : <span style={{ color: "#10b981" }}>Ongoing</span>}
      </td>
      <td style={{ padding: "0.85rem 1rem" }}>
        <StatusBadge isActive={session.is_active} />
      </td>
      <td style={{ padding: "0.85rem 1rem", fontSize: "0.82rem", color: "#94a3b8" }}>
        {session.ip_address || "—"}
      </td>
    </tr>
  );
}

SessionRow.propTypes = {
  session: PropTypes.shape({
    admin_name: PropTypes.string,
    admin_email: PropTypes.string,
    login_time: PropTypes.string,
    logout_time: PropTypes.string,
    session_duration: PropTypes.string,
    is_active: PropTypes.bool.isRequired,
    ip_address: PropTypes.string,
  }).isRequired,
};

export default function AdminSessionTable({ sessions, loading, page, pages, onPageChange }) {
  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
        Loading sessions...
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <EmptyState
        icon="🪑"
        title="No sessions found"
        description="Sessions are recorded when users log in and out."
      />
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #f1f5f9" }}>
              {["User", "Login Time", "Logout Time", "Duration", "Status", "IP Address"].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "0.9rem 1rem", textAlign: "left",
                    fontSize: "0.75rem", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => <SessionRow key={`${session.admin_email || session.admin_name || "session"}-${session.login_time || session.logout_time || session.ip_address || "active"}`} session={session} />)}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onPageChange={onPageChange} />
    </div>
  );
}

AdminSessionTable.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.shape({
    is_active: PropTypes.bool.isRequired,
  })),
  loading: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

AdminSessionTable.defaultProps = {
  sessions: [],
};
