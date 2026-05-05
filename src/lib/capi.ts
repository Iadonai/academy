import crypto from 'crypto'

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface CAPIUserData {
  email?: string | null
  phone?: string | null
  firstName?: string | null
}

export async function sendCAPIEvent(
  eventName: string,
  userData: CAPIUserData,
  customData?: Record<string, unknown>
) {
  const pixelId = process.env.META_PIXEL_ID
  const token = process.env.META_CAPI_TOKEN
  if (!pixelId || !token) return

  const now = Math.floor(Date.now() / 1000)
  const eventId = `${eventName.toLowerCase()}_${now}_${Math.random().toString(36).slice(2, 9)}`

  const hashedUserData: Record<string, string> = {}
  if (userData.email) hashedUserData.em = sha256(userData.email)
  if (userData.phone) {
    const cleaned = userData.phone.replace(/[^0-9]/g, '')
    if (cleaned) hashedUserData.ph = sha256('55' + cleaned)
  }
  if (userData.firstName) hashedUserData.fn = sha256(userData.firstName)

  try {
    await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          event_name: eventName,
          event_time: now,
          event_id: eventId,
          action_source: 'website',
          user_data: hashedUserData,
          ...(customData ? { custom_data: customData } : {}),
        }],
        access_token: token,
      }),
    })
  } catch {
    // silently fail — CAPI is best-effort
  }
}
