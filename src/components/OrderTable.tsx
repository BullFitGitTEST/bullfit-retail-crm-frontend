"use client";

import type { Order } from "@/lib/api";

interface OrderTableProps {
  orders: Order[];
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  processing: "bg-blue-900/50 text-blue-300 border-blue-700",
  shipped: "bg-purple-900/50 text-purple-300 border-purple-700",
  delivered: "bg-green-900/50 text-green-300 border-green-700",
  cancelled: "bg-red-900/50 text-red-300 border-red-700",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function truncateId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}...` : id;
}

export default function OrderTable({ orders }: OrderTableProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Orders</h2>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Customer ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-900">
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-400"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-slate-800"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-300">
                    {truncateId(order.id)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-300">
                    {truncateId(order.customer_id)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        statusColors[order.status] ||
                        "bg-slate-800 text-slate-300 border-slate-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
