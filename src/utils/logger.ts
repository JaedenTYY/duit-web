/* eslint-disable no-console */
const isProd = import.meta.env.PROD

export const logger = {
  log: (...args: any[]) => {
    if (!isProd) console.log('[Duit LOG]', ...args)
  },
  warn: (...args: any[]) => {
    if (!isProd) console.warn('[Duit WARN]', ...args)
  },
  error: (...args: any[]) => {
    if (!isProd) console.error('[Duit ERROR]', ...args)
  },
}
