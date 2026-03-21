/**
 * Dashboard Routes — Supabase REST
 *
 * NOTE: Migrated from db.query (direct Postgres/IPv6) to Supabase REST
 * (HTTPS/IPv4) to fix intermittent connectivity issues on Render.
 *
 * Tasks
 *   GET    /api/dashboard/tasks
 *   POST   /api/dashboard/tasks
 *   PUT    /api/dashboard/tasks/:id
 *   DELETE /api/dashboard/tasks/:id
 *   POST   /api/dashboard/tasks/sync
 *
 * Activity
 *   GET    /api/dashboard/activity
 *   POST   /api/dashboard/activity
 *
 * Companies
 *   GET    /api/dashboard/companies
 *   POST   /api/dashboard/companies
 *   PUT    /api/dashboard/companies/:id
 *   DELETE /api/dashboard/companies/:id
 *   POST   /api/dashboard/companies/:id/projects
 *   DELETE /api/dashboard/companies/:companyId/projects/:projectId
 *
 * Settings
 *   GET    /api/dashboard/settings
 *   POST   /api/dashboard/settings
 *
 * Agents
 *   GET    /api/dashboard/agents
 *   PUT    /api/dashboard/agents/:name
 *
 * Notifications
 *   GET    /api/dashboard/notifications
 *   POST   /api/dashboard/notifications
 *   PUT    /api/dashboard/notifications/:id/read
 *   PUT    /api/dashboard/notifications/read-all
 *   DELETE /api/dashboard/notifications/:id
 *
 * Stats
 *   GET    /api/dashboard/stats
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// All dashboard routes require auth
router.use(requireAuth);

// ═══════════════════════════════════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/tasks', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_tasks')
      .select('id,title,description,status,project,company,agent,priority,due_date,created_at,completed_at,notes')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const tasks = (data || []).map(r => ({
      ...r,
      dueDate: r.due_date,
      createdAt: r.created_at,
      completedAt: r.completed_at,
    }));
    res.json({ tasks });
  } catch (e) {
    console.error('[Dashboard] GET tasks error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/tasks', async (req, res) => {
  try {
    const { id, title, description, status, project, company, agent, priority, dueDate, createdAt, completedAt, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const taskId = id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('dashboard_tasks')
      .insert({
        id: taskId,
        user_id: req.user.id,
        title,
        description: description || '',
        status: status || 'todo',
        project: project || '',
        company: company || '',
        agent: agent || '',
        priority: priority || 'medium',
        due_date: dueDate || '',
        created_at: createdAt || new Date().toISOString(),
        completed_at: completedAt || '',
        notes: notes || '',
      })
      .select('id,title,description,status,project,company,agent,priority,due_date,created_at,completed_at,notes')
      .single();
    if (error) throw error;

    // Auto-log activity (fire-and-forget)
    const activityId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const activityType = (status || 'todo') === 'done' ? 'task_complete' : 'task_start';
    const activityMsg = (status || 'todo') === 'done'
      ? `${agent || 'Someone'} completed: ${title}`
      : `Task created: ${title}`;
    supabase.from('dashboard_activity').insert({
      id: activityId, user_id: req.user.id, type: activityType,
      message: activityMsg, agent: agent || '', project: project || '', timestamp: new Date().toISOString(),
    }).catch(() => {});

    res.json({ task: { ...data, dueDate: data.due_date, createdAt: data.created_at, completedAt: data.completed_at } });
  } catch (e) {
    console.error('[Dashboard] POST task error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, project, company, agent, priority, dueDate, completedAt, notes } = req.body;
    const supabase = getSupabase();

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (project !== undefined) updates.project = project;
    if (company !== undefined) updates.company = company;
    if (agent !== undefined) updates.agent = agent;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (completedAt !== undefined) updates.completed_at = completedAt;
    if (notes !== undefined) updates.notes = notes;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('dashboard_tasks')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id,title,description,status,project,company,agent,priority,due_date,created_at,completed_at,notes')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Task not found' });

    if (status === 'done') {
      const activityId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      supabase.from('dashboard_activity').insert({
        id: activityId, user_id: req.user.id, type: 'task_complete',
        message: `${data.agent || 'Someone'} completed: ${data.title}`,
        agent: data.agent || '', project: data.project || '', timestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    res.json({ task: { ...data, dueDate: data.due_date, createdAt: data.created_at, completedAt: data.completed_at } });
  } catch (e) {
    console.error('[Dashboard] PUT task error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_tasks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] DELETE task error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/tasks/sync', async (req, res) => {
  try {
    const { tasks = [] } = req.body;
    let imported = 0;
    const supabase = getSupabase();
    for (const t of tasks) {
      if (!t.id || !t.title) continue;
      await supabase.from('dashboard_tasks').upsert(
        {
          id: t.id, user_id: req.user.id, title: t.title, description: t.description || '',
          status: t.status || 'todo', project: t.project || '', company: t.company || '',
          agent: t.agent || '', priority: t.priority || 'medium', due_date: t.dueDate || '',
          created_at: t.createdAt || new Date().toISOString(), completed_at: t.completedAt || '', notes: t.notes || '',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      imported++;
    }
    res.json({ ok: true, imported });
  } catch (e) {
    console.error('[Dashboard] POST tasks/sync error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/activity', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const { data, error } = await getSupabase()
      .from('dashboard_activity')
      .select('id,type,message,agent,project,timestamp')
      .eq('user_id', req.user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ activity: data || [] });
  } catch (e) {
    console.error('[Dashboard] GET activity error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/activity', async (req, res) => {
  try {
    const { id, type, message, agent, project, timestamp } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const activityId = id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    const { data, error } = await getSupabase()
      .from('dashboard_activity')
      .insert({ id: activityId, user_id: req.user.id, type: type || 'update', message, agent: agent || '', project: project || '', timestamp: timestamp || new Date().toISOString() })
      .select('id,type,message,agent,project,timestamp')
      .single();
    if (error) throw error;
    res.json({ activity: data });
  } catch (e) {
    console.error('[Dashboard] POST activity error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANIES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/companies', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data: companies, error } = await supabase
      .from('dashboard_companies')
      .select('id,name')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const result = [];
    for (const c of (companies || [])) {
      const { data: projects } = await supabase
        .from('dashboard_projects')
        .select('id,name,category')
        .eq('company_id', c.id)
        .order('name', { ascending: true });
      result.push({ ...c, projects: projects || [] });
    }
    res.json({ companies: result });
  } catch (e) {
    console.error('[Dashboard] GET companies error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/companies', async (req, res) => {
  try {
    const { id, name, projects } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const companyId = id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    const supabase = getSupabase();

    await supabase.from('dashboard_companies').upsert({ id: companyId, user_id: req.user.id, name }, { onConflict: 'id' });

    const projRows = [];
    if (projects && Array.isArray(projects)) {
      for (const p of projects) {
        const projId = p.id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
        const { data: pr } = await supabase
          .from('dashboard_projects')
          .upsert({ id: projId, company_id: companyId, user_id: req.user.id, name: p.name, category: p.category || '' }, { onConflict: 'id' })
          .select('id,name,category')
          .single();
        if (pr) projRows.push(pr);
      }
    }

    if (!projects || !projects.length) {
      const { data: existing } = await supabase.from('dashboard_projects').select('id,name,category').eq('company_id', companyId);
      projRows.push(...(existing || []));
    }

    res.json({ company: { id: companyId, name, projects: projRows } });
  } catch (e) {
    console.error('[Dashboard] POST company error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/companies/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const { data, error } = await getSupabase()
      .from('dashboard_companies')
      .update({ name })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Company not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] PUT company error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/companies/:id', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_companies')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Company not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] DELETE company error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.post('/companies/:id/projects', async (req, res) => {
  try {
    const { id: projId, name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const supabase = getSupabase();

    const { data: co, error: coErr } = await supabase
      .from('dashboard_companies')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (coErr) throw coErr;
    if (!co) return res.status(404).json({ error: 'Company not found' });

    const projectId = projId || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    const { data, error } = await supabase
      .from('dashboard_projects')
      .upsert({ id: projectId, company_id: req.params.id, user_id: req.user.id, name, category: category || '' }, { onConflict: 'id' })
      .select('id,name,category')
      .single();
    if (error) throw error;
    res.json({ project: data });
  } catch (e) {
    console.error('[Dashboard] POST project error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/companies/:companyId/projects/:projectId', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_projects')
      .delete()
      .eq('id', req.params.projectId)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] DELETE project error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/settings', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_settings')
      .select('settings')
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (error) throw error;
    res.json({ settings: data?.settings || {} });
  } catch (e) {
    res.json({ settings: {} });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'settings object required' });
    }
    const { error } = await getSupabase()
      .from('dashboard_settings')
      .upsert({ user_id: req.user.id, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.warn('[Dashboard] settings persist error:', e.message);
    res.json({ ok: true, warn: 'settings not persisted' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FULL SYNC
// ═══════════════════════════════════════════════════════════════════════════════

router.post('/sync', async (req, res) => {
  try {
    const { tasks = [], activity = [], companies = [], settings } = req.body;
    const userId = req.user.id;
    const results = { tasks: 0, activity: 0, companies: 0, projects: 0, settings: false };
    const supabase = getSupabase();

    for (const t of tasks) {
      if (!t.id || !t.title) continue;
      await supabase.from('dashboard_tasks').upsert(
        { id: t.id, user_id: userId, title: t.title, description: t.description || '', status: t.status || 'todo', project: t.project || '', company: t.company || '', agent: t.agent || '', priority: t.priority || 'medium', due_date: t.dueDate || '', created_at: t.createdAt || new Date().toISOString(), completed_at: t.completedAt || '', notes: t.notes || '' },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      results.tasks++;
    }

    for (const a of activity) {
      if (!a.id || !a.message) continue;
      await supabase.from('dashboard_activity').upsert(
        { id: a.id, user_id: userId, type: a.type || 'update', message: a.message, agent: a.agent || '', project: a.project || '', timestamp: a.timestamp || new Date().toISOString() },
        { onConflict: 'id', ignoreDuplicates: true }
      );
      results.activity++;
    }

    for (const c of companies) {
      if (!c.id || !c.name) continue;
      await supabase.from('dashboard_companies').upsert({ id: c.id, user_id: userId, name: c.name }, { onConflict: 'id', ignoreDuplicates: true });
      results.companies++;
      for (const p of (c.projects || [])) {
        if (!p.id || !p.name) continue;
        await supabase.from('dashboard_projects').upsert({ id: p.id, company_id: c.id, user_id: userId, name: p.name, category: p.category || '' }, { onConflict: 'id', ignoreDuplicates: true });
        results.projects++;
      }
    }

    if (settings && typeof settings === 'object') {
      await supabase.from('dashboard_settings').upsert({ user_id: userId, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      results.settings = true;
    }

    res.json({ ok: true, imported: results });
  } catch (e) {
    console.error('[Dashboard] POST sync error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_AGENTS = [
  { id: 'agent-axle', name: 'Axle', role: 'CEO / Orchestrator', status: 'online' },
  { id: 'agent-bolt', name: 'Bolt', role: 'Developer', status: 'online' },
  { id: 'agent-zip', name: 'Zip', role: 'Quick Tasks', status: 'offline' },
];

router.get('/agents', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('dashboard_agents')
      .select('id,name,role,status,last_active,current_task,tasks_completed_today,tokens_used_today')
      .eq('user_id', req.user.id)
      .order('name', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) {
      const seeded = [];
      for (const a of DEFAULT_AGENTS) {
        const { data: inserted } = await supabase
          .from('dashboard_agents')
          .upsert({ id: a.id, user_id: req.user.id, name: a.name, role: a.role, status: a.status }, { onConflict: 'id', ignoreDuplicates: true })
          .select('id,name,role,status,last_active,current_task,tasks_completed_today,tokens_used_today')
          .single();
        if (inserted) seeded.push(inserted);
      }
      return res.json({ agents: seeded.map(a => ({ ...a, lastActive: a.last_active, currentTask: a.current_task, tasksCompletedToday: a.tasks_completed_today, tokensUsedToday: a.tokens_used_today })) });
    }

    res.json({ agents: data.map(a => ({ ...a, lastActive: a.last_active, currentTask: a.current_task, tasksCompletedToday: a.tasks_completed_today, tokensUsedToday: a.tokens_used_today })) });
  } catch (e) {
    console.error('[Dashboard] GET agents error:', e.message);
    res.json({ agents: DEFAULT_AGENTS.map(a => ({ ...a, lastActive: new Date().toISOString(), currentTask: '', tasksCompletedToday: 0, tokensUsedToday: 0 })) });
  }
});

router.put('/agents/:name', async (req, res) => {
  try {
    const { status, currentTask, tasksCompletedToday, tokensUsedToday } = req.body;
    const updates = { last_active: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (currentTask !== undefined) updates.current_task = currentTask;
    if (tasksCompletedToday !== undefined) updates.tasks_completed_today = tasksCompletedToday;
    if (tokensUsedToday !== undefined) updates.tokens_used_today = tokensUsedToday;

    const { data, error } = await getSupabase()
      .from('dashboard_agents')
      .update(updates)
      .eq('user_id', req.user.id)
      .eq('name', req.params.name)
      .select('id,name,role,status,last_active,current_task,tasks_completed_today,tokens_used_today')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent: { ...data, lastActive: data.last_active, currentTask: data.current_task, tasksCompletedToday: data.tasks_completed_today, tokensUsedToday: data.tokens_used_today } });
  } catch (e) {
    console.error('[Dashboard] PUT agent error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/notifications', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const unreadOnly = req.query.unread === 'true';
    const supabase = getSupabase();

    let query = supabase
      .from('dashboard_notifications')
      .select('id,type,title,message,read,created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) throw error;

    const { count: unreadCount } = await supabase
      .from('dashboard_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('read', false);

    res.json({
      notifications: (data || []).map(r => ({ ...r, createdAt: r.created_at })),
      unreadCount: unreadCount || 0,
    });
  } catch (e) {
    console.error('[Dashboard] GET notifications error:', e.message);
    res.json({ notifications: [], unreadCount: 0 });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const { id, type, title, message } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const notifId = id || (Math.random().toString(36).slice(2) + Date.now().toString(36));
    const { data, error } = await getSupabase()
      .from('dashboard_notifications')
      .insert({ id: notifId, user_id: req.user.id, type: type || 'info', title, message: message || '' })
      .select('id,type,title,message,read,created_at')
      .single();
    if (error) throw error;
    res.json({ notification: { ...data, createdAt: data.created_at } });
  } catch (e) {
    console.error('[Dashboard] POST notification error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] PUT notification read error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    const { error } = await getSupabase()
      .from('dashboard_notifications')
      .update({ read: true })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] PUT notifications read-all error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  try {
    const { data, error } = await getSupabase()
      .from('dashboard_notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('[Dashboard] DELETE notification error:', e.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const supabase = getSupabase();

    const [totalRes, completedTodayRes, agentsRes, notifRes] = await Promise.all([
      supabase.from('dashboard_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('dashboard_tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done').gte('completed_at', todayStart.toISOString()),
      supabase.from('dashboard_agents').select('*', { count: 'exact', head: true }).eq('user_id', userId).in('status', ['online', 'busy']),
      supabase.from('dashboard_notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false),
    ]);

    res.json({
      stats: {
        totalTasks: totalRes.count || 0,
        completedToday: completedTodayRes.count || 0,
        activeAgents: agentsRes.count || 0,
        unreadNotifications: notifRes.count || 0,
      },
    });
  } catch (e) {
    console.error('[Dashboard] GET stats error:', e.message);
    res.json({ stats: { totalTasks: 0, completedToday: 0, activeAgents: 0, unreadNotifications: 0 } });
  }
});

module.exports = router;
