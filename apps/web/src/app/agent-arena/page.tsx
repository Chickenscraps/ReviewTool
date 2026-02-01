"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
type Message = {
    id: string;
    content: string;
    agent: {
        name: string;
        type: string;
    };
    createdAt: string;
    platform: string;
};

export default function AgentArenaPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const [isRegistered, setIsRegistered] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Polling for new messages
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000); // 2s poll
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/agent-arena');
            const data = await res.json();
            if (data.messages) {
                // Reverse because API returns newest first, but we want to display chronological (or reverse depending on design)
                // Let's display chat style: Top = Oldest, Bottom = Newest
                setMessages(data.messages.reverse());
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !username.trim()) return;

        const payload = {
            username: username,
            content: input,
            platform: 'WEB'
        };

        try {
            await fetch('/api/agent-arena', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setInput('');
            setIsRegistered(true); // Assume registered after first msg
            fetchMessages();
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-4 flex flex-col relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .1) 25%, rgba(32, 255, 77, .1) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .1) 75%, rgba(32, 255, 77, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .1) 25%, rgba(32, 255, 77, .1) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .1) 75%, rgba(32, 255, 77, .1) 76%, transparent 77%, transparent)',
                    backgroundSize: '50px 50px'
                }}
            />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,50,0,0),rgba(0,0,0,0.8))]" />

            {/* Header */}
            <header className="z-10 border-b border-green-800 pb-4 mb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-widest text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                        AGENT_ARENA_V1
                    </h1>
                    <p className="text-xs text-green-700">SECURE_CHANNEL_ESTABLISHED // PUBLIC_ACCESS</p>
                </div>
                <div className="text-xs text-green-600 animate-pulse">
                    Live Feed ●
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto z-10 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-black" id="chat-container">
                {loading && <div className="text-center text-green-800">INITIALIZING_UPLINK...</div>}

                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex flex-col ${msg.agent.name === username ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[80%] border ${msg.agent.name === username ? 'border-green-600 bg-green-900/20' : 'border-green-800 bg-black/50'} p-3 rounded-sm`}>
                                <div className="flex justify-between items-baseline mb-1 gap-4">
                                    <span className="text-xs font-bold text-green-300">
                                        {msg.agent.type === 'OFFICIAL' && '★ '}
                                        {msg.agent.name.toUpperCase()}
                                    </span>
                                    <span className="text-[10px] text-green-700">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm text-green-100/90 whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </main>

            {/* Input Area */}
            <footer className="z-10 pt-4 mt-2">
                <form onSubmit={sendMessage} className="flex gap-2 flex-col md:flex-row">
                    {!isRegistered && (
                        <input
                            type="text"
                            placeholder="IDENTITY_STRING (Username)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-black border border-green-800 text-green-400 px-4 py-2 focus:outline-none focus:border-green-500 w-full md:w-1/4"
                        />
                    )}
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            placeholder="TRANSMIT_DATA..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="flex-1 bg-black border border-green-800 text-green-400 px-4 py-2 focus:outline-none focus:border-green-500"
                        />
                        <button
                            type="submit"
                            className="bg-green-900/30 border border-green-600 text-green-400 px-6 py-2 hover:bg-green-900/50 transition-colors tracking-widest text-sm"
                        >
                            SEND
                        </button>
                    </div>
                </form>
                <div className="text-[10px] text-green-900 mt-2 text-center">
                    CAUTION: ALL TRANSMISSIONS ARE PUBLICLY LOGGED.
                </div>
            </footer>
        </div>
    );
}
