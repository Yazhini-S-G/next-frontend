"use client";

import { useState } from "react";
import PropTypes from "prop-types";
import Pagination from "./Pagination";
import EmptyState from "./EmptyState";

const ACTION_CONFIG = {
  "Login": { color: "#22c55e", bg: "#f0fdf4", icon: "🔐" },
  "Logout": { color: "#f97316", bg: "#fff7ed", icon: "🚪" },
  "Failed Login": { color: "#ef4444", bg: "#fef2f2", icon: "⛔" },
  "Create Blog": { color: "#3b82f6", bg: "#eff6ff", icon: "✏️" },
  "Update Blog": { color: "#eab308", bg: "#fefce8", icon: "📝" },
  "Delete Blog": { color: "#ef4444", bg: "#fef2f2", icon: "🗑️" },
  "Submit Blog For Review": { color: "#06b6d4", bg: "#ecfeff", icon: "📤" },
  "Publish Blog": { color: "#10b981", bg: "#ecfdf5", icon: "🌐" },
  "Approve Blog": { color: "#10b981", bg: "#ecfdf5", icon: "✅" },
  "Reject Blog": { color: "#ef4444", bg: "#fef2f2", icon: "❌" },
  "Unpublish Blog": { color: "#64748b", bg: "#f8fafc", icon: "📥" },
  "Create User": { color: "#8b5cf6", bg: "#f5f3ff", icon: "👤" },
  "Update User": { color: "#a855f7", bg: "#faf5ff", icon: "✏️" },
  "Delete User": { color: "#dc2626", bg: "#fef2f2", icon: "🗑️" },
  "Create Role": { color: "#0ea5e9", bg: "#f0f9ff", icon: "🛡️" },
  "Update Role": { color: "#0284c7", bg: "#f0f9ff", icon: "✏️" },
  "Modify Permissions": { color: "#f59e0b", bg: "#fffbeb", icon: "🔑" },
  "Password Reset": { color: "#64748b", bg: "#f8fafc", icon: "🔒" },
};

const MODULE_ICONS = {
  "Auth": "🔐",
  "Blog Management": "📝",
  "User Management": "👤",
  "Role Management": "🛡️",
};

function getActionStyle(action) {
  if (ACTION_CONFIG[action]) return ACTION_CONFIG[action];

  for (const [key, value] of Object.entries(ACTION_CONFIG)) {
    if (action.toLowerCase().includes(key.toLowerCase())) return value;
  }

  return { color: "#64748b", bg: "#f8fafc", icon: "📌" };
}

function ActionBadge({ action }) {
  const style = getActionStyle(action);
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "0.25rem 0.65rem",
      borderRadius: 9999,
      fontSize: "0.75rem",
      fontWeight: 700,
      backgroundColor: style.bg,
      color: style.color,
      border: `1px solid ${style.color}30`,
      whiteSpace: "nowrap",
    }}>
      {style.icon} {action}
    </span>
  );
}

ActionBadge.propTypes = {
  action: PropTypes.string.isRequired,
};

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const modIcon = MODULE_ICONS[log.module] || "📌";

  return (
    <>
      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
        <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap", verticalAlign: "top" }}>
          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
            {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {new Date(log.created_at).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </td>

        <td style={{ padding: "0.85rem 1rem", verticalAlign: "top" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{log.username}</div>
          {log.email && <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{log.email}</div>}
        </td>

        <td style={{ padding: "0.85rem 1rem", verticalAlign: "top" }}>
          <span style={{ fontSize: "0.85rem" }}>{modIcon} {log.module}</span>
        </td>

        <td style={{ padding: "0.85rem 1rem", verticalAlign: "top" }}>
          <ActionBadge action={log.action_type} />
        </td>

        <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "#475569", maxWidth: 320, verticalAlign: "top" }}>
          <button
            type="button"
            onClick={() => setExpanded((currentExpanded) => !currentExpanded)}
            style={{
              width: "100%",
              border: 0,
              background: "transparent",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
              color: "inherit",
              font: "inherit",
            }}
          >
            <div style={{
              whiteSpace: expanded ? "normal" : "nowrap",
              overflow: expanded ? "visible" : "hidden",
              textOverflow: "ellipsis",
            }}>
              {log.description}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "0.2rem" }}>
              {expanded ? "▲ collapse" : "▼ expand"}
            </div>
          </button>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
          <td colSpan={5} style={{ padding: "0.75rem 1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", fontSize: "0.82rem" }}>
              <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Log ID:</span> #{log.id}</div>
              <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>User ID:</span> {log.user_id || "—"}</div>
              <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>IP Address:</span> {log.ip_address || "—"}</div>
              <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Status:</span>{" "}
                <span style={{ color: log.status === "Success" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{log.status}</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>Full Description:</span>{" "}
                {log.description}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

LogRow.propTypes = {
  log: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    created_at: PropTypes.string.isRequired,
    username: PropTypes.string,
    email: PropTypes.string,
    module: PropTypes.string,
    action_type: PropTypes.string.isRequired,
    description: PropTypes.string,
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ip_address: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
};

export default function AdminMonitoringTable({ logs, loading, page, pages, onPageChange }) {
  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
        Loading activity logs...
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No activity logs found"
        description="Try clearing your filters, or perform some actions to generate logs."
      />
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f1f5f9", background: "#f8fafc" }}>
              {["Time", "Actor", "Module", "Action", "Description (click to expand)"].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "0.9rem 1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#94a3b8",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => <LogRow key={log.id} log={log} />)}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={pages} onPageChange={onPageChange} />
    </div>
  );
}

AdminMonitoringTable.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })),
  loading: PropTypes.bool.isRequired,
  page: PropTypes.number.isRequired,
  pages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

AdminMonitoringTable.defaultProps = {
  logs: [],
};
