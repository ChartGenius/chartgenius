/**
 * Dashboard API client
 *
 * All functions accept a JWT token and return typed responses.
 * Errors are caught and returned as { error: string } — callers
 * should fall back to localStorage on failure.
 */

import { API_BASE } from './api'

// ─── Types (mirror the dashboard page types) ─────────────────────────────────

export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type AgentName = 'Axle' | 'Bolt' | 'Zip'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  project: string
  company: string
  agent: AgentName | ''
  priority: Priority
  dueDate: string
  createdAt: string
  completedAt: string
  notes: string
}

export interface ActivityItem {
  id: string
  type: string
  message: string
  agent: AgentName | ''
  project: string
  timestamp: string
}

export interface Project {
  id: string
  name: string
  category: string
}

export interface Company {
  id: string
  name: string
  projects: Project[]
}

export interface DashboardSettings {
  theme: string
  defaultView: string
  agentCosts: { Axle: number; Bolt: number; Zip: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headers(token: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function apiFetch<T>(url: string, opts: RequestInit): Promise<T & { error?: string }> {
  try {
    const res = await fetch(url, opts)
    const data = await res.json()
    if (!res.ok) return { error: data.error || `HTTP ${res.status}` } as T & { error: string }
    return data
  } catch (e: any) {
    return { error: e.message || 'Network error' } as T & { error: string }
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function apiGetTasks(token: string) {
  return apiFetch<{ tasks: Task[] }>(
    `${API_BASE}/api/dashboard/tasks`,
    { headers: headers(token) }
  )
}

export async function apiCreateTask(token: string, task: Partial<Task>) {
  return apiFetch<{ task: Task }>(
    `${API_BASE}/api/dashboard/tasks`,
    { method: 'POST', headers: headers(token), body: JSON.stringify(task) }
  )
}

export async function apiUpdateTask(token: string, id: string, updates: Partial<Task>) {
  return apiFetch<{ task: Task }>(
    `${API_BASE}/api/dashboard/tasks/${id}`,
    { method: 'PUT', headers: headers(token), body: JSON.stringify(updates) }
  )
}

export async function apiDeleteTask(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/tasks/${id}`,
    { method: 'DELETE', headers: headers(token) }
  )
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function apiGetActivity(token: string, limit = 50) {
  return apiFetch<{ activity: ActivityItem[] }>(
    `${API_BASE}/api/dashboard/activity?limit=${limit}`,
    { headers: headers(token) }
  )
}

export async function apiCreateActivity(token: string, item: Partial<ActivityItem>) {
  return apiFetch<{ activity: ActivityItem }>(
    `${API_BASE}/api/dashboard/activity`,
    { method: 'POST', headers: headers(token), body: JSON.stringify(item) }
  )
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function apiGetCompanies(token: string) {
  return apiFetch<{ companies: Company[] }>(
    `${API_BASE}/api/dashboard/companies`,
    { headers: headers(token) }
  )
}

export async function apiCreateCompany(token: string, company: Partial<Company>) {
  return apiFetch<{ company: Company }>(
    `${API_BASE}/api/dashboard/companies`,
    { method: 'POST', headers: headers(token), body: JSON.stringify(company) }
  )
}

export async function apiDeleteCompany(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/companies/${id}`,
    { method: 'DELETE', headers: headers(token) }
  )
}

export async function apiAddProject(token: string, companyId: string, project: Partial<Project>) {
  return apiFetch<{ project: Project }>(
    `${API_BASE}/api/dashboard/companies/${companyId}/projects`,
    { method: 'POST', headers: headers(token), body: JSON.stringify(project) }
  )
}

export async function apiDeleteProject(token: string, companyId: string, projectId: string) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/companies/${companyId}/projects/${projectId}`,
    { method: 'DELETE', headers: headers(token) }
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function apiGetSettings(token: string) {
  return apiFetch<{ settings: DashboardSettings }>(
    `${API_BASE}/api/dashboard/settings`,
    { headers: headers(token) }
  )
}

export async function apiSaveSettings(token: string, settings: DashboardSettings) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/settings`,
    { method: 'POST', headers: headers(token), body: JSON.stringify({ settings }) }
  )
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export interface AgentStatus {
  id: string
  name: AgentName
  role: string
  status: 'online' | 'busy' | 'offline'
  lastActive: string
  currentTask: string
  tasksCompletedToday: number
  tokensUsedToday: number
}

export async function apiGetAgents(token: string) {
  return apiFetch<{ agents: AgentStatus[] }>(
    `${API_BASE}/api/dashboard/agents`,
    { headers: headers(token) }
  )
}

export async function apiUpdateAgent(token: string, name: string, updates: Partial<AgentStatus>) {
  return apiFetch<{ agent: AgentStatus }>(
    `${API_BASE}/api/dashboard/agents/${name}`,
    { method: 'PUT', headers: headers(token), body: JSON.stringify(updates) }
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: string
}

export async function apiGetNotifications(token: string, limit = 50, unreadOnly = false) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (unreadOnly) params.set('unread', 'true')
  return apiFetch<{ notifications: Notification[]; unreadCount: number }>(
    `${API_BASE}/api/dashboard/notifications?${params}`,
    { headers: headers(token) }
  )
}

export async function apiCreateNotification(token: string, notif: Partial<Notification>) {
  return apiFetch<{ notification: Notification }>(
    `${API_BASE}/api/dashboard/notifications`,
    { method: 'POST', headers: headers(token), body: JSON.stringify(notif) }
  )
}

export async function apiMarkNotificationRead(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/notifications/${id}/read`,
    { method: 'PUT', headers: headers(token) }
  )
}

export async function apiMarkAllNotificationsRead(token: string) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/notifications/read-all`,
    { method: 'PUT', headers: headers(token) }
  )
}

export async function apiDeleteNotification(token: string, id: string) {
  return apiFetch<{ ok: boolean }>(
    `${API_BASE}/api/dashboard/notifications/${id}`,
    { method: 'DELETE', headers: headers(token) }
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalTasks: number
  completedToday: number
  activeAgents: number
  unreadNotifications: number
}

export async function apiGetStats(token: string) {
  return apiFetch<{ stats: DashboardStats }>(
    `${API_BASE}/api/dashboard/stats`,
    { headers: headers(token) }
  )
}

// ─── Full Sync (localStorage → Supabase) ──────────────────────────────────────

export async function apiSyncDashboard(
  token: string,
  data: { tasks: Task[]; activity: ActivityItem[]; companies: Company[]; settings: DashboardSettings }
) {
  return apiFetch<{ ok: boolean; imported: Record<string, number | boolean> }>(
    `${API_BASE}/api/dashboard/sync`,
    { method: 'POST', headers: headers(token), body: JSON.stringify(data) }
  )
}
