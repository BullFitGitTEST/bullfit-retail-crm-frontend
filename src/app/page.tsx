"use client";

import { useEffect, useState } from "react";
import { getCustomers, getOrders } from "@/lib/api";
import type { Customer, Order } from "@/lib/api";

interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  revenue: number;
  pendingOrders: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [customers, orders]: [Customer[], Order[]] = await Promise.all([
          getCustomers(),
          getOrders(),
        ]);

        const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const pendingOrders = orders.filter(
          (o) => o.status === "pending"
        ).length;

        setStats({
          totalCustomers: customers.length,
          totalOrders: orders.length,
          revenue,
          pendingOrders,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const cards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      icon: (
        <svg
          className="h-6 w-6 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
          />
        </svg>
      ),
      bg: "bg-indigo-600/10",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: (
        <svg
          className="h-6 w-6 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
      ),
      bg: "bg-blue-600/10",
    },
    {
      title: "Revenue",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(stats.revenue),
      icon: (
        <svg
          className="h-6 w-6 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      bg: "bg-green-600/10",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString(),
      icon: (
        <svg
          className="h-6 w-6 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
      bg: "bg-yellow-600/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-lg border border-red-800 bg-red-900/20 px-6 py-4 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Overview of your retail CRM data
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">{card.title}</p>
              <div className={`rounded-lg p-2 ${card.bg}`}>{card.icon}</div>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
