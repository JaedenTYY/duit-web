import { describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import { resolveSafeInternalRedirect } from './safeRedirect'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/dashboard', name: 'dashboard', component: {} },
    { path: '/settings/privacy', name: 'privacy-settings', component: {} },
    { path: '/login', name: 'login', component: {} },
    { path: '/register', name: 'register', component: {} },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: {} },
  ],
})

describe('resolveSafeInternalRedirect', () => {
  it('accepts an internal router-resolvable path with query and hash', () => {
    expect(resolveSafeInternalRedirect('/settings/privacy?tab=export#download', router))
      .toBe('/settings/privacy?tab=export#download')
  })

  it('rejects external absolute redirects', () => {
    expect(resolveSafeInternalRedirect('https://evil.example', router)).toBeNull()
    expect(resolveSafeInternalRedirect('http://evil.example', router)).toBeNull()
  })

  it('rejects protocol-relative and scheme-bearing redirects', () => {
    expect(resolveSafeInternalRedirect('//evil.example', router)).toBeNull()
    expect(resolveSafeInternalRedirect('javascript:alert(1)', router)).toBeNull()
    expect(resolveSafeInternalRedirect('data:text/html,evil', router)).toBeNull()
  })

  it('rejects login/register loop redirects and unknown routes', () => {
    expect(resolveSafeInternalRedirect('/login?redirect=/dashboard', router)).toBeNull()
    expect(resolveSafeInternalRedirect('/register', router)).toBeNull()
    expect(resolveSafeInternalRedirect('/does-not-exist', router)).toBeNull()
  })
})
