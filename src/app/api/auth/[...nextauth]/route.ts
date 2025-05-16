import NextAuth, { DefaultSession, NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createUser, getUserByEmail, UserStats } from '@/lib/models/user';
import { ObjectId } from 'mongodb';

declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id?: string;
            stats?: UserStats;
        } & DefaultSession['user'];
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (!user.email) return false;

            try {
                const existingUser = await getUserByEmail(user.email);

                if (!existingUser) {
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
                console.error('Error during sign in:', error);
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
    },
    pages: {
        signIn: '/auth/signin',
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 