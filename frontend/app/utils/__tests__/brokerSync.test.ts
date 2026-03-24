import { getBrokerSyncCta, normalizeBrokerSyncState, type BrokerSyncState } from '../brokerSync'

describe('normalizeBrokerSyncState', () => {
  it('returns Robinhood-first defaults when API state is missing', () => {
    const state = normalizeBrokerSyncState(null)
    expect(state.preferredBroker).toBe('robinhood')
    expect(state.provider).toBe('snaptrade')
    expect(state.status).toBe('pending_setup')
    expect(state.featureEnabled).toBe(false)
  })

  it('preserves waitlist state from the API payload', () => {
    const state = normalizeBrokerSyncState({
      provider: 'snaptrade',
      preferredBroker: 'robinhood',
      featureEnabled: false,
      launchStage: 'pending_setup',
      status: 'waitlist',
      requestedAccess: true,
      emailUpdates: true,
      connectionReady: false,
      lastRequestedAt: '2026-03-23T23:00:00.000Z',
      lastUpdatedAt: '2026-03-23T23:00:00.000Z',
    })
    expect(state.status).toBe('waitlist')
    expect(state.requestedAccess).toBe(true)
    expect(state.emailUpdates).toBe(true)
  })
})

describe('getBrokerSyncCta', () => {
  it('shows waitlist copy when Robinhood access has been requested', () => {
    const state: BrokerSyncState = {
      provider: 'snaptrade',
      preferredBroker: 'robinhood',
      featureEnabled: false,
      launchStage: 'pending_setup',
      status: 'waitlist',
      requestedAccess: true,
      emailUpdates: true,
      connectionReady: false,
      lastRequestedAt: null,
      lastUpdatedAt: null,
    }

    expect(getBrokerSyncCta(state)).toEqual({
      label: 'On the Robinhood waitlist',
      helper: 'We saved your interest. TradVue will unlock the SnapTrade connection flow after provider setup is complete.',
    })
  })

  it('shows connect copy only when the feature flag is enabled', () => {
    const state = normalizeBrokerSyncState({ featureEnabled: true, launchStage: 'beta' })
    expect(getBrokerSyncCta(state)).toEqual({
      label: 'Connect Robinhood',
      helper: 'Robinhood is the first broker in line for auto-sync via SnapTrade. Finish provider setup and connection launch from Integrations.',
    })
  })
})
