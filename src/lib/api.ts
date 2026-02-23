const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items?: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export interface OrderInput {
  customer_id: string;
  status?: string;
  total: number;
  items?: OrderItem[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function getCustomers(): Promise<Customer[]> {
  return request<Customer[]>("/api/customers");
}

export async function getCustomer(id: string): Promise<Customer> {
  return request<Customer>(`/api/customers/${id}`);
}

export async function createCustomer(data: CustomerInput): Promise<Customer> {
  return request<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerInput>
): Promise<Customer> {
  return request<Customer>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await request<void>(`/api/customers/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function getOrders(): Promise<Order[]> {
  return request<Order[]>("/api/orders");
}

export async function getOrder(id: string): Promise<Order> {
  return request<Order>(`/api/orders/${id}`);
}

export async function createOrder(data: OrderInput): Promise<Order> {
  return request<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOrder(
  id: string,
  data: Partial<OrderInput>
): Promise<Order> {
  return request<Order>(`/api/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getOrdersByCustomer(
  customerId: string
): Promise<Order[]> {
  return request<Order[]>(`/api/orders/customer/${customerId}`);
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}
