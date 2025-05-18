import { DefaultSession, NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createUser, getUserByEmail, UserStats } from '@/lib/models/user';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id?: string;
            stats?: UserStats;
        } & DefaultSession['user'];
    }
}

export const authOptions: NextAuthOptions = {
    debug: true,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) {
                return false;
            }

            try {
                const existingUser = await getUserByEmail(user.email);

                if (!existingUser) {
                    // Create new user if doesn't exist
                    await createUser({
                        email: user.email,
                        name: user.name || '',
                        image: user.image || undefined,
                        stats: {
                            totalQuizzesCreated: 0,
                            totalQuizzesAttempted: 0,
                            currentStreak: 0,
                        },
                    });
                }

                return true;
            } catch (error) {
                return false;
            }
        },
        async session({ session, token }) {
            if (session.user?.email) {
                const user = await getUserByEmail(session.user.email);
                if (user) {
                    session.user.id = user._id?.toString();
                    session.user.stats = user.stats;
                }
            }
            return session;
        },
        async jwt({ token, account, profile }) {
            return token;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
}; 