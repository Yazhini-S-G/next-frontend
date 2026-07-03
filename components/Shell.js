"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, clearToken, hasPermission } from "@/lib/api";
import PropTypes from "prop-types";

const navItems = [
  { href: "/dashboard", label: "Dashboard", permission: null },
  { href: "/users", label: "Users", permission: "view_user" },
  { href: "/roles", label: "Roles", permission: "manage_roles" },
  { href: "/blogs", label: "Blogs", permission: "view_blog" },
  { href: "/blog-review", label: "Blog Review", permission: "review_blog" },
  { href: "/reports", label: "Reports", permission: "view_reports" },
  { href: "/admin-monitoring", label: "Admin Monitoring", superAdminOnly: true },
  { href: "/profile", label: "Profile", permission: null },
];

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const primaryRole = user?.roles?.[0] || "User";
  const isSuperAdmin = user?.roles?.includes("Super Admin");

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Token may already be expired; local logout should still complete.
    }
    clearToken();
    router.push("/");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">RBAC Studio</div>
        <nav className="nav-list">
          {navItems
            .filter((item) => {
              if (item.superAdminOnly && !isSuperAdmin) return false;
              if (item.permission && !hasPermission(user, item.permission)) return false;
              return true;
            })
            .map((item) => (
              <Link key={item.href} className={pathname === item.href ? "nav-link active" : "nav-link"} href={item.href}>
                {item.label}
              </Link>
            ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <div className="top-name">{user?.name || user?.email}</div>
            <div className="role-badge">{primaryRole}</div>
          </div>
          <button className="btn ghost" type="button" onClick={logout}>Logout</button>
        </header>
        {children}
      </main>
    </div>
  );
}

Shell.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
  }),
  children: PropTypes.node.isRequired,
};

Shell.defaultProps = {
  user: null,
};
