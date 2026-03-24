const request = require('supertest');
const express = require('express');

const mockCreateClient = jest.fn();
const mockRequireAuth = jest.fn((req, _res, next) => {
  req.user = { id: 'user-123', email: 'robin@example.com' };
  next();
});

jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args) => mockCreateClient(...args),
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (...args) => mockRequireAuth(...args),
}));

function makeSupabaseDouble({ profile, upsertResult, selectError = null, upsertError = null }) {
  const single = jest.fn().mockResolvedValue({ data: profile, error: selectError });
  const select = jest.fn(() => ({ eq: jest.fn(() => ({ single })) }));
  const upsertSingle = jest.fn().mockResolvedValue({ data: upsertResult, error: upsertError });
  const upsertSelect = jest.fn(() => ({ single: upsertSingle }));
  const upsert = jest.fn(() => ({ select: upsertSelect }));
  const from = jest.fn(() => ({ select, upsert }));

  return { client: { from }, from, select, single, upsert, upsertSelect, upsertSingle };
}

describe('broker sync routes', () => {
  let app;
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.ENABLE_SNAPTRADE_BROKER_SYNC = 'false';
    app = express();
    app.use(express.json());
  });

  test('GET returns default Robinhood-first broker sync payload when no preferences exist', async () => {
    const supabase = makeSupabaseDouble({ profile: { preferences: {} } });
    mockCreateClient.mockReturnValue(supabase.client);

    const router = require('../routes/brokerSync');
    app.use('/api/integrations/broker-sync', router);

    const res = await request(app).get('/api/integrations/broker-sync');

    expect(res.status).toBe(200);
    expect(res.body.brokerSync.featureEnabled).toBe(false);
    expect(res.body.brokerSync.preferredBroker).toBe('robinhood');
    expect(res.body.brokerSync.provider).toBe('snaptrade');
    expect(res.body.brokerSync.status).toBe('pending_setup');
  });

  test('PUT persists Robinhood waitlist preferences into user profile', async () => {
    const existingPreferences = { theme: 'dark' };
    const savedProfile = {
      id: 'user-123',
      preferences: {
        theme: 'dark',
        brokerSync: {
          provider: 'snaptrade',
          preferredBroker: 'robinhood',
          emailUpdates: true,
          requestedAccess: true,
          status: 'waitlist',
        },
      },
    };
    const supabase = makeSupabaseDouble({
      profile: { id: 'user-123', preferences: existingPreferences },
      upsertResult: savedProfile,
    });
    mockCreateClient.mockReturnValue(supabase.client);

    const router = require('../routes/brokerSync');
    app.use('/api/integrations/broker-sync', router);

    const res = await request(app)
      .put('/api/integrations/broker-sync')
      .send({ preferredBroker: 'robinhood', requestedAccess: true, emailUpdates: true });

    expect(res.status).toBe(200);
    expect(supabase.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-123',
        preferences: expect.objectContaining({
          theme: 'dark',
          brokerSync: expect.objectContaining({
            provider: 'snaptrade',
            preferredBroker: 'robinhood',
            requestedAccess: true,
            emailUpdates: true,
            status: 'waitlist',
          }),
        }),
      }),
      { onConflict: 'id' }
    );
    expect(res.body.brokerSync.status).toBe('waitlist');
  });

  test('PUT rejects unsupported brokers so Robinhood stays the only broker for phase 3', async () => {
    const supabase = makeSupabaseDouble({ profile: { preferences: {} } });
    mockCreateClient.mockReturnValue(supabase.client);

    const router = require('../routes/brokerSync');
    app.use('/api/integrations/broker-sync', router);

    const res = await request(app)
      .put('/api/integrations/broker-sync')
      .send({ preferredBroker: 'schwab' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Robinhood/i);
  });
});
