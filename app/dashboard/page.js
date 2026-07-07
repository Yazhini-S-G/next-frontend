"use client";

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import RequireAuth from "@/components/RequireAuth";
import PageHeader from "@/components/PageHeader";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

const BLOG_COLORS = ["#10b981", "#f59e0b", "#64748b", "#ef4444", "#3b82f6"];

const ACTION_ICONS = {
  "Create Blog": "Create",
  "Update Blog": "Update",
  "Delete Blog": "Delete",
  "Submit Blog For Review": "Submit",
  "Approve Blog": "Approve",
  "Reject Blog": "Reject",
  "Publish Blog": "Publish",
  "Login": "Login",
  "Logout": "Logout",
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      {(user) => <Dashboard user={user} />}
    </RequireAuth>
  );
}

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [nextStats, nextActivity] = await Promise.all([
          api("/api/user-dashboard/stats"),
          api("/api/user-dashboard/recent-activity"),
        ]);
        setStats(nextStats);
        setActivity(nextActivity || []);
      } catch (nextError) {
        setError(nextError.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.5rem" }}>Loading</div> Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
        <div style={{ fontSize: "1.5rem" }}>Error</div> {error}
      </div>
    );
  }

  const statCards = [
    { label: "Total Blogs", value: stats?.total_blogs ?? 0, color: "#3b82f6", icon: "Posts" },
    { label: "Published", value: stats?.published_blogs ?? 0, color: "#10b981", icon: "Live" },
    { label: "Pending Review", value: stats?.pending_blogs ?? 0, color: "#f59e0b", icon: "Queue" },
    { label: "Approved", value: stats?.approved_blogs ?? 0, color: "#8b5cf6", icon: "OK" },
    { label: "Drafts", value: stats?.draft_blogs ?? 0, color: "#64748b", icon: "Draft" },
    { label: "Rejected", value: stats?.rejected_blogs ?? 0, color: "#ef4444", icon: "No" },
    { label: "Written Today", value: stats?.blogs_today ?? 0, color: "#06b6d4", icon: "Today" },
  ];

  const chartData = statCards
    .filter(card => ["Published", "Pending Review", "Drafts", "Rejected", "Approved"].includes(card.label) && card.value > 0)
    .map((card, index) => ({
      name: card.label,
      value: card.value,
      color: BLOG_COLORS[index % BLOG_COLORS.length],
    }));

  let pieSection = <p className="muted" style={{ textAlign: "center", padding: "3rem 0" }}>No blogs yet. Start writing!</p>;
  if (mounted) {
    if (chartData.length > 0) {
      pieSection = (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      pieSection = <p className="muted" style={{ textAlign: "center", padding: "3rem 0" }}>No blogs yet. Start writing!</p>;
    }
  } else {
    pieSection = <p className="muted">Loading chart...</p>;
  }

  const activitySection = activity.length > 0
    ? activity.map((item) => (
        <div key={`${item.action}-${item.timestamp}`} style={{ padding: "0.65rem 0", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#3b82f6" }}>
              {ACTION_ICONS[item.action] || "Item"} {item.action}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "0.2rem" }}>
            {item.description}
          </div>
        </div>
      ))
    : <p className="muted" style={{ textAlign: "center", padding: "2rem 0" }}>No activity recorded yet.</p>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <PageHeader
        title={<>Welcome, {user.name}!</>}
        description="Your personal blog dashboard - real data, no placeholders."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {statCards.map((card) => (
          <div key={card.label} className="card" style={{ padding: "1.25rem", borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>{card.icon}</div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>{card.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a" }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Blog Status Distribution</h3>
          {pieSection}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>My Recent Activity</h3>
          <div style={{ maxHeight: "260px", overflowY: "auto" }}>{activitySection}</div>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};
