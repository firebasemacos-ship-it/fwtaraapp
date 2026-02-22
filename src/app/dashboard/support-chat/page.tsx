
'use client';

import { Send, Smile, Loader2, ArrowRight, Search, Home, ClipboardList, Users, Settings, Headphones } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker from 'emoji-picker-react';
import { Message, Conversation } from "@/lib/types";
import { getConversations, sendMessage, startConversation, getUsers } from "@/lib/actions";
import { motion, AnimatePresence } from 'framer-motion';
import { MobileBottomNav, BottomNavItem } from '@/components/ui/MobileBottomNav';

const navItems: BottomNavItem[] = [
    { label: 'الرئيسية', icon: Home, href: '/dashboard', exact: true },
    { label: 'تتبع', icon: Search, href: '/dashboard/track-shipment' },
    { label: 'طلباتي', icon: ClipboardList, href: '/dashboard/my-orders' },
    { label: 'الدعم', icon: Users, href: '/dashboard/support-chat' },
    { label: 'إعدادات', icon: Settings, href: '/dashboard/my-data' },
];

const SupportChatPage = () => {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { scrollToBottom(); }, [messages]);

    useEffect(() => {
        const loadConversation = async () => {
            setIsLoading(true);
            const loggedInUserStr = localStorage.getItem('loggedInUser');
            if (!loggedInUserStr) { router.push('/login'); return; }
            const loggedInUser = JSON.parse(loggedInUserStr);
            const userId = loggedInUser.id;
            if (!userId) { router.push('/login'); return; }

            const allUsers = await getUsers();
            const currentUser = allUsers.find(u => u.id === userId);
            if (!currentUser) { router.push('/login'); return; }

            const allConvos = await getConversations();
            let userConvo = allConvos.find(c => c.userId === userId);

            if (!userConvo) {
                const newConvoId = await startConversation(userId, currentUser.name, `https://i.pravatar.cc/150?u=${userId}`);
                const convosAfterCreation = await getConversations();
                userConvo = convosAfterCreation.find(c => c.id === newConvoId);
            }

            if (userConvo) {
                setConversation(userConvo);
                setMessages(userConvo.messages);
            }
            setIsLoading(false);
        };
        loadConversation();
    }, [router]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !conversation) return;

        const messageData: Omit<Message, 'id'> = {
            text: newMessage,
            sender: 'user',
            timestamp: new Date().toISOString(),
        };

        const optimisticMessage: Message = { ...messageData, id: Date.now().toString() };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');
        await sendMessage(conversation.id, messageData);
    };

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col" dir="rtl">

            {/* Chat Header */}
            <div className="bg-gradient-to-br from-teal-500 to-cyan-600 px-4 pt-12 pb-4 flex items-center gap-3 flex-shrink-0">
                <button onClick={() => router.back()} className="text-white/80">
                    <ArrowRight className="w-5 h-5" />
                </button>
                {/* Support Avatar */}
                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center ml-1">
                    <Headphones className="w-5 h-5 text-white" />
                </div>
                <div className="flex-grow">
                    <p className="font-bold text-white text-sm leading-tight">فريق دعم فوترة</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                        <p className="text-white/80 text-xs">متاح الآن</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <main className="flex-grow overflow-y-auto px-4 py-4 space-y-3">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full text-center gap-4"
                    >
                        <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/30 rounded-full flex items-center justify-center">
                            <Headphones className="w-8 h-8 text-teal-500" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground mb-1">مرحباً بك! 👋</p>
                            <p className="text-sm text-muted-foreground max-w-xs">كيف يمكننا مساعدتك اليوم؟ فريق الدعم جاهز للإجابة على استفساراتك</p>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}
                            >
                                {/* Avatar for support */}
                                {msg.sender !== 'user' && (
                                    <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0 mb-1">
                                        <Headphones className="w-3.5 h-3.5 text-teal-600" />
                                    </div>
                                )}

                                <div className={`max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                                    <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${msg.sender === 'user'
                                            ? 'bg-teal-500 text-white rounded-tr-sm'
                                            : 'bg-white dark:bg-slate-800 text-foreground rounded-tl-sm border border-slate-100 dark:border-slate-700'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {new Date(msg.timestamp).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Bar */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-3 py-3 flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button type="button" className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                                <Smile className="w-5 h-5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-0" side="top" align="start">
                            <EmojiPicker onEmojiClick={(emojiObject) => setNewMessage(prev => prev + emojiObject.emoji)} />
                        </PopoverContent>
                    </Popover>

                    <input
                        placeholder="اكتب رسالتك..."
                        className="flex-grow h-11 bg-slate-100 dark:bg-slate-800 rounded-full px-4 text-sm outline-none border-0 text-foreground placeholder:text-muted-foreground"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading || !conversation}
                        dir="rtl"
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !conversation || !newMessage.trim()}
                        className="w-11 h-11 rounded-full bg-teal-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <Send className="w-4 h-4 text-white disabled:text-muted-foreground rotate-180" />
                    </button>
                </form>
            </div>

            <MobileBottomNav items={navItems} />
        </div>
    );
};

export default SupportChatPage;
