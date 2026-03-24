/**
 * Broker Sync Routes — SnapTrade scaffolding (Robinhood first)
 *
 * Safe Phase 3 slice:
 * - does NOT attempt live broker auth/sync
 * - persists user intent + gating state in user_profiles.preferences via Supabase REST
 * - keeps Robinhood as the only supported broker for now
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function featureEnabled() {
  return String(process.env.ENABLE_SNAPTRADE_BROKER_SYNC || '').toLowerCase() === 'true';
}

function normalizeBrokerSyncPreferences(preferences = {}) {
  const brokerSync = preferences?.brokerSync || {};
  const enabled = featureEnabled();
  const requestedAccess = brokerSync.requestedAccess === true;

  return {
    provider: 'snaptrade',
    preferredBroker: 'robinhood',
    featureEnabled: enabled,
    launchStage: enabled ? 'beta' : 'pending_setup',
    status: requestedAccess ? 'waitlist' : 'pending_setup',
    requestedAccess,
    emailUpdates: brokerSync.emailUpdates === true,
    connectionReady: false,
    lastRequestedAt: brokerSync.lastRequestedAt || null,
    lastUpdatedAt: brokerSync.lastUpdatedAt || null,
    legal: {
      aggregator: 'SnapTrade',
      credentialsStoredByTradVue: false,
      liveSyncActive: false,
    },
  };
}

async function loadProfile(userId) {
  const { data, error } = await getSupabase()
    .from('user_profiles')
    .select('id, preferences')
    .eq('id', userId)
    .single();

  return { data, error };
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const { data: profile, error } = await loadProfile(req.user.id);
    if (error) throw error;

    return res.json({
      brokerSync: normalizeBrokerSyncPreferences(profile?.preferences || {}),
    });
  } catch (err) {
    console.error('[BrokerSync] GET error:', err.message);
    return res.status(500).json({ error: 'Failed to load broker sync status' });
  }
});

router.put('/', async (req, res) => {
  try {
    const preferredBroker = String(req.body?.preferredBroker || 'robinhood').trim().toLowerCase();
    const requestedAccess = req.body?.requestedAccess === true;
    const emailUpdates = req.body?.emailUpdates === true;

    if (preferredBroker !== 'robinhood') {
      return res.status(400).json({
        error: 'Robinhood is the only supported auto-sync broker right now',
      });
    }

    const { data: profile, error: loadError } = await loadProfile(req.user.id);
    if (loadError) throw loadError;

    const existingPreferences = profile?.preferences || {};
    const brokerSync = normalizeBrokerSyncPreferences(existingPreferences);
    const now = new Date().toISOString();

    const nextPreferences = {
      ...existingPreferences,
      brokerSync: {
        provider: 'snaptrade',
        preferredBroker: 'robinhood',
        requestedAccess,
        emailUpdates,
        status: requestedAccess ? 'waitlist' : 'pending_setup',
        lastRequestedAt: requestedAccess ? (brokerSync.lastRequestedAt || now) : null,
        lastUpdatedAt: now,
      },
    };

    const { data: savedProfile, error: saveError } = await getSupabase()
      .from('user_profiles')
      .upsert(
        {
          id: req.user.id,
          preferences: nextPreferences,
          updated_at: now,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (saveError) throw saveError;

    return res.json({
      ok: true,
      brokerSync: normalizeBrokerSyncPreferences(savedProfile?.preferences || nextPreferences),
    });
  } catch (err) {
    console.error('[BrokerSync] PUT error:', err.message);
    return res.status(500).json({ error: 'Failed to save broker sync preferences' });
  }
});

module.exports = router;
