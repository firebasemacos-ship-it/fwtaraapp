'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Bell,
    Sparkles,
    Palette,
    Printer,
    Gift,
    ChevronRight,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface UpdateModalProps {
    isOpen: boolean;
    onClose: (dontShowAgain: boolean) => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const features = [
        {
            icon: Sparkles,
            title: "تحديث نصوص حالات الشحن",
            description: "تمت إعادة صياغة وتحسين نصوص حالات الشحن لتكون أوضح وأكثر دقة بما يسهّل متابعة الطلبات.",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            icon: Palette,
            title: "تطوير كامل للوحة التحكم وواجهة المستخدم",
            description: "قمنا بإعادة تصميم وتطوير لوحة التحكم وواجهة المستخدم بالكامل لتصبح أكثر سرعة، سلاسة، وتنظيمًا.",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
        {
            icon: Printer,
            title: "ميزة الطباعة الجماعية",
            description: "أضفنا إمكانية الطباعة الجماعية للطلبات لتوفير الوقت وتسريع العمليات اليومية.",
            color: "text-green-500",
            bg: "bg-green-500/10"
        }
    ];

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose(dontShowAgain)}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-white dark:bg-slate-950 rounded-3xl" dir="rtl">
                {/* Header with Background Pattern */}
                <div className="relative bg-primary p-8 text-white overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent rounded-full blur-3xl" />
                    </div>

                    <div className="relative z-10 flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-black">معلومات التحديث</h2>
                    </div>

                    <p className="relative z-10 text-white/90 text-lg leading-relaxed max-w-lg font-medium">
                        نعتذر لكم عن التأخير في إصدار هذا التحديث، ونشكركم على صبركم وتفهمكم الدائم.
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        <p className="text-muted-foreground font-semibold flex items-center gap-2">
                            <Info className="w-5 h-5 text-primary" />
                            أبرز التحسينات الجديدة التي عملنا عليها:
                        </p>

                        <div className="grid gap-6">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${feature.bg} flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground mb-1">{feature.title}</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Special Gift Section */}
                    <div className="bg-gradient-to-r from-accent/10 to-transparent p-6 rounded-3xl border border-accent/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                            <Gift className="w-24 h-24 text-accent" />
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                                <Gift className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-foreground">هدية خاصة من فريق هوية للتسويق الرقمي</p>
                                <p className="text-sm text-muted-foreground">تطوير الواجهات تم تقديمه <span className="text-accent font-black">مجاناً (0 د.ل)</span> بدلاً من <span className="line-through opacity-60">1500 د.ل</span> تقديراً لصبركم.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-2 space-x-reverse group cursor-pointer" onClick={() => setDontShowAgain(!dontShowAgain)}>
                            <Checkbox
                                id="dontShow"
                                checked={dontShowAgain}
                                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                                className="rounded-md border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                                htmlFor="dontShow"
                                className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer"
                            >
                                عدم إظهار هذه الرسالة مرة أخرى
                            </Label>
                        </div>

                        <Button
                            onClick={() => onClose(dontShowAgain)}
                            className="w-full sm:w-auto px-10 h-12 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            فهمت ذلك
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpdateModal;
