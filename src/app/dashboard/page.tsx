
'use client';

import { Bell, Home, Search, Mail, Settings, DollarSign, FileText, Landmark, CreditCard, ClipboardList, Users, Sun, Moon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { GlassCard } from '@/components/ui/GlassCard';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
  { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
  { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
  { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
  { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
  { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
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
        if (!loggedInUserStr) {
          router.push('/login');
          return;
        }
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

          const ordersTotal = userOrders.reduce((sum, o) => sum + o.sellingPriceLYD, 0);
          const debtTotal = userOrders.reduce((sum, o) => sum + o.remainingAmount, 0);
          setTotalValue(ordersTotal);
          setTotalDebt(debtTotal);
          setOrderCount(userOrders.length);

          // Fetch notifications
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
    }
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

      // Optimistically update UI
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));

      // Update in backend
      await markNotificationsAsReadForUser(unreadIds);
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24" dir="rtl">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-30 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
            <Image
              src={logo}
              alt="Logo"
              width={40}
              height={40}
              className="relative z-10"
            />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">فوترة</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>
          <DropdownMenu onOpenChange={(open) => { if (open) handleOpenNotifications(); }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <Bell className="w-6 h-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-background animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 glass-card">
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

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 space-y-6">
        {/* User Credit Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard variant="premium" className="relative overflow-hidden min-h-[220px] flex flex-col justify-between group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-white/20 transition-colors" />

            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground mb-1">مرحباً بك،</p>
                <h2 className="text-2xl font-bold text-foreground">{user?.name || '...'}</h2>
              </div>
              <div className="w-12 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-md opacity-80" />
            </div>

            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">إجمالي التداولات</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-lg font-bold text-foreground">{totalValue.toLocaleString()} <span className="text-xs">د.ل</span></p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">الدين الحالي</p>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <p className="text-lg font-bold text-red-500">{totalDebt.toLocaleString()} <span className="text-xs">د.ل</span></p>}
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-4 border-t border-black/5 dark:border-white/10 flex justify-between items-center text-xs text-muted-foreground">
              <span>عدد الشحنات: {orderCount}</span>
              <span>آخر نشاط: {latestOrderDate}</span>
            </div>
          </GlassCard>
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-3 gap-4">
          <ActionCard href="/dashboard/calculate-shipment" icon={<DollarSign className="w-6 h-6" />} label="حاسبة" delay={0.1} />
          <ActionCard href="/dashboard/track-shipment" icon={<Search className="w-6 h-6" />} label="تتبع" delay={0.2} />
          <ActionCard href="/dashboard/financial-operations" icon={<Landmark className="w-6 h-6" />} label="مالية" delay={0.3} />
          <ActionCard href="/dashboard/my-data" icon={<CreditCard className="w-6 h-6" />} label="بياناتي" delay={0.4} />
          <ActionCard href="/dashboard/my-orders" icon={<ClipboardList className="w-6 h-6" />} label="طلباتي" delay={0.5} />
          <ActionCard href="/dashboard/support-chat" icon={<Mail className="w-6 h-6" />} label="تواصل" delay={0.6} />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav items={navItems} />
    </div>
  );
};

const ActionCard = ({ icon, label, href, delay }: { icon: React.ReactElement; label: string; href: string; delay: number }) => (
  <Link href={href}>
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring" }}
    >
      <GlassCard className="flex flex-col items-center justify-center py-6 gap-3 group hover:border-primary/50 transition-colors" hoverEffect={true}>
        <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-300 shadow-sm">
          {icon}
        </div>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </GlassCard>
    </motion.div>
  </Link>
);

export default DashboardPage;
