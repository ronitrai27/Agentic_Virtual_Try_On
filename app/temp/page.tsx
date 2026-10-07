'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  ShoppingBag,
  Search,
  Layers,
  Cpu,
  Zap,
  ExternalLink,
  Plus,
  Trash2,
  Clock,
  Send,
  Loader2,
  Tag,
  Check,
} from 'lucide-react';
import type { Product, WardrobeMemoryItem, ParallelSearchResponse } from '@/lib/agents/shopping/types';

// Initial fake memory for testing
const INITIAL_MEMORY: WardrobeMemoryItem[] = [
  {
    id: 'mem-1',
    title: 'Red linen strip shirt',
    category: 'top',
    color: 'Crimson Red & White',
    pattern: 'Vertical Linen Stripe',
    fabric: 'Pure Linen Blend',
    sleeves: 'Half-sleeve resort collar',
    notes: 'Tried for casual summer outing',
    triedAt: 'Yesterday, 3:30 PM',
  },
  {
    id: 'mem-2',
    title: 'Checked shirts full armed',
    category: 'top',
    color: 'Navy & Forest Green Check',
    pattern: 'Gingham / Windowpane Check',
    fabric: '100% Cotton Twill',
    sleeves: 'Full-sleeve / Full-armed with cuffs',
    notes: 'Tried for semi-formal styling',
    triedAt: '2 days ago',
  },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; result: any }>;
}

export default function ShoppingAgentTestPage() {
  // Input State
  const [input, setInput] = useState<string>('');

  // Messages & Loading State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentStatusText, setCurrentStatusText] = useState<string>('');

  // Products fetched in the current or previous agent runs
  const [extractedProducts, setExtractedProducts] = useState<Product[]>([]);
  const [lastEngineResults, setLastEngineResults] = useState<any>(null);

  // Wardrobe Memory State (Fake DB in-page)
  const [wardrobeMemory, setWardrobeMemory] = useState<WardrobeMemoryItem[]>(INITIAL_MEMORY);
  const [newMemTitle, setNewMemTitle] = useState('');
  const [newMemCategory, setNewMemCategory] = useState<'top' | 'bottom' | 'shoes'>('top');

  // Garment Upload State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Model & Mode Settings
  const [orchestratorModel, setOrchestratorModel] = useState<'gpt-4.1-mini' | 'gpt-4o-mini'>('gpt-4.1-mini');
  const [visionModel, setVisionModel] = useState<'gpt-5-mini' | 'gpt-4o-mini'>('gpt-5-mini');
  const [activeTab, setActiveTab] = useState<'agent' | 'benchmark'>('agent');

  // Benchmark / Direct Search State
  const [benchmarkQuery, setBenchmarkQuery] = useState('beige linen trousers men');
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<ParallelSearchResponse | null>(null);

  // Handle Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Add Item to Memory
  const addMemoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemTitle.trim()) return;

    const newItem: WardrobeMemoryItem = {
      id: `mem-${Date.now()}`,
      title: newMemTitle.trim(),
      category: newMemCategory,
      notes: 'Custom item added during session test',
      triedAt: 'Just now',
    };

    setWardrobeMemory((prev) => [newItem, ...prev]);
    setNewMemTitle('');
  };

  // Remove Item from Memory
  const removeMemoryItem = (id: string) => {
    setWardrobeMemory((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle Form Submit (Realtime SSE parser)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = input.trim();
    if (!userText || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setCurrentStatusText('🧠 Initializing agent workflow...');

    const assistantMsgId = `asst-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '', toolCalls: [] },
    ]);

    try {
      const response = await fetch('/api/shopping-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          wardrobeMemory,
          uploadedImageUrl: uploadedImage,
          orchestratorModel,
          visionModel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const toolCallsList: Array<{ name: string; result: any }> = [];
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            try {
              const lines = eventBlock.split('\n');
              let eventName = '';
              let dataStr = '';

              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  eventName = line.replace('event: ', '').trim();
                } else if (line.startsWith('data: ')) {
                  dataStr = line.replace('data: ', '').trim();
                }
              }

              if (!dataStr) continue;
              const data = JSON.parse(dataStr);

              if (eventName === 'status') {
                setCurrentStatusText(data.text || '');
              } else if (eventName === 'tool_call') {
                toolCallsList.push({ name: data.name, result: data.result });
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, toolCalls: [...toolCallsList] } : msg
                  )
                );
              } else if (eventName === 'products') {
                if (data.products && Array.isArray(data.products)) {
                  setExtractedProducts(data.products);
                  setLastEngineResults(data.engineResults);
                }
              } else if (eventName === 'text_delta') {
                assistantText += data.text || '';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, content: assistantText } : msg
                  )
                );
              }
            } catch (pErr) {
              console.warn('SSE Parse error:', pErr);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${err.message}. Please verify SERPAPI_KEY and OPENAI_API_KEY in .env.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setCurrentStatusText('');
    }
  };

  // Direct Benchmark Test
  const runDirectBenchmark = async () => {
    setIsBenchmarking(true);
    setBenchmarkResult(null);
    try {
      const res = await fetch('/api/shopping-agent/direct-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: benchmarkQuery,
          imageUrl: uploadedImage || undefined,
        }),
      });
      const data = await res.json();
      setBenchmarkResult(data);
      if (data.products) {
        setExtractedProducts(data.products);
      }
    } catch (err) {
      console.error('Benchmark failed', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-[#0d0f15]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-white">Stylist & Shopping Agent</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Test Workbench
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Parallel SerpApi (Shopping + Amazon + Lens) • In-Page Memory • Stylist Reasoning
            </p>
          </div>
        </div>

        {/* Engine Pipeline Status & Model Badges */}
        <div className="flex items-center gap-2 text-xs">
          {/* Active Pipeline Badges */}
          <div className="hidden xl:flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg">
            <span className="text-zinc-500 text-[11px] font-mono">Parallel Pipeline:</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Google Shopping
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Amazon.in
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Google Lens
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded" title="Triggered only if results < 3">
              Bing (Fallback)
            </span>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] text-zinc-400">Orchestrator:</span>
            <select
              value={orchestratorModel}
              onChange={(e) => setOrchestratorModel(e.target.value as any)}
              className="bg-transparent text-amber-400 font-mono text-[11px] focus:outline-none cursor-pointer"
            >
              <option value="gpt-4.1-mini" className="bg-zinc-900 text-zinc-100">gpt-4.1-mini</option>
              <option value="gpt-4o-mini" className="bg-zinc-900 text-zinc-100">gpt-4o-mini</option>
            </select>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5">
            <button
              onClick={() => setActiveTab('agent')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'agent' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Agent Chat
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'benchmark' ? 'bg-amber-500 text-black shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Direct Engine Test
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Garment Upload & Wardrobe Memory (Fake DB) */}
        <aside className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-[#0a0c11] flex flex-col overflow-y-auto p-4 gap-4">
          {/* Section 1: Upload Garment */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Upload Garment
              </span>
              {uploadedImage && (
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setUploadedImageName('');
                  }}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedImage ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border border-amber-500/40 bg-zinc-950">
                <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/80 backdrop-blur px-2 py-1 rounded text-[10px] text-zinc-300 truncate">
                  {uploadedImageName || 'Garment preview'}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border border-dashed border-zinc-700 hover:border-amber-500/60 rounded-xl flex flex-col items-center justify-center gap-2 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors group cursor-pointer"
              >
                <Upload className="w-6 h-6 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200">
                  Upload shirt / pant photo for Vision + Lens
                </span>
                <span className="text-[10px] text-zinc-600">JPG, PNG, WebP</span>
              </button>
            )}
          </div>

          {/* Section 2: In-Page Wardrobe Memory */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Wardrobe Memory (Testing DB)
              </span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 font-mono px-1.5 py-0.5 rounded">
                {wardrobeMemory.length} items
              </span>
            </div>

            <p className="text-[11px] text-zinc-400">
              The agent accesses these items when you ask <span className="text-amber-300">&quot;what should I wear below?&quot;</span> or to pair with tested clothes.
            </p>

            {/* Memory Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {wardrobeMemory.map((item) => (
                <div
                  key={item.id}
                  className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-2.5 relative group hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <h4 className="text-xs font-semibold text-zinc-200">{item.title}</h4>
                    </div>
                    <button
                      onClick={() => removeMemoryItem(item.id)}
                      className="text-zinc-600 hover:text-rose-400 transition-colors p-0.5"
                      title="Remove from memory"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
                    {item.color && (
                      <span className="bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">
                        {item.color}
                      </span>
                    )}
                    {item.pattern && (
                      <span className="bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">
                        {item.pattern}
                      </span>
                    )}
                    {item.fabric && (
                      <span className="bg-zinc-800/80 text-zinc-300 px-1.5 py-0.5 rounded">
                        {item.fabric}
                      </span>
                    )}
                  </div>
                  {item.triedAt && (
                    <p className="text-[9px] text-zinc-500 mt-1 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Tried {item.triedAt}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Item */}
            <form onSubmit={addMemoryItem} className="pt-2 border-t border-zinc-800/80 space-y-2">
              <span className="text-[11px] font-medium text-zinc-400">Add Test Garment to Memory:</span>
              <input
                type="text"
                value={newMemTitle}
                onChange={(e) => setNewMemTitle(e.target.value)}
                placeholder="e.g. Black Oversized Graphic Tee..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-zinc-100"
              />
              <div className="flex gap-2">
                <select
                  value={newMemCategory}
                  onChange={(e) => setNewMemCategory(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2 py-1.5 flex-1 focus:outline-none"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="shoes">Shoes</option>
                </select>
                <button
                  type="submit"
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-zinc-400">Quick Test Prompts:</span>
            <div className="flex flex-col gap-1.5">
              {[
                'What should I wear below my red linen striped shirt?',
                'What pants and shoes match my full armed checked shirt under ₹3,000?',
                'Search for formal shirts for me',
                'Suggest complete look with bottoms for what I tried earlier',
              ].map((presetPrompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(presetPrompt)}
                  className="text-left text-xs bg-zinc-900/40 hover:bg-zinc-800/70 border border-zinc-800/70 hover:border-amber-500/40 text-zinc-300 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  &quot;{presetPrompt}&quot;
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER / MAIN: Tab Content */}
        {activeTab === 'agent' ? (
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Chat Interaction Column */}
            <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-[#0b0d13]">
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 text-zinc-400 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-100">Ready to Test Your Agent</h2>
                      <p className="text-xs text-zinc-400 mt-1.5">
                        Ask styling advice, search Indian ecommerce in parallel, or ask what to wear below your tried shirts from memory!
                      </p>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl text-left w-full space-y-1.5 text-xs">
                      <p className="font-medium text-zinc-300">Try asking:</p>
                      <p className="text-amber-400 cursor-pointer hover:underline" onClick={() => setInput('What should I wear below my red linen striped shirt?')}>
                        👉 &quot;What should I wear below my red linen striped shirt?&quot;
                      </p>
                      <p className="text-amber-400 cursor-pointer hover:underline" onClick={() => setInput('Find formal shirts for me')}>
                        👉 &quot;Find formal shirts for me&quot;
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                        {m.role === 'user' ? 'You' : 'Stylist Agent'}
                      </div>

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-amber-500 text-black font-medium'
                            : 'bg-zinc-900/90 border border-zinc-800 text-zinc-200'
                        }`}
                      >
                        {/* Text output */}
                        <div className="whitespace-pre-wrap">{m.content}</div>

                        {/* Executed Tools Trace */}
                        {m.toolCalls && m.toolCalls.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                            <span className="text-[10px] font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                              <Cpu className="w-3 h-3" /> Agent Execution Log
                            </span>
                            {m.toolCalls.map((tc, tIdx) => (
                              <div key={tIdx} className="bg-black/50 border border-zinc-800 rounded-lg p-2 text-xs font-mono space-y-1">
                                <div className="flex items-center justify-between text-amber-300">
                                  <span>⚙️ {tc.name}</span>
                                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Executed
                                  </span>
                                </div>
                                {tc.name === 'searchProducts' && (
                                  <p className="text-[10px] text-zinc-400">
                                    Found {tc.result?.totalCount || 0} products across parallel stores.
                                  </p>
                                )}
                                {tc.name === 'readWardrobeMemory' && (
                                  <p className="text-[10px] text-zinc-400">
                                    Recalled {tc.result?.itemsCount || 0} tried items from memory.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Real-time Status Stream Indicator */}
                {isLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-amber-400 font-mono bg-zinc-900/90 border border-amber-500/30 px-3.5 py-2.5 rounded-xl shadow-lg animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{currentStatusText || 'Agent is executing parallel workflow...'}</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-zinc-800 bg-[#0a0c10]/95 backdrop-blur">
                <form onSubmit={handleFormSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask stylist: 'what should I wear below my red linen shirt?'..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input || !input.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Product Cards Live Showcase Column */}
            <div className="w-full lg:w-96 xl:w-[440px] bg-[#090b10] flex flex-col overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-sm text-zinc-200">Discovered Products</h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                  {extractedProducts.length} items
                </span>
              </div>

              {/* Engine Stats if available */}
              {lastEngineResults && (
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {Object.entries(lastEngineResults).map(([eng, stat]: any) => (
                    <span
                      key={eng}
                      className={`px-2 py-0.5 rounded border ${
                        stat.status === 'ok'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : stat.status === 'empty'
                          ? 'bg-zinc-800/80 text-zinc-400 border-zinc-700'
                          : 'bg-zinc-800 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      {eng}: {stat.count || 0} ({stat.durationMs}ms)
                    </span>
                  ))}
                </div>
              )}

              {extractedProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500 space-y-2">
                  <Tag className="w-8 h-8 text-zinc-600" />
                  <p className="text-xs">No products fetched yet.</p>
                  <p className="text-[11px] text-zinc-600">
                    When the agent executes a search, parallel results (images, prices, stores) will appear here live!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {extractedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-zinc-900/70 border border-zinc-800 rounded-xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col group shadow-md"
                    >
                      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-md bg-black/80 backdrop-blur text-amber-400 border border-zinc-800">
                          {product.store || product.engine}
                        </span>
                        {product.rating && (
                          <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur text-zinc-300">
                            ★ {product.rating}
                          </span>
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <h4 className="text-xs font-medium text-zinc-200 line-clamp-2" title={product.title}>
                          {product.title}
                        </h4>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                          <span className="text-sm font-bold text-amber-400">
                            {product.priceText || (product.price ? `₹${product.price.toLocaleString('en-IN')}` : 'Check store')}
                          </span>

                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-black bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded-lg transition-colors shadow"
                          >
                            <span>Buy</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        ) : (
          /* BENCHMARK / DIRECT ENGINE TEST TAB */
          <main className="flex-1 bg-[#0b0d13] p-6 overflow-y-auto space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    Direct Parallel Engine Benchmark
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Test Google Shopping, Amazon.in, and Google Lens simultaneously without the chat loop. Verifies SerpApi latency, normalizers, and fallback.
                  </p>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={benchmarkQuery}
                    onChange={(e) => setBenchmarkQuery(e.target.value)}
                    placeholder="Enter search query (e.g. 'beige linen trousers men')..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100"
                  />
                  <button
                    onClick={runDirectBenchmark}
                    disabled={isBenchmarking}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg shadow-amber-500/20"
                  >
                    {isBenchmarking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Run Parallel Search</span>
                  </button>
                </div>
              </div>

              {/* Benchmark Results */}
              {benchmarkResult && (
                <div className="space-y-4">
                  {/* Engine Performance Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {Object.entries(benchmarkResult.engineResults).map(([eng, stat]) => (
                      <div
                        key={eng}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-zinc-300">{eng}</span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              stat.status === 'ok'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : stat.status === 'empty'
                                ? 'bg-zinc-800 text-zinc-400'
                                : stat.status === 'error'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {stat.status}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xl font-bold text-white">{stat.count} items</span>
                          <span className="text-xs text-zinc-400 font-mono">{stat.durationMs}ms</span>
                        </div>
                        {stat.error && (
                          <p className="text-[10px] text-rose-400 truncate" title={stat.error}>
                            {stat.error}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Products Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Normalized & Ranked Results ({benchmarkResult.totalProducts} items)
                      </h3>
                      {benchmarkResult.fallbackTriggered && (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          Bing Fallback Triggered (Primary yielded &lt; 3)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {benchmarkResult.products.map((item) => (
                        <div
                          key={item.id}
                          className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between"
                        >
                          <div className="relative aspect-square bg-zinc-950">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-contain p-2"
                            />
                            <span className="absolute top-2 left-2 text-[10px] bg-black/80 px-2 py-0.5 rounded text-amber-400">
                              {item.store}
                            </span>
                          </div>
                          <div className="p-3 space-y-1.5">
                            <h4 className="text-xs font-medium text-zinc-200 line-clamp-2">{item.title}</h4>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs font-bold text-amber-400">{item.priceText || '-'}</span>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-white"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
