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

// New CRM Types
export interface Prospect {
  id: string;
  business_name: string;
  contact_first_name?: string;
  contact_last_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  store_type: string;
  pipeline_stage: "lead" | "contacted" | "interested" | "partner";
  assigned_to?: string;
  source: string;
  estimated_monthly_volume?: number;
  notes?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProspectInput {
  business_name: string;
  contact_first_name?: string;
  contact_last_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  store_type?: string;
  pipeline_stage?: string;
  assigned_to?: string;
  source?: string;
  estimated_monthly_volume?: number;
  notes?: string;
}

export interface PipelineView {
  lead: Prospect[];
  contacted: Prospect[];
  interested: Prospect[];
  partner: Prospect[];
}

export interface Activity {
  id: string;
  prospect_id: string;
  team_member_id?: string;
  type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  prospects?: { business_name: string };
}

export interface Task {
  id: string;
  prospect_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "completed" | "cancelled";
  completed_at?: string;
  created_at: string;
  updated_at: string;
  prospects?: { business_name: string };
}

export interface TaskInput {
  prospect_id?: string;
  assigned_to?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority?: string;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  prospect_id?: string;
  team_member_id?: string;
  bland_call_id?: string;
  direction: string;
  status: string;
  duration_seconds?: number;
  recording_url?: string;
  transcript?: any;
  summary?: string;
  sentiment?: string;
  outcome?: string;
  notes?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  prospects?: { business_name: string; phone?: string; email?: string };
}

export interface DashboardStats {
  pipeline: Record<string, number>;
  total_prospects: number;
  tasks_due_today: number;
  overdue_tasks: number;
  pending_tasks: number;
  calls_this_week: number;
  recent_activities: Activity[];
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

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

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
// Prospects
// ---------------------------------------------------------------------------

export async function getProspects(params?: {
  stage?: string;
  store_type?: string;
  assigned_to?: string;
  search?: string;
}): Promise<Prospect[]> {
  const query = new URLSearchParams();
  if (params?.stage) query.set("stage", params.stage);
  if (params?.store_type) query.set("store_type", params.store_type);
  if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request<Prospect[]>(`/api/prospects${qs ? `?${qs}` : ""}`);
}

export async function getProspect(id: string): Promise<Prospect> {
  return request<Prospect>(`/api/prospects/${id}`);
}

export async function createProspect(data: ProspectInput): Promise<Prospect> {
  return request<Prospect>("/api/prospects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProspect(
  id: string,
  data: Partial<ProspectInput>
): Promise<Prospect> {
  return request<Prospect>(`/api/prospects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProspect(id: string): Promise<void> {
  await request<void>(`/api/prospects/${id}`, { method: "DELETE" });
}

export async function updateProspectStage(
  id: string,
  pipeline_stage: string
): Promise<Prospect> {
  return request<Prospect>(`/api/prospects/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ pipeline_stage }),
  });
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export async function getPipeline(): Promise<PipelineView> {
  return request<PipelineView>("/api/pipeline");
}

export async function moveProspectInPipeline(
  id: string,
  pipeline_stage: string
): Promise<Prospect> {
  return request<Prospect>(`/api/pipeline/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ pipeline_stage }),
  });
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function getActivitiesByProspect(
  prospectId: string
): Promise<Activity[]> {
  return request<Activity[]>(`/api/activities/prospect/${prospectId}`);
}

export async function getRecentActivities(
  limit?: number
): Promise<Activity[]> {
  return request<Activity[]>(
    `/api/activities/recent${limit ? `?limit=${limit}` : ""}`
  );
}

export async function createActivity(data: {
  prospect_id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<Activity> {
  return request<Activity>("/api/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export async function getTasks(params?: {
  assigned_to?: string;
  status?: string;
  priority?: string;
  prospect_id?: string;
}): Promise<Task[]> {
  const query = new URLSearchParams();
  if (params?.assigned_to) query.set("assigned_to", params.assigned_to);
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.prospect_id) query.set("prospect_id", params.prospect_id);
  const qs = query.toString();
  return request<Task[]>(`/api/tasks${qs ? `?${qs}` : ""}`);
}

export async function createTask(data: TaskInput): Promise<Task> {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(
  id: string,
  data: Partial<TaskInput & { status: string }>
): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function completeTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}/complete`, {
    method: "PATCH",
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/api/tasks/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export async function getTeamMembers(): Promise<TeamMember[]> {
  return request<TeamMember[]>("/api/team");
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/api/dashboard");
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export async function getCalls(params?: {
  prospect_id?: string;
  status?: string;
}): Promise<Call[]> {
  const query = new URLSearchParams();
  if (params?.prospect_id) query.set("prospect_id", params.prospect_id);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return request<Call[]>(`/api/calls${qs ? `?${qs}` : ""}`);
}

export async function getCall(id: string): Promise<Call> {
  return request<Call>(`/api/calls/${id}`);
}

export async function initiateCall(data: {
  prospect_id: string;
  team_member_id?: string;
  pathway_id?: string;
}): Promise<Call> {
  return request<Call>("/api/calls", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function endCall(id: string): Promise<Call> {
  return request<Call>(`/api/calls/${id}/end`, {
    method: "POST",
  });
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}
