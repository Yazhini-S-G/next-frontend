"use client";

import { useState } from "react";
import PropTypes from "prop-types";

const MODULES = ["Auth", "Blog Management", "User Management", "Role Management"];

const ACTION_TYPES = [
  "Login", "Logout", "Failed Login",
  "Create Blog", "Update Blog", "Delete Blog", "Approve Blog", "Reject Blog", "Publish Blog",
  "Create User", "Update User", "Delete User",
  "Create Role", "Update Role", "Modify Permissions",
  "Password Reset",
];

export default function ActivityFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    admin_name: "",
    admin_email: "",
    action_type: "",
    module: "",
    date: "",
  });

  const handleChange = (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const setQuickFilter = (moduleName) => {
    const newFilters = { ...filters, module: moduleName, action_type: "" };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const cleared = { admin_name: "", admin_email: "", action_type: "", module: "", date: "" };
    setFilters(cleared);
    onFilter(cleared);
  };

  const hasActiveFilter = Object.values(filters).some(Boolean);

  return (
    <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0 }}>🔍 Filters</h3>
        {hasActiveFilter && (
          <button className="btn ghost" style={{ fontSize: "0.8rem" }} onClick={clearFilters}>
            ✕ Clear All
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <label htmlFor="filter-admin-name" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
            User Name
          </label>
          <input
            id="filter-admin-name"
            type="text"
            name="admin_name"
            value={filters.admin_name}
            onChange={handleChange}
            className="input"
            placeholder="e.g. John"
          />
        </div>

        <div>
          <label htmlFor="filter-admin-email" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
            Email
          </label>
          <input
            id="filter-admin-email"
            type="text"
            name="admin_email"
            value={filters.admin_email}
            onChange={handleChange}
            className="input"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label htmlFor="filter-module" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
            Module
          </label>
          <select id="filter-module" name="module" value={filters.module} onChange={handleChange} className="input">
            <option value="">All Modules</option>
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filter-action-type" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
            Action Type
          </label>
          <select id="filter-action-type" name="action_type" value={filters.action_type} onChange={handleChange} className="input">
            <option value="">All Actions</option>
            {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="filter-date" style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.8rem", fontWeight: 600, color: "#64748b" }}>
            Date
          </label>
          <input
            id="filter-date"
            type="date"
            name="date"
            value={filters.date}
            onChange={handleChange}
            className="input"
          />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#64748b" }}>Quick:</span>
        {MODULES.map(m => (
          <button
            key={m}
            className="btn outline"
            style={{
              fontSize: "0.78rem",
              padding: "0.25rem 0.65rem",
              background: filters.module === m ? "#0ea5e9" : undefined,
              color: filters.module === m ? "#fff" : undefined,
              borderColor: filters.module === m ? "#0ea5e9" : undefined,
            }}
            onClick={() => setQuickFilter(filters.module === m ? "" : m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

ActivityFilters.propTypes = {
  onFilter: PropTypes.func.isRequired,
};
