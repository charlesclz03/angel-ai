# Angel AI Media And Voice Runbook

Purpose:

- describe the current rich-input behavior and the remaining production gaps

Audience:

- coding agents
- maintainers

Status:

- active

Source of truth scope:

- media and voice-note behavior

Last updated:

- 2026-03-25

Related docs:

- `lib/angel/media.ts`
- `lib/angel/chat-service.ts`
- `components/organisms/AngelChat.tsx`

## Current Supported Inputs

- `TEXT`
- `LINK`
- `IMAGE`
- `VOICE_NOTE`

Attachment storage currently uses `MessageAttachment`.

## What Happens Today

### Links

- link text is normalized
- preview metadata is generated
- a `LINK_PREVIEW` attachment is stored
- Angel replies can reference the shared link

### Images

- image attachment is uploaded through the media proxy when durable storage is configured
- optional user note is stored as message text
- Angel replies can react to the shared image context

### Voice notes

- voice file is stored as a `VOICE_AUDIO` attachment
- chat tries to upload the file through `/api/media/upload` and falls back to a local data URL when storage is unavailable
- if `OPENAI_API_KEY` exists, transcription calls the OpenAI Audio API using `OPENAI_TRANSCRIPTION_MODEL` or the default `gpt-4o-transcribe`
- stored `/api/media/view/...` voice-note assets can now be downloaded and transcribed server-side as well
- otherwise the app uses a deterministic local fallback transcript so the flow still works

### Angel voice replies

- subscriber and privileged threads can request a bounded AI voice preview for saved Angel text messages
- the generated voice is stored as a `VOICE_AUDIO` attachment on the Angel message itself
- if Supabase storage is configured, the audio is persisted through the same media bucket and view proxy
- the preview is explicitly labeled as AI-generated in the chat UI
- monthly caps are currently `CORE: 5` and `PRO: 25`

## Primary Files

- UI: `components/organisms/AngelChat.tsx`
- action boundary: `app/chat/actions.ts`
- normalization + summaries: `lib/angel/media.ts`
- speech generation: `lib/angel/voice-service.ts`
- persistence + reply flow: `lib/angel/chat-service.ts`

## Current Production Gaps

- live OpenAI keys are still required to verify the provider-backed transcription and Angel voice path end-to-end
- free-tier access intentionally does not expose generated Angel voice previews
- store-quality outbound voice still needs real-world smoke coverage before it should be treated as launch-verified

## Verification Suggestions

- send a link and confirm the reply references the linked content
- send an image and confirm attachment rendering survives reload when the proxy path is storage-backed
- send a voice note with and without `OPENAI_API_KEY`
- verify a stored `/api/media/view/...` voice note still transcribes correctly
- generate an Angel voice reply on a subscriber thread and confirm the audio attachment appears on the message
- confirm media turns can still generate memory entries and summary refreshes
