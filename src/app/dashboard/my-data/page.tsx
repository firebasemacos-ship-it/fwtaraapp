
'use client';

import { ArrowLeft, User as UserIcon, Phone, Hash, Calendar, DollarSign, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useMemo } from 'react';
import { getOrders, getUsers } from '@/lib/actions';
import { User, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';

const MyDataPage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // In a real app, user ID would come from an auth session.
                const loggedInUserStr = localStorage.getItem('loggedInUser');
                if (!loggedInUserStr) {
                    router.push('/login');
                    return;
                }
                const loggedInUser = JSON.parse(loggedInUserStr);

                const allUsers = await getUsers();
                const currentUser = allUsers.find(u => u.id === loggedInUser.id);
                

                if (currentUser) {
                    setUser(currentUser);

                    const allOrders = await getOrders();
                    setOrders(allOrders.filter(o => o.userId === currentUser.id));

                } else {
                     router.push('/login');
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);
    
    const handleLogout = () => {
        localStorage.removeItem('loggedInUser');
        router.push('/login');
    };

    const totalAmount = useMemo(() => {
         return orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + o.sellingPriceLYD, 0);
    }, [orders]);

     const lastOrderDate = useMemo(() => {
        const userOrders = orders.filter(o => o.status !== 'cancelled');
        if (userOrders.length === 0) return 'لا يوجد';
        
        return new Date(Math.max(...userOrders.map(o => new Date(o.operationDate).getTime()))).toLocaleDateString('ar-LY');
     }, [orders]);


    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center" dir="rtl">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">...جاري تحميل بياناتك</p>
            </div>
        )
    }

    if (!user) {
        return (
             <div className="min-h-screen bg-secondary/50 flex flex-col items-center justify-center" dir="rtl">
                <p className="text-destructive">.لم يتم العثور على المستخدم</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-secondary/50 flex flex-col" dir="rtl">
            <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold flex-grow text-center">بياناتي الشخصية</h1>
                <button onClick={() => router.back()} className="text-primary-foreground">
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </header>

            <main className="flex-grow p-4 space-y-6">
                <Card className="w-full max-w-2xl mx-auto shadow-lg bg-card/80 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl text-primary">{user.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 text-md">
                        <InfoRow icon={<UserIcon className="w-5 h-5 text-primary" />} label="اسم المستخدم" value={user.username} />
                        <Separator />
                        <InfoRow icon={<Phone className="w-5 h-5 text-primary" />} label="رقم الهاتف" value={user.phone} />
                        <Separator />
                        <InfoRow icon={<Hash className="w-5 h-5 text-primary" />} label="عدد الطلبات" value={user.orderCount.toString()} />
                        <Separator />
                        <InfoRow icon={<Calendar className="w-5 h-5 text-primary" />} label="تاريخ آخر عملية" value={lastOrderDate} />
                        <Separator />
                        <InfoRow icon={<DollarSign className="w-5 h-5 text-primary" />} label="المبلغ الإجمالي" value={`${totalAmount.toFixed(2)} د.ل`} />
                        <Separator />
                        <InfoRow 
                            icon={<AlertCircle className="w-5 h-5 text-destructive" />} 
                            label="الدين المتبقي" 
                            value={`${(user.debt || 0).toFixed(2)} د.ل`}
                            valueClassName="text-destructive font-bold"
                        />
                    </CardContent>
                </Card>
                
                 <div className="w-full max-w-2xl mx-auto">
                    <Button variant="destructive" className="w-full gap-2" onClick={handleLogout}>
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                    </Button>
                </div>
            </main>
        </div>
    );
};

const InfoRow = ({ icon, label, value, valueClassName }: { icon: React.ReactNode, label: string, value: string, valueClassName?: string }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            {icon}
            <span className="text-muted-foreground">{label}</span>
        </div>
        <span className={`font-semibold text-foreground ${valueClassName}`}>{value}</span>
    </div>
);


export default MyDataPage;
