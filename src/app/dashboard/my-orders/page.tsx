
'use client';

import { ArrowRight, PackageCheck, PackageX, Truck, Building, Package, Plane, CheckCircle, Clock, MapPin, Copy, Loader2, ClipboardList, Search, Home, Users, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { getOrders } from '@/lib/actions';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ElementType; color: string; bg: string } } = {
    pending: { text: 'قيد التجهيز', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-100' },
    processed: { text: 'تم التنفيذ', icon: CheckCircle, color: 'text-cyan-700', bg: 'bg-cyan-100' },
    ready: { text: 'تم التجهيز', icon: Package, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    shipped: { text: 'تم الشحن', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-100' },
    arrived_dubai: { text: 'وصلت دبي', icon: Plane, color: 'text-orange-700', bg: 'bg-orange-100' },
    arrived_benghazi: { text: 'وصلت بنغازي', icon: Building, color: 'text-teal-700', bg: 'bg-teal-100' },
    arrived_tripoli: { text: 'وصلت طرابلس', icon: Building, color: 'text-purple-700', bg: 'bg-purple-100' },
    out_for_delivery: { text: 'مع المندوب', icon: MapPin, color: 'text-lime-700', bg: 'bg-lime-100' },
    delivered: { text: 'تم التسليم', icon: PackageCheck, color: 'text-green-700', bg: 'bg-green-100' },
    cancelled: { text: 'ملغي', icon: PackageX, color: 'text-red-600', bg: 'bg-red-100' },
    paid: { text: 'مدفوع', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100' },
};

const tabs = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'الحالية' },
    { value: 'delivered', label: 'المسلمة' },
    { value: 'cancelled', label: 'الملغية' },
];

const OrderCard = ({ order, index }: { order: Order; index: number }) => {
    const { toast } = useToast();
    const cfg = statusConfig[order.status];
    const StatusIcon = cfg.icon;

    const copyToClipboard = (e: React.MouseEvent, text: string) => {
        e.preventDefault();
        navigator.clipboard.writeText(text).then(() => {
            toast({ title: 'تم النسخ!', description: 'تم نسخ كود التتبع إلى الحافظة.' });
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link href={`/dashboard/my-orders/${order.id}`}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
                    {/* Card Header */}
                    <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground mb-0.5">فاتورة #{order.invoiceNumber}</p>
                            <p className="font-bold text-foreground text-sm leading-snug">{order.itemDescription || 'شحنة'}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.operationDate).toLocaleDateString('ar-LY')}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color} shrink-0`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.text}
                        </span>
                    </div>

                    {/* Tracking ID row */}
                    <div className="mx-4 mb-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">كود التتبع</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground tracking-widest">{order.trackingId}</span>
                            <button
                                onClick={(e) => copyToClipboard(e, order.trackingId)}
                                className="w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                            >
                                <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Financial row */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground">الإجمالي</p>
                            <p className="font-bold text-primary text-base">{order.sellingPriceLYD.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">الدين المتبقي</p>
                            <p className={`font-bold text-base ${order.remainingAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {order.remainingAmount.toLocaleString()} <span className="text-xs font-normal">د.ل</span>
                            </p>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

const MyOrdersPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserOrders = async () => {
            setIsLoading(true);
            try {
                const loggedInUserStr = localStorage.getItem('loggedInUser');
                if (!loggedInUserStr) { router.push('/login'); return; }
                const loggedInUser = JSON.parse(loggedInUserStr);
                const allOrders = await getOrders();
                const userOrders = allOrders.filter(o => o.userId === loggedInUser.id);
                setOrders(userOrders.sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime()));
            } catch (error) {
                console.error('Failed to fetch orders:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserOrders();
    }, [router]);

    const { totalAmount, totalRemainingDebt } = useMemo(() => {
        return orders.reduce((acc, o) => {
            if (o.status !== 'cancelled') {
                acc.totalAmount += o.sellingPriceLYD;
                acc.totalRemainingDebt += o.remainingAmount;
            }
            return acc;
        }, { totalAmount: 0, totalRemainingDebt: 0 });
    }, [orders]);

    const filteredOrders = useMemo(() => {
        if (activeTab === 'all') return orders;
        if (activeTab === 'pending') return orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        return orders.filter(o => o.status === activeTab);
    }, [activeTab, orders]);

    const activeCount = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-28" dir="rtl">

            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 px-5 pt-12 pb-6">
                <button onClick={() => router.back()} className="text-white/80 mb-4 flex items-center gap-1 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    رجوع
                </button>
                <h1 className="text-2xl font-bold text-white mb-1">طلباتي</h1>
                <p className="text-white/70 text-sm">{orders.length} طلب إجمالاً</p>
            </div>

            {/* Mini Stat Cards */}
            <div className="px-5 -mt-4 grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-3 text-center border border-slate-100 dark:border-slate-800">
                    <p className="text-lg font-bold text-foreground">{orders.length}</p>
                    <p className="text-[10px] text-muted-foreground">الكل</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-3 text-center border border-slate-100 dark:border-slate-800">
                    <p className="text-lg font-bold text-orange-600">{activeCount}</p>
                    <p className="text-[10px] text-muted-foreground">حالية</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-3 text-center border border-slate-100 dark:border-slate-800">
                    <p className="text-lg font-bold text-green-600">{deliveredCount}</p>
                    <p className="text-[10px] text-muted-foreground">مسلمة</p>
                </div>
            </div>

            <main className="flex-grow px-5">
                {/* Pill Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab.value
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-400 mb-3" />
                        <p className="text-sm text-muted-foreground">جاري تحميل الطلبات...</p>
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredOrders.map((order, i) => (
                                <OrderCard key={order.id} order={order} index={i} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ClipboardList className="w-7 h-7 text-orange-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">لا توجد طلبات في هذه الفئة</p>
                    </div>
                )}
            </main>

            {/* Summary Footer */}
            {!isLoading && orders.length > 0 && (
                <div className="mx-5 mb-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-0.5">الإجمالي الكلي</p>
                            <p className="text-base font-bold text-primary">{totalAmount.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-0.5">إجمالي الدين</p>
                            <p className="text-base font-bold text-red-500">{totalRemainingDebt.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                        </div>
                    </div>
                </div>
            )}

            <MobileBottomNav items={navItems} />
        </div>
    );
};

export default MyOrdersPage;
