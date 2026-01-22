
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Loader2, PackageCheck, PackageX, Truck, FileText, XCircle, User, Phone, MapPin, Tag, Weight, DollarSign, CreditCard, Building, Package, Plane, CheckCircle, Clock } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { getOrderByTrackingId } from "@/lib/actions";
import { Order, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const statusConfig: { [key in OrderStatus]: { text: string; icon: React.ReactNode; className: string } } = {
    pending: { text: 'قيد التجهيز', icon: <Clock className="w-5 h-5" />, className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    processed: { text: 'تم التنفيذ', icon: <CheckCircle className="w-5 h-5" />, className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    ready: { text: 'تم التجهيز', icon: <Package className="w-5 h-5" />, className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    shipped: { text: 'تم الشحن', icon: <Truck className="w-5 h-5" />, className: 'bg-blue-100 text-blue-700 border-blue-200' },
    arrived_dubai: { text: 'وصلت إلى دبي', icon: <Plane className="w-5 h-5" />, className: 'bg-orange-100 text-orange-700 border-orange-200' },
    arrived_benghazi: { text: 'وصلت إلى بنغازي', icon: <Building className="w-5 h-5" />, className: 'bg-teal-100 text-teal-700 border-teal-200' },
    arrived_tobruk: { text: 'وصلت إلى طبرق', icon: <Building className="w-5 h-5" />, className: 'bg-purple-100 text-purple-700 border-purple-200' },
    out_for_delivery: { text: 'مع المندوب', icon: <MapPin className="w-5 h-5" />, className: 'bg-lime-100 text-lime-700 border-lime-200' },
    delivered: { text: 'تم التسليم', icon: <PackageCheck className="w-5 h-5" />, className: 'bg-green-100 text-green-700 border-green-200' },
    cancelled: { text: 'ملغي', icon: <PackageX className="w-5 h-5" />, className: 'bg-red-100 text-red-700 border-red-200' },
    paid: { text: 'مدفوع', icon: <DollarSign className="w-5 h-5" />, className: 'bg-green-100 text-green-700 border-green-200' },
};

const DetailRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number | undefined }) => (
    <div className="flex justify-between items-start text-sm">
        <span className="text-muted-foreground flex items-center gap-2">
            {icon}
            {label}:
        </span>
        <span className="font-semibold text-right">{value || 'غير محدد'}</span>
    </div>
);


const TrackShipmentPage = () => {
    const router = useRouter();
    const [trackingId, setTrackingId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!trackingId) return;
        setIsLoading(true);
        setError(null);
        setOrder(null);
        try {
            const result = await getOrderByTrackingId(trackingId.toUpperCase());
            if (result) {
                setOrder(result);
            } else {
                setError("لم يتم العثور على شحنة بهذا الرقم. الرجاء التأكد من الكود والمحاولة مرة أخرى.");
            }
        } catch (e) {
            setError("حدث خطأ أثناء البحث. الرجاء المحاولة مرة أخرى لاحقاً.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary/50 flex flex-col" dir="rtl">
            <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold flex-grow text-center">تتبع الشحنة</h1>
                <button onClick={() => router.back()} className="text-primary-foreground">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-grow flex flex-col items-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">أدخل رقم الشحنة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="relative">
                            <Input 
                                dir="ltr" 
                                type="text" 
                                placeholder="e.g., A1B2C3D4" 
                                className="h-14 text-center text-lg tracking-wider"
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                        <Button className="w-full h-12 text-lg font-semibold" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "تتبع"}
                        </Button>
                    </CardContent>
                </Card>

                {error && (
                    <Card className="w-full max-w-md mt-6 bg-destructive/10 border-destructive text-destructive">
                         <CardContent className="p-4 flex items-center gap-4">
                            <XCircle className="w-8 h-8 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold">خطأ في البحث</h3>
                                <p className="text-sm">{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {order && (
                    <Card className="w-full max-w-md mt-6 animate-in fade-in-50">
                        <CardHeader className="text-center pb-4">
                            <CardTitle>تفاصيل الشحنة</CardTitle>
                             <div className="flex justify-center pt-2">
                                <Badge variant="outline" className={`font-semibold text-base py-2 px-4 gap-2 ${statusConfig[order.status].className}`}>
                                    {statusConfig[order.status].icon}
                                    {statusConfig[order.status].text}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Separator />
                            <div className="space-y-2 pt-2">
                                <h3 className="font-semibold mb-2">بيانات العميل</h3>
                                <DetailRow icon={<User size={16}/>} label="اسم العميل" value={order.customerName} />
                                <DetailRow icon={<Phone size={16}/>} label="رقم الهاتف" value={order.customerPhone} />
                                <DetailRow icon={<MapPin size={16}/>} label="العنوان" value={order.customerAddress} />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                 <h3 className="font-semibold mb-2">تفاصيل الطلب</h3>
                                <DetailRow icon={<Tag size={16}/>} label="وصف السلعة" value={order.itemDescription} />
                                <DetailRow icon={<Weight size={16}/>} label="الوزن" value={`${order.weightKG || 0} كجم`} />
                            </div>
                             <Separator />
                            <div className="space-y-2">
                                <h3 className="font-semibold mb-2">التفاصيل المالية</h3>
                                <DetailRow icon={<DollarSign size={16}/>} label="الإجمالي" value={`${order.sellingPriceLYD.toFixed(2)} د.ل`} />
                                <DetailRow icon={<CreditCard size={16}/>} label="الدين المتبقي" value={`${order.remainingAmount.toFixed(2)} د.ل`} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default TrackShipmentPage;
