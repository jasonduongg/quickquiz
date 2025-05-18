'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav className="bg-transparent pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    <Link href="/" className="font-telegraf text-3xl font-bold">
                        <span className="text-blue-700">Quick</span>
                        <span className="text-gray-900">Quiz</span>
                    </Link>

                    <div className="flex items-center">
                        {status === 'loading' ? (
                            <div className="animate-pulse px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg bg-white">
                                Loading...
                            </div>
                        ) : session ? (
                            <div className="flex items-center space-x-4">
                                {session.user?.image && (
                                    <div className="relative w-8 h-8">
                                        <Image
                                            src={session.user.image}
                                            alt={session.user.name || 'User'}
                                            fill
                                            sizes="32px"
                                            className="rounded-full"
                                            priority={true}
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={() => signOut()}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => signIn('google')}
                                className="px-3 py-1.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white transition-colors"
                            >
                                Sign In
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
} 