import axios from "axios";

export type Role = "USER" | "ADMIN" | "ASSISTANT";
export type Status = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type PriorityLevel = "P1" | "P2" | "P3" | "P4";

export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface User {
  id: number; email: string; full_name: string; role: Role;
  department?: string | null; account_status?: AccountStatus; created_at?: string | null;
}
export interface Comment {
  id: number; ticket_id: number; content: string; is_internal: boolean; created_at: string; user: User;
}
export interface Ticket {
  id: number; title: string; description: string; category: string; department: string | null;
  status: Status; reporter_id: number | null; requester_name: string | null; assigned_to_id: number | null;
  created_at: string; updated_at: string; reporter: User | null; assigned_to: User | null;
  last_edited_at?: string | null; last_edited_by?: User | null;
  priority_level?: PriorityLevel | null;
  ip_address?: string | null;
  // Manual Entry: historical tickets encoded by IT staff (ip_address is "Manual Entry").
  is_manual?: boolean; deleted_at?: string | null; resolved_at?: string | null;
  manual_entered_at?: string | null; manual_entered_by?: User | null;
  // Invalid = flagged as a mistake by IT staff: not counted in the Dashboard or Support Logs.
  invalid_at?: string | null; invalid_reason?: string | null; invalid_by?: User | null;
  // Optional second technician (the primary one stays in assigned_to / assigned_to_id).
  assigned_to_2_id?: number | null; assigned_to_2?: User | null;
}
export interface TicketDetail extends Ticket { comments: Comment[] }

// Permanent snapshot of a ticket taken when an admin deleted it (the original ticket no longer exists).
export interface TicketDeletionLog {
  id: number; original_ticket_id: number; ticket_title: string; ticket_description: string;
  ticket_category: string; ticket_department: string | null; ticket_status: Status;
  requester_name: string | null; assigned_to_id: number | null; assigned_to_name: string | null;
  assigned_to_2_id?: number | null; assigned_to_2_name?: string | null;
  ticket_created_at: string | null; deleted_by_id: number; deleted_by_name: string; deleted_at: string;
}

// Every technician on a ticket (primary first, then the optional second one).
export const ticketTechnicians = (t: { assigned_to?: User | null; assigned_to_2?: User | null }) =>
  [t.assigned_to, t.assigned_to_2].filter((u): u is User => Boolean(u));

// IT staff = main admin or IT assistant. Only the main admin can delete tickets.
export const hasStaffAccess = (u?: { role: Role } | null) => u?.role === "ADMIN" || u?.role === "ASSISTANT";

// Employees no longer have accounts: the name typed on the public form is stored on the ticket.
export const requesterName = (t: { requester_name?: string | null; reporter?: { full_name: string } | null }) =>
  t.requester_name || t.reporter?.full_name || "Unknown";

export const TOKEN_KEY = "helpdesk_token";
export const USER_KEY = "helpdesk_user";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? `${window.location.protocol}//${window.location.hostname}:8000` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthCall = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err: unknown, fallback = "Something went wrong. Try again."): string {
  const detail = (err as any)?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

export default api;

// Admin only. Newest deletion first.
export const fetchDeletionLogs = () => api.get<TicketDeletionLog[]>("/tickets/deletion-logs").then((r) => r.data);

export interface Summary {
  total: number; open: number; in_progress: number; resolved: number;
  categories: { name: string; count: number; percent: number }[];
  departments: { name: string; count: number }[];
}
export interface Stats {
  months: string[];
  years: number[];
  overall: Summary;
  monthly: Summary | null;
  yearly: Summary | null;
  trend: { month: string; count: number }[];
}



export interface IPSubmissionLog {
  id: number;
  ticket_id: number;
  ip_address: string;
  submitted_at: string;
  user_agent?: string | null;
}

// Admin only. Newest public ticket submission first.
export const fetchIPSubmissionLogs = () =>
  api.get<IPSubmissionLog[]>("/tickets/ip-logs").then((r) => r.data);
