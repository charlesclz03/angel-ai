import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function validateTwaReadiness(baseDir = process.cwd()) {
  const errors = []
  const warnings = []

  const publicDir = path.join(baseDir, 'public')
  const manifestPath = path.join(publicDir, 'manifest.json')
  const serviceWorkerPath = path.join(publicDir, 'sw.js')
  const assetLinksPath = path.join(publicDir, '.well-known', 'assetlinks.json')

  if (!fs.existsSync(manifestPath)) {
    errors.push('Missing public/manifest.json.')
  }

  if (!fs.existsSync(serviceWorkerPath)) {
    errors.push('Missing public/sw.js.')
  }

  if (!fs.existsSync(assetLinksPath)) {
    errors.push('Missing public/.well-known/assetlinks.json.')
  }

  let manifest = null
  if (fs.existsSync(manifestPath)) {
    manifest = readJson(manifestPath, errors, 'manifest.json')
  }

  if (manifest && typeof manifest === 'object' && !Array.isArray(manifest)) {
    if (!String(manifest.start_url ?? '').trim()) {
      errors.push('Manifest must define start_url.')
    }

    if (!String(manifest.id ?? '').trim()) {
      warnings.push('Manifest should define id for reliable install identity.')
    }

    if (manifest.display !== 'standalone') {
      errors.push('Manifest display must be standalone for TWA readiness.')
    }

    const icons = Array.isArray(manifest.icons) ? manifest.icons : []
    if (icons.length === 0) {
      errors.push('Manifest must declare installable icons.')
    }

    const requiredSizes = ['192x192', '512x512']
    for (const size of requiredSizes) {
      const icon = icons.find((candidate) => candidate?.sizes === size)

      if (!icon) {
        errors.push(`Manifest is missing a ${size} icon entry.`)
        continue
      }

      const src = String(icon.src ?? '')
      const iconPath = path.join(publicDir, src.replace(/^\//, ''))
      if (!src || !fs.existsSync(iconPath)) {
        errors.push(`Manifest icon ${src || `(missing src for ${size})`} does not exist in public/.`)
      }
    }

    const maskableIcon = icons.find((candidate) =>
      String(candidate?.purpose ?? '')
        .split(/\s+/)
        .includes('maskable')
    )

    if (!maskableIcon) {
      warnings.push('Manifest should include a maskable icon for Android polish.')
    }
  }

  const assetLinks = fs.existsSync(assetLinksPath)
    ? readJson(assetLinksPath, errors, 'assetlinks.json')
    : null

  if (assetLinks && !Array.isArray(assetLinks)) {
    errors.push('assetlinks.json must be an array.')
  }

  if (Array.isArray(assetLinks)) {
    if (assetLinks.length === 0) {
      errors.push('assetlinks.json must include at least one Android target.')
    }

    assetLinks.forEach((entry, index) => {
      const relation = Array.isArray(entry?.relation) ? entry.relation : []
      const target = entry?.target ?? {}
      const fingerprints = Array.isArray(target?.sha256_cert_fingerprints)
        ? target.sha256_cert_fingerprints
        : []

      if (!relation.includes('delegate_permission/common.handle_all_urls')) {
        errors.push(
          `assetlinks.json entry ${index + 1} must include delegate_permission/common.handle_all_urls.`
        )
      }

      if (target?.namespace !== 'android_app') {
        errors.push(`assetlinks.json entry ${index + 1} must target android_app.`)
      }

      if (!String(target?.package_name ?? '').trim()) {
        errors.push(
          `assetlinks.json entry ${index + 1} must include a package_name.`
        )
      }

      if (fingerprints.length === 0) {
        errors.push(
          `assetlinks.json entry ${index + 1} must include at least one SHA256 certificate fingerprint.`
        )
      }
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

function readJson(filePath, errors, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    errors.push(
      `Could not parse ${label}: ${error instanceof Error ? error.message : 'unknown error'}.`
    )
    return null
  }
}

const currentFilePath = fileURLToPath(import.meta.url)

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  const result = validateTwaReadiness(process.cwd())

  if (result.errors.length === 0) {
    console.log('TWA readiness check passed.')
  } else {
    console.error('TWA readiness check failed:')
    result.errors.forEach((error) => console.error(`- ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn('Warnings:')
    result.warnings.forEach((warning) => console.warn(`- ${warning}`))
  }

  process.exit(result.valid ? 0 : 1)
}
