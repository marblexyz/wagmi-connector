import { MarbleRPCError } from 'marble-sdk'
import { Connector } from 'wagmi'

export class SwitchChainError extends MarbleRPCError {
  name = 'SwitchChainError'

  constructor(error: unknown) {
    super(4902, 'Error switching chain', error)
  }
}

export class SwitchChainNotSupportedError extends Error {
  name = 'SwitchChainNotSupportedError'

  constructor({ connector }: { connector: Connector }) {
    super(`"${connector.name}" does not support programmatic chain switching.`)
  }
}

export class UserRejectedRequestError extends MarbleRPCError {
  name = 'UserRejectedRequestError'

  constructor(error: unknown) {
    super(4001, 'User rejected request', error)
  }
}
