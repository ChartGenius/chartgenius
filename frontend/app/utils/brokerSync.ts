export type BrokerSyncStatus = 'pending_setup' | 'waitlist' | 'beta'

export interface BrokerSyncState {
  provider: 'snaptrade'
  preferredBroker: 'robinhood'
  featureEnabled: boolean
  launchStage: 'pending_setup' | 'beta'
  status: BrokerSyncStatus
  requestedAccess: boolean
  emailUpdates: boolean
  connectionReady: boolean
  lastRequestedAt: string | null
  lastUpdatedAt: string | null
}

const DEFAULT_STATE: BrokerSyncState = {
  provider: 'snaptrade',
  preferredBroker: 'robinhood',
  featureEnabled: false,
  launchStage: 'pending_setup',
  status: 'pending_setup',
  requestedAccess: false,
  emailUpdates: false,
  connectionReady: false,
  lastRequestedAt: null,
  lastUpdatedAt: null,
}

export function normalizeBrokerSyncState(state: Partial<BrokerSyncState> | null | undefined): BrokerSyncState {
  return {
    ...DEFAULT_STATE,
    ...(state || {}),
    provider: 'snaptrade',
    preferredBroker: 'robinhood',
    status: state?.requestedAccess ? 'waitlist' : (state?.status || DEFAULT_STATE.status),
  }
}

export function getBrokerSyncCta(state: BrokerSyncState): { label: string; helper: string } {
  if (state.status === 'waitlist') {
    return {
      label: 'On the Robinhood waitlist',
      helper: 'We saved your interest. TradVue will unlock the SnapTrade connection flow after provider setup is complete.',
    }
  }

  if (state.featureEnabled) {
    return {
      label: 'Connect Robinhood',
      helper: 'Robinhood is the first broker in line for auto-sync via SnapTrade. Finish provider setup and connection launch from Integrations.',
    }
  }

  return {
    label: 'Join Robinhood waitlist',
    helper: 'Robinhood is the first broker planned for auto-sync. Join the waitlist now and keep using CSV import until SnapTrade is configured.',
  }
}
