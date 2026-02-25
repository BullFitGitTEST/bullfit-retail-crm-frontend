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

export type LocationType = "door" | "distribution_center" | "warehouse" | "headquarters";

export const LOCATION_TYPES: { id: LocationType; label: string }[] = [
  { id: "door", label: "Retail Door" },
  { id: "distribution_center", label: "Distribution Center" },
  { id: "warehouse", label: "Warehouse" },
  { id: "headquarters", label: "Headquarters" },
];

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
  location_type?: LocationType;
  dc_region?: string;
  door_count?: number;
  active_opps?: number;
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
  location_type?: LocationType;
  dc_region?: string;
  door_count?: number;
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

export type OpportunityType =
  | "new_authorization"
  | "line_review"
  | "new_sku_add"
  | "promo_endcap"
  | "reorder_expansion"
  | "dc_setup";

export const OPPORTUNITY_TYPES: { id: OpportunityType; label: string }[] = [
  { id: "new_authorization", label: "New Authorization" },
  { id: "line_review", label: "Line Review" },
  { id: "new_sku_add", label: "New SKU Add" },
  { id: "promo_endcap", label: "Promo / Endcap" },
  { id: "reorder_expansion", label: "Reorder & Expansion" },
  { id: "dc_setup", label: "DC Setup & EDI" },
];

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
  opportunity_type?: OpportunityType;
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
  checklist?: ChecklistItem[];
}

export interface OpportunityInput {
  account_id: string;
  location_id?: string;
  contact_id?: string;
  owner_id?: string;
  title?: string;
  stage?: OpportunityStage;
  opportunity_type?: OpportunityType;
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
  wholesale_price?: number;
  msrp?: number;
  margin_percent?: number;
  case_pack?: number;
  total_price?: number;
  status: string;
  rejection_reason?: string;
  notes?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  opportunity_id: string;
  stage: string;
  item_key: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
}

export interface StageGateError {
  error: string;
  missing_requirements: {
    type: "field" | "checklist" | "products";
    key: string;
    label: string;
  }[];
  can_force: boolean;
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
// Enhanced Dashboard Types
// ---------------------------------------------------------------------------

export interface TodayPriorities {
  overdue_next_steps: {
    id: string;
    title: string;
    stage: string;
    next_step_date: string;
    next_step_description?: string;
    estimated_value?: number;
    probability?: number;
    account_name?: string;
    location_name?: string;
  }[];
  stalled_deals: {
    id: string;
    title: string;
    stage: string;
    updated_at: string;
    estimated_value?: number;
    account_name?: string;
    days_stalled: number;
    last_activity_at?: string;
  }[];
  upcoming_next_steps: {
    id: string;
    title: string;
    stage: string;
    next_step_date: string;
    next_step_description?: string;
    estimated_value?: number;
    account_name?: string;
  }[];
}

export interface OpportunityPipelineStats {
  count: number;
  total_value: number;
  weighted_value: number;
}

export interface EnhancedDashboardStats extends DashboardStats {
  today_priorities: TodayPriorities;
  opportunity_pipeline: Record<string, OpportunityPipelineStats>;
  pipeline_summary: {
    total_active: number;
    total_value: number;
    weighted_value: number;
    missing_next_step: number;
  };
  won_lost: {
    won_this_month: number;
    won_value: number;
    lost_this_month: number;
    lost_value: number;
  };
  recent_opportunity_activities: {
    id: string;
    type: string;
    title: string;
    description?: string;
    created_at: string;
    opportunity_id?: string;
    opportunity_title?: string;
    account_name?: string;
  }[];
  total_opportunities: number;
}

// ---------------------------------------------------------------------------
// Action Console Types
// ---------------------------------------------------------------------------

export interface ActionItem {
  id: string;
  title: string;
  stage: string;
  probability: number;
  estimated_value?: number;
  next_step_date?: string;
  next_step_description?: string;
  account_name: string;
  account_id: string;
  location_name?: string;
  contact_name?: string;
  product_count: number;
  last_activity_at?: string;
  score: number;
  action_type: "overdue" | "today" | "set_next_step" | "follow_up" | "upcoming";
  action_description: string;
}

// ---------------------------------------------------------------------------
// Reporting Types
// ---------------------------------------------------------------------------

export interface ReportingData {
  conversion_funnel: {
    stage: string;
    count: number;
    total_value: number;
    percentage: number;
  }[];
  time_to_po: {
    total_won: number;
    avg_days_to_close: number | null;
    min_days: number | null;
    max_days: number | null;
    avg_deal_value: number;
  };
  stage_velocity: {
    stage: string;
    transitions: number;
    avg_days_in_stage: number;
  }[];
  forecast: {
    by_stage: {
      stage: string;
      count: number;
      total_value: number;
      weighted_value: number;
    }[];
    totals: {
      count: number;
      total_value: number;
      weighted_value: number;
    };
  };
  win_loss: {
    win_rate: number;
    won_total: number;
    lost_total: number;
    monthly: {
      month: string;
      won: number;
      won_value: number;
      lost: number;
      lost_value: number;
    }[];
  };
  monthly_trend: {
    month: string;
    created: number;
    total_value: number;
  }[];
  top_accounts: {
    id: string;
    name: string;
    opp_count: number;
    total_value: number;
    weighted_value: number;
  }[];
  lost_reasons: {
    reason: string;
    count: number;
    lost_value: number;
  }[];
  expected_po_30d?: {
    opportunities: {
      id: string;
      title: string;
      stage: string;
      probability: number;
      estimated_value: number;
      expected_close_date: string;
      next_step_date?: string;
      next_step_description?: string;
      account_name: string;
      blocker_type: "overdue_next_step" | "no_next_step" | "no_contact" | "no_products" | "on_track";
    }[];
    totals: {
      count: number;
      total_value: number;
      weighted_value: number;
      with_blockers: number;
    };
  };
  pipeline_hygiene?: {
    score: number;
    missing_next_step: number;
    missing_contact: number;
    missing_value: number;
    missing_close_date: number;
    overdue_next_steps: number;
    total_active: number;
  };
}

// ---------------------------------------------------------------------------
// Stage Checklists
// ---------------------------------------------------------------------------

export interface StageChecklist {
  stage: OpportunityStage;
  items: { key: string; label: string; required: boolean }[];
}

export const STAGE_CHECKLISTS: StageChecklist[] = [
  {
    stage: "targeted",
    items: [
      { key: "research_done", label: "Researched account (website, social, reviews)", required: true },
      { key: "contact_identified", label: "Identified key decision maker", required: false },
      { key: "fit_assessed", label: "Assessed product-market fit for this store", required: true },
    ],
  },
  {
    stage: "contact_found",
    items: [
      { key: "contact_added", label: "Added primary contact with email/phone", required: true },
      { key: "contact_verified", label: "Verified contact info is current", required: false },
      { key: "outreach_planned", label: "Planned first outreach approach", required: true },
    ],
  },
  {
    stage: "first_touch",
    items: [
      { key: "intro_sent", label: "Sent introduction email or made first call", required: true },
      { key: "value_prop_shared", label: "Shared initial value proposition", required: true },
      { key: "response_received", label: "Received response / confirmed interest", required: false },
    ],
  },
  {
    stage: "meeting_booked",
    items: [
      { key: "meeting_scheduled", label: "Meeting date and time confirmed", required: true },
      { key: "agenda_sent", label: "Sent meeting agenda or talking points", required: false },
      { key: "materials_prepared", label: "Prepared pitch deck / product catalog", required: true },
    ],
  },
  {
    stage: "pitch_delivered",
    items: [
      { key: "pitch_completed", label: "Completed product presentation", required: true },
      { key: "pricing_shared", label: "Shared pricing and terms", required: true },
      { key: "objections_addressed", label: "Addressed initial objections", required: false },
      { key: "next_steps_agreed", label: "Agreed on next steps with buyer", required: true },
    ],
  },
  {
    stage: "samples_sent",
    items: [
      { key: "samples_shipped", label: "Shipped product samples", required: true },
      { key: "tracking_sent", label: "Sent tracking info to buyer", required: false },
      { key: "followup_scheduled", label: "Scheduled sample follow-up date", required: true },
      { key: "feedback_collected", label: "Collected sample feedback", required: false },
    ],
  },
  {
    stage: "follow_up",
    items: [
      { key: "feedback_reviewed", label: "Reviewed buyer feedback on samples", required: true },
      { key: "concerns_resolved", label: "Resolved any product concerns", required: false },
      { key: "decision_timeline", label: "Confirmed decision timeline", required: true },
      { key: "competitive_position", label: "Assessed competitive positioning", required: false },
    ],
  },
  {
    stage: "vendor_setup",
    items: [
      { key: "vendor_form_submitted", label: "Submitted vendor application / W-9", required: true },
      { key: "insurance_provided", label: "Provided insurance certificate (if required)", required: false },
      { key: "terms_negotiated", label: "Negotiated payment terms", required: true },
      { key: "vendor_approved", label: "Received vendor approval", required: false },
    ],
  },
  {
    stage: "authorization_pending",
    items: [
      { key: "authorization_submitted", label: "Submitted product authorization request", required: true },
      { key: "planogram_confirmed", label: "Confirmed shelf placement / planogram", required: false },
      { key: "pricing_finalized", label: "Finalized retail pricing and margins", required: true },
      { key: "launch_date_set", label: "Set target launch / first order date", required: false },
    ],
  },
  {
    stage: "po_received",
    items: [
      { key: "po_verified", label: "Verified PO details (SKUs, quantities, pricing)", required: true },
      { key: "fulfillment_scheduled", label: "Scheduled fulfillment / shipping", required: true },
      { key: "invoice_sent", label: "Sent invoice", required: false },
      { key: "delivery_confirmed", label: "Confirmed delivery date with buyer", required: true },
    ],
  },
  {
    stage: "on_shelf",
    items: [
      { key: "shelf_verified", label: "Verified products are on shelf", required: true },
      { key: "staff_trained", label: "Trained store staff on product", required: false },
      { key: "marketing_placed", label: "Placed POP / marketing materials", required: false },
      { key: "reorder_schedule", label: "Discussed reorder schedule", required: true },
    ],
  },
  {
    stage: "reorder_cycle",
    items: [
      { key: "reorder_confirmed", label: "Confirmed reorder schedule is active", required: true },
      { key: "performance_reviewed", label: "Reviewed sell-through performance", required: false },
      { key: "expansion_discussed", label: "Discussed product line expansion", required: false },
      { key: "relationship_maintained", label: "Scheduled regular check-in cadence", required: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Templates & Sequences Types
// ---------------------------------------------------------------------------

export interface Template {
  id: string;
  name: string;
  category: string;
  subject?: string;
  body: string;
  stage?: string;
  variables: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateInput {
  name: string;
  category?: string;
  subject?: string;
  body: string;
  stage?: string;
  variables?: string[];
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  target_stage?: string;
  is_active: boolean;
  created_by?: string;
  step_count?: number;
  active_enrollments?: number;
  steps?: SequenceStep[];
  enrollments?: SequenceEnrollment[];
  created_at: string;
  updated_at: string;
}

export interface SequenceInput {
  name: string;
  description?: string;
  target_stage?: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  template_id?: string;
  template_name?: string;
  template_category?: string;
  channel: string;
  delay_days: number;
  subject_override?: string;
  body_override?: string;
  notes?: string;
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  sequence_id: string;
  opportunity_id: string;
  current_step: number;
  status: string;
  enrolled_at: string;
  next_step_due?: string;
  completed_at?: string;
  sequence_name?: string;
  total_steps?: number;
  opportunity_title?: string;
  account_name?: string;
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

export async function getDashboardStats(): Promise<EnhancedDashboardStats> {
  return request<EnhancedDashboardStats>("/api/dashboard");
}

export async function getDashboardActions(): Promise<ActionItem[]> {
  return request<ActionItem[]>("/api/dashboard/actions");
}

export async function getReportingData(): Promise<ReportingData> {
  return request<ReportingData>("/api/reporting");
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
  lost_reason?: string,
  force?: boolean
): Promise<Opportunity> {
  const res = await fetch(`${API_URL}/api/opportunities/${id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage, lost_reason, force }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    if (res.status === 400 && body.missing_requirements) {
      // Return the gate error as a thrown object with special shape
      const err = new Error(body.error) as Error & { gateError: StageGateError };
      err.gateError = body as StageGateError;
      throw err;
    }
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
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
    wholesale_price?: number;
    msrp?: number;
    case_pack?: number;
    notes?: string;
  }
): Promise<OpportunityProduct> {
  return request<OpportunityProduct>(
    `/api/opportunities/${opportunityId}/products`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function updateOpportunityProduct(
  opportunityId: string,
  productId: string,
  data: Partial<{
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    wholesale_price: number;
    msrp: number;
    case_pack: number;
    status: string;
    rejection_reason: string;
    notes: string;
  }>
): Promise<OpportunityProduct> {
  return request<OpportunityProduct>(
    `/api/opportunities/${opportunityId}/products/${productId}`,
    { method: "PATCH", body: JSON.stringify(data) }
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

// Opportunity Documents
export async function addOpportunityDocument(
  opportunityId: string,
  data: { name: string; type: string; url?: string; status?: string; notes?: string }
): Promise<Document> {
  return request<Document>(
    `/api/opportunities/${opportunityId}/documents`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function updateOpportunityDocument(
  opportunityId: string,
  documentId: string,
  data: { status?: string; url?: string; notes?: string }
): Promise<Document> {
  return request<Document>(
    `/api/opportunities/${opportunityId}/documents/${documentId}`,
    { method: "PATCH", body: JSON.stringify(data) }
  );
}

export async function removeOpportunityDocument(
  opportunityId: string,
  documentId: string
): Promise<void> {
  await request<void>(
    `/api/opportunities/${opportunityId}/documents/${documentId}`,
    { method: "DELETE" }
  );
}

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

export async function getOpportunityChecklist(
  opportunityId: string
): Promise<ChecklistItem[]> {
  return request<ChecklistItem[]>(
    `/api/opportunities/${opportunityId}/checklist`
  );
}

export async function toggleChecklistItem(
  opportunityId: string,
  data: { stage: string; item_key: string; is_completed: boolean }
): Promise<ChecklistItem> {
  return request<ChecklistItem>(
    `/api/opportunities/${opportunityId}/checklist`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function getTemplates(params?: {
  category?: string;
  stage?: string;
}): Promise<Template[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.stage) query.set("stage", params.stage);
  const qs = query.toString();
  return request<Template[]>(`/api/templates${qs ? `?${qs}` : ""}`);
}

export async function getTemplate(id: string): Promise<Template> {
  return request<Template>(`/api/templates/${id}`);
}

export async function createTemplate(data: TemplateInput): Promise<Template> {
  return request<Template>("/api/templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(
  id: string,
  data: Partial<TemplateInput & { is_active: boolean }>
): Promise<Template> {
  return request<Template>(`/api/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await request<void>(`/api/templates/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Sequences
// ---------------------------------------------------------------------------

export async function getSequences(): Promise<Sequence[]> {
  return request<Sequence[]>("/api/sequences");
}

export async function getSequence(id: string): Promise<Sequence> {
  return request<Sequence>(`/api/sequences/${id}`);
}

export async function createSequence(data: SequenceInput): Promise<Sequence> {
  return request<Sequence>("/api/sequences", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSequence(
  id: string,
  data: Partial<SequenceInput & { is_active: boolean }>
): Promise<Sequence> {
  return request<Sequence>(`/api/sequences/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSequence(id: string): Promise<void> {
  await request<void>(`/api/sequences/${id}`, { method: "DELETE" });
}

export async function addSequenceStep(
  sequenceId: string,
  data: {
    template_id?: string;
    channel?: string;
    delay_days?: number;
    subject_override?: string;
    body_override?: string;
    notes?: string;
  }
): Promise<SequenceStep> {
  return request<SequenceStep>(`/api/sequences/${sequenceId}/steps`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSequenceStep(
  sequenceId: string,
  stepId: string
): Promise<void> {
  await request<void>(`/api/sequences/${sequenceId}/steps/${stepId}`, {
    method: "DELETE",
  });
}

export async function enrollInSequence(
  sequenceId: string,
  opportunityId: string
): Promise<SequenceEnrollment> {
  return request<SequenceEnrollment>(`/api/sequences/${sequenceId}/enroll`, {
    method: "POST",
    body: JSON.stringify({ opportunity_id: opportunityId }),
  });
}

export async function advanceEnrollment(
  sequenceId: string,
  enrollmentId: string
): Promise<SequenceEnrollment> {
  return request<SequenceEnrollment>(
    `/api/sequences/${sequenceId}/enrollments/${enrollmentId}/advance`,
    { method: "PATCH" }
  );
}

export async function stopEnrollment(
  sequenceId: string,
  enrollmentId: string
): Promise<SequenceEnrollment> {
  return request<SequenceEnrollment>(
    `/api/sequences/${sequenceId}/enrollments/${enrollmentId}/stop`,
    { method: "PATCH" }
  );
}

export async function getOpportunityEnrollments(
  opportunityId: string
): Promise<SequenceEnrollment[]> {
  return request<SequenceEnrollment[]>(
    `/api/sequences/enrollments/opportunity/${opportunityId}`
  );
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function healthCheck(): Promise<{ status: string }> {
  return request<{ status: string }>("/health");
}
