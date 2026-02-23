"use client";

import type { Customer } from "@/lib/api";

interface CustomerTableProps {
  customers: Customer[];
  onAddCustomer?: () => void;
}

export default function CustomerTable({
  customers,
  onAddCustomer,
}: CustomerTableProps) {
  return (
    <div>
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Customers</h2>
        <button
          onClick={onAddCustomer}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
        >
          + Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="min-w-full divide-y divide-slate-700">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-300">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 bg-slate-900">
            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-slate-400"
                >
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="transition-colors hover:bg-slate-800"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {customer.first_name} {customer.last_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                    {customer.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                    {customer.phone || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-300">
                    {customer.city || "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                    {new Date(customer.created_at).toLocaleDateString()}
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
