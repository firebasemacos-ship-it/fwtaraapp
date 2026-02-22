// src/app/admin/deposits/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, Trash2, Loader2, HandCoins, CheckCircle, Clock, XCircle, Search, Calendar as CalendarIcon, Edit, X, Printer, User, Wallet, History, Receipt } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Deposit, DepositStatus, Representative } from '@/lib/types';
import { getDeposits, addDeposit, deleteDeposit, getRepresentatives, updateDeposit } from '@/lib/actions';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ar } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig: { [key in DepositStatus]: { text: string; icon: React.ReactNode; className: string } } = {
    pending: { text: 'قيد الانتظار', icon: <Clock className="w-3.5 h-3.5" />, className: 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm shadow-yellow-500/10' },
    collected: { text: 'تم التحصيل', icon: <CheckCircle className="w-3.5 h-3.5" />, className: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/10' },
    cancelled: { text: 'ملغي', icon: <XCircle className="w-3.5 h-3.5" />, className: 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-500/10' },
};

const AdminDepositsPage = () => {
    const { toast } = useToast();
    const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
    const [representatives, setRepresentatives] = useState<Representative[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [currentDeposit, setCurrentDeposit] = useState<Deposit | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [fetchedDeposits, fetchedReps] = await Promise.all([
                getDeposits(),
                getRepresentatives()
            ]);
            setAllDeposits(fetchedDeposits);
            setRepresentatives(fetchedReps);
        } catch (error) {
            toast({ title: "خطأ", description: "فشل تحميل البيانات.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const filteredDeposits = useMemo(() => {
        let dateFilteredDeposits = allDeposits;
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        const now = new Date();

        switch (filterType) {
            case 'daily': startDate = startOfDay(now); endDate = endOfDay(now); break;
            case 'weekly': startDate = startOfWeek(now, { locale: ar }); endDate = endOfWeek(now, { locale: ar }); break;
            case 'monthly': startDate = startOfMonth(now); endDate = endOfMonth(now); break;
            case 'custom':
                if (dateRange?.from) startDate = startOfDay(dateRange.from);
                if (dateRange?.to) endDate = endOfDay(dateRange.to);
                else if (dateRange?.from) endDate = endOfDay(dateRange.from);
                break;
        }

        if (startDate && endDate) {
            dateFilteredDeposits = allDeposits.filter(d => {
                const dDate = parseISO(d.date);
                return dDate >= startDate! && dDate <= endDate!;
            });
        }

        if (!searchQuery) return dateFilteredDeposits;

        return dateFilteredDeposits.filter(deposit => {
            const query = searchQuery.toLowerCase();
            return (
                deposit.customerName.toLowerCase().includes(query) ||
                deposit.customerPhone.toLowerCase().includes(query) ||
                deposit.receiptNumber.toLowerCase().includes(query)
            );
        });
    }, [allDeposits, searchQuery, filterType, dateRange]);

    const openDialog = (deposit: Deposit | null = null) => {
        setCurrentDeposit(deposit);
        setIsDialogOpen(true);
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const repValue = formData.get('representativeId') as string | null;
        const repId = (repValue === 'none' || !repValue) ? null : repValue;
        const selectedRep = representatives.find(r => r.id === repId);

        const depositData: Partial<Deposit> = {
            customerName: formData.get('customerName') as string,
            customerPhone: formData.get('customerPhone') as string,
            amount: parseFloat(formData.get('amount') as string) || 0,
            description: formData.get('description') as string,
            representativeId: repId,
            representativeName: selectedRep?.name || null,
        };

        if (currentDeposit) {
            const success = await updateDeposit(currentDeposit.id, depositData);
            if (success) {
                toast({ title: "تم تحديث العربون بنجاح" });
                fetchInitialData();
                setIsDialogOpen(false);
            } else {
                toast({ title: "حدث خطأ", description: "فشل تحديث العربون.", variant: 'destructive' });
            }
        } else {
            const newDepositData: Omit<Deposit, 'id' | 'receiptNumber' | 'collectedDate'> = {
                ...(depositData as any),
                date: new Date().toISOString(),
                status: 'pending',
                collectedBy: repId ? 'representative' : 'admin',
            };
            const result = await addDeposit(newDepositData);
            if (result) {
                toast({ title: "تم إضافة العربون بنجاح" });
                fetchInitialData();
                setIsDialogOpen(false);
            } else {
                toast({ title: "حدث خطأ", description: "فشل حفظ العربون.", variant: 'destructive' });
            }
        }
    };

    const handleDelete = async () => {
        if (currentDeposit) {
            const success = await deleteDeposit(currentDeposit.id);
            if (success) {
                toast({ title: "تم حذف العربون" });
                fetchInitialData();
            } else {
                toast({ title: "حدث خطأ", description: "فشل حذف العربون.", variant: 'destructive' });
            }
        }
        setIsDeleteConfirmOpen(false);
        setCurrentDeposit(null);
    };

    const handleFilterChange = (type: string) => {
        setFilterType(type);
        if (type !== 'custom') setDateRange(undefined);
    }

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range);
        setFilterType('custom');
    }

    const handlePrint = (depositId: string) => {
        const printUrl = `/admin/deposits/print/${depositId}`;
        window.open(printUrl, '_blank', 'height=842,width=595,resizable=yes,scrollbars=yes');
    };

    const totalCollected = filteredDeposits.filter(d => d.status === 'collected').reduce((sum, d) => sum + d.amount, 0);
    const totalPending = filteredDeposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0);
    const totalCancelled = filteredDeposits.filter(d => d.status === 'cancelled').reduce((sum, d) => sum + d.amount, 0);
    const totalAll = filteredDeposits.reduce((sum, d) => sum + d.amount, 0);

    return (
        <div className="space-y-6 pb-12" dir="rtl">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">سجل العربون</h1>
                    <p className="text-muted-foreground mt-1 text-base">{allDeposits.length} سجل عربون محفوظ</p>
                </div>
                <Button className="h-11 px-6 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 gap-2 font-bold transition-all active:scale-95" onClick={() => openDialog()}>
                    <PlusCircle className="h-5 w-5" />
                    عربون جديد
                </Button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-slate-500/10 transition-colors" />
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 w-fit mb-4">
                        <Receipt className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">إجمالي العربونات</p>
                    <h3 className="text-2xl font-black text-foreground">{totalAll.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400 w-fit mb-4">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">تم التحصيل</p>
                    <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCollected.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-yellow-500/10 transition-colors" />
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-950/30 rounded-2xl text-yellow-600 dark:text-yellow-400 w-fit mb-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">قيد الانتظار</p>
                    <h3 className="text-2xl font-black text-yellow-600 dark:text-yellow-400">{totalPending.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-red-500/10 transition-colors" />
                    <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl text-red-600 dark:text-red-400 w-fit mb-4">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">طلبات ملغاة</p>
                    <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{totalCancelled.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-normal text-muted-foreground">د.ل</span></h3>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="ابحث بالاسم، الهاتف، أو رقم الإيصال..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("h-11 rounded-xl justify-start text-sm font-normal px-4 min-w-[180px]", filterType === 'custom' && "text-primary border-primary bg-primary/5")}>
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d/M")} - ${format(dateRange.to, "d/M/y")}` : format(dateRange.from, "d/M/yy")) : <span>فترة مخصصة</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateRangeSelect} numberOfMonths={2} locale={ar} />
                            </PopoverContent>
                        </Popover>
                        {dateRange && (
                            <Button variant="ghost" size="icon" onClick={() => { setDateRange(undefined); setFilterType('all'); }} className="h-11 w-11 rounded-xl shrink-0">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                    {[
                        { key: 'all', label: 'كافة السجلات' },
                        { key: 'daily', label: 'اليوم' },
                        { key: 'weekly', label: 'أسبوعي' },
                        { key: 'monthly', label: 'شهري' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => handleFilterChange(f.key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${filterType === f.key
                                ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-slate-50'
                                }`}
                        >
                            {f.label}
                            {f.key === filterType && filteredDeposits.length > 0 && (
                                <span className="mr-1.5 opacity-70 bg-white/20 px-1.5 rounded-full">{filteredDeposits.length}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <p className="font-bold text-foreground">سجل العمليات</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <p className="text-xs font-bold">{totalCollected.toLocaleString('ar-LY', { minimumFractionDigits: 2 })} <span className="text-[10px] text-muted-foreground">د.ل</span></p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                            <p className="text-xs font-bold">{totalPending.toLocaleString('ar-LY', { minimumFractionDigits: 2 })} <span className="text-[10px] text-muted-foreground">د.ل</span></p>
                        </div>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-none">
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 pr-6'>الرقم / العميل</TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>التاريخ</TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>المبلغ</TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 text-center'>الحالة</TableHead>
                            <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>بواسطة</TableHead>
                            <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : filteredDeposits.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-24 text-muted-foreground font-bold opacity-40">لا يوجد سجلات للفترة المحددة.</TableCell></TableRow>
                        ) : filteredDeposits.map((deposit) => (
                            <TableRow key={deposit.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-50 dark:border-slate-800">
                                <TableCell className="py-4 pr-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                                            <Wallet className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-black text-sm text-foreground">{deposit.customerName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-muted-foreground">#{deposit.receiptNumber}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground">{deposit.customerPhone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4">
                                    <p className="text-xs font-bold text-muted-foreground">{format(parseISO(deposit.date), "yyyy/MM/dd")}</p>
                                </TableCell>
                                <TableCell className="py-4">
                                    <p className="font-black text-sm text-foreground">{deposit.amount.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-normal opacity-60">د.ل</span></p>
                                </TableCell>
                                <TableCell className="py-4 text-center">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full border ${statusConfig[deposit.status].className}`}>
                                        {statusConfig[deposit.status].icon}
                                        {statusConfig[deposit.status].text}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs font-bold">{deposit.representativeName || 'الإدارة'}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 pl-6 text-left">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-all h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl p-1.5 min-w-[160px]">
                                            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-2 py-1">إجراءات السجل</DropdownMenuLabel>
                                            <DropdownMenuItem onSelect={() => openDialog(deposit)} className="rounded-lg gap-2 cursor-pointer font-medium p-2"><Edit className="h-4 w-4" /> تعديل البيانات</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handlePrint(deposit.id)} className="rounded-lg gap-2 cursor-pointer font-medium p-2"><Printer className="h-4 w-4" /> طباعة إيصال</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => { setCurrentDeposit(deposit); setIsDeleteConfirmOpen(true); }} className="text-destructive rounded-lg gap-2 cursor-pointer font-medium p-2"><Trash2 className="h-4 w-4" /> حذف العربون</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Form Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) setCurrentDeposit(null); }}>
                <DialogContent className="sm:max-w-md rounded-2xl" dir='rtl'>
                    <form onSubmit={handleSave}>
                        <DialogHeader className="text-right">
                            <DialogTitle className="text-xl font-bold">{currentDeposit ? 'تعديل بيانات العربون' : 'إضافة عربون جديد'}</DialogTitle>
                            <DialogDescription className="text-sm">أدخل البيانات المطلوبة لتسجيل عملية الدفع المسبق.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-6 text-right">
                            <div className="space-y-2">
                                <Label htmlFor="customerName" className="text-xs font-bold">اسم العميل</Label>
                                <Input id="customerName" name="customerName" defaultValue={currentDeposit?.customerName} required className="h-11 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerPhone" className="text-xs font-bold">رقم هاتف العميل</Label>
                                <Input id="customerPhone" name="customerPhone" defaultValue={currentDeposit?.customerPhone} required className="h-11 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-xs font-bold">المبلغ المدفوع (د.ل)</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" dir="ltr" defaultValue={currentDeposit?.amount} required className="h-11 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-xs font-bold">ملاحظات / وصف</Label>
                                <Textarea id="description" name="description" placeholder="اذكر تفاصيل إضافية..." defaultValue={currentDeposit?.description} className="rounded-lg resize-none min-h-[100px]" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="representativeId" className="text-xs font-bold">المسؤول عن التحصيل</Label>
                                <Select name="representativeId" defaultValue={currentDeposit?.representativeId || 'none'}>
                                    <SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="اختر مندوبًا أو اتركه للإدارة" /></SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        <SelectItem value="none">الإدارة العامة</SelectItem>
                                        {representatives.map(rep => (<SelectItem key={rep.id} value={rep.id}>{rep.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="submit" className="flex-1 rounded-xl h-11 font-bold">حفظ السجل</Button>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 rounded-xl h-11">إلغاء</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent className="rounded-2xl" dir='rtl'>
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-xl font-bold">تأكيد حذف العربون</DialogTitle>
                        <DialogDescription className="text-sm">
                            هل أنت متأكد من حذف هذا العربون؟ لا يمكن التراجع عن هذه الخطوة وسيتأثر الرصيد المالي.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                        <Button variant="destructive" className="flex-1 rounded-xl font-bold h-11" onClick={handleDelete}>نعم، احذف السجل</Button>
                        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setIsDeleteConfirmOpen(false)}>تراجع</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminDepositsPage;
