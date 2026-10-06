import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ToastProvider } from '@/components/ui/toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Campus Nexus | Student Development & Intelligence Portal',
  description:
    'Institutional portal connecting Students, Faculty Mentors, and HOD for skill tracking, project showcases, certifications, internships, innovation, and department intelligence.',
  keywords: [
    'Campus Nexus',
    'Student Development',
    'Mentoring Portal',
    'Skill Tracking',
    'Department Intelligence',
    'Innovation Hub',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
