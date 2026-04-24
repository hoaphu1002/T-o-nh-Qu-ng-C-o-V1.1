import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Image as ImageIcon, 
  Shirt, 
  Watch, 
  ShoppingBag, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  X,
  RefreshCw,
  Download,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { generateFashionAd } from "@/lib/gemini";

const ASPECT_RATIOS = [
  { label: "9:16", value: "9:16" },
  { label: "16:9", value: "16:9" },
  { label: "1:1", value: "1:1" },
  { label: "3:4", value: "3:4" },
  { label: "4:3", value: "4:3" },
];

const STYLES = [
  "Default",
  "In-store",
  "Product Concept",
  "Packshot",
  "Selfie"
];

const LOADING_MESSAGES = [
  "Đang phân tích người mẫu...",
  "Đang phối trang phục...",
  "Đang tinh chỉnh ánh sáng...",
  "Đang tạo bối cảnh chuyên nghiệp...",
  "Sắp hoàn tất ảnh quảng cáo của bạn...",
];

export default function App() {
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [accessoryImage, setAccessoryImage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("Default");
  const [prompt, setPrompt] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isPromptBarVisible, setIsPromptBarVisible] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const fileInputRefs = {
    model: useRef<HTMLInputElement>(null),
    clothing: useRef<HTMLInputElement>(null),
    accessory: useRef<HTMLInputElement>(null),
    product: useRef<HTMLInputElement>(null),
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024; // Good balance for quality and quota
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8)); // Use JPEG with 80% quality for smaller size
      };
    });
  };

  const handleFileUpload = async (type: keyof typeof fileInputRefs, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      if (type === "model") setModelImage(compressed);
      if (type === "clothing") setClothingImage(compressed);
      if (type === "accessory") setAccessoryImage(compressed);
      if (type === "product") setProductImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!modelImage && !clothingImage && !prompt.trim()) {
      alert("Vui lòng tải ảnh hoặc nhập mô tả để bắt đầu.");
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    
    // Rotate loading messages
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);

    try {
      const results = await generateFashionAd({
        modelImage: modelImage || undefined,
        clothingImage: clothingImage || undefined,
        accessoryImage: accessoryImage || undefined,
        productImage: productImage || undefined,
        aspectRatio,
        style,
        prompt: prompt.trim(),
      });
      setGeneratedImages(results);
    } catch (error: any) {
      console.error("Generation failed:", error);
      if (error.message === "QUOTA_EXCEEDED") {
        alert("Hệ thống đã hết lượt sử dụng miễn phí (Quota Exceeded). \n\nBạn hãy thử lại sau vài phút hoặc nhập API Key cá nhân trong phần Settings để tiếp tục sử dụng ngay.");
      } else {
        alert("Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại.");
      }
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `fashion-ad-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#1a2333] text-white font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#1a2333]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-display">HOA PHÚ <span className="text-blue-400 font-medium">FASHION AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Tình trạng hệ thống</span>
            <span className="text-[10px] text-blue-400 font-medium">Sẵn sàng (Shared Quota)</span>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 font-semibold px-3 py-1">PREMIUM ACCESS</Badge>
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
            <img src="https://picsum.photos/seed/fashion/36/36" alt="Avatar" referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[450px] border-r border-white/5 flex flex-col bg-[#1a2333]">
          <ScrollArea className="flex-1 pr-1">
            <div className="p-8 space-y-10 pb-24">
              {/* Upload Section */}
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">Tài nguyên thiết kế</h2>
                  <Button variant="ghost" size="sm" className="text-[10px] text-slate-500 hover:text-white hover:bg-white/5" onClick={() => {
                    setModelImage(null);
                    setClothingImage(null);
                    setAccessoryImage(null);
                    setProductImage(null);
                  }}>LÀM MỚI TẤT CẢ</Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <UploadCard 
                    label="Tải ảnh người mẫu" 
                    subtext="PNG, JPG"
                    icon={<ImageIcon className="w-8 h-8" />} 
                    image={modelImage} 
                    onClick={() => fileInputRefs.model.current?.click()} 
                  />
                  <UploadCard 
                    label="Tải trang phục" 
                    subtext="Quần, áo, váy..."
                    icon={<Shirt className="w-8 h-8" />} 
                    image={clothingImage} 
                    onClick={() => fileInputRefs.clothing.current?.click()} 
                  />
                  <UploadCard 
                    label="Tải phụ kiện" 
                    subtext="Giày, kính, mũ..."
                    icon={<Watch className="w-8 h-8" />} 
                    image={accessoryImage} 
                    onClick={() => fileInputRefs.accessory.current?.click()} 
                  />
                  <UploadCard 
                    label="Tải sản phẩm cầm tay" 
                    subtext="Mỹ phẩm, túi xách..."
                    icon={<ShoppingBag className="w-8 h-8" />} 
                    image={productImage} 
                    onClick={() => fileInputRefs.product.current?.click()} 
                  />
                </div>

                {/* Hidden Inputs */}
                <input type="file" ref={fileInputRefs.model} className="hidden" accept="image/*" onChange={(e) => handleFileUpload("model", e)} />
                <input type="file" ref={fileInputRefs.clothing} className="hidden" accept="image/*" onChange={(e) => handleFileUpload("clothing", e)} />
                <input type="file" ref={fileInputRefs.accessory} className="hidden" accept="image/*" onChange={(e) => handleFileUpload("accessory", e)} />
                <input type="file" ref={fileInputRefs.product} className="hidden" accept="image/*" onChange={(e) => handleFileUpload("product", e)} />
              </section>

              <Separator className="bg-white/5" />
            </div>
          </ScrollArea>

          <div className="p-8 border-t border-white/10 bg-[#1a2333]">
            <Button 
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.97] disabled:opacity-50"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ĐANG XỬ LÝ...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  TẠO ẢNH QUẢNG CÁO
                </>
              )}
            </Button>
          </div>
        </aside>

        {/* Main Preview Area */}
        <section className="flex-1 bg-[#1a2333] relative flex flex-col items-center justify-center p-12 overflow-hidden">
          <AnimatePresence mode="wait">
            {generatedImages.length === 0 && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-8 max-w-md"
              >
                <div className="w-24 h-24 bg-[#24314d] rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                  <ImageIcon className="w-12 h-12 text-slate-500" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white font-display">Sẵn sàng sáng tạo?</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Tải lên các tài nguyên bên trái và nhập ý tưởng của bạn để AI kiến tạo những mẫu quảng cáo đẳng cấp.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1">Ultra HD 4K</Badge>
                  <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1">AI Smart Lighting</Badge>
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-zinc-800 border-t-orange-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-orange-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-zinc-200">{LOADING_MESSAGES[loadingMessageIndex]}</p>
                  <p className="text-zinc-500 text-sm">Quá trình này có thể mất vài giây...</p>
                </div>
              </motion.div>
            )}

            {generatedImages.length > 0 && !isGenerating && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full h-full flex items-center justify-center gap-10 p-6"
              >
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-6 flex-1 max-w-[45%]">
                    <div className="relative group w-full overflow-hidden rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] border border-white/10 bg-[#24314d]/40 backdrop-blur-sm">
                      <img 
                        src={img} 
                        alt={`Generated Advertisement ${idx + 1}`} 
                        className="w-full h-auto max-h-[60vh] object-contain transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-blue-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 bg-white text-slate-900 hover:bg-blue-50" onClick={() => setFullScreenImage(img)}>
                          <Maximize2 className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="secondary" className="rounded-full w-12 h-12 bg-white text-slate-900 hover:bg-blue-50" onClick={() => downloadImage(img)}>
                          <Download className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-500 text-white border-none px-4 py-1.5 rounded-full font-bold shadow-lg shadow-blue-500/20">PHONG CÁCH {idx + 1}</Badge>
                      <Button size="sm" variant="ghost" className="h-9 text-slate-400 hover:text-white hover:bg-white/5 rounded-full px-4" onClick={() => downloadImage(img)}>
                        <Download className="w-4 h-4 mr-2" />
                        TẢI XUỐNG
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Command Bar (Floating Prompt Area) */}
          <motion.div 
            initial={false}
            animate={{ 
              y: isPromptBarVisible ? 0 : 390,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-50"
          >
            <div className="relative">
              {/* Toggle Button - Fixed Arrow Logic & Visibility */}
              <button 
                onClick={() => setIsPromptBarVisible(!isPromptBarVisible)}
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#24314d] border border-white/10 rounded-2xl flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-600 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 group"
              >
                <motion.div
                  animate={{ rotate: isPromptBarVisible ? 180 : 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <ChevronRight className="w-8 h-8 rotate-90" />
                </motion.div>
                <div className="absolute -top-10 bg-[#24314d] text-[10px] font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5 shadow-xl">
                  {isPromptBarVisible ? "ẨN THANH CÔNG CỤ" : "HIỆN THANH CÔNG CỤ"}
                </div>
              </button>

              <div className="bg-[#24314d]/90 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] space-y-6">
                {/* Aspect Ratio & Style integrated into Prompt Bar */}
                <div className="flex items-center justify-between gap-8 px-2">
                  <div className="flex-1 space-y-3">
                    <Label className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] ml-1">Tỷ lệ khung hình</Label>
                    <div className="flex gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => setAspectRatio(ratio.value)}
                          className={`px-4 py-2 text-[10px] font-bold rounded-xl border transition-all flex-1 ${
                            aspectRatio === ratio.value 
                              ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                              : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-64 space-y-3">
                    <Label className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] ml-1">Kiểu nghệ thuật</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="bg-white/5 border-white/5 text-white h-9 text-[11px] rounded-xl focus:ring-blue-500/20">
                        <SelectValue placeholder="Chọn kiểu" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2333] border-white/10 text-white">
                        {STYLES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs focus:bg-blue-500 focus:text-white">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex flex-wrap gap-2 justify-center">
                  {["Hoàng hôn", "Studio", "Đường phố", "Vintage", "Minimalist", "Cyberpunk", "Vogue Style", "Cinematic"].map(tag => (
                    <button
                      key={tag}
                      onClick={() => setPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                      className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-blue-500/20 transition-all border border-white/5"
                    >
                      + {tag.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="relative flex items-end gap-4 bg-black/40 rounded-3xl border border-white/5 p-3 focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                  <div className="flex-1 min-h-[56px] flex flex-col">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Nhập mô tả chi tiết để AI kiến tạo ảnh quảng cáo"
                      className="w-full bg-transparent border-none p-4 text-base text-white placeholder:text-slate-600 focus:outline-none resize-none min-h-[56px] max-h-40 font-medium"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 pb-2 pr-2">
                    {prompt && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-12 w-12 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl"
                        onClick={() => setPrompt("")}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-12 w-12 text-blue-400 hover:text-white hover:bg-blue-500 rounded-2xl"
                      onClick={() => setPrompt(prev => prev + ", high-end fashion lighting, cinematic composition, sharp focus, professional color grading")}
                    >
                      <Sparkles className="w-5 h-5" />
                    </Button>
                    <Button 
                      className="h-12 px-8 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "TẠO ẢNH QUẢNG CÁO"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Info */}
          <div className="absolute bottom-8 left-8 flex items-center gap-6 text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-medium">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <span>Hoa Phu AI Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>Stable Release</span>
            </div>
          </div>
        </section>
      </main>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={fullScreenImage} 
                alt="Full Screen Preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(59,130,246,0.2)] border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="flex items-center gap-4">
                <Button 
                  size="lg"
                  variant="secondary" 
                  className="rounded-2xl px-6 bg-white text-slate-900 hover:bg-blue-50 font-bold shadow-xl"
                  onClick={() => setFullScreenImage(null)}
                >
                  <Minimize2 className="w-5 h-5 mr-2" />
                  THOÁT TOÀN MÀN HÌNH
                </Button>
                <Button 
                  size="lg"
                  variant="outline" 
                  className="rounded-2xl px-6 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold backdrop-blur-md"
                  onClick={() => downloadImage(fullScreenImage)}
                >
                  <Download className="w-5 h-5 mr-2" />
                  TẢI XUỐNG
                </Button>
              </div>
              
              <button 
                onClick={() => setFullScreenImage(null)}
                className="absolute -top-12 -right-12 p-3 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadCard({ label, subtext, icon, image, onClick }: { label: string, subtext: string, icon: React.ReactNode, image: string | null, onClick: () => void }) {
  return (
    <Card 
      className={`relative h-52 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all border border-white/5 overflow-hidden group/card ${
        image 
          ? "bg-blue-600/10 border-blue-500/30" 
          : "bg-[#24314d] hover:bg-[#2d3b5e] hover:border-white/10"
      }`}
      onClick={onClick}
    >
      {image ? (
        <>
          <img src={image} alt={label} className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover/card:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
              <ChevronRight className="w-5 h-5" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white uppercase tracking-wide">{label}</p>
              <p className="text-[10px] text-blue-300/70 mt-1">Đã tải lên thành công</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity flex items-end justify-center pb-4">
            <span className="text-[10px] font-bold text-white bg-blue-500 px-3 py-1 rounded-full">THAY ĐỔI ẢNH</span>
          </div>
        </>
      ) : (
        <>
          <div className="text-slate-400 group-hover/card:text-blue-400 transition-colors">{icon}</div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-white tracking-wide">{label}</p>
            <p className="text-[10px] text-slate-500 font-medium">{subtext}</p>
          </div>
          <Button 
            variant="secondary" 
            className="h-8 px-4 bg-[#3d4b66] hover:bg-[#4a5a7a] text-white text-[10px] font-bold rounded-full border border-white/5 transition-all mt-2"
          >
            Hoặc chọn từ thư viện
          </Button>
        </>
      )}
    </Card>
  );
}
