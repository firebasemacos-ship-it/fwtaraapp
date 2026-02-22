// src/app/admin/expenses/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, Loader2, TrendingDown, Search, Calendar as CalendarIcon, X, CreditCard, CalendarDays, History } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Expense } from '@/lib/types';
import { getExpenses, addExpense, deleteExpense } from '@/lib/actions';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const AdminExpensesPage = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedExpenses = await getExpenses();
      setExpenses(fetchedExpenses);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل قائمة المصروفات.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const filteredExpenses = useMemo(() => {
    let dateFilteredExpenses = expenses;
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
      dateFilteredExpenses = expenses.filter(d => {
        const dDate = parseISO(d.date);
        return dDate >= startDate! && dDate <= endDate!;
      });
    }

    if (!searchQuery) return dateFilteredExpenses;

    return dateFilteredExpenses.filter(expense =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [expenses, searchQuery, filterType, dateRange]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!description || amount <= 0) {
      toast({ title: "خطأ", description: "الرجاء إدخال وصف ومبلغ صحيح.", variant: 'destructive' });
      return;
    }

    try {
      const newExpenseData: Omit<Expense, 'id'> = {
        description,
        amount,
        date: new Date().toISOString(),
      };
      const newExpense = await addExpense(newExpenseData);
      if (newExpense) {
        setExpenses(prev => [newExpense, ...prev]);
        toast({ title: "تم إضافة المصروف بنجاح" });
      } else {
        throw new Error("Failed to create expense");
      }
      setIsDialogOpen(false);
      setDescription('');
      setAmount(0);
    } catch (error) {
      toast({ title: "حدث خطأ", description: "فشل حفظ المصروف.", variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (currentExpense) {
      try {
        await deleteExpense(currentExpense.id);
        setExpenses(expenses.filter(e => e.id !== currentExpense.id));
        toast({ title: "تم حذف المصروف" });
      } catch (error) {
        toast({ title: "حدث خطأ", description: "فشل حذف المصروف.", variant: 'destructive' });
      }
    }
    setIsDeleteConfirmOpen(false);
    setCurrentExpense(null);
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    if (type !== 'custom') {
      setDateRange(undefined);
    }
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilterType('custom');
  }

  const totalFilteredExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const monthlyExpensesValue = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = parseISO(e.date);
      return d >= startOfMonth(now) && d <= endOfMonth(now);
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const todayExpensesValue = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = parseISO(e.date);
      return d >= startOfDay(now) && d <= endOfDay(now);
    }).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const allTimeExpensesValue = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">إدارة المصروفات</h1>
          <p className="text-muted-foreground mt-1 text-base">{expenses.length} مصروف مسجل في النظام</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 px-6 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 gap-2 font-bold">
              <PlusCircle className="h-5 w-5" />
              إضافة مصروف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl" dir='rtl'>
            <form onSubmit={handleSave}>
              <DialogHeader className="text-right">
                <DialogTitle className="text-xl font-bold">تسجيل مصروف جديد</DialogTitle>
                <DialogDescription className="text-sm">أدخل تفاصيل المصروف ليتم خصمه من الإحصائيات المالية.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-6">
                <div className="space-y-2 text-right">
                  <Label htmlFor="description" className="text-sm font-bold">وصف النفقات</Label>
                  <Input
                    id="description"
                    placeholder="مثلاً: صيانة المحل، فاتورة كهرباء..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-11 rounded-lg border-slate-200 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="amount" className="text-sm font-bold">المبلغ (د.ل)</Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      dir="ltr"
                      className="h-11 rounded-lg border-slate-200 focus:ring-primary focus:border-primary pr-4"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">د.ل</span>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="submit" className="flex-1 rounded-xl h-11 font-bold">حفظ المصروف</Button>
                <Button type="button" variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* All-time Statistics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-red-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-950/30 rounded-2xl text-red-600 dark:text-red-400">
              <History className="w-6 h-6" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium mb-1">إجمالي المصروفات</p>
          <h3 className="text-3xl font-black text-foreground">
            {allTimeExpensesValue.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">د.ل</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-2">السجل التراكمي الكامل</p>
        </div>

        {/* Monthly Statistics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-orange-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-950/30 rounded-2xl text-orange-600 dark:text-orange-400">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium mb-1">مصروفات الشهر</p>
          <h3 className="text-3xl font-black text-foreground">
            {monthlyExpensesValue.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">د.ل</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-2">{format(new Date(), 'MMMM yyyy', { locale: ar })}</p>
        </div>

        {/* Today's Statistics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium mb-1">نفقات اليوم</p>
          <h3 className="text-3xl font-black text-foreground">
            {todayExpensesValue.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-normal text-muted-foreground">د.ل</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-2">{format(new Date(), 'EEEE, d MMMM', { locale: ar })}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ابحث في وصف المصروفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("h-11 rounded-xl justify-start text-sm font-normal px-4 min-w-[180px]", filterType === 'custom' && "text-primary border-primary bg-primary/5")}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? `${format(dateRange.from, "d/M")} - ${format(dateRange.to, "d/M/y")}` : format(dateRange.from, "d/M/yy")
                  ) : <span>تحديد فترة مخصصة</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={handleDateRangeSelect} numberOfMonths={2} locale={ar} />
              </PopoverContent>
            </Popover>
            {dateRange && (
              <Button variant="ghost" size="icon" onClick={() => { setDateRange(undefined); setFilterType('all'); }} className="h-11 w-11 rounded-xl">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
          {[
            { key: 'all', label: 'كافة السجلات' },
            { key: 'daily', label: 'اليوم' },
            { key: 'weekly', label: 'هذا الأسبوع' },
            { key: 'monthly', label: 'هذا الشهر' },
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
              {f.key === filterType && filteredExpenses.length > 0 && (
                <span className="mr-1.5 opacity-70 bg-white/20 px-1.5 rounded-full">{filteredExpenses.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-muted-foreground" />
            <p className="font-bold text-foreground">قائمة المصروفات</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">إجمالي القائمة:</p>
            <p className="font-black text-red-600 dark:text-red-400">
              {totalFilteredExpenses.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-none">
              <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 pr-6'>التفاصيل / الوصف</TableHead>
              <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>التاريخ والوقت</TableHead>
              <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>المبلغ المستحق</TableHead>
              <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center gap-2 opacity-40">
                    <History className="w-12 h-12" />
                    <p className="font-bold">لا يوجد مصروفات للفترة المحددة</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredExpenses.map((expense) => (
                  <TableRow
                    key={expense.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-50 dark:border-slate-800"
                  >
                    <TableCell className="py-4 pr-6">
                      <p className="font-bold text-sm text-foreground">{expense.description}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        {format(parseISO(expense.date), "yyyy/MM/dd")}
                        <span className="mx-2 text-slate-200 dark:text-slate-700">|</span>
                        {format(parseISO(expense.date), "hh:mm a", { locale: ar })}
                      </p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="font-black text-red-600 dark:text-red-400 text-sm">
                        {expense.amount.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] font-normal opacity-60">د.ل</span>
                      </p>
                    </TableCell>
                    <TableCell className="py-4 pl-6 text-left">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-all h-8 w-8 text-destructive hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                        onClick={() => {
                          setCurrentExpense(expense);
                          setIsDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="rounded-2xl" dir='rtl'>
          <DialogHeader className="text-right">
            <DialogTitle className="text-xl font-bold">حذف السجل</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف هذا المصروف؟
              <br />
              <span className="text-destructive font-bold">"{currentExpense?.description}"</span>
              <br />
              هذا الإجراء سيقوم بتعديل التقارير المالية ولا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="destructive" className="flex-1 rounded-xl font-bold" onClick={handleDelete}>حذف نهائي</Button>
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExpensesPage;
