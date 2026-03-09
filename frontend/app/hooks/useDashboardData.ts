'use client'

/**
 * useDashboardData — hybrid persistence hook
 *
 * When the user is authenticated (has a JWT token):
 *   1. Loads data from the API on mount
 *   2. Falls back to localStorage if API fails
 *   3. Writes go to both API and localStorage (write-through)
 *   4. On first successful API load, syncs any localStorage-only data up
 *
 * When not authenticated:
 *   - Uses localStorage only (same as before)
 *
 * The hook returns the SAME interface as the old useLocalStorage,
 * so the dashboard component needs minimal changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Task, ActivityItem, Company, DashboardSettings,
  apiGetTasks, apiCreateTask, apiUpdateTask, apiDeleteTask,
  apiGetActivity, apiCreateActivity,
  apiGetCompanies, apiCreateCompany, apiDeleteCompany, apiAddProject, apiDeleteProject,
  apiGetSettings, apiSaveSettings,
  apiSyncDashboard,
} from '../lib/dashboardApi'

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function lsSet<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── Default data ─────────────────────────────────────────────────────────────
// (re-exported so the dashboard page doesn't need to duplicate them)

const todayStr = new Date().toISOString().split('T')[0]
const TODAY = new Date().toISOString()

export const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'apex',
    name: 'ApexLogics',
    projects: [
      { id: 'cg-dev', name: 'TradVue › Development', category: 'Development' },
      { id: 'cg-biz', name: 'TradVue › Business', category: 'Business' },
      { id: 'cg-ops', name: 'TradVue › Operations', category: 'Operations' },
    ],
  },
]

export const DEFAULT_TASKS: Task[] = [
  {
    id: 't1', title: 'News feed expansion — 5 new sources',
    description: 'Add Reuters, Bloomberg, FT, Seeking Alpha, and Benzinga to the news aggregator.',
    status: 'done', project: 'TradVue › Development', company: 'ApexLogics',
    agent: 'Bolt', priority: 'high', dueDate: todayStr,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 3600000).toISOString(), notes: '',
  },
  {
    id: 't2', title: 'Portfolio P&L chart',
    description: 'Build cumulative P&L chart with time range selector.',
    status: 'done', project: 'TradVue › Development', company: 'ApexLogics',
    agent: 'Bolt', priority: 'high', dueDate: todayStr,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    completedAt: new Date(Date.now() - 5400000).toISOString(), notes: '',
  },
  {
    id: 't3', title: 'Legal disclaimers — all pages',
    description: 'Add "Not financial advice" disclaimers to all public-facing pages.',
    status: 'done', project: 'TradVue › Operations', company: 'ApexLogics',
    agent: 'Zip', priority: 'medium', dueDate: todayStr,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    completedAt: new Date(Date.now() - 7200000).toISOString(), notes: '',
  },
  {
    id: 't4', title: 'Trading tools phase 2',
    description: 'ATR calculator, correlation matrix, and options screener.',
    status: 'done', project: 'TradVue › Development', company: 'ApexLogics',
    agent: 'Bolt', priority: 'high', dueDate: todayStr,
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    completedAt: new Date(Date.now() - 9000000).toISOString(), notes: '',
  },
  {
    id: 't5', title: 'Market sentiment analysis',
    description: 'Research and implement Fear & Greed index integration.',
    status: 'inprogress', project: 'TradVue › Development', company: 'ApexLogics',
    agent: 'Bolt', priority: 'medium', dueDate: todayStr,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: '', notes: 'API endpoint found: CNN Fear & Greed',
  },
  {
    id: 't6', title: 'User acquisition strategy',
    description: 'Draft SEO strategy and content calendar for Q2 2026.',
    status: 'inprogress', project: 'TradVue › Business', company: 'ApexLogics',
    agent: 'Axle', priority: 'medium', dueDate: todayStr,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: '', notes: '',
  },
  {
    id: 't7', title: 'Deploy staging environment',
    description: 'Set up Vercel staging branch with feature flags.',
    status: 'todo', project: 'TradVue › Operations', company: 'ApexLogics',
    agent: 'Bolt', priority: 'low', dueDate: '',
    createdAt: TODAY, completedAt: '', notes: '',
  },
  {
    id: 't8', title: 'Email onboarding sequence',
    description: 'Write 3-email welcome sequence for new signups.',
    status: 'todo', project: 'TradVue › Business', company: 'ApexLogics',
    agent: 'Zip', priority: 'medium', dueDate: '',
    createdAt: TODAY, completedAt: '', notes: '',
  },
]

export const DEFAULT_ACTIVITY: ActivityItem[] = [
  { id: 'a1', type: 'task_complete', message: 'Bolt completed: trading tools phase 2', agent: 'Bolt', project: 'TradVue › Development', timestamp: new Date(Date.now() - 9000000).toISOString() },
  { id: 'a2', type: 'task_complete', message: 'Zip completed: legal disclaimers', agent: 'Zip', project: 'TradVue › Operations', timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a3', type: 'task_complete', message: 'Bolt completed: portfolio P&L chart', agent: 'Bolt', project: 'TradVue › Development', timestamp: new Date(Date.now() - 5400000).toISOString() },
  { id: 'a4', type: 'task_complete', message: 'Bolt completed: news feed expansion', agent: 'Bolt', project: 'TradVue › Development', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a5', type: 'task_start', message: 'Axle started: user acquisition strategy', agent: 'Axle', project: 'TradVue › Business', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a6', type: 'task_start', message: 'Bolt started: market sentiment analysis', agent: 'Bolt', project: 'TradVue › Development', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'a7', type: 'deploy', message: 'Deployed to production: TradVue v2.4', agent: 'Bolt', project: 'TradVue › Operations', timestamp: new Date(Date.now() - 10800000).toISOString() },
]

export const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'dark',
  defaultView: 'overview',
  agentCosts: { Axle: 15, Bolt: 3, Zip: 0.25 },
}

// ─── LS Keys ──────────────────────────────────────────────────────────────────

const LS_TASKS     = 'cg_dashboard_tasks'
const LS_ACTIVITY  = 'cg_dashboard_activity'
const LS_COMPANIES = 'cg_dashboard_companies'
const LS_SETTINGS  = 'cg_dashboard_settings'
const LS_SYNCED    = 'cg_dashboard_synced' // flag: initial sync done

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData(token: string | null) {
  const [tasks, _setTasks] = useState<Task[]>(DEFAULT_TASKS)
  const [activity, _setActivity] = useState<ActivityItem[]>(DEFAULT_ACTIVITY)
  const [companies, _setCompanies] = useState<Company[]>(DEFAULT_COMPANIES)
  const [settings, _setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)
  const tokenRef = useRef(token)
  tokenRef.current = token

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    async function init() {
      // Always start with localStorage (instant render)
      const lsTasks     = lsGet(LS_TASKS, DEFAULT_TASKS)
      const lsActivity  = lsGet(LS_ACTIVITY, DEFAULT_ACTIVITY)
      const lsCompanies = lsGet(LS_COMPANIES, DEFAULT_COMPANIES)
      const lsSettings  = lsGet(LS_SETTINGS, DEFAULT_SETTINGS)

      _setTasks(lsTasks)
      _setActivity(lsActivity)
      _setCompanies(lsCompanies)
      _setSettings(lsSettings)

      // If authenticated, try to load from API
      if (token) {
        try {
          const [tRes, aRes, cRes, sRes] = await Promise.all([
            apiGetTasks(token),
            apiGetActivity(token),
            apiGetCompanies(token),
            apiGetSettings(token),
          ])

          // Check if this is a first-time sync (API has no data but localStorage does)
          const apiHasData = !tRes.error && tRes.tasks && tRes.tasks.length > 0
          const hasSynced = localStorage.getItem(LS_SYNCED) === 'true'

          if (!apiHasData && !hasSynced && lsTasks.length > 0) {
            // First time — push localStorage data up to API
            console.info('[Dashboard] First sync: uploading localStorage → API')
            await apiSyncDashboard(token, {
              tasks: lsTasks,
              activity: lsActivity,
              companies: lsCompanies,
              settings: lsSettings,
            })
            localStorage.setItem(LS_SYNCED, 'true')
            // Keep localStorage values as source of truth for this session
          } else if (apiHasData) {
            // API has data — use it as source of truth
            if (!tRes.error && tRes.tasks) { _setTasks(tRes.tasks); lsSet(LS_TASKS, tRes.tasks) }
            if (!aRes.error && aRes.activity) { _setActivity(aRes.activity); lsSet(LS_ACTIVITY, aRes.activity) }
            if (!cRes.error && cRes.companies) { _setCompanies(cRes.companies); lsSet(LS_COMPANIES, cRes.companies) }
            if (!sRes.error && sRes.settings && Object.keys(sRes.settings).length > 0) {
              _setSettings(sRes.settings as DashboardSettings); lsSet(LS_SETTINGS, sRes.settings)
            }
            localStorage.setItem(LS_SYNCED, 'true')
          }
        } catch (e) {
          console.warn('[Dashboard] API load failed, using localStorage:', e)
        }
      }

      setLoading(false)
    }

    init()
  }, [token])

  // ── Write-through setters ─────────────────────────────────────────────────

  const setTasks = useCallback((newTasks: Task[]) => {
    _setTasks(newTasks)
    lsSet(LS_TASKS, newTasks)
    // Note: individual API calls are made by the action functions below.
    // The full array is only written to localStorage for offline fallback.
  }, [])

  const setActivity = useCallback((newActivity: ActivityItem[]) => {
    _setActivity(newActivity)
    lsSet(LS_ACTIVITY, newActivity)
  }, [])

  const setCompanies = useCallback((newCompanies: Company[]) => {
    _setCompanies(newCompanies)
    lsSet(LS_COMPANIES, newCompanies)
  }, [])

  const setSettings = useCallback((newSettings: DashboardSettings) => {
    _setSettings(newSettings)
    lsSet(LS_SETTINGS, newSettings)
    // Fire-and-forget API save
    if (tokenRef.current) {
      apiSaveSettings(tokenRef.current, newSettings).catch(() => {})
    }
  }, [])

  // ── Task actions (API + local) ────────────────────────────────────────────

  const addTask = useCallback((task: Task) => {
    _setTasks(prev => {
      const next = [...prev, task]
      lsSet(LS_TASKS, next)
      return next
    })
    if (tokenRef.current) {
      apiCreateTask(tokenRef.current, task).catch(() => {})
    }
  }, [])

  const updateTask = useCallback((task: Task) => {
    _setTasks(prev => {
      const next = prev.map(t => t.id === task.id ? task : t)
      lsSet(LS_TASKS, next)
      return next
    })
    if (tokenRef.current) {
      apiUpdateTask(tokenRef.current, task.id, task).catch(() => {})
    }
  }, [])

  const deleteTask = useCallback((id: string) => {
    _setTasks(prev => {
      const next = prev.filter(t => t.id !== id)
      lsSet(LS_TASKS, next)
      return next
    })
    if (tokenRef.current) {
      apiDeleteTask(tokenRef.current, id).catch(() => {})
    }
  }, [])

  // ── Activity actions ──────────────────────────────────────────────────────

  const addActivityItem = useCallback((item: ActivityItem) => {
    _setActivity(prev => {
      const next = [item, ...prev].slice(0, 50)
      lsSet(LS_ACTIVITY, next)
      return next
    })
    if (tokenRef.current) {
      apiCreateActivity(tokenRef.current, item).catch(() => {})
    }
  }, [])

  // ── Company actions ───────────────────────────────────────────────────────

  const addCompany = useCallback((company: Company) => {
    _setCompanies(prev => {
      const next = [...prev, company]
      lsSet(LS_COMPANIES, next)
      return next
    })
    if (tokenRef.current) {
      apiCreateCompany(tokenRef.current, company).catch(() => {})
    }
  }, [])

  const deleteCompany = useCallback((id: string) => {
    _setCompanies(prev => {
      const next = prev.filter(c => c.id !== id)
      lsSet(LS_COMPANIES, next)
      return next
    })
    if (tokenRef.current) {
      apiDeleteCompany(tokenRef.current, id).catch(() => {})
    }
  }, [])

  const addProject = useCallback((companyId: string, project: { id: string; name: string; category: string }) => {
    _setCompanies(prev => {
      const next = prev.map(c =>
        c.id === companyId ? { ...c, projects: [...c.projects, project] } : c
      )
      lsSet(LS_COMPANIES, next)
      return next
    })
    if (tokenRef.current) {
      apiAddProject(tokenRef.current, companyId, project).catch(() => {})
    }
  }, [])

  const removeProject = useCallback((companyId: string, projectId: string) => {
    _setCompanies(prev => {
      const next = prev.map(c =>
        c.id === companyId ? { ...c, projects: c.projects.filter(p => p.id !== projectId) } : c
      )
      lsSet(LS_COMPANIES, next)
      return next
    })
    if (tokenRef.current) {
      apiDeleteProject(tokenRef.current, companyId, projectId).catch(() => {})
    }
  }, [])

  return {
    // State (read)
    tasks,
    activity,
    companies,
    settings,
    loading,

    // Setters (for bulk/direct operations like import, drag-drop)
    setTasks,
    setActivity,
    setCompanies,
    setSettings,

    // Granular actions (preferred — these handle API + localStorage)
    addTask,
    updateTask,
    deleteTask,
    addActivityItem,
    addCompany,
    deleteCompany,
    addProject,
    removeProject,
  }
}
