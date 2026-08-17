
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Order, OrderStatus, Representative, Transaction } from '@/lib/types';
import { getOrderById, getRepresentativeById, getTransactionsByOrderId } from '@/lib/actions';
import {
    Loader2, ArrowRight, Clock, Truck, Building, Plane, MapPin,
    PackageCheck, PackageX, CheckCircle, User, Phone, Copy,
    DollarSign, CreditCard, Weight, Package as PackageIcon,
    Tag, Receipt, Building2, UserCheck
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ElementType; color: string; bg: string; gradient: string } } = {
    pending: { text: 'قيد التجهيز', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-100', gradient: 'from-yellow-400 to-amber-500' },
    processed: { text: 'تم التنفيذ', icon: CheckCircle, color: 'text-cyan-700', bg: 'bg-cyan-100', gradient: 'from-cyan-400 to-sky-500' },
    ready: { text: 'تم التجهيز', icon: PackageIcon, color: 'text-indigo-700', bg: 'bg-indigo-100', gradient: 'from-indigo-400 to-violet-500' },
    shipped: { text: 'تم الشحن', icon: Truck, color: 'text-blue-700', bg: 'bg-blue-100', gradient: 'from-blue-400 to-sky-600' },
    arrived_dubai: { text: 'وصلت إلى دبي', icon: Plane, color: 'text-orange-700', bg: 'bg-orange-100', gradient: 'from-orange-400 to-amber-600' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', icon: Building, color: 'text-teal-700', bg: 'bg-teal-100', gradient: 'from-teal-400 to-cyan-600' },
    arrived_tripoli: { text: 'وصلت إلى طرابلس', icon: Building, color: 'text-purple-700', bg: 'bg-purple-100', gradient: 'from-purple-400 to-violet-600' },
    office_pickup: { text: 'استلام فالمكتب', icon: Building2, color: 'text-amber-700', bg: 'bg-amber-100', gradient: 'from-amber-400 to-yellow-600' },
    transferred_to_rep: { text: 'تحويل للمندوب', icon: UserCheck, color: 'text-sky-700', bg: 'bg-sky-100', gradient: 'from-sky-400 to-blue-600' },
    out_for_delivery: { text: 'مع المندوب', icon: MapPin, color: 'text-lime-700', bg: 'bg-lime-100', gradient: 'from-lime-400 to-green-500' },
    delivered: { text: 'تم التسليم', icon: PackageCheck, color: 'text-green-700', bg: 'bg-green-100', gradient: 'from-green-400 to-emerald-600' },
    cancelled: { text: 'ملغي', icon: PackageX, color: 'text-red-600', bg: 'bg-red-100', gradient: 'from-red-400 to-rose-600' },
    paid: { text: 'مدفوع', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100', gradient: 'from-green-400 to-emerald-600' },
};

const statusSteps: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
    { key: 'pending', label: 'قيد التجهيز', icon: Clock },
    { key: 'ready', label: 'تم التجهيز', icon: PackageIcon },
    { key: 'shipped', label: 'تم الشحن', icon: Truck },
    { key: 'arrived_dubai', label: 'وصلت دبي', icon: Plane },
    { key: 'arrived_tripoli', label: 'وصلت طرابلس', icon: Building },
    { key: 'out_for_delivery', label: 'مع المندوب', icon: MapPin },
    { key: 'delivered', label: 'تم التسليم', icon: PackageCheck },
];

const getStepIndex = (status: OrderStatus) => statusSteps.findIndex(s => s.key === status);

const InfoRow = ({ icon: Icon, label, value, action }: { icon: React.ElementType; label: string; value?: string | number; action?: React.ReactNode }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
        <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{value || 'غير محدد'}</span>
            {action}
        </div>
    </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm px-4 py-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide pt-4 pb-2">{title}</p>
        {children}
    </div>
);

const OrderDetailsContent = () => {
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId as string;
    const { toast } = useToast();

    const [order, setOrder] = useState<Order | null>(null);
    const [representative, setRepresentative] = useState<Representative | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!orderId) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const fetchedOrder = await getOrderById(orderId);
                setOrder(fetchedOrder);
                if (fetchedOrder?.representativeId) {
                    const fetchedRep = await getRepresentativeById(fetchedOrder.representativeId);
                    setRepresentative(fetchedRep);
                }
                if (fetchedOrder) {
                    const fetchedTxs = await getTransactionsByOrderId(fetchedOrder.id);
                    setTransactions(fetchedTxs);
                }
            } catch {
                toast({ title: 'خطأ', description: 'فشل في تحميل بيانات الطلب.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [orderId, toast]);

    const copy = (text: string, label: string) => {
        navigator.clipboard.writeText(text).then(() =>
            toast({ title: 'تم النسخ!', description: `تم نسخ ${label} إلى الحافظة.` })
        );
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex h-screen items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-950" dir="rtl">
                <div>
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PackageX className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-lg font-bold text-foreground mb-2">تعذر العثور على الطلب</h1>
                    <p className="text-sm text-muted-foreground mb-6">قد يكون الطلب قد تم حذفه أو أن الرابط غير صحيح.</p>
                    <button onClick={() => router.back()} className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold">العودة</button>
                </div>
            </div>
        );
    }

    const cfg = statusConfig[order.status];
    const StatusIcon = cfg.icon;
    const currentStepIndex = getStepIndex(order.status);
    const totalPaid = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-8" dir="rtl">

            {/* Hero Header */}
            <div className={`bg-gradient-to-br ${cfg.gradient} px-5 pt-12 pb-10`}>
                <button onClick={() => router.back()} className="text-white/80 mb-4 flex items-center gap-1 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    طلباتي
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-white/70 text-xs mb-1">فاتورة #{order.invoiceNumber}</p>
                        <h1 className="text-2xl font-bold text-white">{order.itemDescription || 'شحنة'}</h1>
                        <p className="text-white/70 text-sm mt-1">{new Date(order.operationDate).toLocaleDateString('ar-LY')}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
                        <StatusIcon className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                    <StatusIcon className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-xs font-semibold">{cfg.text}</span>
                </div>
            </div>

            {/* Tracking ID — floats over hero */}
            <div className="px-5 -mt-5 mb-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-3.5 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">كود التتبع</p>
                        <p className="font-mono font-bold text-base tracking-widest text-foreground">{order.trackingId}</p>
                    </div>
                    <button
                        onClick={() => copy(order.trackingId, 'كود التتبع')}
                        className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700"
                    >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
            </div>

            <main className="px-5 space-y-4">

                {/* Progress Stepper */}
                {order.status !== 'cancelled' && (
                    <Section title="مسار الشحنة">
                        <div className="overflow-x-auto pb-4">
                            <div className="flex items-center gap-0 min-w-max py-2">
                                {statusSteps.map((step, idx) => {
                                    const isCompleted = currentStepIndex >= idx;
                                    const isCurrent = currentStepIndex === idx;
                                    const StepIcon = step.icon;
                                    return (
                                        <div key={step.key} className="flex items-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                        ? `bg-gradient-to-br ${cfg.gradient} text-white shadow-md`
                                                        : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                                                    } ${isCurrent ? 'ring-2 ring-offset-2 ring-current scale-110' : ''}`}>
                                                    <StepIcon className="w-4 h-4" />
                                                </div>
                                                <span className={`text-[9px] text-center w-14 leading-tight font-medium ${isCompleted ? `${cfg.color}` : 'text-muted-foreground'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                            {idx < statusSteps.length - 1 && (
                                                <div className={`w-6 h-0.5 mb-5 mx-0.5 rounded-full transition-colors ${currentStepIndex > idx ? `bg-gradient-to-r ${cfg.gradient}` : 'bg-slate-200 dark:bg-slate-700'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Section>
                )}

                {/* Shipment Details */}
                <Section title="تفاصيل الشحنة">
                    <InfoRow icon={Tag} label="وصف السلعة" value={order.itemDescription} />
                    <InfoRow icon={Weight} label="وزن الشحنة" value={`${(order.weightKG || 0).toFixed(2)} كجم`} />
                </Section>

                {/* Representative */}
                {representative && (
                    <Section title="المندوب">
                        <InfoRow icon={User} label="الاسم" value={representative.name} />
                        <InfoRow
                            icon={Phone}
                            label="الهاتف"
                            value={representative.phone}
                            action={
                                <button
                                    onClick={() => copy(representative.phone, 'رقم هاتف المندوب')}
                                    className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center"
                                >
                                    <Copy className="w-3 h-3 text-muted-foreground" />
                                </button>
                            }
                        />
                    </Section>
                )}

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
                        <p className="text-base font-bold text-primary">{order.sellingPriceLYD.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">د.ل</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">المدفوع</p>
                        <p className="text-base font-bold text-green-600">{totalPaid.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">د.ل</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
                        <p className={`text-base font-bold ${order.remainingAmount > 0 ? 'text-red-500' : 'text-green-600'}`}>{order.remainingAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">د.ل</p>
                    </div>
                </div>

                {/* Transaction History */}
                <Section title="سجل العمليات المالية">
                    {transactions.length === 0 ? (
                        <div className="text-center py-5 mb-2">
                            <Receipt className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">لا توجد عمليات مالية مسجلة</p>
                        </div>
                    ) : (
                        transactions.map((tx, i) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(tx.date).toLocaleDateString('ar-LY')}</p>
                                </div>
                                <span className={`text-sm font-bold ${tx.type === 'payment' ? 'text-green-600' : 'text-red-500'}`}>
                                    {tx.type === 'payment' ? '+' : '-'}{tx.amount.toLocaleString()} د.ل
                                </span>
                            </motion.div>
                        ))
                    )}
                </Section>

            </main>
        </div>
    );
};

export default function Page() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <OrderDetailsContent />
        </Suspense>
    );
}
