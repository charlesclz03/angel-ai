import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const resolvedParams = await params
    const filePath = resolvedParams.path?.join('/')

    if (!filePath) {
      return new Response('File path missing', { status: 400 })
    }

    // Security: Only allow users to view their own media folder
    // In a shared thread, you'd extend this logic to check thread ownership.
    if (!filePath.startsWith(session.user.id + '/')) {
      return new Response('Forbidden access to media', { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return new Response('Storage unavailable', { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate a secure signed URL valid for 1 hour (3600s)
    const { data, error } = await supabase.storage
      .from('media-attachments')
      .createSignedUrl(filePath, 3600)

    if (error || !data?.signedUrl) {
      return new Response('Media not found or error generating URL', {
        status: 404,
      })
    }

    // Redirect the frontend image tag or generic client to the signed URL
    return NextResponse.redirect(data.signedUrl)
  } catch (error) {
    console.error('Media view proxy error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
