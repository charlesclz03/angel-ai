---
name: security-audit
description: Audit Angel AI auth, billing, uploads, memory privacy, push, and external-tool boundaries. Use when security posture changes or before shipping sensitive app features.
---

# Security Audit

Use this skill for Angel-specific application security reviews.

## Priority Areas

- auth and session handling
- Stripe webhooks and billing access
- uploads and media processing
- memory and dossier privacy
- social connector tokens and scan jobs
- push subscription handling
- prompt injection or tool abuse risks

## Workflow

1. Map the sensitive data and trust boundaries.
2. Review authorization before UI polish.
3. Check headers, rate limits, validation, and secrets handling.
4. Review logs and error messages for data leakage.
5. Capture concrete findings with remediation steps.

## Guardrails

- prefer least privilege
- assume attachments and external content are hostile
- do not expose sensitive user data for operator convenience

