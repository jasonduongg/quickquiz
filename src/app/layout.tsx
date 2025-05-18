import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "QuickQuiz - AI-Powered Quiz Generator",
  description: "Generate and take quizzes powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className={`antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
