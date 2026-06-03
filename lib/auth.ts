import { PrismaAdapter } from '@next-auth/prisma-adapter'
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type Session,
} from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

import { prisma } from '@/lib/prisma'

export type AuthenticatedUser = DefaultSession['user'] & {
  id: string
  role: string
}

export type AuthSession = Session & {
  user: AuthenticatedUser
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'database',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (!session.user) {
        return session
      }

      const authUser = user as { id: string; role?: string }

      return {
        ...session,
        user: {
          ...session.user,
          id: authUser.id,
          role: authUser.role ?? 'USER',
        },
      } as AuthSession
    },
  },
}

export async function getServerAuthSession(): Promise<AuthSession | null> {
  return (await getServerSession(authOptions)) as AuthSession | null
}

export async function requireServerAuthSession(
  message = 'Please sign in before continuing.'
): Promise<AuthSession> {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    throw new Error(message)
  }

  return session
}
