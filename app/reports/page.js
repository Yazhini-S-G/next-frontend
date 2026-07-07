"use client";

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

function StatRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.55rem 0", borderBottom: "1px solid #f8fafc" }}>
      <span style={{ fontSize: "0.88rem", color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: "1rem", color: color || "#0f172a" }}>{value ?? 0}</span>
    </div>
  );
}

StatRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  color: PropTypes.string,
};

StatRow.defaultProps = {
  value: 0,
  color: undefined,
};

function chartEmpty(message) {
  return <p className="muted" style={{ textAlign: "center", padding: "3rem 0" }}>{message}</p>;
}

function buildChartSection(mounted, data, emptyMessage, renderer) {
  if (!mounted) {
    return <p className="muted">Loading chart...</p>;
  }
  if (data.length === 0) {
    return chartEmpty(emptyMessage);
  }
  return renderer(data);
}

export default function ReportsPage() {
  return (
    <RequireAuth permission="view_reports">
      {() => <Reports />}
    </RequireAuth>
  );
}

function Reports() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    (async () => {
      try {
        const [s, r, c] = await Promise.all([
          api("/api/reports/summary"),
          api("/api/reports/recent"),
          api("/api/reports/charts"),
        ]);
        setSummary(s);
        setRecent(r || []);
        setCharts(c);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleExport = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/activity-logs/export`,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    if (!res.ok) {
      alert("Export failed");
      return;
    }

    const blob = await res.blob();
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `rbac_report_${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
  };

  if (loading) return <div style={{ padding: "3rem", textAlign: "center" }}>â³ Loading reports...</div>;
  if (error) return <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>âš ï¸ {error}</div>;

  const us = summary?.user_statistics || {};
  const bs = summary?.blog_statistics || {};
  const as = summary?.activity_statistics || {};

  const blogChart = buildChartSection(mounted, charts?.blog_growth || [], "No data yet.", (data) => (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={11} />
        <YAxis allowDecimals={false} fontSize={11} />
        <Tooltip />
        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Blogs Created" />
      </BarChart>
    </ResponsiveContainer>
  ));

  const userChart = buildChartSection(mounted, charts?.user_growth || [], "No data yet.", (data) => (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" fontSize={11} />
        <YAxis allowDecimals={false} fontSize={11} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Users Created" />
      </LineChart>
    </ResponsiveContainer>
  ));

  const roleChart = buildChartSection(mounted, charts?.role_distribution || [], "No data yet.", (data) => (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={75} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  ));

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <PageHeader title="System Reports" description="Live analytics from PostgreSQL â€” no placeholders.">
        <button className="btn outline" onClick={handleExport}>â¬‡ Export CSV</button>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.75rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>ðŸ‘¤ Users</h3>
          <StatRow label="Total Users" value={us.total_users} />
          <StatRow label="Active" value={us.active_users} color="#10b981" />
          <StatRow label="Inactive" value={us.inactive_users} color="#ef4444" />
          <StatRow label="Admins" value={us.admins} color="#3b82f6" />
          <StatRow label="Super Admins" value={us.super_admins} color="#8b5cf6" />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.75rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>ðŸ“ Blogs</h3>
          <StatRow label="Total Blogs" value={bs.total_blogs} />
          <StatRow label="Published" value={bs.published_blogs} color="#10b981" />
          <StatRow label="Pending Review" value={bs.pending_blogs} color="#f59e0b" />
          <StatRow label="Drafts" value={bs.draft_blogs} color="#64748b" />
          <StatRow label="Rejected" value={bs.rejected_blogs} color="#ef4444" />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "0.75rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>âš¡ Today</h3>
          <StatRow label="Logins" value={as.total_logins_today} />
          <StatRow label="Failed Logins" value={as.failed_logins_today} color="#ef4444" />
          <StatRow label="Active Sessions" value={as.active_sessions} color="#10b981" />
          <StatRow label="User Actions" value={as.user_actions_today} color="#3b82f6" />
          <StatRow label="Role Changes" value={as.role_changes_today} color="#f59e0b" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>ðŸ“Š Blog Activity (Last 7 Days)</h3>
          {blogChart}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>ðŸ“ˆ User Growth (By Month)</h3>
          {userChart}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>ðŸ›¡ï¸ Role Distribution</h3>
          {roleChart}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>ðŸ† Most Active Users (This Month)</h3>
          {charts?.top_users?.length > 0 ? (
            charts.top_users.map((user, index) => (
              <div key={`${user.username}-${index}`} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "0.9rem" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 700, marginRight: "0.5rem" }}>#{index + 1}</span>
                  {user.username}
                </span>
                <span style={{ fontWeight: 700, color: "#3b82f6" }}>{user.actions} actions</span>
              </div>
            ))
          ) : (
            <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>No activity this month.</p>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>ðŸ• Recent System Activity</h3>
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {recent.length === 0 ? (
            <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>No recent activity.</p>
          ) : (
            recent.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} style={{ padding: "0.65rem 0", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.username}</span>
                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: "0.82rem" }}>
                  <span style={{ color: "#3b82f6", fontWeight: 700 }}>[{item.action}]</span>{" "}
                  <span style={{ color: "#475569" }}>{item.description}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
