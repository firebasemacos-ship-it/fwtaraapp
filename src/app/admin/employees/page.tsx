// src/app/admin/employees/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
import { MoreHorizontal, PlusCircle, Copy, Search, Loader2, UserCog, Phone, User, Key, ShieldCheck, ShieldAlert, Edit, Trash2, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Manager } from '@/lib/types';
import { getManagers, addManager, updateManager, deleteManager } from '@/lib/actions';
import { cn } from '@/lib/utils';

const permissions = [
  { id: 'users', label: 'إدارة المستخدمين', category: 'أساسي' },
  { id: 'employees', label: 'إدارة المدراء', category: 'إداري' },
  { id: 'representatives', label: 'إدارة المندوبين', category: 'إداري' },
  { id: 'orders', label: 'إدارة الطلبات', category: 'عمليات' },
  { id: 'shipping_label', label: 'إنشاء بوليصة شحن', category: 'عمليات' },
  { id: 'temporary_users', label: 'المستخدمين المؤقتين', category: 'أساسي' },
  { id: 'financial_reports', label: 'التقارير المالية', category: 'مالي' },
  { id: 'instant_sales', label: 'مبيعات فورية', category: 'عمليات' },
  { id: 'deposits', label: 'سجل العربون', category: 'مالي' },
  { id: 'expenses', label: 'إدارة المصروفات', category: 'مالي' },
  { id: 'creditors', label: 'إدارة الذمم', category: 'مالي' },
  { id: 'support', label: 'مركز الدعم', category: 'خدمة عملاء' },
  { id: 'notifications', label: 'إدارة الإشعارات', category: 'خدمة عملاء' },
  { id: 'exchange_rate', label: 'اسعار الصرف والشحن', category: 'إعدادات' },
];

const AdminManagersPage = () => {
  const { toast } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchManagers = async () => {
    setIsLoading(true);
    try {
      const fetchedManagers = await getManagers();
      setManagers(fetchedManagers);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل تحميل قائمة المدراء.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [toast]);

  const filteredManagers = useMemo(() => {
    if (!searchQuery) return managers;
    return managers.filter(manager => {
      const query = searchQuery.toLowerCase();
      return (
        manager.name.toLowerCase().includes(query) ||
        manager.username.toLowerCase().includes(query) ||
        manager.phone?.toLowerCase().includes(query)
      );
    });
  }, [managers, searchQuery]);

  const openDialog = (manager: Manager | null = null) => {
    setCurrentManager(manager);
    if (manager) {
      setSelectedPermissions(manager.permissions || []);
    } else {
      setSelectedPermissions(permissions.map(p => p.id));
    }
    setIsDialogOpen(true);
  };

  const generatePassword = () => Math.random().toString(36).slice(-8);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "تم النسخ!", description: "تم نسخ كلمة السر للحافظة." });
    });
  };

  const generateNextUsername = () => {
    const maxEmpNumber = managers.reduce((max, emp) => {
      if (emp.username.startsWith('EMP')) {
        const num = parseInt(emp.username.substring(3));
        if (!isNaN(num) && num > max) return num;
      }
      return max;
    }, 0);
    return `EMP${maxEmpNumber + 1}@fwtara.ly`;
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formValues = {
      name: formData.get('name') as string,
      username: formData.get('username') as string,
      phone: formData.get('phone') as string,
    };
    const password = formData.get('password') as string;

    if (!formValues.username) {
      toast({ title: "خطأ", description: "اسم المستخدم مطلوب.", variant: 'destructive' });
      return;
    }

    try {
      if (currentManager) {
        const updatedData: Partial<Manager> = { ...formValues, permissions: selectedPermissions };
        if (password) updatedData.password = password;
        await updateManager(currentManager.id, updatedData);
        setManagers(managers.map(u => u.id === currentManager.id ? { ...currentManager, ...updatedData, password: password || currentManager.password } : u));
        toast({ title: "تم التحديث بنجاح" });
      } else {
        const newManagerData: Omit<Manager, 'id'> = {
          name: formValues.name,
          username: formValues.username,
          phone: formValues.phone,
          password: password || generatePassword(),
          permissions: selectedPermissions,
        };
        const newManager = await addManager(newManagerData);
        if (newManager) {
          setManagers(prev => [...prev, newManager]);
          toast({ title: "تم إضافة المدير بنجاح" });
        }
      }
      setIsDialogOpen(false);
      setCurrentManager(null);
    } catch (error) {
      toast({ title: "حدث خطأ", description: "فشل حفظ البيانات.", variant: 'destructive' });
    }
  };

  const handleDelete = async (managerId: string) => {
    try {
      await deleteManager(managerId);
      setManagers(managers.filter(e => e.id !== managerId));
      toast({ title: "تم حذف المدير بنجاح" });
    } catch (error) {
      toast({ title: "حدث خطأ", description: "فشل حذف المدير.", variant: 'destructive' });
    }
  }

  const handlePermissionChange = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(p => p !== permissionId) : [...prev, permissionId]
    );
  };

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">إدارة المدراء</h1>
          <p className="text-muted-foreground mt-1 text-base">{managers.length} مدير مسجل في النظام</p>
        </div>
        <Button className="h-11 px-6 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 gap-2 font-bold" onClick={() => openDialog()}>
          <PlusCircle className="h-5 w-5" />
          إضافة مدير جديد
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary w-fit mb-4"><UserCog className="w-6 h-6" /></div>
          <p className="text-muted-foreground font-medium mb-1">إجمالي المدراء</p>
          <h3 className="text-3xl font-black text-foreground">{managers.length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 rounded-2xl text-emerald-600 dark:text-emerald-400 w-fit mb-4"><ShieldCheck className="w-6 h-6" /></div>
          <p className="text-muted-foreground font-medium mb-1">صلاحيات كاملة</p>
          <h3 className="text-3xl font-black text-foreground">{managers.filter(m => m.permissions?.length === permissions.length).length}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-950/30 rounded-2xl text-yellow-600 dark:text-yellow-400 w-fit mb-4"><ShieldAlert className="w-6 h-6" /></div>
          <p className="text-muted-foreground font-medium mb-1">صلاحيات محدودة</p>
          <h3 className="text-3xl font-black text-foreground">{managers.filter(m => (m.permissions?.length || 0) < permissions.length).length}</h3>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ابحث بالاسم، اسم المستخدم أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-11 text-sm bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50 border-none">
              <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4 pr-6'>المدير</TableHead>
              <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>بيانات الدخول</TableHead>
              <TableHead className='text-right font-bold text-xs text-muted-foreground uppercase py-4'>الصلاحيات</TableHead>
              <TableHead className="w-[80px]"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : filteredManagers.length > 0 ? filteredManagers.map((manager) => (
              <TableRow key={manager.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-50 dark:border-slate-800">
                <TableCell className="py-4 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground">{manager.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {manager.phone || 'غير مسجل'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground bg-slate-50 dark:bg-slate-800 py-1 px-2 rounded-md w-fit">{manager.username}</p>
                    <div className="flex items-center gap-2 group/pass cursor-pointer" onClick={() => copyToClipboard(manager.password)}>
                      <p className="text-[10px] font-mono text-muted-foreground">********</p>
                      <Copy className="w-3 h-3 text-muted-foreground opacity-0 group-hover/pass:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-wrap gap-1.5 max-w-sm">
                    {(manager.permissions?.length === permissions.length) ? (
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-2 py-0.5">صلاحيات كاملة</Badge>
                    ) : (
                      manager.permissions?.slice(0, 3).map(pId => {
                        const perm = permissions.find(p => p.id === pId);
                        return <Badge key={pId} variant="secondary" className="text-[10px] font-bold border-none bg-slate-100 dark:bg-slate-800">{perm?.label}</Badge>
                      })
                    )}
                    {manager.permissions && manager.permissions.length > 3 && (
                      <Badge variant="outline" className="text-[10px] font-bold">+{manager.permissions.length - 3} أخرى</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-left">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-all h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-1.5 min-w-[160px]">
                      <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-2 py-1">إدارة الحساب</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => openDialog(manager)} className="rounded-lg gap-2 cursor-pointer font-medium p-2"><Edit className="h-4 w-4" /> تعديل البيانات</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => handleDelete(manager.id)} className="text-destructive rounded-lg gap-2 cursor-pointer font-medium p-2"><Trash2 className="h-4 w-4" /> حذف الحساب</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={4} className="text-center py-24 text-muted-foreground font-bold opacity-40">لا يوجد مدراء يطابقون البحث.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) setCurrentManager(null); }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl overflow-hidden p-0 border-none shadow-2xl" dir='rtl'>
          <form onSubmit={handleSave}>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b border-slate-100 dark:border-slate-800">
              <DialogHeader className="text-right">
                <DialogTitle className="text-xl font-black">{currentManager ? 'تعديل الصلاحيات' : 'إضافة مدير جديد'}</DialogTitle>
                <DialogDescription className="text-sm font-medium">أدخل البيانات واضبط الصلاحيات بعناية.</DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold mr-1">الاسم الكامل</Label>
                    <Input id="name" name="name" defaultValue={currentManager?.name} placeholder="الاسم رباعي" className="h-11 rounded-xl" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs font-bold mr-1">اسم المستخدم / البريد</Label>
                    <Input id="username" name="username" defaultValue={currentManager?.username || generateNextUsername()} className="h-11 rounded-xl font-mono text-sm" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold mr-1">رقم الهاتف</Label>
                    <Input id="phone" name="phone" defaultValue={currentManager?.phone} placeholder="09XXXXXXXX" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold mr-1">كلمة السر</Label>
                    <div className="relative">
                      <Input id="password" name="password" type="text" placeholder={currentManager ? "اتركه فارغاً لعدم التغيير" : "تلقائياً إذا ترك فارغاً"} className="h-11 rounded-xl pr-10" />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-black flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    تخصيص الصلاحيات
                  </Label>
                  <Button type="button" variant="ghost" className="h-8 text-[10px] font-bold text-primary" onClick={() => setSelectedPermissions(permissions.map(p => p.id))}>تحديد الكل</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                  {permissions.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-2xl border border-transparent hover:border-primary/20 transition-all group/perm">
                      <Checkbox
                        id={`perm-${p.id}`}
                        checked={selectedPermissions.includes(p.id)}
                        onCheckedChange={() => handlePermissionChange(p.id)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1 cursor-pointer" onClick={() => handlePermissionChange(p.id)}>
                        <Label htmlFor={`perm-${p.id}`} className="font-bold text-xs cursor-pointer">{p.label}</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              <Button type="submit" className="flex-1 rounded-xl h-11 font-black">حفظ البيانات</Button>
              <Button type="button" variant="outline" className="flex-1 rounded-xl h-11 font-bold" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagersPage;
