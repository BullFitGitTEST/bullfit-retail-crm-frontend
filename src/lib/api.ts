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
// Retail Account Model Types
// ---------------------------------------------------------------------------

export type OpportunityStage =
  | "targeted"
  | "contact_found"
  | "first_touch"
  | "meeting_booked"
  | "pitch_delivered"
  | "samples_sent"
  | "follow_up"
  | "vendor_setup"
  | "authorization_pending"
  | "po_received"
  | "on_shelf"
  | "reorder_cycle"
  | "closed_lost"
  | "on_hold";

export const OPPORTUNITY_STAGES: {
  id: OpportunityStage;
  label: string;
  probability: number;
  color: string;
}[] = [
  { id: "targeted", label: "Targeted", probability: 0, color: "border-slate-500" },
  { id: "contact_found", label: "Contact Found", probability: 5, color: "border-blue-500" },
  { id: "first_touch", label: "First Touch", probability: 10, color: "border-cyan-500" },
  { id: "meeting_booked", label: "Meeting Booked", probability: 20, color: "border-teal-500" },
  { id: "pitch_delivered", label: "Pitch Delivered", probability: 30, color: "border-yellow-500" },
  { id: "samples_sent", label: "Samples Sent", probability: 40, color: "border-orange-500" },
  { id: "follow_up", label: "Follow Up", probability: 50, color: "border-amber-500" },
  { id: "vendor_setup", label: "Vendor Setup", probability: 60, color: "border-purple-500" },
  { id: "authorization_pending", label: "Auth Pending", probability: 70, color: "border-violet-500" },
  { id: "po_received", label: "PO Received", probability: 85, color: "border-indigo-500" },
  { id: "on_shelf", label: "On Shelf", probability: 95, color: "border-emerald-500" },
  { id: "reorder_cycle", label: "Reorder", probability: 100, color: "border-green-500" },
];

export interface Account {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  annual_revenue?: number;
  employee_count?: number;
  notes?: string;
  owner_id?: string;
  owner_name?: string;
  location_count?: number;
  contact_count?: number;
  active_opportunities?: number;
  created_at: string;
  updated_at: string;
  // Populated on detail fetch
  locations?: Location[];
  contacts?: RetailContact[];
  opportunities?: Opportunity[];
}

export interface AccountInput {
  name: string;
  website?: string;
  industry?: string;
  annual_revenue?: number;
  employee_count?: number;
  notes?: string;
  owner_id?: string;
}

export interface Location {
  id: string;
  account_id: string;
  account_name?: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  store_type: string;
  square_footage?: number;
  foot_traffic_estimate?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LocationInput {
  account_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  store_type?: string;
  square_footage?: number;
  foot_traffic_estimate?: number;
  notes?: string;
}

export interface RetailContact {
  id: string;
  account_id: string;
  account_name?: string;
  location_id?: string;
  location_name?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: string;
  title?: string;
  is_primary: boolean;
  is_decision_maker: boolean;
  notes?: string;
  source: string;
  apollo_id?: string;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RetailContactInput {
  account_id: string;
  location_id?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  title?: string;
  is_primary?: boolean;
  is_decision_maker?: boolean;
  notes?: string;
  source?: string;
  apollo_id?: string;
}

export interface Opportunity {
  id: string;
  account_id: string;
  account_name?: string;
  location_id?: string;
  location_name?: string;
  location_city?: string;
  location_state?: string;
  store_type?: string;
  contact_id?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  owner_id?: string;
  owner_name?: string;
  title: string;
  stage: OpportunityStage;
  estimated_value?: number;
  estimated_monthly_volume?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  probability: number;
  lost_reason?: string;
  next_step_date?: string;
  next_step_description?: string;
  notes?: string;
  source: string;
  product_count?: number;
  created_at: string;
  updated_at: string;
  // Populated on detail fetch
  products?: OpportunityProduct[];
  activities?: OpportunityActivity[];
  documents?: Document[];
}

export interface OpportunityInput {
  account_id: string;
  location_id?: string;
  contact_id?: string;
  owner_id?: string;
  title?: string;
  stage?: OpportunityStage;
  estimated_value?: number;
  estimated_monthly_volume?: number;
  expected_close_date?: string;
  next_step_date?: string;
  next_step_description?: string;
  notes?: string;
  source?: string;
}

export interface OpportunityProduct {
  id: string;
  opportunity_id: string;
  product_name: string;
  sku?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface OpportunityActivity {
  id: string;
  opportunity_id: string;
  account_id?: string;
  team_member_id?: string;
  type: string;
  title: string;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Document {
  id: string;
  account_id?: string;
  opportunity_id?: string;
  name: string;
  type: string;
  url?: string;
  status: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export type OpportunityPipelineView = Record<string, Opportunity[]>;

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
// Accounts
// ---------------------------------------------------------------------------

export async function getAccounts(params?: {
  search?: string;
  owner_id?: string;
}): Promise<Account[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.owner_id) query.set("owner_id", params.owner_id);
  const qs = query.toString();
  return request<Account[]>(`/api/accounts${qs ? `?${qs}` : ""}`);
}

export async function getAccount(id: string): Promise<Account> {
  return request<Account>(`/api/accounts/${id}`);
}

export async function createAccount(data: AccountInput): Promise<Account> {
  return request<Account>("/api/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAccount(
  id: string,
  data: Partial<AccountInput>
): Promise<Account> {
  return request<Account>(`/api/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await request<void>(`/api/accounts/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export async function getLocations(params?: {
  account_id?: string;
  search?: string;
}): Promise<Location[]> {
  const query = new URLSearchParams();
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request<Location[]>(`/api/locations${qs ? `?${qs}` : ""}`);
}

export async function createLocation(data: LocationInput): Promise<Location> {
  return request<Location>("/api/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLocation(
  id: string,
  data: Partial<LocationInput>
): Promise<Location> {
  return request<Location>(`/api/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteLocation(id: string): Promise<void> {
  await request<void>(`/api/locations/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Retail Contacts
// ---------------------------------------------------------------------------

export async function getRetailContacts(params?: {
  account_id?: string;
  location_id?: string;
  search?: string;
  role?: string;
}): Promise<RetailContact[]> {
  const query = new URLSearchParams();
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.location_id) query.set("location_id", params.location_id);
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  const qs = query.toString();
  return request<RetailContact[]>(`/api/contacts-retail${qs ? `?${qs}` : ""}`);
}

export async function createRetailContact(
  data: RetailContactInput
): Promise<RetailContact> {
  return request<RetailContact>("/api/contacts-retail", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRetailContact(
  id: string,
  data: Partial<RetailContactInput>
): Promise<RetailContact> {
  return request<RetailContact>(`/api/contacts-retail/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRetailContact(id: string): Promise<void> {
  await request<void>(`/api/contacts-retail/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export async function getOpportunities(params?: {
  account_id?: string;
  stage?: string;
  owner_id?: string;
  search?: string;
}): Promise<Opportunity[]> {
  const query = new URLSearchParams();
  if (params?.account_id) query.set("account_id", params.account_id);
  if (params?.stage) query.set("stage", params.stage);
  if (params?.owner_id) query.set("owner_id", params.owner_id);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  return request<Opportunity[]>(`/api/opportunities${qs ? `?${qs}` : ""}`);
}

export async function getOpportunityPipeline(): Promise<OpportunityPipelineView> {
  return request<OpportunityPipelineView>("/api/opportunities/pipeline");
}

export async function getOpportunity(id: string): Promise<Opportunity> {
  return request<Opportunity>(`/api/opportunities/${id}`);
}

export async function createOpportunity(
  data: OpportunityInput
): Promise<Opportunity> {
  return request<Opportunity>("/api/opportunities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateOpportunity(
  id: string,
  data: Partial<OpportunityInput>
): Promise<Opportunity> {
  return request<Opportunity>(`/api/opportunities/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function moveOpportunityStage(
  id: string,
  stage: OpportunityStage,
  lost_reason?: string
): Promise<Opportunity> {
  return request<Opportunity>(`/api/opportunities/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage, lost_reason }),
  });
}

export async function deleteOpportunity(id: string): Promise<void> {
  await request<void>(`/api/opportunities/${id}`, { method: "DELETE" });
}

// Opportunity Products
export async function addOpportunityProduct(
  opportunityId: string,
  data: {
    product_name: string;
    sku?: string;
    quantity?: number;
    unit_price?: number;
    notes?: string;
  }
): Promise<OpportunityProduct> {
  return request<OpportunityProduct>(
    `/api/opportunities/${opportunityId}/products`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function updateProductStatus(
  opportunityId: string,
  productId: string,
  status: string
): Promise<OpportunityProduct> {
  return request<OpportunityProduct>(
    `/api/opportunities/${opportunityId}/products/${productId}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) }
  );
}

export async function removeOpportunityProduct(
  opportunityId: string,
  productId: string
): Promise<void> {
  await request<void>(
    `/api/opportunities/${opportunityId}/products/${productId}`,
    { method: "DELETE" }
  );
}

// Opportunity Activities
export async function addOpportunityActivity(
  opportunityId: string,
  data: {
    type: string;
    title: string;
    description?: string;
    metadata?: Record<string, any>;
  }
): Promise<OpportunityActivity> {
  return request<OpportunityActivity>(
    `/api/opportunities/${opportunityId}/activities`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}
