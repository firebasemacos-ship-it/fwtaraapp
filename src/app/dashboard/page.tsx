
'use client';

import { Bell, Home, Search, Mail, Settings, DollarSign, FileText, Landmark, CreditCard, ClipboardList, Users, Sun, Moon, Loader2, ChevronLeft, TrendingUp, Package, Wallet } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import logo from '@/app/assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Notification, Order } from '@/lib/types';
import { getOrders, getUsers, getNotificationsForUser, markNotificationsAsReadForUser } from '@/lib/actions';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
  { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
  { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
  { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
  { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
  { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

const actionCards = [
  {
    href: '/dashboard/financial-operations',
    icon: Landmark,
    label: 'العمليات المالية',
    sub: 'دفعات وأرصدة',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    href: '/dashboard/track-shipment',
    icon: Search,
    label: 'تتبع الشحنة',
    sub: 'اعرف مكان طلبك',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    href: '/dashboard/calculate-shipment',
    icon: DollarSign,
    label: 'حاسبة الشحن',
    sub: 'احسب التكلفة',
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    href: '/dashboard/my-orders',
    icon: ClipboardList,
    label: 'طلباتي',
    sub: 'كل سجلاتك',
    color: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    href: '/dashboard/my-data',
    icon: CreditCard,
    label: 'بياناتي',
    sub: 'معلومات الحساب',
    color: 'from-pink-500 to-rose-600',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    href: '/dashboard/support-chat',
    icon: Mail,
    label: 'تواصل معنا',
    sub: 'نحن هنا للمساعدة',
    color: 'from-teal-500 to-cyan-600',
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
];

const DashboardPage = () => {
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestOrderDate, setLatestOrderDate] = useState('...');
  const [totalValue, setTotalValue] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const loggedInUserStr = localStorage.getItem('loggedInUser');
        if (!loggedInUserStr) { router.push('/login'); return; }
        const loggedInUser = JSON.parse(loggedInUserStr);

        const allUsers = await getUsers();
        const currentUser = allUsers.find(u => u.id === loggedInUser.id);

        if (currentUser) {
          setUser(currentUser);

          const allOrders = await getOrders();
          const userOrders = allOrders.filter(o => o.userId === currentUser.id && o.status !== 'cancelled');

          if (userOrders.length > 0) {
            const latestDate = Math.max(...userOrders.map(o => new Date(o.operationDate).getTime()));
            setLatestOrderDate(new Date(latestDate).toLocaleDateString('ar-LY'));
          } else {
            setLatestOrderDate('لا يوجد');
          }

          setTotalValue(userOrders.reduce((sum, o) => sum + o.sellingPriceLYD, 0));
          setTotalDebt(userOrders.reduce((sum, o) => sum + o.remainingAmount, 0));
          setOrderCount(userOrders.length);

          const userNotifications = await getNotificationsForUser(currentUser.id);
          setNotifications(userNotifications);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleOpenNotifications = async () => {
    if (user && unreadNotificationsCount > 0) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      await markNotificationsAsReadForUser(unreadIds);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const initials = user?.name?.charAt(0) || '?';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-28" dir="rtl">

      {/* Header */}
      <header className="px-5 pt-12 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl overflow-hidden">
            <Image src={logo} alt="Logo" width={36} height={36} className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-foreground">فوترة</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-9 h-9 text-muted-foreground">
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </Button>
          <DropdownMenu onOpenChange={(open) => { if (open) handleOpenNotifications(); }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full w-9 h-9 text-muted-foreground">
                <Bell className="w-4.5 h-4.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full border border-background animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? notifications.map(notification => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 whitespace-normal">
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString('ar-LY')}</p>
                </DropdownMenuItem>
              )) : (
                <DropdownMenuItem disabled>لا توجد إشعارات جديدة</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow px-5 space-y-5">

        {/* Hero — Account Card */}
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-6 shadow-xl shadow-primary/30">
            {/* Decorative circles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10" />

            {/* Top row: greeting + avatar */}
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <p className="text-white/70 text-sm mb-0.5">مرحباً بك 👋</p>
                <h2 className="text-2xl font-bold text-white">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (user?.name || '...')}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                <span className="text-white text-xl font-bold">{initials}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="relative z-10 grid grid-cols-2 gap-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/20">
                <p className="text-white/70 text-xs mb-1">إجمالي التداولات</p>
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                  : <p className="text-xl font-bold text-white">{totalValue.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                }
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/20">
                <p className="text-white/70 text-xs mb-1">الدين الحالي</p>
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin text-white" />
                  : <p className="text-xl font-bold text-white">{totalDebt.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                }
              </div>
            </div>

            {/* Bottom row */}
            <div className="relative z-10 mt-3 flex justify-between items-center text-white/60 text-xs pt-3 border-t border-white/20">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {orderCount} شحنة
              </span>
              <span>آخر نشاط: {latestOrderDate}</span>
            </div>
          </div>
        </motion.div>

        {/* Section Title */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">الخدمات السريعة</h3>
        </div>

        {/* Quick Actions — 2-column rich cards */}
        <div className="grid grid-cols-2 gap-3">
          {actionCards.map((card, i) => (
            <motion.div
              key={card.href}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
            >
              <Link href={card.href}>
                <div className={`${card.bg} rounded-2xl p-4 border border-slate-100 dark:border-slate-800 active:scale-95 transition-transform shadow-sm`}>
                  <div className={`w-11 h-11 rounded-xl ${card.iconColor} bg-white dark:bg-slate-900 flex items-center justify-center mb-3 shadow-sm`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-foreground leading-snug">{card.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav items={navItems} />
    </div>
  );
};

export default DashboardPage;
