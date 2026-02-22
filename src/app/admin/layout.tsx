'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Home,
  Users,
  Briefcase,
  Bike,
  ShoppingCart,
  Users2,
  BarChart,
  MessageSquare,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Loader2,
  DollarSign,
  TrendingDown,
  HandCoins,
  Printer,
  Download,
  BookUser,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import logo from '@/app/assets/logo.png';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Manager } from '@/lib/types';
import { getManagerById } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { href: '/admin/dashboard', icon: Home, label: 'لوحة التحكم', permissionId: 'dashboard' },
  { href: '/admin/users', icon: Users, label: 'إدارة المستخدمين', permissionId: 'users' },
  { href: '/admin/employees', icon: Briefcase, label: 'إدارة المدراء', permissionId: 'employees' },
  { href: '/admin/representatives', icon: Bike, label: 'إدارة المندوبين', permissionId: 'representatives' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'إدارة الطلبات', permissionId: 'orders' },
  { href: '/admin/shipping-label', icon: Printer, label: 'إنشاء بوليصة شحن', permissionId: 'shipping_label' },
  { href: '/admin/temporary-users', icon: Users2, label: 'المستخدمين المؤقتين', permissionId: 'temporary_users' },
  { href: '/admin/financial-reports', icon: BarChart, label: 'التقارير المالية', permissionId: 'financial_reports' },
  { href: '/admin/instant-sales', icon: Zap, label: 'مبيعات فورية', permissionId: 'instant_sales' },
  { href: '/admin/deposits', icon: HandCoins, label: 'سجل العربون', permissionId: 'deposits' },
  { href: '/admin/expenses', icon: TrendingDown, label: 'إدارة المصروفات', permissionId: 'expenses' },
  { href: '/admin/creditors', icon: BookUser, label: 'إدارة الذمم', permissionId: 'creditors' },
  { href: '/admin/support-center', icon: MessageSquare, label: 'مركز الدعم', permissionId: 'support' },
  { href: '/admin/notifications', icon: Bell, label: 'إدارة الإشعارات', permissionId: 'notifications' },
  { href: '/admin/data-export', icon: Download, label: 'تصدير البيانات', permissionId: 'data_export' },
  { href: '/admin/exchange-rate', icon: DollarSign, label: 'اسعار الصرف والشحن', permissionId: 'exchange_rate' },
];

const getPageTitle = (pathname: string): string => {
  const pageTitles: { [key: string]: string } = {
    '/admin/dashboard': 'لوحة التحكم الرئيسية',
    '/admin/users': 'إدارة المستخدمين',
    '/admin/employees': 'إدارة المدراء',
    '/admin/representatives': 'إدارة المندوبين',
    '/admin/orders': 'إدارة الطلبات',
    '/admin/orders/add': 'إضافة/تعديل طلب',
    '/admin/shipping-label': 'إنشاء بوليصة شحن يدوية',
    '/admin/shipping-label/history': 'سجل البوليصات اليدوية',
    '/admin/temporary-users': 'إدارة المستخدمين المؤقتين',
    '/admin/temporary-users/add': 'إضافة فاتورة مجمعة',
    '/admin/financial-reports': 'التقارير المالية',
    '/admin/instant-sales': 'حاسبة المبيعات الفورية',
    '/admin/instant-sales/history': 'سجل المبيعات الفورية',
    '/admin/deposits': 'سجل العربون',
    '/admin/expenses': 'إدارة المصروفات',
    '/admin/creditors': 'إدارة الذمم (الدائنون/المدينون)',
    '/admin/support-center': 'مركز الدعم',
    '/admin/notifications': 'إدارة الإشعارات',
    '/admin/data-export': 'تصدير البيانات',
    '/admin/exchange-rate': 'اسعار الصرف والشحن',
  };

  if (pathname.startsWith('/admin/users/print')) return 'طباعة كشف حساب المستخدم';
  if (pathname.startsWith('/admin/users/')) return 'الملف الشخصي للمستخدم';
  if (pathname.startsWith('/admin/representatives/')) return 'الملف الشخصي للمندوب';
  if (pathname.startsWith('/admin/creditors/print')) return 'طباعة كشف حساب';
  if (pathname.startsWith('/admin/creditors/')) return 'ملف الذمة';
  if (pathname.startsWith('/admin/orders/')) return 'تفاصيل الطلب';

  return pageTitles[pathname] || 'لوحة التحكم';
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const user = localStorage.getItem('loggedInUser');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.type === 'admin') {
          const fetchManagerData = async () => {
            // In a real app we might verify token valididity here
            // For now we trust localStorage but reload permissions
            const manager = await getManagerById(userData.id);
            if (manager) {
              setCurrentManager(manager);
              setIsAuthenticated(true);
            } else {
              handleLogout();
            }
          };
          fetchManagerData();
        } else {
          setIsAuthenticated(false);
          if (pathname !== '/admin/login') {
            // Avoid redirect loop if already on login
            router.push('/admin/login');
          }
        }
      } catch (e) {
        setIsAuthenticated(false);
        if (pathname !== '/admin/login') router.push('/admin/login');
      }
    } else {
      setIsAuthenticated(false);
      if (pathname !== '/admin/login') router.push('/admin/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setCurrentManager(null);
    setIsAuthenticated(false);
    router.push('/admin/login');
  };

  const currentPageTitle = getPageTitle(pathname);

  const visibleNavItems = navItems.filter(item => {
    if (item.permissionId === 'dashboard') return true;
    const isSuperAdmin = currentManager?.username === 'admin@fwtara.ly';
    if (isSuperAdmin) return true;
    return currentManager?.permissions?.includes(item.permissionId);
  });

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname === '/admin/login' || !isAuthenticated) {
    return <>{children}</>;
  }

  if (pathname !== '/admin/dashboard' && !visibleNavItems.some(item => pathname.startsWith(item.href))) {
    return (
      <div className="flex h-screen items-center justify-center bg-[hsl(var(--background))] text-center p-4" dir="rtl">
        <div className="glass-card p-8 rounded-2xl border-red-500/20">
          <h1 className="text-3xl font-bold text-destructive mb-4">وصول مرفوض</h1>
          <p className="text-muted-foreground mb-6">ليس لديك الصلاحية للوصول إلى هذه الصفحة.</p>
          <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>العودة إلى لوحة التحكم</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground font-sans selection:bg-primary/30" dir="rtl">

      <TooltipProvider>
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Floating Sidebar */}
        <aside
          className={cn(
            'fixed top-0 right-0 bottom-0 z-40 w-72 transition-transform duration-300 ease-in-out no-print',
            'bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col shadow-xl',
            isSidebarOpen ? 'translate-x-0' : 'translate-x-[110%]',
            'md:translate-x-0'
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 flex items-center justify-center bg-primary rounded-xl shadow-md">
                <Image src={logo} alt="Logo" width={28} height={28} className="brightness-0 invert" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">فوترة</h1>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <ul className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href) && item.href !== '/admin/dashboard' || pathname === item.href;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 group relative overflow-hidden',
                        isActive
                          ? 'text-white bg-primary shadow-lg shadow-primary/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 z-10 relative transition-transform duration-300",
                        isActive ? "scale-110" : "group-hover:scale-110"
                      )}
                      />
                      <span className="z-10 relative font-medium text-sm">{item.label}</span>

                      {/* Active / Hover Glow */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {currentManager?.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{currentManager?.name || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentManager?.username}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="md:pr-[18rem] transition-[padding] duration-300 h-full">
          <header className="sticky top-0 z-30 no-print">
            {/* Clean Header */}
            <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between px-6">
              <div className="flex items-center gap-4 h-16">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-foreground"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
                <h1 className="font-bold text-lg text-primary">{currentPageTitle}</h1>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-primary/20 text-foreground">
                      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>تغيير المظهر</p></TooltipContent>
                </Tooltip>
                <div className="w-px h-6 bg-border mx-1"></div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-destructive/20 hover:text-destructive text-muted-foreground">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>تسجيل الخروج</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </TooltipProvider>
    </div>
  );
}
