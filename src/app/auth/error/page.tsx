'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-offwhite">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
                        Authentication Error
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {error || 'An error occurred during authentication'}
                    </p>
                </div>
                <div className="mt-8 space-y-4">
                    <Link
                        href="/"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Return to Home
                    </Link>
                    <Link
                        href="/auth/signin"
                        className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Try Again
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthError() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-offwhite">
                <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mt-4"></div>
                    </div>
                </div>
            </div>
        }>
            <AuthErrorContent />
        </Suspense>
    );
} 