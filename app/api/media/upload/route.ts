import { NextResponse } from 'next/server'
import { getServerAuthSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Fallback for mocked environments
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured. Using mock path.')
      return NextResponse.json({
        path: `mock/${session.user.id}/${Date.now()}-${file.name}`,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const filePath = `${session.user.id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('media-attachments')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload' }, { status: 500 })
    }

    return NextResponse.json({ path: filePath })
  } catch (error) {
    console.error('Media upload proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
