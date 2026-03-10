/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Utensils, Heart, Brain, Activity, Search, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// Types
interface NutritionInfo {
  nutrients: string;
  organImpact: {
    digestive: string;
    circulatory: string;
    nervous: string;
  };
  mealAdvice: string;
  summary: string;
}

const AI_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export default function App() {
  const [step, setStep] = useState<'intro' | 'loading' | 'result'>('intro');
  const [dishName, setDishName] = useState('');
  const [nutritionInfo, setNutritionInfo] = useState<NutritionInfo | null>(null);
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [mascotImage, setMascotImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    const generateMascot = async () => {
      try {
        const response = await ai.models.generateContent({
          model: IMAGE_MODEL,
          contents: {
            parts: [{ text: "A cute 3D little chef mascot, smiling, holding a spoon, wearing a white chef hat, vibrant colors, 3D render, soft clay style, white background, high quality, 4k." }]
          },
          config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setMascotImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (err) {
        console.error("Failed to generate mascot", err);
      }
    };
    generateMascot();
  }, []);

  const analyzeNutrition = async (name: string) => {
    try {
      setStep('loading');
      setError(null);

      // 1. Generate Nutrition Info
      const prompt = `
        Bạn là một chuyên gia dinh dưỡng AI vui vẻ. Hãy phân tích món ăn: "${name}".
        Hãy trả lời bằng ngôn ngữ dễ hiểu, ngắn gọn, vui tươi và xưng 'chuyên gia' - gọi người hỏi là 'các chuyên gia dinh dưỡng nhí'.
        
        Trả về kết quả dưới dạng JSON với cấu trúc sau:
        {
          "nutrients": "Mô tả các nhóm chất/vitamin chính",
          "organImpact": {
            "digestive": "Lợi/hại cho hệ tiêu hóa",
            "circulatory": "Lợi/hại cho hệ tuần hoàn",
            "nervous": "Lợi/hại cho hệ thần kinh"
          },
          "mealAdvice": "Lời khuyên nên ăn vào bữa nào (sáng, trưa, tối) và tại sao",
          "summary": "Một câu tổng kết vui nhộn"
        }
      `;

      const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}') as NutritionInfo;
      setNutritionInfo(data);

      // 2. Generate Chibi Image
      const imageResponse = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: {
          parts: [{ text: `A cute 3D chibi style character illustration of ${name} food, 3D render, soft clay style, vibrant colors, white background, high quality, 4k, digital art.` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setDishImage(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }

      setStep('result');
    } catch (err) {
      console.error(err);
      setError("Ôi không! Chuyên gia gặp chút rắc rối rồi. Thử lại nhé các chuyên gia dinh dưỡng nhí!");
      setStep('intro');
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (dishName.trim()) {
      analyzeNutrition(dishName);
    }
  };

  const reset = () => {
    setStep('intro');
    setDishName('');
    setNutritionInfo(null);
    setDishImage(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-[#4A4A4A] font-sans selection:bg-emerald-100 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100/30 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute top-[20%] right-[-5%] w-[20%] h-[20%] bg-rose-100/20 rounded-full blur-2xl" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center relative z-10"
          >
            {/* Mascot Container */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="relative mb-8"
            >
              <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/10 border-8 border-white overflow-hidden">
                {mascotImage ? (
                  <img src={mascotImage} alt="Mascot Chef" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 text-emerald-200 animate-spin" />
                    <span className="text-xs text-emerald-300 font-medium">Đang gọi đầu bếp...</span>
                  </div>
                )}
              </div>
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 -top-4 p-4 bg-amber-400 rounded-2xl shadow-lg rotate-12"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-emerald-900 drop-shadow-sm"
            >
              Tôi là <span className="text-emerald-500">Chuyên Gia</span> <br className="hidden md:block" /> Dinh Dưỡng AI
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl md:text-2xl text-emerald-800/60 mb-12 max-w-2xl font-medium leading-relaxed"
            >
              Chào mừng các <span className="text-rose-500 font-bold">chuyên gia dinh dưỡng nhí</span>! <br />
              Hôm nay chúng ta sẽ cùng nhau khám phá bí mật của món ăn nào đây?
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onSubmit={handleStart} 
              className="w-full max-w-xl relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-amber-400 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative">
                <input
                  type="text"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Nhập tên món ăn bạn muốn khám phá..."
                  className="w-full px-8 py-6 rounded-[1.8rem] border-2 border-white bg-white/90 backdrop-blur-sm focus:border-emerald-400 focus:ring-8 focus:ring-emerald-50/50 outline-none transition-all text-xl shadow-xl placeholder:text-emerald-200"
                />
                <button
                  type="submit"
                  disabled={!dishName.trim()}
                  className="absolute right-3 top-3 bottom-3 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-emerald-200 disabled:to-emerald-200 text-white rounded-[1.4rem] transition-all flex items-center gap-3 font-bold text-lg shadow-lg active:scale-95"
                >
                  <Search className="w-6 h-6" />
                  Bắt đầu
                </button>
              </div>
            </motion.form>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-rose-500 font-bold bg-rose-50 px-4 py-2 rounded-full"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex flex-col items-center justify-center bg-[#FDFCF0] z-50"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-500 rounded-full"
              />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-500" />
            </div>
            <p className="mt-8 text-xl font-medium text-emerald-800 animate-pulse">
              Chuyên gia đang nghiên cứu món {dishName}...
            </p>
          </motion.div>
        )}

        {step === 'result' && nutritionInfo && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto px-6 py-12"
          >
            <button
              onClick={reset}
              className="mb-8 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay lại
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Side: Image */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-5 flex flex-col items-center"
              >
                <div className="w-full aspect-square bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border-8 border-white overflow-hidden relative group">
                  {dishImage ? (
                    <img
                      src={dishImage}
                      alt={dishName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                      <Loader2 className="w-12 h-12 text-emerald-200 animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h2 className="mt-6 text-3xl font-bold text-emerald-900 capitalize">{dishName}</h2>
              </motion.div>

              {/* Right Side: Info */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-7 space-y-8"
              >
                {/* Nutrients */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <Sparkles className="w-6 h-6 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900">Nhóm chất & Vitamin</h3>
                  </div>
                  <p className="text-lg leading-relaxed text-slate-600">
                    {nutritionInfo.nutrients}
                  </p>
                </section>

                {/* Organs */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-rose-100 rounded-xl">
                      <Heart className="w-6 h-6 text-rose-600" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-900">Tác động đến cơ thể</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold">
                        <Activity className="w-4 h-4" />
                        Tiêu hóa
                      </div>
                      <p className="text-sm text-slate-600">{nutritionInfo.organImpact.digestive}</p>
                    </div>
                    <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-2 mb-2 text-rose-700 font-bold">
                        <Heart className="w-4 h-4" />
                        Tuần hoàn
                      </div>
                      <p className="text-sm text-slate-600">{nutritionInfo.organImpact.circulatory}</p>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold">
                        <Brain className="w-4 h-4" />
                        Thần kinh
                      </div>
                      <p className="text-sm text-slate-600">{nutritionInfo.organImpact.nervous}</p>
                    </div>
                  </div>
                </section>

                {/* Advice */}
                <section className="bg-emerald-600 p-8 rounded-3xl shadow-lg shadow-emerald-900/10 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Utensils className="w-6 h-6" />
                      Lời khuyên từ Chuyên gia
                    </h3>
                    <p className="text-lg leading-relaxed opacity-90 italic">
                      "{nutritionInfo.mealAdvice}"
                    </p>
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <p className="text-xl font-bold">
                        {nutritionInfo.summary}
                      </p>
                    </div>
                  </div>
                  <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
                </section>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
