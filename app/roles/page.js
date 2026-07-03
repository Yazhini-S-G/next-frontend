"use client";

import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";

const PERMISSION_GROUPS = {
  "User Management":   ["view_user", "create_user", "edit_user", "delete_user", "manage_roles"],
  "Blog Management":   ["view_blog", "create_blog", "edit_own_blog", "edit_blog", "delete_blog",
                        "delete_own_blog", "submit_for_review", "review_blog", "approve_blog",
                        "publish_blog", "feature_blog", "view_blog_analytics", "upload_blog_image",
                        "save_draft"],
  "Reports":           ["view_reports", "export_reports"],
  "Monitoring":        ["view_activity_logs", "view_sessions"],
};

const GROUP_ICONS = {
  "User Management":  "👤",
  "Blog Management":  "📝",
  "Reports":          "📊",
  "Monitoring":       "🔍",
};

export default function RolesPage() {
  return (
    <RequireAuth permission="manage_roles">
      {() => <Roles />}
    </RequireAuth>
  );
}

function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  async function load() {
    const [nextRoles, nextPerms] = await Promise.all([
      api("/rbac/roles"),
      api("/rbac/permissions"),
    ]);
    // Filter out auto-generated custom roles
    const coreRoles = nextRoles.filter(
      r => !r.role_name.match(/^(User|Admin) Custom \d+$/)
    );
    setRoles(coreRoles);
    setPermissions(nextPerms);

    if (coreRoles.length > 0 && !selectedRoleId) {
      const first = coreRoles[0];
      setSelectedRoleId(first.id);
      setSelectedPerms(
        nextPerms.filter(p => first.permissions.includes(p.permission_name)).map(p => p.id)
      );
    }
  }

  useEffect(() => {
    load().catch(e => setMessage({ text: e.message, type: "error" }));
  }, []);

  function selectRole(role) {
    setSelectedRoleId(role.id);
    setSelectedPerms(
      permissions.filter(p => role.permissions.includes(p.permission_name)).map(p => p.id)
    );
    setMessage({ text: "", type: "" });
  }

  function toggle(permId) {
    setSelectedPerms(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  }

  function selectGroup(groupPerms) {
    const groupIds = permissions.filter(p => groupPerms.includes(p.permission_name)).map(p => p.id);
    const allSelected = groupIds.every(id => selectedPerms.includes(id));
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(id => !groupIds.includes(id)));
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...groupIds])]);
    }
  }

  async function save() {
    if (!selectedRoleId) return;
    setSaving(true);
    setMessage({ text: "", type: "" });
    try {
      await api(`/rbac/roles/${selectedRoleId}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permission_ids: selectedPerms }),
      });
      setMessage({ text: "✅ Permissions saved successfully.", type: "success" });
      await load();
    } catch (err) {
      setMessage({ text: `❌ ${err.message}`, type: "error" });
    } finally {
      setSaving(false);
    }
  }

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Build lookup: permission_name → permission object
  const permByName = useMemo(() => {
    const map = {};
    permissions.forEach(p => { map[p.permission_name] = p; });
    return map;
  }, [permissions]);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <PageHeader
        title="Roles & Permissions"
        description="Select a role and configure its permissions. Changes are saved to the database."
      >
        <button
          className="btn primary"
          onClick={save}
          disabled={!selectedRoleId || saving}
          style={{ minWidth: 150 }}
        >
          {saving ? "Saving..." : "💾 Save Permissions"}
        </button>
      </PageHeader>

      {message.text && (
        <div style={{
          padding: "0.85rem 1.25rem",
          borderRadius: 8,
          marginBottom: "1.25rem",
          background: message.type === "success" ? "#ecfdf5" : "#fef2f2",
          color: message.type === "success" ? "#065f46" : "#991b1b",
          border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecaca"}`,
          fontWeight: 600,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.5rem" }}>

        {/* Role selector (left panel) */}
        <div>
          {roles.map(role => {
            const isSelected = role.id === selectedRoleId;
            const permCount = role.permissions.length;
            return (
              <div
                key={role.id}
                role="button"
                tabIndex={0}
                onClick={() => selectRole(role)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectRole(role);
                  }
                }}
                style={{
                  padding: "1rem 1.25rem",
                  marginBottom: "0.75rem",
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                  background: isSelected ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontWeight: 700, color: isSelected ? "#1d4ed8" : "#0f172a", marginBottom: "0.25rem" }}>
                  {role.role_name}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  {permCount} permission{permCount !== 1 ? "s" : ""}
                </div>
                {role.description && (
                  <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem" }}>
                    {role.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Permission panels (right) */}
        <div>
          {selectedRole ? (
            <>
              <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <h2 style={{ margin: 0 }}>{selectedRole.role_name}</h2>
                <span style={{
                  padding: "0.2rem 0.65rem", borderRadius: 9999,
                  background: "#eff6ff", color: "#3b82f6",
                  fontSize: "0.8rem", fontWeight: 700,
                }}>
                  {selectedPerms.length} selected
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                {Object.entries(PERMISSION_GROUPS).map(([group, permNames]) => {
                  const groupPerms = permNames.map(n => permByName[n]).filter(Boolean);
                  if (groupPerms.length === 0) return null;
                  const groupIds = groupPerms.map(p => p.id);
                  const allChecked = groupIds.every(id => selectedPerms.includes(id));
                  const someChecked = groupIds.some(id => selectedPerms.includes(id));

                  return (
                    <div key={group} className="card" style={{ padding: "1.25rem" }}>
                      {/* Group header with select-all */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                          {GROUP_ICONS[group]} {group}
                        </span>
                        <button
                          className="btn ghost"
                          style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem" }}
                          onClick={() => selectGroup(permNames)}
                        >
                          {allChecked ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      {/* Permission checkboxes */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {groupPerms.map(perm => (
                          <label
                            key={perm.id}
                            className="check"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              cursor: "pointer",
                              padding: "0.35rem 0.5rem",
                              borderRadius: 6,
                              background: selectedPerms.includes(perm.id) ? "#eff6ff" : "transparent",
                              transition: "background 0.1s",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPerms.includes(perm.id)}
                              onChange={() => toggle(perm.id)}
                              style={{ accentColor: "#3b82f6" }}
                            />
                            <span style={{
                              fontSize: "0.83rem",
                              color: selectedPerms.includes(perm.id) ? "#1d4ed8" : "#374151",
                              fontFamily: "monospace",
                            }}>
                              {perm.permission_name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              icon="🛡️"
              description="Select a role from the left panel to manage its permissions."
            />
          )}
        </div>
      </div>
    </div>
  );
}
