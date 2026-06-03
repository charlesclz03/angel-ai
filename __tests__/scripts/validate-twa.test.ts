import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { validateTwaReadiness } from '@/scripts/validate-twa.mjs'

const tempDirs: string[] = []

describe('validateTwaReadiness', () => {
  afterEach(() => {
    tempDirs.splice(0).forEach((directory) => {
      fs.rmSync(directory, { recursive: true, force: true })
    })
  })

  it('reports missing manifest icons as a readiness failure', () => {
    const tempDir = makeTempDir()
    const publicDir = path.join(tempDir, 'public')
    fs.mkdirSync(path.join(publicDir, '.well-known'), { recursive: true })
    fs.writeFileSync(
      path.join(publicDir, 'manifest.json'),
      JSON.stringify({
        start_url: '/chat',
        id: '/chat',
        display: 'standalone',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      })
    )
    fs.writeFileSync(path.join(publicDir, 'sw.js'), 'self.addEventListener()')
    fs.writeFileSync(
      path.join(publicDir, '.well-known', 'assetlinks.json'),
      JSON.stringify([
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'ai.angel.app',
            sha256_cert_fingerprints: ['AA:BB'],
          },
        },
      ])
    )

    const result = validateTwaReadiness(tempDir)

    expect(result.valid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/icon-192x192\.png/),
        expect.stringMatching(/icon-512x512\.png/),
      ])
    )
  })

  it('passes when manifest, icons, service worker, and asset links are present', () => {
    const tempDir = makeTempDir()
    const publicDir = path.join(tempDir, 'public')
    fs.mkdirSync(path.join(publicDir, '.well-known'), { recursive: true })
    fs.writeFileSync(
      path.join(publicDir, 'manifest.json'),
      JSON.stringify({
        start_url: '/chat',
        id: '/chat',
        display: 'standalone',
        icons: [
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      })
    )
    fs.writeFileSync(path.join(publicDir, 'sw.js'), 'self.addEventListener()')
    fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), 'ok')
    fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), 'ok')
    fs.writeFileSync(path.join(publicDir, 'icon-maskable-512x512.png'), 'ok')
    fs.writeFileSync(
      path.join(publicDir, '.well-known', 'assetlinks.json'),
      JSON.stringify([
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: {
            namespace: 'android_app',
            package_name: 'ai.angel.app',
            sha256_cert_fingerprints: ['AA:BB'],
          },
        },
      ])
    )

    const result = validateTwaReadiness(tempDir)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

function makeTempDir() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'angel-ai-twa-'))
  tempDirs.push(directory)
  return directory
}
