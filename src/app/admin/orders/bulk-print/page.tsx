// src/app/admin/orders/bulk-print/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import logo from '@/app/assets/logo.png';
import { Loader2, DollarSign, Package, Hash, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getOrderById } from '@/lib/actions';
import { Order } from '@/lib/types';

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 w-28 text-gray-600 font-semibold flex items-center gap-1.5 whitespace-nowrap">
            {icon} {label}
        </div>
        <div className="font-medium">{value}</div>
    </div>
);

const PrintableOrder = ({ order }: { order: Order }) => {
    const isPaymentOnReceipt = order.remainingAmount > 0;
    return (
        <div
            className="bg-white shadow-lg flex flex-col border border-gray-300 w-full mx-auto"
            style={{ pageBreakAfter: 'always', minHeight: '26cm', padding: '0' }}
        >
            {/* Header */}
            <header className="grid grid-cols-3 items-center p-4 border-b border-gray-300">
                <div className="col-span-1 flex items-center gap-4">
                    <img src={logo.src} alt="Logo" style={{ width: '60px', height: '60px' }} />
                    <div>
                        <h1 className="text-lg font-bold whitespace-nowrap">بوليصة شحن</h1>
                        <p className="text-xs text-gray-500">شركة فوترة</p>
                    </div>
                </div>
                <div className="col-span-1" />
                <div className="col-span-1 text-left">
                    <p className="font-bold text-sm whitespace-nowrap">رقم الفاتورة: {order.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{format(new Date(order.operationDate), 'yyyy/MM/dd')}</p>
                </div>
            </header>

            {/* Sender & Receiver */}
            <section className="grid grid-cols-2 gap-4 p-4 border-b border-gray-300 text-sm">
                <div className="border-l border-gray-300 pl-4">
                    <h2 className="font-bold mb-2 whitespace-nowrap">من: المرسل</h2>
                    <p className="font-semibold">شركة فوترة</p>
                    <p>قرجي – بالقرب من مدرسة قرطبة</p>
                    <p dir="ltr" className="text-right font-mono">0946891207</p>
                </div>
                <div>
                    <h2 className="font-bold mb-2 whitespace-nowrap">إلى: المستلم</h2>
                    <p className="font-semibold">{order.customerName}</p>
                    <p>{order.customerAddress}</p>
                    <p dir="ltr" className="text-right font-mono">{order.customerPhone}</p>
                </div>
            </section>

            {/* Order Details */}
            <section className="p-4 flex-grow">
                <h2 className="font-bold mb-2">تفاصيل الشحنة</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <InfoRow icon={<Package className="w-4 h-4" />} label="وصف المحتوى:" value={order.itemDescription || 'غير محدد'} />
                    <InfoRow icon={<Hash className="w-4 h-4" />} label="كود التتبع:" value={order.trackingId || 'N/A'} />
                    <InfoRow icon={<CalendarIcon className="w-4 h-4" />} label="تاريخ الطلب:" value={format(new Date(order.operationDate), 'yyyy/MM/dd')} />
                    <InfoRow icon={<DollarSign className="w-4 h-4" />} label="المبلغ الإجمالي:" value={`${order.sellingPriceLYD.toFixed(2)} د.ل`} />
                </div>
                <Separator className="my-4" />
                <div className="bg-gray-100 p-3 rounded-md text-center">
                    <p className="font-bold text-base whitespace-nowrap">
                        {isPaymentOnReceipt ? 'المبلغ المطلوب عند الاستلام' : 'الدفعة تمت بالكامل'}
                    </p>
                    {isPaymentOnReceipt && (
                        <p className="text-xl font-bold text-red-600">{order.remainingAmount.toFixed(2)} د.ل</p>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto p-4 border-t border-gray-300 text-center flex-shrink-0">
                <p className="text-sm font-bold">شكراً لتعاملكم معنا!</p>
                <p className="text-xs text-gray-500 mt-1">ملاحظات: الرجاء التأكد من سلامة الشحنة قبل التوقيع على الاستلام.</p>
            </footer>
        </div>
    );
};

const BulkPrintView = () => {
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const idsParam = searchParams.get('ids');
        if (!idsParam) { setIsLoading(false); return; }
        const ids = idsParam.split(',').filter(Boolean);

        const fetchAll = async () => {
            setIsLoading(true);
            const results = await Promise.all(ids.map(id => getOrderById(id)));
            setOrders(results.filter(Boolean) as Order[]);
            setIsLoading(false);
        };
        fetchAll();
    }, [searchParams]);

    // Auto-print after data loads
    useEffect(() => {
        if (!isLoading && orders.length > 0) {
            setTimeout(() => window.print(), 600);
        }
    }, [isLoading, orders]);

    if (isLoading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen no-print gap-3">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">جاري تجهيز بوليصات الطباعة...</p>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen no-print">
                <p className="text-red-500">لم يتم العثور على أي طلبات.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 p-4 min-h-screen" dir="rtl">
            {/* Toolbar — hidden on print */}
            <div className="w-full max-w-4xl mx-auto flex items-center justify-between mb-4 no-print">
                <p className="text-sm font-semibold text-muted-foreground">{orders.length} بوليصة جاهزة للطباعة</p>
                <Button onClick={() => window.print()} className="gap-2">
                    <Printer className="w-4 h-4" />
                    طباعة الكل
                </Button>
            </div>

            {/* All orders — each gets its own print page */}
            <div className="space-y-6 max-w-4xl mx-auto">
                {orders.map(order => (
                    <div key={order.id} className="printable-content bulk-item">
                        <PrintableOrder order={order} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const Page = () => (
    <Suspense fallback={
        <div className="flex justify-center items-center h-screen no-print">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
    }>
        <BulkPrintView />
    </Suspense>
);

export default Page;
