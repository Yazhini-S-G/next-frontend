"use client";

import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import PasswordInput from "@/components/PasswordInput";
import { api, hasPermission } from "@/lib/api";

export default function UsersPage() {
  return (
    <RequireAuth permission="view_user">
      {(currentUser) => <Users currentUser={currentUser} />}
    </RequireAuth>
  );
}

function Users({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const canManageRoles = hasPermission(currentUser, "manage_roles");

  async function load() {
    const nextUsers = await api("/rbac/users");
    setUsers(nextUsers);
    if (canManageRoles) {
      const [nextRoles, nextPermissions] = await Promise.all([api("/rbac/roles"), api("/rbac/permissions")]);
      setRoles(nextRoles);
      setPermissions(nextPermissions);
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function removeUser(id) {
    if (!confirm("Delete this user?")) return;
    await api(`/rbac/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>User Management</h1>
          <p className="muted">Create users, assign roles, grant permissions, and control account status.</p>
        </div>
        {hasPermission(currentUser, "create_user") && <button className="btn primary" onClick={() => setEditing({})}>Create User</button>}
      </div>
      {error && <div className="empty-state">{error}</div>}
      <div className="table-card">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.roles.filter(role => !role.match(/^(User|Admin) Custom \d+$/)).map((role) => <span className="role-badge" key={role}>{role}</span>)}</td>
                <td><span className={user.is_active ? "badge success" : "badge danger"}>{user.is_active ? "Active" : "Inactive"}</span></td>
                <td className="actions">
                  {hasPermission(currentUser, "edit_user") && <button className="btn" onClick={() => setEditing(user)}>Edit</button>}
                  {hasPermission(currentUser, "delete_user") && user.id !== currentUser.id && <button className="btn danger" onClick={() => removeUser(user.id)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <UserModal
          user={editing}
          roles={roles}
          permissions={permissions}
          canManageRoles={canManageRoles}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}
    </>
  );
}

function UserModal({ user, roles, permissions, canManageRoles, onClose, onSaved }) {
  const [selectedRoles, setSelectedRoles] = useState(() => roles.filter((role) => user.roles?.includes(role.role_name)).map((role) => role.id));
  const [selectedPermissions, setSelectedPermissions] = useState(() => permissions.filter((permission) => user.permissions?.includes(permission.permission_name)).map((permission) => permission.id));
  const [error, setError] = useState("");
  const isEdit = Boolean(user.id);

  const grouped = useMemo(() => {
    return permissions.reduce((acc, permission) => {
      const group = permission.permission_name.includes("blog") ? "Blogs"
        : permission.permission_name.includes("user") ? "User Management"
          : permission.permission_name.includes("report") || permission.permission_name.includes("analytics") ? "Reports and Analytics"
            : permission.permission_name.includes("article") || permission.permission_name.includes("comment") ? "CMS"
              : permission.permission_name.includes("product") || permission.permission_name.includes("inventory") || permission.permission_name.includes("refund") || permission.permission_name.includes("discount") ? "Store"
                : permission.permission_name.includes("audit") || permission.permission_name.includes("password") || permission.permission_name.includes("blacklist") ? "Security"
                  : "System";
      acc[group] = [...(acc[group] || []), permission];
      return acc;
    }, {});
  }, [permissions]);

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      username: form.get("username"),
      email: form.get("email"),
      is_active: form.get("is_active") === "on",
      role_ids: canManageRoles ? selectedRoles : [],
      permission_ids: canManageRoles ? selectedPermissions : [],
    };
    if (!isEdit) {
      payload.password = form.get("password");
      payload.confirm_password = form.get("confirm_password");
      if (payload.password !== payload.confirm_password) {
        setError("Passwords do not match");
        return;
      }
    }
    try {
      await api(isEdit ? `/rbac/users/${user.id}` : "/rbac/users", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="modal">
      <form className="modal-panel" onSubmit={submit}>
        <div className="page-title">
          <h1>{isEdit ? "Edit User" : "Create User"}</h1>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
        <div className="grid two-col">
          <div>
            <div className="field"><label>Full Name</label><input name="name" defaultValue={user.name || ""} required /></div>
            <div className="field"><label>Username</label><input name="username" defaultValue={user.username || ""} /></div>
            <div className="field"><label>Email</label><input name="email" type="email" defaultValue={user.email || ""} required /></div>
            {!isEdit && (
              <>
                <div className="field"><label>Password</label><PasswordInput name="password" minLength={8} required /></div>
                <div className="field"><label>Confirm Password</label><PasswordInput name="confirm_password" minLength={8} required /></div>
              </>
            )}
            <label className="check"><input name="is_active" type="checkbox" defaultChecked={user.is_active ?? true} /> Account active</label>
          </div>
          <div>
            <h3>Role Selection</h3>
            {canManageRoles ? roles.filter(role => !role.role_name.match(/^(User|Admin) Custom \d+$/)).map((role) => (
              <label className="check" key={role.id}>
                <input type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => toggle(selectedRoles, setSelectedRoles, role.id)} />
                {role.role_name}
              </label>
            )) : <p className="muted">Only role managers can assign roles.</p>}
          </div>
        </div>
        <h3>Permissions Selection</h3>
        <div className="permission-grid">
          {canManageRoles ? Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <b>{group}</b>
              {items.map((permission) => (
                <label className="check" key={permission.id}>
                  <input type="checkbox" checked={selectedPermissions.includes(permission.id)} onChange={() => toggle(selectedPermissions, setSelectedPermissions, permission.id)} />
                  {permission.permission_name}
                </label>
              ))}
            </div>
          )) : <p className="muted">Only role managers can assign permissions.</p>}
        </div>
        <div className="error">{error}</div>
        <div className="actions">
          <button className="btn primary" type="submit">Save User</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
