"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import PasswordInput from "@/components/PasswordInput";
import Modal from "@/components/Modal";
import Badge from "@/components/Badge";
import { api, hasPermission } from "@/lib/api";

function isCustomRoleName(roleName) {
  return /^(User|Admin) Custom \d+$/.test(roleName);
}

function buildSelectedIds(items, selectedNames, nameKey) {
  return items.filter((item) => selectedNames?.includes(item[nameKey])).map((item) => item.id);
}

function toggleValue(list, value) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

function buildGroupedPermissions(permissions) {
  return permissions.reduce((accumulator, permission) => {
    let group = "System";
    const name = permission.permission_name;

    if (name.includes("blog")) {
      group = "Blogs";
    } else if (name.includes("user")) {
      group = "User Management";
    } else if (name.includes("report") || name.includes("analytics")) {
      group = "Reports and Analytics";
    } else if (name.includes("article") || name.includes("comment")) {
      group = "CMS";
    } else if (name.includes("product") || name.includes("inventory") || name.includes("refund") || name.includes("discount")) {
      group = "Store";
    } else if (name.includes("audit") || name.includes("password") || name.includes("blacklist")) {
      group = "Security";
    }

    const nextGroup = accumulator[group] || [];
    accumulator[group] = [...nextGroup, permission];
    return accumulator;
  }, {});
}

function getStatusBadge(isActive) {
  if (isActive) {
    return <Badge variant="success">Active</Badge>;
  }
  return <Badge variant="danger">Inactive</Badge>;
}

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

  const load = useCallback(async () => {
  const nextUsers = await api("/rbac/users");
  setUsers(nextUsers);

  if (!canManageRoles) {
    setRoles([]);
    setPermissions([]);
    return;
  }

  const [nextRoles, nextPermissions] = await Promise.all([
    api("/rbac/roles"),
    api("/rbac/permissions"),
  ]);

  setRoles(nextRoles);
  setPermissions(nextPermissions);
}, [canManageRoles]);
 useEffect(() => {
  load().catch((err) => setError(err.message));
}, [load]);
  async function removeUser(id) {
    if (!confirm("Delete this user?")) return;
    await api(`/rbac/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <PageHeader
        title="User Management"
        description="Create users, assign roles, grant permissions, and control account status."
      >
        {hasPermission(currentUser, "create_user") && <button className="btn primary" onClick={() => setEditing({})}>Create User</button>}
      </PageHeader>
      {error && <div className="empty-state">{error}</div>}
      <div className="table-card">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((user) => {
              const visibleRoles = user.roles.filter((role) => !isCustomRoleName(role));
              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{visibleRoles.map((role) => <span className="role-badge" key={role}>{role}</span>)}</td>
                  <td>{getStatusBadge(user.is_active)}</td>
                  <td className="actions">
                    {hasPermission(currentUser, "edit_user") && <button className="btn" onClick={() => setEditing(user)}>Edit</button>}
                    {hasPermission(currentUser, "delete_user") && user.id !== currentUser.id && <button className="btn danger" onClick={() => removeUser(user.id)}>Delete</button>}
                  </td>
                </tr>
              );
            })}
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

Users.propTypes = {
  currentUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    permissions: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

function UserModal({ user, roles, permissions, canManageRoles, onClose, onSaved }) {
  const [selectedRoles, setSelectedRoles] = useState(() => buildSelectedIds(roles, user.roles, "role_name"));
  const [selectedPermissions, setSelectedPermissions] = useState(() => buildSelectedIds(permissions, user.permissions, "permission_name"));
  const [error, setError] = useState("");
  const isEdit = Boolean(user.id);
  const grouped = useMemo(() => buildGroupedPermissions(permissions), [permissions]);

  function handleRoleToggle(roleId) {
    setSelectedRoles((current) => toggleValue(current, roleId));
  }

  function handlePermissionToggle(permissionId) {
    setSelectedPermissions((current) => toggleValue(current, permissionId));
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
    <Modal title={isEdit ? "Edit User" : "Create User"} onClose={onClose} onSubmit={submit}>
        <div className="grid two-col">
          <div>
            <div className="field"><label htmlFor="user-name">Full Name</label><input id="user-name" name="name" defaultValue={user.name || ""} required /></div>
            <div className="field"><label htmlFor="user-username">Username</label><input id="user-username" name="username" defaultValue={user.username || ""} /></div>
            <div className="field"><label htmlFor="user-email">Email</label><input id="user-email" name="email" type="email" defaultValue={user.email || ""} required /></div>
            {!isEdit && (
              <>
                <div className="field"><label htmlFor="user-password">Password</label><PasswordInput id="user-password" name="password" minLength={8} required /></div>
                <div className="field"><label htmlFor="user-confirm-password">Confirm Password</label><PasswordInput id="user-confirm-password" name="confirm_password" minLength={8} required /></div>
              </>
            )}
            <label className="check" htmlFor="user-is-active"><input id="user-is-active" name="is_active" type="checkbox" defaultChecked={user.is_active ?? true} /> Account active</label>
          </div>
          <div>
            <h3>Role Selection</h3>
            {canManageRoles ? (
              roles.filter((role) => !isCustomRoleName(role.role_name)).map((role) => (
                <label className="check" key={role.id} htmlFor={`role-${role.id}`}>
                  <input id={`role-${role.id}`} type="checkbox" checked={selectedRoles.includes(role.id)} onChange={() => handleRoleToggle(role.id)} />
                  {role.role_name}
                </label>
              ))
            ) : (
              <p className="muted">Only role managers can assign roles.</p>
            )}
          </div>
        </div>
        <h3>Permissions Selection</h3>
        <div className="permission-grid">
          {canManageRoles ? (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <b>{group}</b>
                {items.map((permission) => (
                  <label className="check" key={permission.id} htmlFor={`perm-${permission.id}`}>
                    <input id={`perm-${permission.id}`} type="checkbox" checked={selectedPermissions.includes(permission.id)} onChange={() => handlePermissionToggle(permission.id)} />
                    {permission.permission_name}
                  </label>
                ))}
              </div>
            ))
          ) : (
            <p className="muted">Only role managers can assign permissions.</p>
          )}
        </div>
        <div className="error">{error}</div>
        <div className="actions">
          <button className="btn primary" type="submit">Save User</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
    </Modal>
  );
}

UserModal.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    username: PropTypes.string,
    email: PropTypes.string,
    is_active: PropTypes.bool,
    roles: PropTypes.arrayOf(PropTypes.string),
    permissions: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      role_name: PropTypes.string.isRequired,
    })
  ).isRequired,
  permissions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      permission_name: PropTypes.string.isRequired,
    })
  ).isRequired,
  canManageRoles: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};
