'use client';

import {
    ArrowRight, ArrowUpCircle, ArrowDownCircle, Landmark,
    Loader2, Receipt, Search, Home, ClipboardList, Users, Settings, TrendingDown, TrendingUp, Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, User } from '@/lib/types';
import { getTransactions, getUsers } from '@/lib/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

// Group transactions by date label
const groupByDate = (transactions: Transaction[]) => {
    const groups: { [label: string]: Transaction[] } = {};
    transactions.forEach(tx => {
        const d = new Date(tx.date);
        const today = new Date();
        const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
        let label: string;
        if (d.toDateString() === today.toDateString()) label = 'اليوم';
        else if (d.toDateString() === yesterday.toDateString()) label = 'أمس';
        else label = d.toLocaleDateString('ar-LY', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[label]) groups[label] = [];
        groups[label].push(tx);
    });
    return groups;
};

const FinancialOperationsPage = () => {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const loggedInUserStr = localStorage.getItem('loggedInUser');
                if (!loggedInUserStr) { router.push('/login'); return; }
                const loggedInUser = JSON.parse(loggedInUserStr);
                const allUsers = await getUsers();
                const currentUser = allUsers.find(u => u.id === loggedInUser.id);
                if (currentUser) {
                    setUser(currentUser);
                    const allTransactions = await getTransactions();
                    const userTransactions = allTransactions.filter(t => t.customerId === currentUser.id);
                    setTransactions(userTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else {
                    router.push('/login');
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [router]);

    const totalOrders = useMemo(() =>
        transactions.filter(t => t.type === 'order' && t.status !== 'cancelled').reduce((acc, t) => acc + t.amount, 0),
        [transactions]);

    const totalPayments = useMemo(() =>
        transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + t.amount, 0),
        [transactions]);

    const remainingDebt = user?.debt ?? 0;
    const grouped = useMemo(() => groupByDate(transactions), [transactions]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-28" dir="rtl">

            {/* Header */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 px-5 pt-12 pb-8">
                <button onClick={() => router.back()} className="text-white/80 mb-4 flex items-center gap-1 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    رجوع
                </button>
                <h1 className="text-2xl font-bold text-white mb-1">سجل المعاملات</h1>
                <p className="text-white/70 text-sm">{transactions.length} معاملة إجمالاً</p>
            </div>

            {/* Stat Cards — float over header */}
            <div className="px-5 -mt-5 grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'المطلوبات', value: totalOrders, color: 'text-foreground', icon: TrendingUp },
                    { label: 'المدفوع', value: totalPayments, color: 'text-green-600', icon: TrendingDown },
                    { label: 'المتبقي', value: remainingDebt, color: remainingDebt > 0 ? 'text-red-500' : 'text-green-600', icon: Wallet },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-3"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                            <stat.icon className={`w-3 h-3 ${stat.color}`} />
                        </div>
                        <p className={`text-sm font-bold ${stat.color} leading-tight`}>
                            {stat.value.toLocaleString()}
                            <span className="text-[10px] font-normal text-muted-foreground"> د.ل</span>
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Transaction List */}
            <main className="flex-grow px-5">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
                        <p className="text-sm text-muted-foreground">جاري تحميل المعاملات...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-950/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Receipt className="w-7 h-7 text-violet-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">لا توجد معاملات لعرضها</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <AnimatePresence>
                            {Object.entries(grouped).map(([dateLabel, txs], gi) => (
                                <motion.div
                                    key={dateLabel}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: gi * 0.06 }}
                                >
                                    {/* Date separator */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex-grow h-px bg-slate-200 dark:bg-slate-800" />
                                        <span className="text-xs text-muted-foreground font-medium bg-slate-50 dark:bg-slate-950 px-2">{dateLabel}</span>
                                        <div className="flex-grow h-px bg-slate-200 dark:bg-slate-800" />
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                        {txs.map((tx, i) => {
                                            const isPayment = tx.type === 'payment';
                                            return (
                                                <div
                                                    key={tx.id}
                                                    className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                                                >
                                                    {/* Icon */}
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isPayment ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'
                                                        }`}>
                                                        {isPayment
                                                            ? <ArrowDownCircle className="w-5 h-5 text-green-600" />
                                                            : <ArrowUpCircle className="w-5 h-5 text-red-500" />
                                                        }
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{tx.description}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{isPayment ? 'دفعة' : 'طلب'}</p>
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="text-left flex-shrink-0">
                                                        <p className={`text-sm font-bold ${isPayment ? 'text-green-600' : 'text-red-500'}`}>
                                                            {isPayment ? '+' : '-'}{tx.amount.toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground text-left">د.ل</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            <MobileBottomNav items={navItems} />
        </div>
    );
};

export default FinancialOperationsPage;
