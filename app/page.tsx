'use client'
import { Button } from '@/components/ui/button';
import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Pill } from 'lucide-react';

 const Home = () => {
  const router = useRouter();
  
  return (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-8">
      <Pill className="w-10 h-10" />
    </div>
    <h1 className="text-4xl font-bold text-slate-900 mb-4">Smart Medication Manager</h1>
    <p className="text-slate-500 text-lg mb-12 max-w-md">
      Your intelligent health companion. Track schedules, manage inventory, and stay compliant with AI-powered assistance.
    </p>
    <Button onClick={() => {
      //redirect to login
      router.push('/auth/login');
    }} className="w-full max-w-xs py-4 text-lg shadow-xl shadow-blue-200">
      Login / Get Started
      <ChevronRight className="w-5 h-5 ml-2" />
    </Button>
  </div>
)};

export default Home;