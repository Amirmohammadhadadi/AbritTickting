import React, { useState } from 'react';
import { Sliders, BookOpen, Plus, Trash2 } from 'lucide-react';
import type { AISettings, KnowledgeBaseItem } from '../types';

interface SettingsPageProps {
    aiSettings: AISettings;
    setAiSettings: React.Dispatch<React.SetStateAction<AISettings>>;
    onSaveAI: (e: React.FormEvent) => void;
    kbItems: KnowledgeBaseItem[];
    onAddKB: (data: { category: string; title: string; content: string }) => void;
    onDeleteKB: (id: number) => void;
}

const categoryConfig: Record<string, { label: string; color: string }> = {
    RULES: { label: 'قوانین و مقررات', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    PRICING: { label: 'تعرفه‌ها و مالی', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    TECHNICAL: { label: 'فنی و سرور', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    GENERAL: { label: 'عمومی و SLA', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const SettingsPage: React.FC<SettingsPageProps> = ({
    aiSettings,
    setAiSettings,
    onSaveAI,
    kbItems,
    onAddKB,
    onDeleteKB,
}) => {
    const [newKb, setNewKb] = useState({ category: 'RULES', title: '', content: '' });

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKb.title.trim() || !newKb.content.trim()) return;
        onAddKB(newKb);
        setNewKb({ category: 'RULES', title: '', content: '' });
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 h-fit">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Sliders className="w-5 h-5" /></div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800">پیکربندی هوش مصنوعی (OpenRouter)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">اعمال آنی روی ربات تلگرام</p>
                    </div>
                </div>

                <form onSubmit={onSaveAI} className="space-y-4 mt-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">نام مدل (Model ID)</label>
                        <input
                            type="text"
                            value={aiSettings?.model_name || ''}
                            onChange={(e) => setAiSettings((prev) => ({ ...prev, model_name: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left dir-ltr focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                            <span>Temperature</span>
                            <span className="font-mono text-indigo-600">{aiSettings?.temperature || 0}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={aiSettings?.temperature || 0}
                            onChange={(e) => setAiSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="w-full accent-indigo-600"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">دستورالعمل سیستمی (System Prompt)</label>
                        <textarea
                            rows={8}
                            value={aiSettings?.system_prompt || ''}
                            onChange={(e) => setAiSettings((prev) => ({ ...prev, system_prompt: e.target.value }))}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md">
                        ذخیره تنظیمات هوش مصنوعی
                    </button>
                </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><BookOpen className="w-5 h-5" /></div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800">پایگاه دانش شرکت (Agentic RAG)</h3>
                        <p className="text-xs text-slate-500 mt-0.5">مدیریت قوانین فرضی شرکت ابریت</p>
                    </div>
                </div>

                <form onSubmit={handleFormSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-indigo-600" /> افزودن قانون جدید به حافظه RAG
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <select
                            value={newKb.category}
                            onChange={(e) => setNewKb({ ...newKb, category: e.target.value })}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                        >
                            <option value="RULES">قوانین (RULES)</option>
                            <option value="PRICING">مالی (PRICING)</option>
                            <option value="TECHNICAL">فنی (TECHNICAL)</option>
                            <option value="GENERAL">عمومی (GENERAL)</option>
                        </select>
                        <input
                            type="text"
                            value={newKb.title}
                            onChange={(e) => setNewKb({ ...newKb, title: e.target.value })}
                            placeholder="عنوان قانون"
                            className="sm:col-span-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <textarea
                        rows={2}
                        value={newKb.content}
                        onChange={(e) => setNewKb({ ...newKb, content: e.target.value })}
                        placeholder="متن کامل قانون..."
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end">
                        <button type="submit" className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition">
                            + ثبت در پایگاه دانش
                        </button>
                    </div>
                </form>

                <div className="space-y-3">
                    {kbItems && kbItems.length > 0 ? (
                        kbItems.map((item) => (
                            <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex items-start justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryConfig[item.category]?.color || 'bg-slate-100 text-slate-600'}`}>
                                            {categoryConfig[item.category]?.label || item.category}
                                        </span>
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-800">{item.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>
                                </div>
                                <button onClick={() => onDeleteKB(item.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-6 text-slate-400 text-xs">هیچ قانونی در پایگاه دانش ثبت نشده است.</div>
                    )}
                </div>
            </div>
        </div>
    );
};