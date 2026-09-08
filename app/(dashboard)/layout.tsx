'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
  Store,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { RealtimeOrderNotification } from './RealtimeNotification';
import ThemeToggle from '@/components/theme/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'لوحة القيادة', icon: LayoutDashboard },
    { href: '/orders', label: 'الطلبات والمبيعات', icon: ShoppingBag },
    { href: '/products', label: 'إدارة المنتجات', icon: Package },
    { href: '/offers', label: 'العروض والبنرات', icon: Tag },
    { href: '/settings', label: 'إعدادات المتجر', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('تم تسجيل الخروج بنجاح');
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex bg-stone-100/70 dark:bg-stone-950 transition-colors">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-300 border-l border-stone-800 p-5 shrink-0 select-none">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-4 mb-6 border-b border-stone-800">
          <div className="w-10 h-10 rounded-xl bg-brass-500 text-stone-950 flex items-center justify-center font-black text-lg shadow-sm">
            G
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wide block">GOGO ADMIN</span>
            <span className="text-[11px] text-stone-400">لوحة إدارة المتجر</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brass-500 text-stone-950 shadow-sm'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions: View Storefront & Logout */}
        <div className="pt-4 border-t border-stone-800 space-y-2">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-brass-400" />
              <span>معاينة متجر العميل</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-right"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile Top Navbar */}
        <header className="md:hidden bg-stone-900 text-white p-4 flex items-center justify-between border-b border-stone-800 sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brass-500 text-stone-950 flex items-center justify-center font-bold text-sm">
              G
            </div>
            <span className="font-bold text-sm">GOGO ADMIN</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-stone-800 text-stone-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-stone-900 text-stone-300 p-4 border-b border-stone-800 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-brass-500 text-stone-950' : 'hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-400 font-semibold pt-3 border-t border-stone-800"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        )}

        {/* Top bar with Realtime Status & Quick Actions */}
        <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur border-b border-stone-200/80 dark:border-stone-800 px-6 py-3.5 hidden md:flex items-center justify-between sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <span>مرحباً بك في إدارة</span>
            <span className="font-bold text-stone-900 dark:text-white">Gogo Concrete</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <RealtimeOrderNotification />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

    </div>
  );
}
