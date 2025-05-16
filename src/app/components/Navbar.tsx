'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
    const [isSignedIn, setIsSignedIn] = useState(false);

    return (
        <nav className="bg-transparent pt-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="text-3xl font-bold text-offwhite">
                        QuickQuiz
                    </Link>

                    {/* Auth Buttons */}
                    <div className="flex items-center">
                        {isSignedIn ? (
                            <button
                                onClick={() => setIsSignedIn(false)}
                                className="px-3 py-1.5 text-sm font-medium text-offwhite border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsSignedIn(true)}
                                className="px-3 py-1.5 text-sm font-medium text-offwhite border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-800/70 focus:outline-none focus:ring-1 focus:ring-offwhite/30 focus:ring-offset-2 focus:ring-offset-black transition-colors"
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