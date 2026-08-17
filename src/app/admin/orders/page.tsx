
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Truck, CheckCircle, Clock, DollarSign, Copy, UserPlus, Search, Package, Building, Plane, MapPin, UserX, Calendar as CalendarIcon, Filter, X, Printer, TrendingUp, Scale, Building2, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import { Order, OrderStatus, Representative, AppSettings } from '@/lib/types';
import { getOrders, updateOrder, deleteOrder, addTransaction, getRepresentatives, assignRepresentativeToOrder, unassignRepresentativeFromOrder, bulkDeleteOrders, bulkUpdateOrdersStatus, getAppSettings, addCustomerWeight } from '@/lib/actions';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';


const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ReactNode; className: string } } = {
  pending: { text: 'قيد التجهيز', icon: <Clock className="w-4 h-4" />, className: 'bg-yellow-100 text-yellow-700' },
  processed: { text: 'تم التنفيذ', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-cyan-100 text-cyan-700' },
  ready: { text: 'تم التجهيز', icon: <Package className="w-4 h-4" />, className: 'bg-indigo-100 text-indigo-700' },
  shipped: { text: 'تم الشحن', icon: <Truck className="w-4 h-4" />, className: 'bg-blue-100 text-blue-700' },
  arrived_dubai: { text: 'وصلت إلى دبي', icon: <Plane className="w-4 h-4" />, className: 'bg-orange-100 text-orange-700' },
  arrived_benghazi: { text: 'وصلت إلى بنغازي', icon: <Building className="w-4 h-4" />, className: 'bg-teal-100 text-teal-700' },
  arrived_tripoli: { text: 'وصلت إلى طرابلس', icon: <Building className="w-4 h-4" />, className: 'bg-purple-100 text-purple-700' },
  office_pickup: { text: 'استلام فالمكتب', icon: <Building2 className="w-4 h-4" />, className: 'bg-amber-100 text-amber-800' },
  transferred_to_rep: { text: 'تحويل للمندوب', icon: <UserCheck className="w-4 h-4" />, className: 'bg-sky-100 text-sky-700' },
  out_for_delivery: { text: 'مع المندوب', icon: <MapPin className="w-4 h-4" />, className: 'bg-lime-100 text-lime-700' },
  delivered: { text: 'تم التسليم', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-green-100 text-green-700' },
  cancelled: { text: 'ملغي', icon: <Trash2 className="w-4 h-4" />, className: 'bg-red-100 text-red-700' },
  paid: { text: 'مدفوع', icon: <CheckCircle className="w-4 h-4" />, className: 'bg-green-100 text-green-700' },
};

const allStatuses = Object.keys(statusConfig) as OrderStatus[];

import { motion, AnimatePresence } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

const AdminOrdersPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isWeightDialogOpen, setIsWeightDialogOpen] = useState(false);

  // Data for dialogs
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [weightKg, setWeightKg] = useState(0);
  const [companyKiloPriceUSD, setCompanyKiloPriceUSD] = useState(0); // Company cost per kilo in USD
  const [customerKiloPrice, setCustomerKiloPrice] = useState(0); // Customer price per kilo in LYD

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Bulk actions states
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const selectedRowCount = useMemo(() => Object.values(selectedRows).filter(Boolean).length, [selectedRows]);


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedOrders, fetchedReps, fetchedSettings] = await Promise.all([
        getOrders(),
        getRepresentatives(),
        getAppSettings()
      ]);
      setOrders(fetchedOrders.sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime()));
      setRepresentatives(fetchedReps);
      setSettings(fetchedSettings);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحميل البيانات.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const query = searchQuery.toLowerCase();

      // Search filter
      const matchesSearch = (
        order.customerName.toLowerCase().includes(query) ||
        (order.trackingId && order.trackingId.toLowerCase().includes(query)) ||
        (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(query))
      );

      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      // Payment filter
      const matchesPayment = paymentFilter === 'all' ||
        (paymentFilter === 'paid' && order.remainingAmount <= 0) ||
        (paymentFilter === 'unpaid' && order.remainingAmount > 0);

      // Date range filter
      const matchesDate = !dateRange?.from || (
        parseISO(order.operationDate) >= startOfDay(dateRange.from) &&
        parseISO(order.operationDate) <= endOfDay(dateRange.to || dateRange.from)
      );

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, dateRange]);

  const { totalValue, totalDebt, totalProfit } = useMemo(() => {
    const activeOrders = filteredOrders.filter(o => o.status !== 'cancelled');
    const value = activeOrders.reduce((sum, order) => sum + order.sellingPriceLYD, 0);
    const debt = activeOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
    const profit = activeOrders.reduce((sum, order) => {
      const purchaseCostLYD = (order.purchasePriceUSD || 0) * (order.exchangeRate || settings?.exchangeRate || 1);
      const shippingCostLYD = order.shippingCostLYD || 0;
      // Company weight cost stored in USD, convert to LYD using order's exchange rate (or current if not set)
      const weightCostUSD = order.companyWeightCostUSD || 0;
      const weightCostLYD = weightCostUSD * (order.exchangeRate || settings?.exchangeRate || 1);

      // Legacy support: if companyWeightCost (LYD) exists, add it too (though we deprecated it)
      const legacyWeightCost = order.companyWeightCost || 0;

      const netProfit = order.sellingPriceLYD - purchaseCostLYD - shippingCostLYD - weightCostLYD - legacyWeightCost;
      return sum + netProfit;
    }, 0);

    return { totalValue: value, totalDebt: debt, totalProfit: profit };
  }, [filteredOrders, settings]);


  const handleSelectRow = (orderId: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [orderId]: checked }));
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked) {
      filteredOrders.forEach(order => {
        newSelectedRows[order.id] = true;
      });
    }
    setSelectedRows(newSelectedRows);
  };

  // --- Single Action Handlers ---
  const openPaymentDialog = (order: Order) => {
    setCurrentOrder(order);
    setPaymentAmount(0);
    setPaymentNotes('');
    setIsPaymentDialogOpen(true);
  };

  const openDeleteConfirm = (order: Order) => {
    setCurrentOrder(order);
    setIsDeleteConfirmOpen(true);
  };

  const openWeightDialog = (order: Order) => {
    setCurrentOrder(order);
    setWeightKg(0);
    setCompanyKiloPriceUSD(0);
    setCustomerKiloPrice(0);
    setIsWeightDialogOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrder(orderId, { status });
      setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status } : o));
      toast({ title: "تم تحديث الحالة بنجاح" });
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحديث الحالة", variant: "destructive" });
    }
  };

  const handleAddPayment = async () => {
    if (!currentOrder || paymentAmount <= 0) return;

    let description = `دفعة من طلب ${currentOrder.invoiceNumber}`;
    if (paymentNotes) {
      description += ` | ${paymentNotes}`;
    }

    await addTransaction({
      orderId: currentOrder.id,
      customerId: currentOrder.userId,
      customerName: currentOrder.customerName,
      date: new Date().toISOString(),
      type: 'payment',
      status: 'paid',
      amount: paymentAmount,
      description: description,
    });
    toast({ title: "تم تسجيل الدفعة بنجاح" });
    setIsPaymentDialogOpen(false);
    setCurrentOrder(null);
    fetchData();
  };

  const handleDeleteOrder = async () => {
    if (currentOrder) {
      const success = await deleteOrder(currentOrder.id);
      if (success) {
        setOrders(prevOrders => prevOrders.filter(o => o.id !== currentOrder.id));
        toast({ title: "تم حذف الطلب" });
      } else {
        toast({ title: "خطأ", description: "فشل حذف الطلب. يرجى مراجعة السجلات.", variant: "destructive" });
      }
    }
    setIsDeleteConfirmOpen(false);
    setCurrentOrder(null);
  };

  const handleAssignRep = async (orderId: string, rep: Representative) => {
    await assignRepresentativeToOrder(orderId, rep);
    toast({ title: "تم إسناد المندوب وتغيير الحالة إلى 'مع المندوب'" });
    fetchData(); // Refetch data to show updated status
  }

  const handleUnassignRep = async (orderId: string) => {
    await unassignRepresentativeFromOrder(orderId);
    toast({ title: "تم إلغاء إسناد المندوب وإرجاع الحالة إلى 'تم التجهيز'" });
    fetchData(); // Refetch data
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "تم النسخ!", description: `تم نسخ ${label} إلى الحافظة.` });
    });
  };

  const handlePrint = (order: Order) => {
    window.open(`/admin/orders/${order.id}/print`, '_blank', 'height=842,width=595,resizable=yes,scrollbars=yes');
  };

  const handleAddWeightCost = async () => {
    if (!currentOrder || weightKg <= 0) return;

    try {
      await addCustomerWeight(currentOrder.id, weightKg, companyKiloPriceUSD, customerKiloPrice);

      const customerTotalLYD = weightKg * customerKiloPrice;
      const companyTotalUSD = weightKg * companyKiloPriceUSD;

      setOrders(prev => prev.map(o => {
        if (o.id === currentOrder.id) {
          return {
            ...o,
            sellingPriceLYD: o.sellingPriceLYD + customerTotalLYD,
            remainingAmount: o.remainingAmount + customerTotalLYD,
            customerWeightCost: (o.customerWeightCost || 0) + customerTotalLYD,
            companyWeightCostUSD: (o.companyWeightCostUSD || 0) + companyTotalUSD,
            weightKG: (o.weightKG || 0) + weightKg,
            companyPricePerKiloUSD: companyKiloPriceUSD,
            customerPricePerKilo: customerKiloPrice
          };
        }
        return o;
      }));
      toast({ title: "تم إضافة وزن للزبون بنجاح" });
      setIsWeightDialogOpen(false);
      setCurrentOrder(null);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل إضافة القيمة", variant: "destructive" });
    }
  };

  // --- Bulk Action Handlers ---
  const handleBulkDelete = async () => {
    const idsToDelete = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (idsToDelete.length === 0) return;
    const success = await bulkDeleteOrders(idsToDelete);
    if (success) {
      toast({ title: `تم حذف ${idsToDelete.length} طلب بنجاح` });
      fetchData();
      setSelectedRows({});
    } else {
      toast({ title: "خطأ", description: "فشل حذف بعض الطلبات.", variant: "destructive" });
    }
    setIsBulkDeleteOpen(false);
  }

  const handleBulkUpdateStatus = async (status: OrderStatus) => {
    const idsToUpdate = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (idsToUpdate.length === 0) return;
    const success = await bulkUpdateOrdersStatus(idsToUpdate, status);
    if (success) {
      toast({ title: `تم تحديث حالة ${idsToUpdate.length} طلب بنجاح` });
      fetchData();
      setSelectedRows({});
    } else {
      toast({ title: "خطأ", description: "فشل تحديث حالة بعض الطلبات.", variant: "destructive" });
    }
  }

  const handleBulkAssignRep = async (rep: Representative) => {
    const idsToUpdate = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (idsToUpdate.length === 0) return;
    // This is not implemented in actions.ts yet
    toast({ title: "قيد التطوير", description: "الإسناد الجماعي للمندوبين قيد التطوير.", variant: "default" });
  }

  const handleBulkPrint = () => {
    const idsToPrint = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (idsToPrint.length === 0) return;

    const idsParam = idsToPrint.join(',');
    window.open(`/admin/orders/bulk-print?ids=${idsParam}`, '_blank');

    toast({ title: `جاري تجهيز ${idsToPrint.length} بوليصة للطباعة`, description: 'سيتم فتح صفحة الطباعة الموحدة' });
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الطلبات</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} طلب إجمالياً</p>
        </div>
        <Button className="gap-2 bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90" onClick={() => router.push('/admin/orders/add')}>
          <PlusCircle className="h-4 w-4" />
          طلب جديد
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">إجمالي الطلبات</p>
          <p className="text-2xl font-bold text-foreground">{filteredOrders.length}</p>
          <p className="text-xs text-muted-foreground mt-1">طلب معروض</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">إجمالي القيمة</p>
          <p className="text-2xl font-bold text-foreground">{totalValue.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">د.ل</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">إجمالي الديون</p>
          <p className="text-2xl font-bold text-destructive">{totalDebt.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">د.ل متبقي</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">صافي الأرباح</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{totalProfit.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">د.ل</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ابحث بالاسم، كود التتبع، أو رقم الفاتورة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 text-sm"
            />
          </div>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[160px] text-sm">
              <SelectValue placeholder="حالة الدفع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الدفعات</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
              <SelectItem value="unpaid">غير مدفوع</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full sm:w-auto justify-start text-sm font-normal", dateRange && "text-primary border-primary")}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? `${format(dateRange.from, "d/M")} - ${format(dateRange.to, "d/M/y")}` : format(dateRange.from, "d/M/yy")
                ) : <span>الفترة الزمنية</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          {dateRange && (
            <Button variant="ghost" size="icon" onClick={() => setDateRange(undefined)} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {/* Status Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200'
              }`}
          >كل الحالات ({orders.length})</button>
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {statusConfig[s].text} ({orders.filter(o => o.status === s).length})
            </button>
          ))}
        </div>
      </div>
      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {selectedRowCount > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border-b border-primary/20">
            <span className="text-sm font-semibold text-primary">{selectedRowCount} طلب محدد</span>
            {/* One-click bulk print button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-white gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={handleBulkPrint}
            >
              <Printer className="w-4 h-4" />
              طباعة المحدد ({selectedRowCount})
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white">الإجراءات الجماعية</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>تحديث الحالة</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {allStatuses.map(s => (
                      <DropdownMenuItem key={s} onSelect={() => handleBulkUpdateStatus(s)}>{statusConfig[s].text}</DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>إسناد إلى مندوب</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {representatives.map(rep => (
                      <DropdownMenuItem key={rep.id} onSelect={() => handleBulkAssignRep(rep)}>{rep.name}</DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onSelect={() => setIsBulkDeleteOpen(true)}>حذف المحدد</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedRowCount > 0 && selectedRowCount === filteredOrders.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
              </TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">رقم الفاتورة</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">كود التتبع</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">اسم العميل</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">المندوب</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">الإجمالي</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">المتبقي</TableHead>
              <TableHead className="text-right font-semibold text-xs text-foreground">الحالة</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center h-32">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Package className="w-5 h-5 animate-bounce text-primary" />
                  <span>جاري تحميل الطلبات...</span>
                </div>
              </TableCell></TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center h-32">
                <p className="text-muted-foreground">لا توجد طلبات تطابق البحث</p>
              </TableCell></TableRow>
            ) : filteredOrders.map((order) => (
              <TableRow
                key={order.id}
                className={`group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${selectedRows[order.id] ? "bg-primary/5" : ""}`}
              >
                <TableCell>
                  <Checkbox checked={!!selectedRows[order.id]} onCheckedChange={(checked) => handleSelectRow(order.id, !!checked)} />
                </TableCell>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="font-bold text-sm hover:text-primary transition-colors">{order.invoiceNumber}</Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">{order.trackingId}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(order.trackingId, 'كود التتبع')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">{order.customerName}</TableCell>
                <TableCell>{order.representativeName ? <Badge variant="secondary" className="font-normal text-xs">{order.representativeName}</Badge> : <span className="text-muted-foreground text-sm">--</span>}</TableCell>
                <TableCell className="font-semibold text-sm">{order.sellingPriceLYD.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل</TableCell>
                <TableCell className={`font-semibold text-sm ${order.remainingAmount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {order.remainingAmount.toLocaleString('ar-LY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.ل
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig[order.status as keyof typeof statusConfig].className}`}>
                    {statusConfig[order.status as keyof typeof statusConfig].icon}
                    <span className="mr-0.5">{statusConfig[order.status as keyof typeof statusConfig].text}</span>
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => router.push(`/admin/orders/add?id=${order.id}`)}><Edit className="ml-2 h-4 w-4" /> تعديل</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handlePrint(order)}><Printer className="ml-2 h-4 w-4" /> طباعة</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openPaymentDialog(order)} disabled={order.remainingAmount <= 0}><DollarSign className="ml-2 h-4 w-4" /> دفعة</DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><Truck className="ml-2 h-4 w-4" /> تحديث الحالة</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {allStatuses.map(s => <DropdownMenuItem key={s} onSelect={() => handleUpdateStatus(order.id, s)}>{statusConfig[s].text}</DropdownMenuItem>)}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger><UserPlus className="ml-2 h-4 w-4" /> إسناد مندوب</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onSelect={() => handleUnassignRep(order.id)}><UserX className="ml-2 h-4 w-4" /> إلغاء الإسناد</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {representatives.map(rep => <DropdownMenuItem key={rep.id} onSelect={() => handleAssignRep(order.id, rep)}>{rep.name}</DropdownMenuItem>)}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => openDeleteConfirm(order)} className="text-destructive"><Trash2 className="ml-2 h-4 w-4" /> حذف</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => openWeightDialog(order)}><Scale className="ml-2 h-4 w-4" /> وزن الزبون</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>


      {/* Payment Dialog */}
      < Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent dir='rtl'>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة - طلب {currentOrder?.invoiceNumber}</DialogTitle>
            <DialogDescription>المتبقي: {currentOrder?.remainingAmount.toFixed(2)} د.ل</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">قيمة الدفعة (د.ل)</Label>
              <Input id="payment-amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">ملاحظات (اختياري)</Label>
              <Textarea id="payment-notes" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="مثال: دفعة عن طريق الحساب البنكي..." />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddPayment}>حفظ الدفعة</Button>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      < Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent dir='rtl'>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف الطلب "{currentOrder?.invoiceNumber}"؟ لا يمكن التراجع عن هذا الإجراء.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteOrder}>حذف</Button>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      < Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent dir='rtl'>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف الجماعي</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف {selectedRowCount} طلب؟; لا يمكن التراجع.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleBulkDelete}>نعم، قم بحذف الكل</Button>
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weight Cost Dialog */}
      < Dialog open={isWeightDialogOpen} onOpenChange={setIsWeightDialogOpen}>
        <DialogContent dir='rtl'>
          <DialogHeader>
            <DialogTitle>إضافة تفاصيل الوزن - {currentOrder?.invoiceNumber}</DialogTitle>
            <DialogDescription>أدخل الوزن وتكلفة الكيلو (على الشركة) وسعر بيع الكيلو (للزبون).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight-kg">الوزن (كجم)</Label>
              <Input id="weight-kg" type="number" value={weightKg} onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-price">تكلفة الكيلو على الشركة ($ دولار)</Label>
              <Input id="company-price" type="number" value={companyKiloPriceUSD} onChange={(e) => setCompanyKiloPriceUSD(parseFloat(e.target.value) || 0)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-price">سعر بيع الكيلو للزبون (د.ل)</Label>
              <Input id="customer-price" type="number" value={customerKiloPrice} onChange={(e) => setCustomerKiloPrice(parseFloat(e.target.value) || 0)} dir="ltr" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-sm space-y-2">
              {(() => {
                const companyTotalUSD = weightKg * companyKiloPriceUSD;
                const exchangeRate = currentOrder?.exchangeRate || settings?.exchangeRate || 1;
                const companyTotalLYD = companyTotalUSD * exchangeRate;
                const customerTotalLYD = weightKg * customerKiloPrice;
                const profit = customerTotalLYD - companyTotalLYD;
                return (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">التكلفة (شركة - $):</span><span className="font-bold">{companyTotalUSD.toFixed(2)} $</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">إجمالي البيع (زبون):</span><span className="font-bold text-green-600">{customerTotalLYD.toFixed(2)} د.ل</span></div>
                    <div className="flex justify-between border-t pt-2 mt-1"><span>تقدير الربح:</span><span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profit.toFixed(2)} د.ل</span></div>
                  </>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddWeightCost}>حفظ</Button>
            <Button variant="outline" onClick={() => setIsWeightDialogOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;
