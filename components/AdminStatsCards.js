"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });

const STAT_CARDS = [
  { key: "total_logins_today",      label: "Logins Today",       icon: "🔐", color: "#10b981" },
  { key: "failed_logins_today",     label: "Failed Logins",      icon: "⛔", color: "#ef4444" },
  { key: "total_active_sessions",   label: "Active Sessions",    icon: "🟢", color: "#0ea5e9" },
  { key: "blogs_created_today",     label: "Blogs Created",      icon: "✏️", color: "#3b82f6" },
  { key: "blogs_edited_today",      label: "Blogs Edited",       icon: "📝", color: "#8b5cf6" },
  { key: "blogs_published_today",   label: "Blogs Published",    icon: "🌐", color: "#10b981" },
  { key: "blogs_deleted_today",     label: "Blogs Deleted",      icon: "🗑️", color: "#ef4444" },
  { key: "user_management_actions", label: "User Actions",       icon: "👤", color: "#f59e0b" },
  { key: "role_permission_changes", label: "Role/Perm Changes",  icon: "🛡️", color: "#a855f7" },
];

export default function AdminStatsCards({ stats, loading }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>⏳</div>
        Loading stats...
      </div>
    );
  }

  if (!stats) return null;

  const chartData = stats.activity_chart_data || [];

  return (
    <div style={{ marginBottom: "2rem" }}>
      {/* 9 Stat Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
        gap: "0.85rem",
        marginBottom: "1.5rem",
      }}>
        {STAT_CARDS.map(({ key, label, icon, color }) => (
          <div key={key} className="card" style={{ padding: "1.1rem", borderLeft: `4px solid ${color}` }}>
            <div style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>{icon}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
              {label}
            </div>
            <div style={{ fontSize: "1.9rem", fontWeight: 900, color: "#0f172a" }}>
              {stats[key] ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* 7-day Activity Chart */}
      {mounted && chartData.length > 0 && (
        <div className="card" style={{ padding: "1.5rem" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#64748b", textTransform: "uppercase", fontSize: "0.82rem", letterSpacing: "0.05em" }}>
            Activity Trend — Last 7 Days
          </h4>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "#f1f5f9" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Bar dataKey="actions" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Total Actions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {mounted && chartData.length === 0 && (
        <div className="card" style={{ padding: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📉</div>
          No activity recorded in the last 7 days.
        </div>
      )}
    </div>
  );
}

AdminStatsCards.propTypes = {
  stats: PropTypes.shape({
    activity_chart_data: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string,
      actions: PropTypes.number,
    })),
  }),
  loading: PropTypes.bool.isRequired,
};

AdminStatsCards.defaultProps = {
  stats: null,
};
