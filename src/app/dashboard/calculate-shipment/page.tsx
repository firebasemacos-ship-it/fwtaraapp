'use client';

import {
    ArrowRight, Trash2, Plus, ShoppingCart, Truck, CheckCircle,
    Loader2, DollarSign, Package, Search, Home, ClipboardList, Users, Settings, Calculator
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from 'react';
import { getAppSettings } from '@/lib/actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { predefinedItems } from '@/lib/items';
import type { AppSettings } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

interface ShipmentItem {
    id: number;
    itemId: string;
    quantity: number;
}

const CalculateShipmentPage = () => {
    const router = useRouter();
    const [basketPriceUSD, setBasketPriceUSD] = useState<number>(0);
    const [items, setItems] = useState<ShipmentItem[]>([
        { id: 1, itemId: 'tshirt', quantity: 1 }
    ]);
    const [settings, setSettings] = useState<AppSettings | null>(null);

    useEffect(() => {
        getAppSettings().then(setSettings);
    }, []);

    const exchangeRate = settings?.exchangeRate ?? 1;
    const pricePerKiloLYD = settings?.pricePerKiloLYD ?? 0;

    const basketPriceLYD = useMemo(() =>
        exchangeRate === 0 ? 0 : basketPriceUSD * exchangeRate,
        [basketPriceUSD, exchangeRate]);

    const totalShippingCost = useMemo(() =>
        items.reduce((total, item) => {
            const itemData = predefinedItems[item.itemId];
            if (!itemData) return total;
            return total + itemData.weight * item.quantity * pricePerKiloLYD;
        }, 0),
        [items, pricePerKiloLYD]);

    const finalTotal = basketPriceLYD + totalShippingCost;

    const handleAddItem = () => {
        const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
        setItems([...items, { id: newId, itemId: 'tshirt', quantity: 1 }]);
    };

    const handleRemoveItem = (id: number) => {
        if (items.length > 1) setItems(items.filter(item => item.id !== id));
    };

    const handleItemChange = (id: number, field: keyof Omit<ShipmentItem, 'id'>, value: string | number) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    if (settings === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pb-28" dir="rtl">

            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-5 pt-12 pb-8">
                <button onClick={() => router.back()} className="text-white/80 mb-4 flex items-center gap-1 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    رجوع
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">حاسبة الشحن</h1>
                        <p className="text-white/70 text-sm">احسب تكلفة طلبيتك بسهولة</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                        <Calculator className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Rate pills */}
                <div className="flex gap-2 mt-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs border border-white/30">
                        1$ = {exchangeRate.toFixed(2)} د.ل
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs border border-white/30">
                        1 كجم = {pricePerKiloLYD.toFixed(2)} د.ل
                    </div>
                </div>
            </div>

            <main className="flex-grow px-5 -mt-4 space-y-4">

                {/* Basket Price Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="font-bold text-sm text-foreground">سعر السلة</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* USD input */}
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">القيمة بالدولار</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    dir="ltr"
                                    className="w-full h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 pl-8 text-base font-semibold text-foreground outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
                                    value={basketPriceUSD || ''}
                                    onChange={(e) => setBasketPriceUSD(parseFloat(e.target.value) || 0)}
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">$</span>
                            </div>
                        </div>
                        {/* LYD output */}
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">القيمة بالدينار</label>
                            <div className="relative">
                                <input
                                    readOnly
                                    dir="ltr"
                                    value={basketPriceLYD.toFixed(2)}
                                    className="w-full h-12 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 pr-12 text-base font-bold text-emerald-700 dark:text-emerald-400 outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">د.ل</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Items Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center">
                                <Truck className="w-4 h-4 text-emerald-600" />
                            </div>
                            <p className="font-bold text-sm text-foreground">أصناف الشحن</p>
                        </div>
                        <button
                            onClick={handleAddItem}
                            className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة صنف
                        </button>
                    </div>

                    <div className="space-y-2.5">
                        <AnimatePresence initial={false}>
                            {items.map((item) => {
                                const itemData = predefinedItems[item.itemId];
                                const itemShippingCost = itemData ? itemData.weight * item.quantity * pricePerKiloLYD : 0;
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3"
                                    >
                                        {/* Item selector */}
                                        <div className="flex gap-2 mb-2">
                                            <Select value={item.itemId} onValueChange={(v) => handleItemChange(item.id, 'itemId', v)}>
                                                <SelectTrigger className="flex-grow h-10 text-sm bg-white dark:bg-slate-900 rounded-xl border-slate-200 dark:border-slate-700">
                                                    <SelectValue placeholder="اختر صنفاً..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(predefinedItems).map(([key, val]) => (
                                                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-xl flex items-center justify-center flex-shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>

                                        {/* Quantity + cost */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-grow">
                                                <label className="text-[10px] text-muted-foreground mb-1 block">الكمية</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    min="1"
                                                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-center font-semibold outline-none"
                                                />
                                            </div>
                                            <div className="text-left flex-shrink-0">
                                                <p className="text-[10px] text-muted-foreground mb-1">تكلفة الشحن</p>
                                                <p className="text-base font-bold text-emerald-600">{itemShippingCost.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">د.ل</span></p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Live Total Card */}
                <motion.div
                    key={finalTotal}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/30"
                >
                    <p className="text-white/70 text-xs mb-3 font-medium uppercase tracking-wide">ملخص التكلفة</p>
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-white/80 text-sm">
                            <span>تكلفة المنتجات</span>
                            <span className="font-semibold">{basketPriceLYD.toFixed(2)} د.ل</span>
                        </div>
                        <div className="flex justify-between text-white/80 text-sm">
                            <span>تكلفة الشحن</span>
                            <span className="font-semibold">{totalShippingCost.toFixed(2)} د.ل</span>
                        </div>
                    </div>
                    <div className="border-t border-white/30 pt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-white" />
                            <span className="text-white font-bold">الإجمالي النهائي</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{finalTotal.toFixed(2)} <span className="text-sm font-normal">د.ل</span></span>
                    </div>
                </motion.div>

            </main>

            <MobileBottomNav items={navItems} />
        </div>
    );
};

export default CalculateShipmentPage;
