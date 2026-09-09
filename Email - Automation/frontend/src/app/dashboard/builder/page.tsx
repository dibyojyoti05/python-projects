"use client";

import React, { useState } from "react";
import {
  Type,
  Image as ImageIcon,
  Box,
  Layout,
  Save,
  Play,
  Send,
  Trash2,
  CheckCircle2,
  Smartphone,
  Monitor,
  MoveUp,
  MoveDown,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

interface EmailBlock {
  id: string;
  type: "heading" | "text" | "button" | "image" | "divider" | "spacer";
  content: string;
  align?: "left" | "center" | "right";
  buttonUrl?: string;
  buttonColor?: string;
  imageUrl?: string;
}

let blockCounter = 0;
function generateBlockId(): string {
  blockCounter += 1;
  return `b_${blockCounter}_${Date.now()}`;
}

const defaultBlocks: EmailBlock[] = [
  {
    id: "b1",
    type: "image",
    content: "",
    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
    align: "center",
  },
  {
    id: "b2",
    type: "heading",
    content: "Special Summer Promotion: Up to 50% Off!",
    align: "center",
  },
  {
    id: "b3",
    type: "text",
    content:
      "Hello {{ first_name }}, we are thrilled to bring you our most anticipated flash discount event. Access exclusive early-bird deals across all top categories today.",
    align: "left",
  },
  {
    id: "b4",
    type: "button",
    content: "Claim Your Discount",
    buttonUrl: "https://example.com/summer-sale",
    buttonColor: "#2563eb",
    align: "center",
  },
  {
    id: "b5",
    type: "divider",
    content: "",
  },
  {
    id: "b6",
    type: "text",
    content: "Need help? Reply directly to this email or visit our Help Center.",
    align: "center",
  },
];

export default function EmailBuilderPage() {
  const [campaignName, setCampaignName] = useState("Summer Flash Sale Promo");
  const [subject, setSubject] = useState("Exclusive {{ first_name }}: Your 50% Discount Inside");
  const [blocks, setBlocks] = useState<EmailBlock[]>(defaultBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>("b2");
  const [activeTab, setActiveTab] = useState<"blocks" | "settings">("blocks");

  // Status & Modal states
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const addBlock = (type: EmailBlock["type"]) => {
    const newId = generateBlockId();
    const newBlock: EmailBlock = { id: newId, type, content: "" };

    if (type === "heading") {
      newBlock.content = "New Heading Title";
      newBlock.align = "left";
    } else if (type === "text") {
      newBlock.content = "Add your descriptive body copy here. Personalize with {{ first_name }}.";
      newBlock.align = "left";
    } else if (type === "button") {
      newBlock.content = "Click Here";
      newBlock.buttonUrl = "https://example.com";
      newBlock.buttonColor = "#2563eb";
      newBlock.align = "center";
    } else if (type === "image") {
      newBlock.imageUrl = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80";
      newBlock.align = "center";
    }

    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newId);
    setActiveTab("settings");
  };

  const updateSelectedBlock = (patch: Partial<EmailBlock>) => {
    if (!selectedBlockId) return;
    setBlocks(blocks.map((b) => (b.id === selectedBlockId ? { ...b, ...patch } : b)));
  };

  const deleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  // Generate full HTML from canvas blocks
  const generateHTML = () => {
    const blockHtml = blocks
      .map((b) => {
        const alignStyle = `text-align: ${b.align || "left"};`;
        if (b.type === "heading") {
          return `<h1 style="${alignStyle} font-size: 26px; font-weight: bold; color: #0f172a; margin: 16px 0;">${b.content}</h1>`;
        }
        if (b.type === "text") {
          return `<p style="${alignStyle} font-size: 15px; line-height: 1.6; color: #475569; margin: 12px 0;">${b.content}</p>`;
        }
        if (b.type === "button") {
          return `<div style="${alignStyle} margin: 24px 0;"><a href="${b.buttonUrl || "#"}" style="background-color: ${b.buttonColor || "#2563eb"}; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">${b.content}</a></div>`;
        }
        if (b.type === "image") {
          return `<div style="${alignStyle} margin: 16px 0;"><img src="${b.imageUrl}" alt="" style="max-width: 100%; border-radius: 8px; display: inline-block;" /></div>`;
        }
        if (b.type === "divider") {
          return `<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`;
        }
        if (b.type === "spacer") {
          return `<div style="height: 32px;"></div>`;
        }
        return "";
      })
      .join("\n");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${subject}</title></head><body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;"><div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${blockHtml}</div></body></html>`;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const html = generateHTML();
      if (savedCampaignId) {
        await api.campaigns.update(savedCampaignId, {
          name: campaignName,
          subject,
          content_html: html,
        });
        setStatusMessage("Campaign updated successfully!");
      } else {
        const res = await api.campaigns.create({
          name: campaignName,
          subject,
          content_html: html,
        });
        setSavedCampaignId(res.id);
        setStatusMessage("Campaign draft saved to database!");
      }
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setStatusMessage(`Save failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setSendingTest(true);
    try {
      let cid = savedCampaignId;
      if (!cid) {
        const res = await api.campaigns.create({
          name: campaignName,
          subject,
          content_html: generateHTML(),
        });
        cid = res.id;
        setSavedCampaignId(cid);
      }
      await api.campaigns.test(cid, testEmail);
      setStatusMessage(`Test email delivered to ${testEmail}!`);
      setShowTestModal(false);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Test send failed";
      alert(`Test send failed: ${msg}`);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col border border-border/80 rounded-2xl overflow-hidden bg-background shadow-xl">
      {/* Topbar */}
      <div className="h-16 border-b border-border/80 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Campaign Name
            </span>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="bg-transparent font-semibold text-foreground focus:outline-none focus:border-b border-primary text-sm w-56 truncate"
            />
          </div>
          <div className="h-6 w-[1px] bg-border" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Subject Line
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-transparent font-normal text-muted-foreground focus:text-foreground focus:outline-none focus:border-b border-primary text-xs w-64 truncate"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {statusMessage && (
            <span className="text-xs text-emerald-400 font-medium mr-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {statusMessage}
            </span>
          )}
          <button
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center justify-center rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary h-9 px-3.5 transition-all"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" /> Preview
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl text-xs font-medium border border-border bg-card hover:bg-secondary h-9 px-3.5 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center justify-center rounded-xl text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 transition-all shadow-md shadow-primary/20"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" /> Send Test
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Component Palette & Properties */}
        <div className="w-80 border-r border-border/80 bg-card/40 flex flex-col shrink-0">
          <div className="flex border-b border-border/80">
            <button
              onClick={() => setActiveTab("blocks")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "blocks"
                  ? "border-b-2 border-primary text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === "settings"
                  ? "border-b-2 border-primary text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Inspector
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "blocks" ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Heading", icon: Type, type: "heading" as const },
                  { name: "Paragraph", icon: Type, type: "text" as const },
                  { name: "Button", icon: Box, type: "button" as const },
                  { name: "Image", icon: ImageIcon, type: "image" as const },
                  { name: "Divider", icon: Layout, type: "divider" as const },
                  { name: "Spacer", icon: Layout, type: "spacer" as const },
                ].map((b) => (
                  <button
                    key={b.name}
                    onClick={() => addBlock(b.type)}
                    className="flex flex-col items-center justify-center p-4 border border-border/80 rounded-xl bg-secondary/30 hover:bg-secondary hover:border-primary/40 transition-all text-center group"
                  >
                    <b.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                    <span className="text-xs font-medium text-foreground">{b.name}</span>
                  </button>
                ))}
              </div>
            ) : selectedBlock ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold uppercase text-primary">
                    {selectedBlock.type} Block
                  </span>
                  <button
                    onClick={(e) => deleteBlock(selectedBlock.id, e)}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {/* Content Input */}
                {selectedBlock.type !== "divider" && selectedBlock.type !== "spacer" && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      {selectedBlock.type === "image" ? "Image URL" : "Content Text"}
                    </label>
                    {selectedBlock.type === "text" ? (
                      <textarea
                        rows={4}
                        value={selectedBlock.content}
                        onChange={(e) => updateSelectedBlock({ content: e.target.value })}
                        className="w-full bg-secondary/40 border border-border rounded-lg p-2.5 text-xs outline-none focus:border-primary"
                      />
                    ) : selectedBlock.type === "image" ? (
                      <input
                        type="text"
                        value={selectedBlock.imageUrl || ""}
                        onChange={(e) => updateSelectedBlock({ imageUrl: e.target.value })}
                        className="w-full bg-secondary/40 border border-border rounded-lg px-2.5 py-2 text-xs outline-none focus:border-primary"
                      />
                    ) : (
                      <input
                        type="text"
                        value={selectedBlock.content}
                        onChange={(e) => updateSelectedBlock({ content: e.target.value })}
                        className="w-full bg-secondary/40 border border-border rounded-lg px-2.5 py-2 text-xs outline-none focus:border-primary"
                      />
                    )}
                  </div>
                )}

                {/* Button specific */}
                {selectedBlock.type === "button" && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Link URL
                      </label>
                      <input
                        type="text"
                        value={selectedBlock.buttonUrl || ""}
                        onChange={(e) => updateSelectedBlock({ buttonUrl: e.target.value })}
                        className="w-full bg-secondary/40 border border-border rounded-lg px-2.5 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">
                        Button Color
                      </label>
                      <input
                        type="color"
                        value={selectedBlock.buttonColor || "#2563eb"}
                        onChange={(e) => updateSelectedBlock({ buttonColor: e.target.value })}
                        className="h-8 w-full rounded cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {/* Alignment */}
                {selectedBlock.type !== "divider" && selectedBlock.type !== "spacer" && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Alignment
                    </label>
                    <div className="flex rounded-lg border border-border overflow-hidden">
                      {(["left", "center", "right"] as const).map((al) => (
                        <button
                          key={al}
                          onClick={() => updateSelectedBlock({ align: al })}
                          className={`flex-1 py-1.5 text-xs capitalize ${
                            selectedBlock.align === al
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "hover:bg-secondary text-muted-foreground"
                          }`}
                        >
                          {al}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center pt-8">
                Click any block on the canvas to inspect and edit its properties.
              </p>
            )}
          </div>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 bg-slate-950/80 overflow-y-auto flex justify-center p-8">
          <div className="w-full max-w-[620px] bg-white text-slate-900 shadow-2xl rounded-xl p-8 min-h-[700px] flex flex-col space-y-3">
            {blocks.map((block, index) => {
              const isSelected = selectedBlockId === block.id;

              return (
                <div
                  key={block.id}
                  onClick={() => {
                    setSelectedBlockId(block.id);
                    setActiveTab("settings");
                  }}
                  className={`group relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/20"
                      : "border-transparent hover:border-blue-300"
                  }`}
                >
                  {/* Floating reorder & delete toolbar */}
                  <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-slate-900 text-white rounded-md px-1.5 py-0.5 shadow-md z-10">
                    <button
                      onClick={(e) => moveBlock(index, "up", e)}
                      disabled={index === 0}
                      className="hover:text-blue-400 p-1 disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => moveBlock(index, "down", e)}
                      disabled={index === blocks.length - 1}
                      className="hover:text-blue-400 p-1 disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => deleteBlock(block.id, e)}
                      className="hover:text-red-400 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Render based on type */}
                  {block.type === "heading" && (
                    <h2
                      style={{ textAlign: block.align || "center" }}
                      className="text-2xl font-bold tracking-tight text-slate-900"
                    >
                      {block.content}
                    </h2>
                  )}

                  {block.type === "text" && (
                    <p
                      style={{ textAlign: block.align || "left" }}
                      className="text-sm text-slate-600 leading-relaxed"
                    >
                      {block.content}
                    </p>
                  )}

                  {block.type === "button" && (
                    <div style={{ textAlign: block.align || "center" }}>
                      <button
                        style={{ backgroundColor: block.buttonColor || "#2563eb" }}
                        className="px-6 py-2.5 text-white font-bold text-sm rounded-lg shadow-sm"
                      >
                        {block.content}
                      </button>
                    </div>
                  )}

                  {block.type === "image" && (
                    <div style={{ textAlign: block.align || "center" }}>
                      {block.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={block.imageUrl}
                          alt="email banner"
                          className="max-w-full rounded-lg inline-block"
                        />
                      ) : (
                        <div className="h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                          Image Block
                        </div>
                      )}
                    </div>
                  )}

                  {block.type === "divider" && <hr className="border-slate-200 my-2" />}

                  {block.type === "spacer" && <div className="h-8 w-full bg-slate-100/50 rounded" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-card border border-border rounded-2xl p-6 shadow-2xl flex flex-col h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                    previewDevice === "desktop"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Monitor className="w-4 h-4" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 ${
                    previewDevice === "mobile"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Smartphone className="w-4 h-4" /> Mobile
                </button>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 mt-4 rounded-xl">
              <div
                className={`bg-white text-slate-900 rounded-xl p-6 transition-all shadow-xl overflow-y-auto max-h-full ${
                  previewDevice === "mobile" ? "w-[360px]" : "w-[600px]"
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: generateHTML() }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold">Send Live Test Email</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dispatch this email template to your inbox to inspect rendering in email clients.
            </p>

            <form onSubmit={handleSendTestSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tester@company.com"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {sendingTest ? "Sending..." : "Send Test Now"}
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
