import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-white border-slate-200 shadow-md">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          The requested Campus Nexus portal page does not exist or has been relocated.
        </p>

        <div className="mt-8">
          <Link href="/">
            <Button variant="primary" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Portal Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
