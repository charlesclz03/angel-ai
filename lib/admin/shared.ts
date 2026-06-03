export function formatAdminUserLabel({
  preferredName,
  name,
  email,
  fallbackId,
}: {
  preferredName: string | null
  name: string | null
  email: string | null
  fallbackId: string
}) {
  return preferredName || name || email || `User ${fallbackId.slice(0, 8)}`
}
