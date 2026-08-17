
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, Loader2, PackageCheck, PackageX, Truck, XCircle, User, Phone, MapPin, Tag, Weight, DollarSign, CreditCard, Building, Package, Plane, CheckCircle, Clock } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { getOrderByTrackingId } from "@/lib/actions";
import { Order, OrderStatus } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';
import { Home, ClipboardList, Users, Settings } from 'lucide-react';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

// Status order for the progress tracker
const statusSteps: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
    { key: 'pending', label: 'قيد التجهيز', icon: Clock },
    { key: 'ready', label: 'تم التجهيز', icon: Package },
    { key: 'shipped', label: 'تم الشحن', icon: Truck },
    { key: 'arrived_dubai', label: 'وصلت دبي', icon: Plane },
    { key: 'arrived_tripoli', label: 'وصلت طرابلس', icon: Building },
    { key: 'out_for_delivery', label: 'مع المندوب', icon: MapPin },
    { key: 'delivered', label: 'تم التسليم', icon: PackageCheck },
];

const statusConfig: { [key in OrderStatus]: { text: string; color: string; bg: string } } = {
    pending: { text: 'قيد التجهيز', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    processed: { text: 'تم التنفيذ', color: 'text-cyan-600', bg: 'bg-cyan-100' },
    ready: { text: 'تم التجهيز', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    shipped: { text: 'تم الشحن', color: 'text-blue-600', bg: 'bg-blue-100' },
    arrived_dubai: { text: 'وصلت إلى دبي', color: 'text-orange-600', bg: 'bg-orange-100' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', color: 'text-teal-600', bg: 'bg-teal-100' },
    arrived_tripoli: { text: 'وصلت إلى طرابلس', color: 'text-purple-600', bg: 'bg-purple-100' },
    office_pickup: { text: 'استلام فالمكتب', color: 'text-amber-700', bg: 'bg-amber-100' },
    transferred_to_rep: { text: 'تحويل للمندوب', color: 'text-sky-700', bg: 'bg-sky-100' },
    out_for_delivery: { text: 'مع المندوب', color: 'text-lime-700', bg: 'bg-lime-100' },
    delivered: { text: 'تم التسليم', color: 'text-green-700', bg: 'bg-green-100' },
    cancelled: { text: 'ملغي', color: 'text-red-600', bg: 'bg-red-100' },
    paid: { text: 'مدفوع', color: 'text-green-700', bg: 'bg-green-100' },
};

const getStepIndex = (status: OrderStatus) => statusSteps.findIndex(s => s.key === status);

const TrackShipmentPage = () => {
    const router = useRouter();
    const [trackingId, setTrackingId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!trackingId.trim()) return;
        setIsLoading(true);
        setError(null);
        setOrder(null);
        try {
            const result = await getOrderByTrackingId(trackingId.trim().toUpperCase());
            if (result) {
                setOrder(result);
            } else {
                setError("لم يتم العثور على شحنة بهذا الرقم.");
            }
        } catch {
            setError("حدث خطأ أثناء البحث. حاول مرة أخرى.");
        } finally {
            setIsLoading(false);
        }
    };

    const currentStepIndex = order ? getStepIndex(order.status) : -1;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-28" dir="rtl">

            {/* Header */}
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 px-5 pt-12 pb-8">
                <button onClick={() => router.back()} className="text-white/80 mb-4 flex items-center gap-1 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    رجوع
                </button>
                <h1 className="text-2xl font-bold text-white mb-1">تتبع الشحنة</h1>
                <p className="text-white/70 text-sm">أدخل كود التتبع لمعرفة مكان شحنتك</p>
            </div>

            {/* Search Box — floats over the header */}
            <div className="px-5 -mt-5">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-sky-100 dark:shadow-slate-900 p-4">
                    <div className="flex gap-3">
                        <Input
                            dir="ltr"
                            type="text"
                            placeholder="e.g., A1B2C3D4"
                            className="h-12 text-center text-base tracking-widest font-mono border-slate-200 rounded-xl"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={isLoading}
                            className="h-12 px-5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shrink-0"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="flex-grow px-5 mt-5 space-y-4">

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-2xl p-4 flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center shrink-0">
                                <XCircle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-red-700 dark:text-red-400">لم يتم العثور على الشحنة</p>
                                <p className="text-xs text-red-500 mt-0.5">{error}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Result */}
                <AnimatePresence>
                    {order && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Status Badge */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground font-mono">#{order.trackingId}</span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                                        {statusConfig[order.status].text}
                                    </span>
                                </div>
                                <p className="font-bold text-foreground mt-1">{order.itemDescription || 'شحنة'}</p>

                                {/* Progress Stepper */}
                                {order.status !== 'cancelled' && (
                                    <div className="mt-5 overflow-x-auto pb-2">
                                        <div className="flex items-center gap-0 min-w-max">
                                            {statusSteps.map((step, idx) => {
                                                const isCompleted = currentStepIndex >= idx;
                                                const isCurrent = currentStepIndex === idx;
                                                const StepIcon = step.icon;
                                                return (
                                                    <div key={step.key} className="flex items-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isCompleted
                                                                    ? 'bg-sky-500 text-white shadow-md shadow-sky-200'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                                                                } ${isCurrent ? 'ring-2 ring-sky-300 ring-offset-2' : ''}`}>
                                                                <StepIcon className="w-4 h-4" />
                                                            </div>
                                                            <span className={`text-[9px] text-center w-14 leading-tight font-medium ${isCompleted ? 'text-sky-600' : 'text-muted-foreground'}`}>
                                                                {step.label}
                                                            </span>
                                                        </div>
                                                        {idx < statusSteps.length - 1 && (
                                                            <div className={`w-6 h-0.5 mb-5 mx-0.5 transition-colors ${currentStepIndex > idx ? 'bg-sky-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {order.status === 'cancelled' && (
                                    <div className="mt-4 bg-red-50 dark:bg-red-950/30 rounded-xl p-3 flex items-center gap-2">
                                        <PackageX className="w-5 h-5 text-red-500 shrink-0" />
                                        <p className="text-sm text-red-600 font-medium">هذا الطلب تم إلغاؤه</p>
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">بيانات العميل</p>
                                <div className="space-y-3">
                                    <InfoRow icon={User} label="الاسم" value={order.customerName} />
                                    <InfoRow icon={Phone} label="الهاتف" value={order.customerPhone} />
                                    <InfoRow icon={MapPin} label="العنوان" value={order.customerAddress} />
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">تفاصيل الطلب</p>
                                <div className="space-y-3">
                                    <InfoRow icon={Tag} label="الوصف" value={order.itemDescription} />
                                    <InfoRow icon={Weight} label="الوزن" value={`${order.weightKG || 0} كجم`} />
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">المالية</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
                                        <p className="font-bold text-foreground text-base">{order.sellingPriceLYD.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3 text-center">
                                        <p className="text-xs text-muted-foreground mb-1">المتبقي</p>
                                        <p className="font-bold text-red-600 text-base">{order.remainingAmount.toLocaleString()} <span className="text-xs font-normal">د.ل</span></p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Empty state */}
                {!order && !error && !isLoading && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-sky-50 dark:bg-sky-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="w-9 h-9 text-sky-400" />
                        </div>
                        <p className="text-muted-foreground text-sm">أدخل رقم التتبع للبحث عن شحنتك</p>
                    </div>
                )}

            </main>

            <MobileBottomNav items={navItems} />
        </div>
    );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Icon className="w-4 h-4" />
            <span className="text-sm">{label}</span>
        </div>
        <span className="text-sm font-semibold text-foreground text-left max-w-[55%] truncate">{value || 'غير محدد'}</span>
    </div>
);

export default TrackShipmentPage;
