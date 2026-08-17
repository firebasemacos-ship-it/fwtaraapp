// src/app/admin/financial-reports/page.tsx
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, CreditCard, MoreHorizontal, Edit, Trash2, TrendingUp, RefreshCcw, TrendingDown, Calendar as CalendarIcon, Loader2, Search, ArrowUpDown, History, Receipt, Wallet, Filter, X } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Transaction, Order, AppSettings, Expense, OrderStatus } from '@/lib/types';
import { getTransactions, deleteOrder, getOrders, getAppSettings, resetFinancialReports, getExpenses } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const statusConfig: { [key in OrderStatus]: { text: string; className: string } } = {
    pending: { text: 'قيد التجهيز', className: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    processed: { text: 'تم التنفيذ', className: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    ready: { text: 'تم التجهيز', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    shipped: { text: 'تم الشحن', className: 'bg-blue-50 text-blue-700 border-blue-100' },
    arrived_dubai: { text: 'وصلت إلى دبي', className: 'bg-orange-50 text-orange-700 border-orange-100' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', className: 'bg-teal-50 text-teal-700 border-teal-100' },
    arrived_tripoli: { text: 'وصلت إلى طرابلس', className: 'bg-purple-50 text-purple-700 border-purple-100' },
    office_pickup: { text: 'استلام فالمكتب', className: 'bg-amber-50 text-amber-800 border-amber-100' },
    transferred_to_rep: { text: 'تحويل للمندوب', className: 'bg-sky-50 text-sky-700 border-sky-100' },
    out_for_delivery: { text: 'مع المندوب', className: 'bg-lime-50 text-lime-700 border-lime-100' },
    delivered: { text: 'تم التسليم', className: 'bg-green-50 text-green-700 border-green-100' },
    cancelled: { text: 'ملغي', className: 'bg-red-50 text-red-700 border-red-100' },
    paid: { text: 'مدفوع', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

type SortableKeys = 'customerName' | 'date' | 'status' | 'amount';

const FinancialReportsPage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const [filterType, setFilterType] = useState<string>('monthly');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        const [fetchedTransactions, fetchedOrders, fetchedSettings, fetchedExpenses] = await Promise.all([
            getTransactions(),
            getOrders(),
            getAppSettings(),
            getExpenses(),
        ]);
        setAllTransactions(fetchedTransactions);
        setAllOrders(fetchedOrders);
        setSettings(fetchedSettings);
        setAllExpenses(fetchedExpenses);
        setIsLoading(false);
    }

    useEffect(() => {
        fetchData();
    }, []);

    const { filteredTransactions, chartData, dateFilteredOrders } = useMemo(() => {
        const regularTransactions = allTransactions.filter(t => !t.customerId.startsWith('TEMP-'));
        const regularOrders = allOrders.filter(o => !o.userId.startsWith('TEMP-'));

        let startDate: Date | null = null;
        let endDate: Date | null = null;
        const now = new Date();

        switch (filterType) {
            case 'daily': startDate = startOfDay(now); endDate = endOfDay(now); break;
            case 'weekly': startDate = startOfWeek(now, { locale: ar }); endDate = endOfWeek(now, { locale: ar }); break;
            case 'monthly': startDate = startOfMonth(now); endDate = endOfMonth(now); break;
            case 'yearly': startDate = startOfYear(now); endDate = endOfYear(now); break;
            case 'custom':
                if (dateRange?.from) startDate = startOfDay(dateRange.from);
                if (dateRange?.to) endDate = endOfDay(dateRange.to);
                else if (dateRange?.from) endDate = endOfDay(dateRange.from);
                break;
        }

        let dateFilteredTransactions = regularTransactions;
        let dateFilteredExpenses = allExpenses;
        let dateFilteredOrders = regularOrders;

        if (startDate && endDate) {
            dateFilteredTransactions = regularTransactions.filter(t => {
                const tDate = parseISO(t.date);
                return tDate >= startDate! && tDate <= endDate!;
            });
            dateFilteredExpenses = allExpenses.filter(e => {
                const eDate = parseISO(e.date);
                return eDate >= startDate! && eDate <= endDate!;
            });
            dateFilteredOrders = regularOrders.filter(o => {
                const oDate = parseISO(o.operationDate);
                return oDate >= startDate! && oDate <= endDate!;
            });
        }

        let searchedTransactions = dateFilteredTransactions;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            searchedTransactions = dateFilteredTransactions.filter(t => {
                const order = regularOrders.find(o => o.id === t.orderId);
                return (
                    t.customerName.toLowerCase().includes(query) ||
                    t.customerId.toLowerCase().includes(query) ||
                    (order && (
                        order.invoiceNumber.toLowerCase().includes(query) ||
                        order.customerPhone?.toLowerCase().includes(query)
                    )) ||
                    t.description.toLowerCase().includes(query)
                );
            });
        }

        let sortedTransactions = [...searchedTransactions];
        if (sortConfig !== null) {
            sortedTransactions.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        const dataMap: { [key: string]: { revenue: number; expenses: number; profit: number } } = {};
        const isLongRange = filterType === 'yearly' || filterType === 'all' || ((endDate?.getTime() ?? 0) - (startDate?.getTime() ?? 0) > 40 * 24 * 60 * 60 * 1000);
        const dateFormat = isLongRange ? 'yyyy-MM' : 'yyyy-MM-dd';

        dateFilteredTransactions.filter(t => t.type === 'payment').forEach(t => {
            const key = format(parseISO(t.date), dateFormat);
            if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0, profit: 0 };
            dataMap[key].revenue += t.amount;
        });

        dateFilteredExpenses.forEach(e => {
            const key = format(parseISO(e.date), dateFormat);
            if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0, profit: 0 };
            dataMap[key].expenses += e.amount;
        });

        dateFilteredOrders.filter(o => o.status !== 'cancelled').forEach(order => {
            const key = format(parseISO(order.operationDate), dateFormat);
            if (!dataMap[key]) dataMap[key] = { revenue: 0, expenses: 0, profit: 0 };
            const purchasePriceUSD = order.purchasePriceUSD || 0;
            const shippingCostLYD = order.shippingCostLYD || 0;
            const exchangeRate = order.exchangeRate || settings?.exchangeRate || 1;
            const purchaseCostLYD = purchasePriceUSD * exchangeRate;
            const netProfitForOrder = order.sellingPriceLYD - purchaseCostLYD - shippingCostLYD;
            dataMap[key].profit += netProfitForOrder;
        });

        const finalChartData = Object.keys(dataMap).map(key => ({
            date: key,
            revenue: dataMap[key].revenue,
            expenses: dataMap[key].expenses,
            profit: dataMap[key].profit,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            filteredTransactions: sortedTransactions,
            chartData: finalChartData,
            dateFilteredOrders: dateFilteredOrders
        };

    }, [filterType, dateRange, allTransactions, allOrders, allExpenses, searchQuery, sortConfig, settings]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-3 h-3 ml-2 text-muted-foreground opacity-30" />;
        }
        return <span className="text-primary mr-1 text-[10px] items-center mb-0.5">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
    };

    const handleDelete = async () => {
        if (transactionToDelete && transactionToDelete.orderId) {
            const success = await deleteOrder(transactionToDelete.orderId);
            if (success) {
                toast({ title: "تم حذف الطلب بنجاح" });
                fetchData();
            } else {
                toast({ title: "خطأ", description: "فشل حذف الطلب.", variant: "destructive" });
            }
        }
        setIsDeleteDialogOpen(false);
        setTransactionToDelete(null);
    };

    const handleResetReports = async () => {
        const success = await resetFinancialReports();
        if (success) {
            toast({ title: "تم تصفير التقارير بنجاح" });
            fetchData();
        } else {
            toast({ title: "خطأ", description: "فشل تصفير التقارير.", variant: "destructive" });
        }
        setIsResetDialogOpen(false);
    }

    const { totalRevenue, totalDebt, totalExpenses, netProfit } = useMemo(() => {
        const revenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
        const expenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
        const profit = chartData.reduce((sum, item) => sum + item.profit, 0);
        const debt = dateFilteredOrders.filter(o => o.status !== 'cancelled').reduce((sum, order) => sum + order.remainingAmount, 0);
        return { totalRevenue: revenue, totalDebt: debt, totalExpenses: expenses, netProfit: profit - expenses };
    }, [chartData, dateFilteredOrders]);

    const handleFilterChange = (type: string) => {
        setFilterType(type);
        const now = new Date();
        if (type === 'daily') setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        else if (type === 'weekly') setDateRange({ from: startOfWeek(now, { locale: ar }), to: endOfWeek(now, { locale: ar }) });
        else if (type === 'monthly') setDateRange({ from: startOfMonth(now), to: endOfMonth(now) });
        else if (type === 'yearly') setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        else if (type === 'all') setDateRange(undefined);
    }

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range);
        setFilterType('custom');
    }

    return (
        <div className="space-y-6 pb-12" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">التقارير المالية</h1>
                    <p className="text-muted-foreground mt-1 text-base">تحليل الأرباح، الإيرادات والمصروفات</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => setIsResetDialogOpen(true)} variant="destructive" className="flex-1 md:flex-none h-11 px-6 rounded-xl font-bold gap-2">
                        <RefreshCcw className="w-4 h-4" />
                        تصفير البيانات
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400 w-fit mb-4">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1 text-sm">إجمالي الإيرادات</p>
                    <h3 className="text-2xl font-black text-foreground">{totalRevenue.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 font-bold">
                        <TrendingUp className="w-3 h-3" />
                        ثبات مالي جيد
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-red-500/10 transition-colors" />
                    <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl text-red-600 dark:text-red-400 w-fit mb-4">
                        <CreditCard className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1 text-sm">إجمالي الديون</p>
                    <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{totalDebt.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                    <p className="text-[10px] text-muted-foreground mt-2">ديون مستحقة غير محصلة</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-orange-500/10 transition-colors" />
                    <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-2xl text-orange-600 dark:text-orange-400 w-fit mb-4">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1 text-sm">إجمالي المصروفات</p>
                    <h3 className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalExpenses.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                    <p className="text-[10px] text-muted-foreground mt-2">تكاليف التشغيل والنفقات</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors" />
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary w-fit mb-4">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1 text-sm">صافي الأرباح</p>
                    <h3 className={cn("text-2xl font-black", netProfit >= 0 ? "text-primary" : "text-destructive")}>
                        {netProfit.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-2">الأرباح الفعلية المحققة</p>
                </div>
            </div>

            {/* Analytics Chart */}
            <Card className="border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden border-none">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 mb-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-black">تحليل الأداء المالي</CardTitle>
                            <CardDescription className="text-xs font-medium">مقارنة الإيرادات، المصاريف والأرباح حسب الفترة</CardDescription>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-950 rounded-xl shadow-sm">
                            <CalendarDaysIcon className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-8">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-80"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : chartData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-80 opacity-20"><TrendingUp className="w-16 h-16 mb-2" /><p className="font-bold">لا يوجد بيانات كافية للرسم البياني</p></div>
                    ) : (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis dataKey="date" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        formatter={(value: number) => [`${value.toLocaleString('ar-LY', { minimumFractionDigits: 2 })} د.ل`, '']}
                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', direction: 'rtl', padding: '12px' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 800, padding: '2px 0' }}
                                        labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }} />
                                    <Bar dataKey="revenue" fill="#10b981" name="الإيرادات" radius={[6, 6, 0, 0]} barSize={12} />
                                    <Bar dataKey="expenses" fill="#f43f5e" name="المصروفات" radius={[6, 6, 0, 0]} barSize={12} />
                                    <Bar dataKey="profit" fill="#3b82f6" name="الأرباح" radius={[6, 6, 0, 0]} barSize={12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="ابحث بالعميل، الفاتورة أو الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("h-11 rounded-xl justify-start text-sm font-normal px-4 min-w-[200px]", filterType === 'custom' && "text-primary border-primary bg-primary/5")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d MMM")} - ${format(dateRange.to, "d MMM y")}` : format(dateRange.from, "d MMM y")) : <span>تحديد فترة</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateRangeSelect} numberOfMonths={2} locale={ar} />
                            </PopoverContent>
                        </Popover>
                        {filterType === 'custom' && (
                            <Button variant="ghost" size="icon" onClick={() => handleFilterChange('monthly')} className="h-11 w-11 rounded-xl shrink-0"><X className="w-4 h-4" /></Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                    {[
                        { key: 'all', label: 'كافة المعاملات' },
                        { key: 'daily', label: 'اليوم' },
                        { key: 'weekly', label: 'أسبوعي' },
                        { key: 'monthly', label: 'شهري' },
                        { key: 'yearly', label: 'سنوي' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                                filterType === f.key
                                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-slate-50"
                            )}
                        >
                            {f.label}
                            {f.key === filterType && filteredTransactions.length > 0 && (
                                <span className="mr-1.5 opacity-70 bg-white/20 px-1.5 rounded-full">{filteredTransactions.length}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <p className="font-bold text-foreground">سجل المعاملات المالية</p>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-none">
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 pr-6'>الوثيقة / الفاتورة</TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 cursor-pointer group' onClick={() => requestSort('customerName')}>
                                <div className='flex items-center'>العميل {getSortIndicator('customerName')}</div>
                            </TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 cursor-pointer group' onClick={() => requestSort('date')}>
                                <div className='flex items-center text-right'>التاريخ {getSortIndicator('date')}</div>
                            </TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>النوع</TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 cursor-pointer group' onClick={() => requestSort('status')}>
                                <div className='flex items-center'>الحالة {getSortIndicator('status')}</div>
                            </TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 cursor-pointer group' onClick={() => requestSort('amount')}>
                                <div className='flex items-center'>المبلغ {getSortIndicator('amount')}</div>
                            </TableHead>
                            <TableHead className="w-[60px]"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((transaction) => {
                                const order = allOrders.find(o => o.id === transaction.orderId);
                                return (
                                    <TableRow key={transaction.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-50 dark:border-slate-800">
                                        <TableCell className="py-4 pr-6">
                                            {order ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Receipt className="w-4 h-4" /></div>
                                                    <Link href={`/admin/orders/${order.id}`} className="font-black text-sm text-primary hover:underline">{order.invoiceNumber}</Link>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><History className="w-4 h-4" /></div>
                                                    <p className="font-bold text-sm text-foreground">{transaction.description}</p>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <p className="font-bold text-sm">{transaction.customerName}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">#{transaction.customerId.slice(-6)}</p>
                                        </TableCell>
                                        <TableCell className="py-4 text-xs font-bold text-muted-foreground">
                                            {new Date(transaction.date).toLocaleDateString('ar-LY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="py-4 text-xs font-black">
                                            {transaction.type === 'order' ? <span className="text-destructive">طلب شراء</span> : <span className="text-emerald-600">دفعة مالية</span>}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border shadow-sm",
                                                statusConfig[transaction.status as keyof typeof statusConfig]?.className
                                            )}>
                                                {statusConfig[transaction.status as keyof typeof statusConfig]?.text}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <p className={cn("font-black text-sm", transaction.type === 'order' ? "text-red-600" : "text-emerald-600")}>
                                                {transaction.type === 'order' ? '-' : '+'}{transaction.amount.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-normal opacity-60">د.ل</span>
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-4 text-left">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-all h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl p-1.5 min-w-[160px]">
                                                    <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-2 py-1">إجراءات المعاملة</DropdownMenuLabel>
                                                    <DropdownMenuItem onSelect={() => router.push(`/admin/orders/add?id=${transaction.orderId}`)} disabled={!transaction.orderId} className="rounded-lg gap-2 cursor-pointer font-medium p-2"><Edit className="h-4 w-4" /> عرض التفاصيل</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onSelect={() => { setTransactionToDelete(transaction); setIsDeleteDialogOpen(true); }} className="text-destructive rounded-lg gap-2 cursor-pointer font-medium p-2" disabled={transaction.type !== 'order'}><Trash2 className="h-4 w-4" /> حذف المعاملة</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow><TableCell colSpan={7} className="text-center py-24 text-muted-foreground font-bold opacity-40">لا يوجد بيانات تطابق الفلترة الحالية.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Dialogs */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-2xl" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-xl font-bold">حذف المعاملة</DialogTitle>
                        <DialogDescription className="text-sm">
                            هل أنت متأكد من حذف الطلب رقم #{transactionToDelete?.orderId?.slice(-6)}؟
                            سيتم تعديل الأرصدة والتقارير المالية بناءً على هذا الإجراء.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="destructive" className="flex-1 rounded-xl font-bold" onClick={handleDelete}>تأكيد الحذف</Button>
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsDeleteDialogOpen(false)}>تراجع</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className="rounded-2xl" dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-xl font-bold text-destructive">تصفير السجلات المالية</DialogTitle>
                        <DialogDescription className="text-sm">
                            تحذير: هذا الإجراء سيقوم بحذف <span className="font-bold underline">جميع</span> المعاملات والمييزانيات المخزنة بشكل نهائي.
                            <br /><br />
                            هل أنت متأكد تماماً؟ لا يمكن استعادة البيانات بعد التصفير.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="destructive" className="flex-1 rounded-xl font-bold" onClick={handleResetReports}>نعم، تصفير والبدء من جديد</Button>
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsResetDialogOpen(false)}>إلغاء</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const CalendarDaysIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
    </svg>
)

export default FinancialReportsPage;
