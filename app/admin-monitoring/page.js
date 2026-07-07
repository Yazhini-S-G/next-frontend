"use client";

import { useState, useEffect, useCallback } from "react";
import RequireAuth from "@/components/RequireAuth";
import ActivityFilters from "@/components/ActivityFilters";
import AdminStatsCards from "@/components/AdminStatsCards";
import AdminMonitoringTable from "@/components/AdminMonitoringTable";
import AdminSessionTable from "@/components/AdminSessionTable";
import PageHeader from "@/components/PageHeader";
import { api, getToken } from "@/lib/api";

export default function AdminMonitoringPage() {
  const [activeTab, setActiveTab] = useState("activity");
  const [logsData, setLogsData] = useState({ items: [], total: 0, page: 1, size: 20, pages: 0 });
  const [sessionData, setSessionData] = useState({ items: [], total: 0, page: 1, size: 20, pages: 0 });
  const [stats, setStats] = useState(null);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [filters, setFilters] = useState({});

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const params = new URLSearchParams({ page: logsPage, size: 20 });
      if (filters.admin_name) params.append("admin_name", filters.admin_name);
      if (filters.admin_email) params.append("admin_email", filters.admin_email);
      if (filters.action_type) params.append("action_type", filters.action_type);
      if (filters.module) params.append("module", filters.module);
      if (filters.date) params.append("date", filters.date);

      const data = await api(`/api/activity-logs?${params.toString()}`);
      setLogsData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLogs(false);
    }
  }, [logsPage, filters]);

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const data = await api(`/api/activity-logs/sessions?page=${sessionsPage}&size=20`);
      setSessionData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSessions(false);
    }
  }, [sessionsPage]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await api("/api/activity-logs/stats");
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/activity-logs/export`, {
        headers: { "Authorization": `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to export logs");
      const blob = await res.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admin_monitoring_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (error) {
      console.error(error);
      alert("Error exporting logs");
    }
  };

  return (
    <RequireAuth>
      {(user) => {
        if (!user.roles?.includes("Super Admin")) {
          return <div className="card" style={{ padding: "2rem", textAlign: "center" }}>Access Denied. Super Admin only.</div>;
        }

        return (
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <PageHeader title="Admin Monitoring">
              <button className="btn outline" onClick={handleExport}>Export CSV</button>
            </PageHeader>

            <AdminStatsCards stats={stats} loading={loadingStats} />

            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              <button className={`btn ${activeTab === "activity" ? "primary" : "ghost"}`} onClick={() => setActiveTab("activity")}>
                Activity Logs
              </button>
              <button className={`btn ${activeTab === "sessions" ? "primary" : "ghost"}`} onClick={() => setActiveTab("sessions")}>
                Session Tracking
              </button>
            </div>

            {activeTab === "activity" && (
              <>
                <ActivityFilters onFilter={(newFilters) => { setFilters(newFilters); setLogsPage(1); }} />
                <AdminMonitoringTable
                  logs={logsData.items}
                  loading={loadingLogs}
                  page={logsData.page}
                  pages={logsData.pages}
                  onPageChange={setLogsPage}
                />
              </>
            )}

            {activeTab === "sessions" && (
              <AdminSessionTable
                sessions={sessionData.items}
                loading={loadingSessions}
                page={sessionData.page}
                pages={sessionData.pages}
                onPageChange={setSessionsPage}
              />
            )}
          </div>
        );
      }}
    </RequireAuth>
  );
}
