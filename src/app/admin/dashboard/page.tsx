'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Briefcase,
    Bike,
    ShoppingCart,
    Users2,
    BarChart,
    MessageSquare,
    Bell,
    ArrowRight,
    Loader2,
    DollarSign,
    TrendingUp,
    TrendingDown,
    Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Manager, Order } from '@/lib/types';
import { getManagerById, getTransactions, getExpenses, getOrders } from '@/lib/actions';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumChart } from '@/components/ui/PremiumChart';
import { PremiumDonutChart } from '@/components/ui/PremiumDonutChart';

const allDashboardItems = [
    {
        title: "إدارة الطلبات",
        description: "عرض وتحديث حالات الطلبات الجديدة.",
        icon: ShoppingCart,
        href: "/admin/orders",
        color: "text-blue-400",
        gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
        title: "إدارة المستخدمين",
        description: "إضافة، تعديل، وحذف حسابات المستخدمين.",
        icon: Users,
        href: "/admin/users",
        color: "text-green-400",
        gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
        title: "إدارة المندوبين",
        description: "متابعة المندوبين وتعيين الطلبات.",
        icon: Bike,
        href: "/admin/representatives",
        color: "text-orange-400",
        gradient: "from-orange-500/20 to-amber-500/20"
    },
    {
        title: "إدارة المدراء",
        description: "التحكم في صلاحيات المدراء والمشرفين.",
        icon: Briefcase,
        href: "/admin/employees",
        color: "text-purple-400",
        gradient: "from-primary/20 to-accent/20"
    },
    {
        title: "المستخدمين المؤقتين",
        description: "إدارة الطلبات للمستخدمين غير المسجلين.",
        icon: Users2,
        href: "/admin/temporary-users",
        color: "text-indigo-400",
        gradient: "from-indigo-500/20 to-violet-500/20"
    },
    {
        title: "التقارير المالية",
        description: "عرض الإحصائيات والتقارير المالية.",
        icon: BarChart,
        href: "/admin/financial-reports",
        color: "text-pink-400",
        gradient: "from-pink-500/20 to-rose-500/20"
    },
    {
        title: "مركز الدعم",
        description: "التواصل مع المستخدمين وحل مشاكلهم.",
        icon: MessageSquare,
        href: "/admin/support-center",
        color: "text-teal-400",
        gradient: "from-teal-500/20 to-cyan-500/20"
    },
    {
        title: "إدارة الإشعارات",
        description: "إرسال إشعارات عامة أو خاصة للمستخدمين.",
        icon: Bell,
        href: "/admin/notifications",
        color: "text-yellow-400",
        gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
        title: "اسعار الصرف والشحن",
        description: "إدارة إعدادات النظام المالية.",
        icon: DollarSign,
        href: "/admin/exchange-rate",
        color: "text-red-400",
        gradient: "from-red-500/20 to-orange-500/20"
    },
    {
        title: "مبيعات فورية",
        description: "تسجيل المبيعات المباشرة وحساب الأرباح.",
        icon: Zap,
        href: "/admin/instant-sales",
        color: "text-yellow-300",
        gradient: "from-yellow-400/20 to-amber-600/20"
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const itemVariant = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } }
};

const AdminDashboardPage = () => {
    const [manager, setManager] = useState<Manager | null>(null);
    const [dailyData, setDailyData] = useState({ revenue: 0, expenses: 0, netProfit: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isDailyDataLoading, setIsDailyDataLoading] = useState(true);

    useEffect(() => {
        const fetchManagerData = async () => {
            const user = localStorage.getItem('loggedInUser');
            if (user) {
                try {
                    const userData = JSON.parse(user);
                    if (userData.type === 'admin') {
                        const fetchedManager = await getManagerById(userData.id);
                        if (fetchedManager) {
                            setManager(fetchedManager);
                            const hasReportsPermission = fetchedManager.permissions?.includes('reports') || fetchedManager.username === 'admin@fwtara.ly';
                            if (hasReportsPermission) {
                                fetchDailyFinancials();
                            } else {
                                setIsDailyDataLoading(false);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse user data or fetch manager name", e);
                }
            }
        };

        const fetchDailyFinancials = async () => {
            setIsDailyDataLoading(true);
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];

            // In a real scenario, this would be a specialized API call
            const [transactions, expenses, orders] = await Promise.all([
                getTransactions(),
                getExpenses(),
                getOrders(),
            ]);

            const regularTransactions = transactions.filter(t => !t.customerId.startsWith('TEMP-'));

            // Recent Orders Logic
            const sortedOrders = [...orders]
                .sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
                .slice(0, 5);
            setRecentOrders(sortedOrders);

            const todayTransactions = regularTransactions.filter(t => t.date.startsWith(todayStr));
            // Just for chart demo, let's fake some hourly data based on total if it's 0 to show the UI
            // Or better, stick to daily aggregates for last 7 days for the chart?
            // Let's implement Last 7 Days chart for better visuals than just "Today"

            // Calculate Today's stats
            const todayRevenue = todayTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
            const todayExpenses = expenses.filter(e => e.date.startsWith(todayStr)).reduce((sum, e) => sum + e.amount, 0);

            const todayOrders = orders.filter(o => o.operationDate.startsWith(todayStr) && o.status !== 'cancelled' && !o.userId.startsWith('TEMP-'));
            const todayGrossProfit = todayOrders.reduce((profit, order) => {
                const purchasePriceUSD = order.purchasePriceUSD || 0;
                const shippingCostLYD = order.shippingCostLYD || 0;
                const purchaseCostLYD = purchasePriceUSD * (order.exchangeRate || 0);
                return profit + (order.sellingPriceLYD - purchaseCostLYD - shippingCostLYD);
            }, 0);
            const todayNetProfit = todayGrossProfit - todayExpenses;

            setDailyData({ revenue: todayRevenue, expenses: todayExpenses, netProfit: todayNetProfit });

            // Prepare Demo Chart Data (Last 5 days + Today)
            const days = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                const dayName = format(d, 'EEE', { locale: ar });

                // Real calculation per day
                const dayTrans = regularTransactions.filter(t => t.date.startsWith(dStr) && t.type === 'payment');
                const dayRev = dayTrans.reduce((s, t) => s + t.amount, 0);
                const dayExp = expenses.filter(e => e.date.startsWith(dStr)).reduce((s, e) => s + e.amount, 0);
                // Simple profit approx for chart speed
                const profit = dayRev * 0.2 - dayExp; // Dummy logic if no order data per day easily available

                days.push({
                    name: dayName,
                    income: dayRev,
                    expense: dayExp,
                    profit: profit > 0 ? profit : 0
                });
            }
            setChartData(days);

            setIsDailyDataLoading(false);
        };

        fetchManagerData();
    }, []);

    const hasReportsAccess = manager?.permissions?.includes('reports') || manager?.username === 'admin@fwtara.ly';

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-10"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {manager?.name ? (
                        <motion.h1
                            variants={itemVariant}
                            className="text-4xl font-black tracking-tight text-foreground mb-2"
                        >
                            مرحباً، <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{manager.name}</span> 👋
                        </motion.h1>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )}
                    <motion.p variants={itemVariant} className="text-muted-foreground text-lg">
                        نظرة عامة على أداء النظام اليوم
                    </motion.p>
                </div>

                <motion.div variants={itemVariant}>
                    <Link href="/admin/orders/add">
                        <Button className="h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 text-lg font-bold text-primary-foreground">
                            <Zap className="mr-2 h-5 w-5 fill-white" />
                            طلب جديد
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Quick Stats Row */}
            {hasReportsAccess && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div variants={itemVariant} className="h-full">
                        <GlassCard variant="premium" className="h-full flex flex-col justify-between relative overflow-hidden group">
                            <div className="u-absolute-fill bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-muted-foreground font-medium mb-1">الإيرادات اليومية</p>
                                    <h3 className="text-3xl font-bold text-foreground tracking-widest">{isDailyDataLoading ? "..." : dailyData.revenue.toLocaleString()} <span className="text-sm text-muted-foreground">د.ل</span></h3>
                                </div>
                                <div className="p-3 bg-green-500/20 rounded-xl text-green-400 group-hover:scale-110 transition-transform duration-300">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[70%]" />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={itemVariant} className="h-full">
                        <GlassCard variant="premium" className="h-full flex flex-col justify-between relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-muted-foreground font-medium mb-1">المصاريف اليومية</p>
                                    <h3 className="text-3xl font-bold text-foreground tracking-widest">{isDailyDataLoading ? "..." : dailyData.expenses.toLocaleString()} <span className="text-sm text-muted-foreground">د.ل</span></h3>
                                </div>
                                <div className="p-3 bg-red-500/20 rounded-xl text-red-400 group-hover:scale-110 transition-transform duration-300">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500 w-[30%]" />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={itemVariant} className="h-full">
                        <GlassCard variant="neon" className="h-full flex flex-col justify-between relative overflow-hidden group border-primary/30">
                            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/30 transition-all duration-500" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-primary/80 font-medium mb-1">صافي الربح</p>
                                    <h3 className="text-4xl font-black text-foreground tracking-widest drop-shadow-[0_0_10px_rgba(15,171,244,0.2)]">
                                        {isDailyDataLoading ? "..." : dailyData.netProfit.toLocaleString()}
                                        <span className="text-lg text-primary/70 font-normal ml-2">د.ل</span>
                                    </h3>
                                </div>
                                <div className="p-3 bg-primary/20 rounded-xl text-primary group-hover:rotate-12 transition-transform duration-300">
                                    <TrendingUp className="w-8 h-8" />
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart Section */}
                <motion.div variants={itemVariant} className="lg:col-span-2 min-h-[400px]">
                    <GlassCard className="h-full p-0 flex flex-col">
                        <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-foreground">تحليل الأداء المالي</h3>
                                <p className="text-sm text-muted-foreground">ملخص الإيرادات والمصاريف لآخر 7 أيام</p>
                            </div>
                            <Link href="/admin/financial-reports">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                    تفاصيل أكثر <ArrowRight className="w-4 h-4 mr-1" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 p-4 w-full h-full min-h-[300px] flex items-center justify-center relative">
                            {!isDailyDataLoading && (
                                <div className="w-full flex flex-col md:flex-row items-center justify-around gap-8">
                                    <div className="w-full md:w-1/2 h-[300px]">
                                        <PremiumDonutChart
                                            data={[
                                                { name: "صافي الأرباح", value: dailyData.netProfit > 0 ? dailyData.netProfit : 0, color: "#faca12" }, // Yellow
                                                { name: "المصاريف", value: dailyData.expenses, color: "#ef4444" }, // Red
                                                { name: "تكلفة المبيعات", value: dailyData.revenue - dailyData.netProfit - dailyData.expenses, color: "#2e68b1" } // Blue
                                            ].filter(d => d.value > 0)}
                                            innerRadius={80}
                                            outerRadius={120}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-4 w-full md:w-auto p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full bg-[#faca12] shadow-[0_0_10px_#faca12]" />
                                            <div>
                                                <div>
                                                    <p className="text-muted-foreground text-sm">صافي الأرباح</p>
                                                    <p className="text-xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                                                        {(dailyData.netProfit > 0 ? dailyData.netProfit : 0).toLocaleString()} <span className="text-xs">د.ل</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full bg-[#ef4444] shadow-[0_0_10px_#ef4444]" />
                                            <div>
                                                <div>
                                                    <p className="text-muted-foreground text-sm">المصاريف التشغيلية</p>
                                                    <p className="text-xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
                                                        {dailyData.expenses.toLocaleString()} <span className="text-xs">د.ل</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full bg-[#2e68b1] shadow-[0_0_10px_#2e68b1]" />
                                            <div>
                                                <div>
                                                    <p className="text-muted-foreground text-sm">تكلفة المبيعات</p>
                                                    {/* Approximate Cost logic for display: Revenue - Profit - Expenses */}
                                                    <p className="text-xl font-bold text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                                                        {(dailyData.revenue - dailyData.netProfit - dailyData.expenses).toLocaleString()} <span className="text-xs">د.ل</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Recent Orders / Side Panel */}
                <motion.div variants={itemVariant} className="space-y-6">
                    <GlassCard className="relative overflow-hidden min-h-[300px]">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-primary" />
                            أحدث الطلبات
                        </h3>
                        <div className="space-y-3">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order, i) => (
                                    <Link key={order.id} href={`/admin/orders/${order.id}`}>
                                        <div className="flex justify-between items-center p-3 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-black/5 dark:hover:border-white/5 group">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : order.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'} shadow-[0_0_8px_currentColor]`} />
                                                <div>
                                                    <p className="text-sm text-foreground font-bold group-hover:text-primary transition-colors">#{order.invoiceNumber}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(order.operationDate).toLocaleDateString('ar-EG')}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-foreground">{order.sellingPriceLYD.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">د.ل</span></p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                                                    order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                                                        'bg-blue-500/10 text-blue-400'
                                                    }`}>
                                                    {order.status === 'delivered' ? 'تم التوصيل' : order.status === 'pending' ? 'قيد الانتظار' : order.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">لا توجد طلبات حديثة</p>
                            )}
                        </div>
                        <Link href="/admin/orders" className="block mt-4 text-center">
                            <Button variant="outline" className="w-full border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground">
                                عرض كل الطلبات
                            </Button>
                        </Link>
                    </GlassCard>

                    <Link href="/admin/temporary-users/add">
                        <GlassCard className="group cursor-pointer hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg text-primary-foreground group-hover:scale-110 transition-transform">
                                    <Users2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">فاتورة مجمعة</h4>
                                    <p className="text-sm text-muted-foreground">إضافة طلبات لمستخدم مؤقت</p>
                                </div>
                                <ArrowRight className="mr-auto w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                        </GlassCard>
                    </Link>
                </motion.div>
            </div>

            {/* Navigation Grid */}
            <div>
                <motion.h2 variants={itemVariant} className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                    الوصول السريع
                </motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {allDashboardItems.map((item) => (
                        <Link href={item.href} key={item.title}>
                            <motion.div variants={itemVariant} whileHover={{ y: -5 }}>
                                <GlassCard
                                    className="h-full hover:bg-black/5 dark:hover:bg-slate-800/80 transition-colors border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 group"
                                    hoverEffect={true}
                                >
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                                        <item.icon className={`w-6 h-6 ${item.color}`} />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-snug">{item.description}</p>
                                </GlassCard>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboardPage;

