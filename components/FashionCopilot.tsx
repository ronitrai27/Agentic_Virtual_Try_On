"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Send,
  Plus,
  Mic,
  X,
  ExternalLink,
  Shirt,
} from "lucide-react";
import { Mascot } from "page-mascot";
import { DotmCircular15 } from "@/components/ui/dotm-circular-15";
import ReactMarkdown from "react-markdown";
import type { Product } from "@/lib/agents/shopping/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string | null;
  toolCalls?: Array<{ name: string; result: any }>;
  products?: Product[];
}

interface FashionCopilotProps {
  onSelectPrompt?: (prompt: string) => void;
  onTryOn?: (product: Product) => void;
}

export function FashionCopilot({
  onSelectPrompt,
  onTryOn,
}: FashionCopilotProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatusText, setCurrentStatusText] = useState("");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Recomend me outfits based on my previous prefernces.",
    "Get me some Red men jackets",
    "Find best men shirts under 500 .",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, currentStatusText]);

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

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setUploadedImage(null);
    setUploadedImageName("");
    setIsLoading(false);
    setCurrentStatusText("");
  };

  const handleSend = async (userTextOverride?: string) => {
    const textToSend = (
      userTextOverride !== undefined ? userTextOverride : input
    ).trim();
    if ((!textToSend && !uploadedImage) || isLoading) return;

    if (onSelectPrompt && textToSend) {
      onSelectPrompt(textToSend);
    }

    const currentImage = uploadedImage;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      image: currentImage,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setUploadedImage(null);
    setUploadedImageName("");
    setIsLoading(true);
    setCurrentStatusText("Analyzing request...");

    const assistantMsgId = `asst-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        toolCalls: [],
        products: [],
      },
    ]);

    try {
      const response = await fetch("/api/shopping-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          uploadedImageUrl: currentImage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const toolCallsList: Array<{ name: string; result: any }> = [];
      let foundProducts: Product[] = [];
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventBlock of events) {
            if (!eventBlock.trim()) continue;

            try {
              const lines = eventBlock.split("\n");
              let eventName = "";
              let dataStr = "";

              for (const line of lines) {
                if (line.startsWith("event: ")) {
                  eventName = line.replace("event: ", "").trim();
                } else if (line.startsWith("data: ")) {
                  dataStr = line.replace("data: ", "").trim();
                }
              }

              if (!dataStr) continue;
              const data = JSON.parse(dataStr);

              if (eventName === "status") {
                setCurrentStatusText(data.text || "");
              } else if (eventName === "tool_call") {
                toolCallsList.push({ name: data.name, result: data.result });
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, toolCalls: [...toolCallsList] }
                      : msg,
                  ),
                );
              } else if (eventName === "products") {
                if (data.products && Array.isArray(data.products)) {
                  foundProducts = data.products;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMsgId
                        ? { ...msg, products: foundProducts }
                        : msg,
                    ),
                  );
                }
              } else if (eventName === "text_delta") {
                assistantText += data.text || "";
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: assistantText }
                      : msg,
                  ),
                );
              }
            } catch (pErr) {
              console.warn("SSE Parse error:", pErr);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ Error: ${err.message || "Failed to get response"}`,
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      setCurrentStatusText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white text-zinc-900 min-h-0 overflow-hidden select-none">
      {/* 1. Top Header */}
      <header className="px-4 py-2.5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <div className="flex items-center justify-center shrink-0">
              <Mascot
                directions="/mascots/glasses-directions.webp"
                reactions="/mascots/glasses-reactions.webp"
                size={26}
              />
            </div>
          )}
          <h2 className="text-sm font-semibold text-neutral-800">
            Fashion copilot
          </h2>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-sm transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </header>

      {/* 2. Chat / Empty State Container */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="mb-4 flex flex-col items-center justify-center">
              <Mascot
                directions="/mascots/glasses-directions.webp"
                reactions="/mascots/glasses-reactions.webp"
                size={86}
              />
            </div>

            <div className="w-full max-w-sm flex flex-col gap-2.5">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="relative w-full p-3.5 pr-16 text-left text-xs font-medium text-neutral-800 bg-linear-to-r from-orange-50/90 via-orange-50/50 to-amber-50/30 hover:from-orange-100/90 hover:to-amber-100/50 border border-orange-200/80 hover:border-orange-300 rounded-lg transition-all cursor-pointer overflow-hidden flex items-center justify-between"
                >
                  <span className="relative z-10">{suggestion}</span>
                  <img
                    src="/orange.svg"
                    alt=""
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 object-contain pointer-events-none select-none"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="flex flex-col items-end gap-1.5 max-w-[85%]">
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Uploaded garment"
                        className="w-24 h-24 object-cover rounded-lg border border-neutral-200"
                      />
                    )}
                    {msg.content && (
                      <div className="px-3 py-2 bg-orange-300 text-neutral-900 border border-orange-400/50 rounded-lg text-xs leading-relaxed font-medium break-words">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-start gap-2.5 max-w-full w-full">
                    {/* Minimal Tool Calls */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="flex flex-col gap-1 w-full">
                        {msg.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[11px] font-mono text-white bg-neutral-900 border border-neutral-800 px-2.5 py-0.5 rounded w-fit shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{tc.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.content && (
                      <div className="text-xs text-neutral-800 leading-relaxed break-words space-y-1 w-full">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => (
                              <p className="mb-1.5 last:mb-0 leading-relaxed">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-neutral-900">
                                {children}
                              </strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 space-y-1 my-1.5">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 space-y-1 my-1.5">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-xs leading-relaxed">
                                {children}
                              </li>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Products Horizontal Scrollable Cards */}
                    {msg.products && msg.products.length > 0 && (
                      <div className="w-full flex flex-col gap-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-neutral-500">
                            Found {msg.products.length} matching items
                          </span>
                          <span className="text-[10px] text-neutral-900 font-inter">
                            Scroll →
                          </span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 w-full snap-x">
                          {msg.products.map((prod) => (
                            <div
                              key={prod.id}
                              className="w-[175px] shrink-0 snap-start flex flex-col rounded-xl border border-neutral-200 bg-white p-2.5 shadow-2xs hover:shadow-xs transition-all"
                            >
                              {/* Product Image */}
                              <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-50 border border-neutral-100 flex items-center justify-center relative mb-2">
                                {prod.image ? (
                                  <img
                                    src={prod.image}
                                    alt={prod.title}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[10px]">
                                    No image
                                  </div>
                                )}
                              </div>

                              {/* Title & Price & Store */}
                              <div className="flex flex-col flex-1 mb-2.5">
                                <h4
                                  title={prod.title}
                                  className="text-xs font-medium text-neutral-800 line-clamp-2 leading-snug mb-1"
                                >
                                  {prod.title}
                                </h4>
                                <div className="flex items-center justify-between text-xs mt-auto pt-1">
                                  <span className="font-semibold text-neutral-900">
                                    {prod.priceText ||
                                      (prod.price ? `₹${prod.price}` : "")}
                                  </span>
                                  {prod.store && (
                                    <span className="text-[10px] text-neutral-400 truncate max-w-[70px]">
                                      {prod.store}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons: Try On & Visit Link */}
                              <div className="flex items-center gap-1.5 mt-auto pt-1.5 border-t border-neutral-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onTryOn) {
                                      onTryOn(prod);
                                    } else if (onSelectPrompt) {
                                      onSelectPrompt(prod.title);
                                    }
                                  }}
                                  className="flex-1 py-1 px-2 bg-neutral-800 hover:bg-neutral-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs active:scale-95"
                                  title="Try on this item"
                                >
                                  <Shirt className="w-3 h-3 text-neutral-300" />
                                  <span>Try on</span>
                                </button>
                                <a
                                  href={prod.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1 px-2 bg-neutral-300 text-black rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                                  title="Visit product link"
                                >
                                  <span>Visit</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Agent Executing Loader */}
            {isLoading && (
              <div className="flex items-center gap-2.5 py-1 px-1 text-xs text-neutral-600 self-start">
                <DotmCircular15
                  size={32}
                  dotSize={4}
                  speed={1.4}
                  opacityBase={0.1}
                  opacityMid={0.4}
                  opacityPeak={0.95}
                />
                {currentStatusText && (
                  <span className="font-mono text-[11px] text-neutral-500 truncate">
                    {currentStatusText}
                  </span>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Bottom Textarea */}
      <div className="p-2 border-t border-neutral-200 bg-white shrink-0">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="border border-neutral-200 rounded-lg bg-neutral-100 focus-within:bg-white focus-within:border-neutral-300 p-2.5 transition-colors flex flex-col gap-2">
          {/* Uploaded Image Chip */}
          {uploadedImage && (
            <div className="flex items-center gap-2 p-1.5 bg-white rounded-md border border-neutral-200 w-fit max-w-full">
              <img
                src={uploadedImage}
                alt="Attachment"
                className="w-5 h-5 rounded object-cover border border-neutral-200"
              />
              <span className="text-[11px] text-neutral-700 truncate max-w-[150px]">
                {uploadedImageName || "Garment attachment"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setUploadedImage(null);
                  setUploadedImageName("");
                }}
                className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
                title="Remove attachment"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Fashion Copilot anything..."
            className="w-full text-xs bg-transparent border-b border-neutral-400 h-12 focus:outline-hidden resize-none placeholder:text-neutral-400 text-neutral-800"
          />
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-black hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
              title="Attach image or file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 bg-neutral-700 hover:bg-neutral-800 text-white rounded-sm transition-colors cursor-pointer flex items-center justify-center"
                title="Voice input"
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={(!input.trim() && !uploadedImage) || isLoading}
                className="p-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-neutral-900 text-white rounded-sm transition-colors cursor-pointer flex items-center justify-center"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
