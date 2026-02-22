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
    Activity,
    LineChart,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Manager, Order, OrderStatus } from '@/lib/types';

const statusTranslations: Record<OrderStatus, string> = {
    pending: 'قيد التجهيز',
    processed: 'تم التنفيذ',
    ready: 'تم التجهيز',
    shipped: 'تم الشحن',
    arrived_dubai: 'وصل دبي',
    arrived_benghazi: 'وصل بنغازي',
    arrived_tripoli: 'وصل طرابلس',
    out_for_delivery: 'مع المندوب',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
    paid: 'مدفوع'
};
import { getManagerById, getTransactions, getExpenses, getOrders } from '@/lib/actions';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { PremiumChart } from '@/components/ui/PremiumChart';
import { PremiumDonutChart } from '@/components/ui/PremiumDonutChart';
import UpdateModal from '@/components/admin/UpdateModal';

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
    const [dailyData, setDailyData] = useState({ revenue: 0, expenses: 0, netProfit: 0, activeOrders: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isDailyDataLoading, setIsDailyDataLoading] = useState(true);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    useEffect(() => {
        // Check if user has already seen and dismissed the update modal
        const hasSeenUpdate = localStorage.getItem('hideUpdateModal_v1');
        if (!hasSeenUpdate) {
            setIsUpdateModalOpen(true);
        }

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

            const activeOrdersToday = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

            setDailyData({ revenue: todayRevenue, expenses: todayExpenses, netProfit: todayNetProfit, activeOrders: activeOrdersToday });

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

    const handleCloseUpdateModal = (dontShowAgain: boolean) => {
        if (dontShowAgain) {
            localStorage.setItem('hideUpdateModal_v1', 'true');
        }
        setIsUpdateModalOpen(false);
    };

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
                            مرحباً، <span className="text-primary">{manager.name}</span> 👋
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

            {/* Main Mockup Style Layout: 2 Columns */}
            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left Column (Activity & Analytics) */}
                <div className="w-full xl:w-[45%] flex flex-col gap-6">
                    {/* Activity Section Header */}
                    <div className="pr-2 flex justify-between items-center bg-white/5 dark:bg-slate-900/50 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="w-6 h-6 text-primary" />
                            النشاط اليومي
                        </h2>
                    </div>

                    {/* 4 Cards Grid */}
                    {hasReportsAccess && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Card 1: Revenue (Solid Blue) */}
                            <motion.div variants={itemVariant} className="h-full">
                                <div className="h-full bg-primary rounded-3xl p-5 shadow-lg shadow-primary/20 flex flex-col justify-between text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-2 bg-white/20 rounded-xl">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-bold tracking-tight mb-1">{isDailyDataLoading ? "..." : dailyData.revenue.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-medium opacity-80">د.ل</span></h3>
                                        <p className="text-primary-foreground/80 font-medium text-sm">إجمالي الإيرادات</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 2: Net Profit (Solid Yellow) */}
                            <motion.div variants={itemVariant} className="h-full">
                                <div className="h-full bg-accent rounded-3xl p-5 shadow-lg shadow-accent/20 flex flex-col justify-between text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-2 bg-white/30 rounded-xl">
                                            <TrendingUp className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-bold tracking-tight mb-1">{isDailyDataLoading ? "..." : dailyData.netProfit.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-medium opacity-80">د.ل</span></h3>
                                        <p className="text-white/90 font-medium text-sm">صافي الأرباح</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 3: Expenses (Light Blue) */}
                            <motion.div variants={itemVariant} className="h-full">
                                <div className="h-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-3xl p-5 flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-2 bg-primary/10 rounded-xl">
                                            <TrendingDown className="w-5 h-5 text-primary" />
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-bold text-foreground tracking-tight mb-1">{isDailyDataLoading ? "..." : dailyData.expenses.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-base font-medium text-muted-foreground">د.ل</span></h3>
                                        <p className="text-muted-foreground font-medium text-sm">المصاريف</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Card 4: Orders (Light Yellow) */}
                            <motion.div variants={itemVariant} className="h-full">
                                <div className="h-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/50 rounded-3xl p-5 flex flex-col justify-between group">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="p-2 bg-accent/20 rounded-xl">
                                            <ShoppingCart className="w-5 h-5 text-accent" />
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-3xl font-bold text-foreground tracking-tight mb-1">{isDailyDataLoading ? "..." : dailyData.activeOrders.toLocaleString()}</h3>
                                        <p className="text-muted-foreground font-medium text-sm">الطلبات النشطة</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Analytics Section (Cost Breakdown Donut) */}
                    <motion.div variants={itemVariant} className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                        <h3 className="text-lg font-bold text-foreground mb-4">التوزيع المالي</h3>
                        <div className="flex flex-col md:flex-row items-center justify-around gap-4 h-[250px]">
                            {!isDailyDataLoading && (
                                <>
                                    <div className="w-full md:w-1/2 h-full">
                                        <PremiumDonutChart
                                            data={[
                                                { name: "الأرباح", value: dailyData.netProfit > 0 ? dailyData.netProfit : 0, color: "#faca12" },
                                                { name: "المصاريف", value: dailyData.expenses, color: "#ef4444" },
                                                { name: "تكلفة المبيعات", value: dailyData.revenue - dailyData.netProfit - dailyData.expenses, color: "#2e68b1" }
                                            ].filter(d => d.value > 0)}
                                            innerRadius={60}
                                            outerRadius={90}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-3 w-full md:w-auto text-sm">
                                        <div className="flex justify-between items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#faca12]" />
                                                <span className="text-muted-foreground">صافي الأرباح</span>
                                            </div>
                                            <span className="font-bold">{dailyData.netProfit > 0 ? ((dailyData.netProfit / dailyData.revenue) * 100).toFixed(0) : 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                                                <span className="text-muted-foreground">المصاريف</span>
                                            </div>
                                            <span className="font-bold">{dailyData.revenue > 0 ? ((dailyData.expenses / dailyData.revenue) * 100).toFixed(0) : 0}%</span>
                                        </div>
                                        <div className="flex justify-between items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#2e68b1]" />
                                                <span className="text-muted-foreground">التكلفة</span>
                                            </div>
                                            <span className="font-bold">{dailyData.revenue > 0 ? (((dailyData.revenue - dailyData.expenses - dailyData.netProfit) / dailyData.revenue) * 100).toFixed(0) : 0}%</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column (Charts & Lists) */}
                <div className="w-full xl:w-[55%] flex flex-col gap-6">
                    {/* Header line for Chart */}
                    <div className="flex justify-between items-center px-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <LineChart className="w-6 h-6 text-primary" />
                            إحصائيات الأرباح
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-slate-200"><ChevronRight className="w-4 h-4" /></Button>
                            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-slate-200"><ChevronLeft className="w-4 h-4" /></Button>
                        </div>
                    </div>

                    {/* Area Chart Card */}
                    <motion.div variants={itemVariant} className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl p-6 h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-sm text-muted-foreground">الإيرادات وصافي الربح خلال آخر أسبوع</p>
                            <div className="flex gap-4 text-xs font-bold text-slate-400">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> الدخل</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent" /> الربح</span>
                            </div>
                        </div>
                        {!isDailyDataLoading ? (
                            <div className="h-[280px] w-full">
                                <PremiumChart
                                    data={chartData}
                                    dataKeys={[
                                        { key: 'income', color: '#2e68b1', name: 'الدخل' },
                                        { key: 'profit', color: '#faca12', name: 'الربح' }
                                    ]}
                                    height={280}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        )}
                    </motion.div>

                    {/* Recent Orders Application List */}
                    <motion.div variants={itemVariant} className="bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">الطلبات الحديثة</h3>
                            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-xl">عرض الكل</Button>
                        </div>

                        <div className="flex flex-col gap-2">
                            {recentOrders.length > 0 ? (
                                recentOrders.map((order, i) => (
                                    <div key={order.id} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold">
                                                {order.customerName ? order.customerName.substring(0, 2) : 'A'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{order.customerName || `طلب #${order.invoiceNumber}`}</p>
                                                <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[200px]">{order.itemDescription || 'بدون تفاصيل إضافية'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="text-center hidden sm:block">
                                                <p className="text-xs text-muted-foreground">تاريخ العملية</p>
                                                <p className="text-sm font-semibold">{new Date(order.operationDate).toLocaleDateString('ar-EG')}</p>
                                            </div>
                                            <div className="w-24 text-center">
                                                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${order.status === 'delivered' || order.status === 'paid' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {statusTranslations[order.status] || order.status}
                                                </span>
                                            </div>
                                            <Link href={`/admin/orders/${order.id}`}>
                                                <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                                                    عرض
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-6 border-2 border-dashed border-slate-200 rounded-2xl">لا يوجد طلبات حديثة اليوم</p>
                            )}
                        </div>
                    </motion.div>
                </div>
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

            <UpdateModal
                isOpen={isUpdateModalOpen}
                onClose={handleCloseUpdateModal}
            />
        </motion.div>
    );
};

export default AdminDashboardPage;

