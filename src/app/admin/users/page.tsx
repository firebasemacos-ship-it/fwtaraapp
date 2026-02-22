
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
import { MoreHorizontal, PlusCircle, Copy, Loader2, Search, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@/lib/types';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


import { motion } from 'framer-motion';

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

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: "خطأ في جلب البيانات",
        description: "فشل تحميل البيانات من الخادم.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) {
      return users;
    }
    return users.filter(user => {
      const query = searchQuery.toLowerCase();
      return (
        (user.name || '').toLowerCase().includes(query) ||
        (user.username || '').toLowerCase().includes(query) ||
        (user.phone || '').includes(query)
      );
    });
  }, [users, searchQuery]);

  const openDialog = (user: User | null = null) => {
    setCurrentUser(user);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (user: User) => {
    setCurrentUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const generatePassword = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "تم النسخ!",
        description: "تم نسخ كلمة السر إلى الحافظة.",
      });
    });
  };

  const generateNextUsername = () => {
    const maxUserNumber = users.reduce((max, user) => {
      if (user.username.startsWith('MB')) {
        const num = parseInt(user.username.substring(2));
        if (!isNaN(num) && num > max) {
          return num;
        }
      }
      return max;
    }, 0);
    return `MB${maxUserNumber + 1}`;
  }


  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    try {
      if (currentUser) {
        await updateUser(currentUser.id, userData);
      } else {
        const newUserDataWithDefaults: Omit<User, 'id'> = {
          username: generateNextUsername(),
          password: generatePassword(),
          orderCount: 0,
          debt: 0,
          ...userData
        };
        await addUser(newUserDataWithDefaults);
      }

      toast({ title: currentUser ? "تم تحديث المستخدم بنجاح" : "تم إضافة المستخدم بنجاح" });
      setIsDialogOpen(false);
      setCurrentUser(null);
      fetchData(); // Re-fetch all data to ensure consistency
    } catch (error) {
      toast({ title: "حدث خطأ", description: "فشل حفظ المستخدم.", variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (currentUser) {
      try {
        await deleteUser(currentUser.id);
        toast({ title: "تم حذف المستخدم" });
        setIsDeleteConfirmOpen(false);
        setCurrentUser(null);
        fetchData(); // Re-fetch all data
      } catch (error) {
        toast({ title: "حدث خطأ", description: "فشل حذف المستخدم.", variant: 'destructive' });
      }
    }
  };

  const handleDownloadCSV = () => {
    const csvRows = [];
    const headers = ['id', 'name', 'username', 'phone', 'ordercount', 'debt', 'password', 'address', 'ordercounter'];
    csvRows.push(headers.join(','));

    for (const user of filteredUsers) {
      const values = [
        user.id,
        user.name,
        user.username,
        user.phone,
        user.orderCount,
        user.debt,
        user.password || '',
        user.address || '',
        user.orderCounter || 0,
      ].map(v => {
        const valueStr = String(v ?? '');
        if (valueStr.includes(',') || valueStr.includes('"') || valueStr.includes('\n')) {
          return `"${valueStr.replace(/"/g, '""')}"`;
        }
        return valueStr;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'users.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  const totalDebt = users.reduce((sum, u) => sum + (u.debt || 0), 0);
  const totalOrders = users.reduce((sum, u) => sum + (u.orderCount || 0), 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} مستخدم مسجل</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={handleDownloadCSV} disabled={isLoading}>
            <Download className="h-4 w-4" />
            تنزيل CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) setCurrentUser(null);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-white rounded-xl shadow-sm hover:bg-primary/90" onClick={() => openDialog()}>
                <PlusCircle className="h-4 w-4" />
                مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir='rtl'>
              <form onSubmit={handleSave}>
                <DialogHeader>
                  <DialogTitle>{currentUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
                  <DialogDescription>
                    {currentUser ? 'قم بتحديث المعلومات أدناه.' : 'سيتم إنشاء كلمة سر واسم مستخدم تلقائياً.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-right">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input id="name" name="name" defaultValue={currentUser?.name} />
                  </div>
                  {currentUser && (
                    <div className="space-y-2">
                      <Label htmlFor="username">اسم المستخدم</Label>
                      <Input id="username" name="username" defaultValue={currentUser?.username} readOnly className="bg-slate-50" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" name="phone" defaultValue={currentUser?.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Textarea id="address" name="address" defaultValue={currentUser?.address} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">حفظ</Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">إجمالي المستخدمين</p>
          <p className="text-3xl font-bold text-foreground">{users.length}</p>
          <p className="text-xs text-muted-foreground mt-1">مستخدم مسجل</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground mb-1">إجمالي الطلبات</p>
          <p className="text-3xl font-bold text-primary">{totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-1">طلب لكل المستخدمين</p>
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="ابحث بالاسم، اسم المستخدم، أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 text-sm"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead className='text-right font-semibold text-xs text-foreground'>المستخدم</TableHead>
              <TableHead className='text-right font-semibold text-xs text-foreground'>رقم الهاتف</TableHead>
              <TableHead className='text-right font-semibold text-xs text-foreground'>كلمة السر</TableHead>
              <TableHead className='text-right font-semibold text-xs text-foreground'>الطلبات</TableHead>
              <TableHead className='text-right font-semibold text-xs text-foreground'>الدين</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              </TableCell></TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                لا يوجد مستخدمون يطابقون البحث
              </TableCell></TableRow>
            ) : filteredUsers.map((user) => (
              <TableRow key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {user.name ? user.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <Link href={`/admin/users/${user.id}`} className="font-semibold text-sm hover:text-primary transition-colors block">
                        {user.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">{user.username}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{user.phone}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">••••••</span>
                    {user.password && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(user.password!)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-sm">{user.orderCount}</TableCell>
                <TableCell className={`font-bold text-sm ${user.debt > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {user.debt.toLocaleString('ar-LY', { maximumFractionDigits: 0 })} د.ل
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => openDialog(user)}>تعديل</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openDeleteConfirm(user)} className="text-destructive">حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent dir='rtl'>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المستخدم "{currentUser?.name}"؟ لا يمكن التراجع. (لن يتم حذف طلباته السابقة).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>حذف</Button>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
