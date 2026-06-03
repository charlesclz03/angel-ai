---
name: push-notification-audit
description: Audit Angel AI web push, service worker, installability, VAPID, and notification UX. Use when implementing or reviewing push subscriptions, service-worker handlers, manifests, and install prompts.
---

# Push Notification Audit

Use this skill when Angel's proactive contact or installability changes.

## Focus

- service worker `push` and `notificationclick`
- VAPID setup
- subscription lifecycle
- install prompt UX
- manifest and icon coverage
- iOS Home Screen caveats
- Android TWA alignment

## Workflow

1. Review manifest, service worker, and subscription model together.
2. Verify push permissions and subscription persistence.
3. Check notification click routing and deep links.
4. Confirm installability assets and standalone behavior.
5. Document any env vars, commands, or device caveats.

## Guardrails

- no silent push spam
- no notification flow without unsubscribe or disable paths
- treat subscriptions as sensitive user data

