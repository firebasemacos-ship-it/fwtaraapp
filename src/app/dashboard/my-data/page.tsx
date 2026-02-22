
'use client';

import {
    User as UserIcon, Phone, Hash, Calendar, DollarSign,
    AlertCircle, Loader2, LogOut, ShieldCheck, Search,
    Home, ClipboardList, Users, Settings, ChevronLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { getOrders, getUsers } from '@/lib/actions';
import { User, Order } from '@/lib/types';
import { motion } from 'framer-motion';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

const InfoItem = ({ icon: Icon, label, value, danger }: {
    icon: React.ElementType; label: string; value: string; danger?: boolean
}) => (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-950/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Icon className={`w-4 h-4 ${danger ? 'text-red-500' : 'text-muted-foreground'}`} />
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-foreground'}`}>{value}</span>
    </div>
);

const MyDataPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
                    setOrders(allOrders.filter(o => o.userId === currentUser.id));
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        router.push('/login');
    };

    const totalAmount = useMemo(() =>
        orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.sellingPriceLYD, 0), [orders]);

    const activeOrders = useMemo(() =>
        orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, [orders]);

    const lastOrderDate = useMemo(() => {
        const userOrders = orders.filter(o => o.status !== 'cancelled');
        if (userOrders.length === 0) return 'لا يوجد';
        return new Date(Math.max(...userOrders.map(o => new Date(o.operationDate).getTime()))).toLocaleDateString('ar-LY');
    }, [orders]);

    const initials = user?.name?.charAt(0) || '?';

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center" dir="rtl">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center" dir="rtl">
                <p className="text-red-500">لم يتم العثور على المستخدم</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-28" dir="rtl">

            {/* Hero Profile Section */}
            <div className="bg-gradient-to-br from-primary to-primary/80 px-5 pt-14 pb-16 relative overflow-hidden">
                {/* decorative circles */}
                <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-white/10" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 border-2 border-white/40 flex items-center justify-center mb-3 shadow-lg">
                        <span className="text-3xl font-bold text-white">{initials}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                    <p className="text-white/70 text-sm mt-0.5">@{user.username}</p>
                    <div className="flex items-center gap-1.5 mt-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-white/80" />
                        <span className="text-white/90 text-xs font-medium">عميل مسجل</span>
                    </div>
                </div>
            </div>

            {/* Stat Mini Cards — float over hero */}
            <div className="px-5 -mt-7 grid grid-cols-3 gap-3 mb-4">
                {[
                    { label: 'الطلبات', value: user.orderCount, color: 'text-primary' },
                    { label: 'الحالية', value: activeOrders, color: 'text-orange-500' },
                    { label: 'الإجمالي', value: `${totalAmount.toLocaleString()}`, sub: 'د.ل', color: 'text-foreground' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-3 text-center"
                    >
                        <p className={`text-base font-bold ${stat.color}`}>{stat.value}<span className="text-[10px] font-normal text-muted-foreground"> {stat.sub}</span></p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <main className="flex-grow px-5 space-y-4">

                {/* Account Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-4 py-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-4 pb-1">معلومات الحساب</p>
                    <InfoItem icon={UserIcon} label="اسم المستخدم" value={user.username} />
                    <InfoItem icon={Phone} label="رقم الهاتف" value={user.phone} />
                    <InfoItem icon={Calendar} label="آخر عملية" value={lastOrderDate} />
                    <InfoItem icon={Hash} label="عدد الطلبات" value={user.orderCount.toString()} />
                </div>

                {/* Financial Info */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-4 py-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-4 pb-1">المعلومات المالية</p>
                    <InfoItem icon={DollarSign} label="المبلغ الإجمالي" value={`${totalAmount.toLocaleString()} د.ل`} />
                    <InfoItem icon={AlertCircle} label="الدين المتبقي" value={`${(user.debt || 0).toLocaleString()} د.ل`} danger={(user.debt || 0) > 0} />
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-4 py-4 text-red-500 active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
                            <LogOut className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-sm font-semibold">تسجيل الخروج</span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-red-400" />
                </button>

            </main>

            <MobileBottomNav items={navItems} />
        </div>
    );
};

export default MyDataPage;
