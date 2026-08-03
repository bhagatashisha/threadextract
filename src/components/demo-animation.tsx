"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function DemoAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),   // Move to Dashboard Connect
      setTimeout(() => setStep(2), 3000),   // Click -> Load Slack OAuth
      setTimeout(() => setStep(3), 4500),   // Move to Slack Allow
      setTimeout(() => setStep(4), 6000),   // Click -> Load Settings
      setTimeout(() => setStep(5), 7500),   // Move to Connect Notion
      setTimeout(() => setStep(6), 9000),   // Click -> Load Notion OAuth 1
      setTimeout(() => setStep(7), 10500),  // Move to Select Pages
      setTimeout(() => setStep(8), 12000),  // Click -> Load Notion OAuth 2
      setTimeout(() => setStep(9), 13500),  // Move to Allow Access
      setTimeout(() => setStep(10), 15000), // Click -> Load Settings (Connected)
      setTimeout(() => setStep(11), 18000), // Load Slack App
      setTimeout(() => setStep(12), 20000), // Move to Brain Emoji
      setTimeout(() => setStep(13), 21500), // Click Brain Emoji
      setTimeout(() => setStep(14), 23000), // Bot Replies
      setTimeout(() => setStep(15), 26000), // Slide to Notion App
      setTimeout(() => setStep(16), 28000), // Row populates
      setTimeout(() => setStep(17), 31000), // Cursor to new row
      setTimeout(() => setStep(18), 32500), // Click row -> open page
      setTimeout(() => setStep(0), 40000),  // Reset
    ];
    return () => timers.forEach(clearTimeout);
  }, [step === 0]);

  // Click animation effect
  const isClicking = [2, 4, 6, 8, 10, 13, 18].includes(step);

  const CAPTIONS: Record<number, string> = {
    0: "Welcome to ThreadExtract. First, connect your Slack workspace.",
    1: "Welcome to ThreadExtract. First, connect your Slack workspace.",
    2: "Authorize ThreadExtract to read messages from your Slack channels.",
    3: "Authorize ThreadExtract to read messages from your Slack channels.",
    4: "Next, connect your Notion account to sync extracted threads.",
    5: "Next, connect your Notion account to sync extracted threads.",
    6: "Select the specific Notion pages where threads will be saved.",
    7: "Select the specific Notion pages where threads will be saved.",
    8: "Authorize ThreadExtract to edit your selected Notion pages.",
    9: "Authorize ThreadExtract to edit your selected Notion pages.",
    10: "Your integration is complete! A new database is automatically created.",
    11: "Now, whenever a solution is found in Slack...",
    12: "...just react with the 🧠 emoji.",
    13: "...just react with the 🧠 emoji.",
    14: "ThreadExtract instantly processes the thread and confirms extraction.",
    15: "The clean, formatted solution is perfectly synced to your Notion database.",
    16: "The clean, formatted solution is perfectly synced to your Notion database.",
    17: "The clean, formatted solution is perfectly synced to your Notion database.",
    18: "The problem and solution are clearly documented for your entire team.",
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto h-[550px] bg-[#1e1e2e] rounded-xl overflow-hidden shadow-2xl flex border border-slate-800 text-left text-slate-800">
      
      {/* CAPTIONS */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium shadow-2xl text-center min-w-[320px] max-w-[80%] text-sm border border-slate-700">
         {CAPTIONS[step]}
      </div>
      
      {/* ========================================== */}
      {/* PHASE 1: Dashboard UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex flex-col bg-white z-10"
        initial={{ opacity: 1 }}
        animate={{ opacity: step < 2 ? 1 : 0, pointerEvents: step < 2 ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-14 border-b flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="w-6 h-6 rounded bg-gradient-to-br from-[#10b981] to-[#3b82f6] text-white flex items-center justify-center text-xs">K</span>
            ThreadExtract
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span className="font-medium text-slate-900">Dashboard</span>
            <span>Settings</span>
            <span>Billing</span>
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold ml-2">G</span>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
           <div className="w-[480px] bg-white rounded-xl shadow-sm border p-10 flex flex-col items-center text-center">
             <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <span className="text-xl">✨</span>
             </div>
             <h2 className="text-xl font-bold mb-3">No workspace connected</h2>
             <p className="text-slate-500 mb-8 text-sm leading-relaxed">Install ThreadExtract in your Slack workspace to start turning threads into Notion docs.</p>
             <button className="bg-[#10b981] hover:bg-[#0ea5e9] bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
               Connect to Slack
             </button>
           </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 2: Slack OAuth UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex flex-col bg-white z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: (step >= 2 && step < 4) ? 1 : 0, pointerEvents: (step >= 2 && step < 4) ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-16 border-b flex items-center px-6 shrink-0">
          <div className="font-bold text-xl flex items-center gap-1">
             <span className="text-[#E01E5A]">#</span> slack
          </div>
        </div>
        <div className="flex-1 flex p-12 max-w-4xl mx-auto w-full gap-16 items-start">
           <div className="flex-1 flex flex-col items-center text-center pt-8">
             <div className="w-16 h-16 bg-gradient-to-br from-[#10b981] to-[#3b82f6] rounded-xl flex items-center justify-center text-white text-3xl font-bold mb-6 shadow-md border-4 border-white">
               K
             </div>
             <h1 className="text-2xl font-bold mb-2">Allow the &quot;ThreadExtract&quot; app to access Slack</h1>
             <p className="text-slate-500 text-sm mb-6">This app was created by a member of your workspace, Korrali.</p>
             <div className="w-full max-w-[280px] border rounded-md p-2 flex justify-between items-center bg-slate-50 text-sm font-medium">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-orange-400 rounded-sm"></div> Korrali
                </div>
                <span className="text-xs text-slate-400">▼</span>
             </div>
           </div>
           <div className="flex-1 pt-8">
              <h2 className="font-bold mb-6">Review app permissions</h2>
              
              <div className="bg-slate-50 rounded-lg p-5 mb-6">
                 <h3 className="font-medium text-sm mb-4">Information &quot;ThreadExtract&quot; can view</h3>
                 <div className="flex items-start gap-3 text-sm text-slate-600 border-b pb-4 mb-4">
                    <span className="mt-1">💬</span>
                    <div>Content and info about channels & conversations</div>
                    <span className="ml-auto">▶</span>
                 </div>
                 <h3 className="font-medium text-sm mb-4 mt-6">Actions &quot;ThreadExtract&quot; can take</h3>
                 <div className="flex items-start gap-3 text-sm text-slate-600">
                    <span className="mt-1">⚡</span>
                    <div>Perform actions in channels & conversations</div>
                    <span className="ml-auto">▶</span>
                 </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button className="px-4 py-2 border rounded font-medium text-sm">Cancel</button>
                <button className="px-6 py-2 bg-[#007a5a] text-white rounded font-bold text-sm">Allow</button>
              </div>
           </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 3 & 5.5: Settings UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex flex-col bg-slate-50 z-10 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: ((step >= 4 && step < 6) || step === 10) ? 1 : 0, pointerEvents: ((step >= 4 && step < 6) || step === 10) ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-14 border-b flex items-center px-6 justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="w-6 h-6 rounded bg-gradient-to-br from-[#10b981] to-[#3b82f6] text-white flex items-center justify-center text-xs">K</span>
            ThreadExtract
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <span>Dashboard</span>
            <span className="font-medium text-slate-900">Settings</span>
            <span>Billing</span>
            <span className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold ml-2">G</span>
          </div>
        </div>
        <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
           <h1 className="text-2xl font-bold mb-1">Settings</h1>
           <p className="text-slate-500 text-sm mb-8">Configure your workspace integrations and preferences.</p>
           
           <div className="bg-white border rounded-xl p-8 mb-6 shadow-sm">
              <h2 className="font-bold mb-1">Notion configuration</h2>
              <p className="text-slate-500 text-sm mb-8">Connect Notion to automatically sync your extracted Slack threads.</p>
              
              {step === 10 ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 font-medium text-sm mb-6">
                    <div className="flex items-center gap-2"><span>✅</span> Connected to Notion</div>
                    <span className="text-red-500 cursor-pointer">Disconnect</span>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 p-3 text-xs font-medium text-slate-500 border-b">Destination Database</div>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span>⊞</span> Extracted Slack Threads
                      </div>
                      <span className="text-blue-500 text-xs font-semibold cursor-pointer">Open in Notion ↗</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center max-w-md mx-auto">
                   <p className="text-sm text-slate-600 mb-6">Connect your Notion account and we will automatically set up an <strong>Extracted Slack Threads</strong> database for you.</p>
                   <button className="bg-black text-white px-6 py-2.5 rounded-md font-medium text-sm">Connect Notion</button>
                </div>
              )}
           </div>

           <div className="bg-white border rounded-xl p-8 shadow-sm">
              <h2 className="font-bold mb-1">Extraction triggers</h2>
              <p className="text-slate-500 text-sm mb-6">Select which Slack emojis should trigger extraction.</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                 <div className="border border-blue-500 bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                    <input type="checkbox" checked readOnly className="rounded border-slate-300" />
                    <span className="text-sm font-medium flex items-center gap-1">🧠 brain</span>
                 </div>
                 <div className="border rounded-lg p-3 flex items-center gap-3 opacity-60">
                    <input type="checkbox" readOnly className="rounded border-slate-300" />
                    <span className="text-sm font-medium flex items-center gap-1">📌 pushpin</span>
                 </div>
                 <div className="border rounded-lg p-3 flex items-center gap-3 opacity-60">
                    <input type="checkbox" readOnly className="rounded border-slate-300" />
                    <span className="text-sm font-medium flex items-center gap-1">✅ check</span>
                 </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 4: Notion OAuth 1 UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex flex-col bg-slate-50 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: (step >= 6 && step < 8) ? 1 : 0, pointerEvents: (step >= 6 && step < 8) ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-1 flex items-center justify-center p-8">
           <div className="w-[420px] bg-white rounded-xl shadow-xl border p-8 flex flex-col items-center relative">
             <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-xl" />
             <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mb-6 text-xl font-bold text-slate-500 border">T</div>
             <div className="text-sm text-slate-500 mb-1">Connect with</div>
             <h2 className="text-xl font-bold mb-6">ThreadExtract OAuth</h2>
             
             <div className="w-full text-left mb-6">
               <label className="text-xs font-semibold text-slate-500 mb-2 block">Select workspace</label>
               <div className="border rounded p-3 flex items-center gap-3 bg-white">
                  <div className="w-8 h-8 bg-orange-100 rounded text-xl flex items-center justify-center">💼</div>
                  <div>
                     <div className="text-sm font-bold">Korrali</div>
                     <div className="text-xs text-slate-500">Workspace</div>
                  </div>
                  <div className="ml-auto text-xs text-slate-400">▼</div>
               </div>
             </div>

             <div className="w-full text-left mb-6 border rounded-lg p-4 bg-slate-50">
               <div className="text-xs font-medium text-slate-500 mb-3">ThreadExtract OAuth already has the following permissions</div>
               <div className="flex flex-col gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2"><span className="text-blue-500">✓</span> View pages you select</div>
                  <div className="flex items-center gap-2"><span className="text-blue-500">✓</span> Edit pages you select</div>
                  <div className="flex items-center gap-2"><span className="text-blue-500">✓</span> Create new content</div>
               </div>
             </div>

             <button className="w-full bg-[#2383e2] text-white rounded font-semibold py-2.5 text-sm mb-3">Select pages to access</button>
             <button className="w-full border rounded font-semibold py-2.5 text-sm">Cancel</button>
           </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 5: Notion OAuth 2 UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex flex-col bg-slate-50 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: (step >= 8 && step < 10) ? 1 : 0, pointerEvents: (step >= 8 && step < 10) ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex-1 flex items-center justify-center p-8">
           <div className="w-[420px] bg-white rounded-xl shadow-xl border p-8 flex flex-col items-center relative">
             <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-xl" />
             <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center mb-6 text-xl font-bold text-slate-500 border">T</div>
             <div className="text-sm text-slate-500 mb-1">Connect with</div>
             <h2 className="text-xl font-bold mb-6">ThreadExtract OAuth</h2>
             
             <div className="w-full text-left mb-6">
               <div className="text-xs font-medium text-slate-500 mb-2">Allow <strong>ThreadExtract OAuth</strong> to access the following pages</div>
               <div className="border rounded-lg bg-slate-50 p-2">
                  <div className="flex items-center gap-2 p-2 text-sm font-semibold border-b">
                     💼 Korrali
                  </div>
                  <div className="flex items-center justify-between p-2 text-sm text-slate-700 hover:bg-slate-100 rounded">
                     <div className="flex items-center gap-2">🏠 Korrali&apos;s HQ</div>
                     <span className="text-slate-400">🗑️</span>
                  </div>
                  <div className="flex items-center justify-between p-2 text-sm text-slate-700 hover:bg-slate-100 rounded">
                     <div className="flex items-center gap-2">📄 Extracted Threads</div>
                     <span className="text-slate-400">🗑️</span>
                  </div>
                  <div className="flex items-center justify-between p-2 text-sm text-slate-700 hover:bg-slate-100 rounded">
                     <div className="flex items-center gap-2">📘 Docs</div>
                     <span className="text-slate-400">🗑️</span>
                  </div>
               </div>
             </div>

             <button className="w-full bg-[#2383e2] text-white rounded font-semibold py-2.5 text-sm mb-3">Allow access</button>
             <button className="w-full border rounded font-semibold py-2.5 text-sm">Back</button>
           </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 6: Slack App UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex bg-white origin-left z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: (step >= 11 && step < 15) ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Slack Far-Left Bar */}
        <div className="w-[72px] bg-[#350d36] flex flex-col items-center py-4 gap-4 shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white font-bold text-lg">K</div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex flex-col items-center justify-center text-white/70">
            <span className="text-xl leading-none">⌂</span>
          </div>
        </div>

        {/* Slack Sidebar */}
        <div className="w-60 bg-[#3F0E40] flex flex-col p-4 text-[#CFC3CF] shrink-0 border-r border-[#611f62]">
          <div className="font-bold text-white mb-6 text-lg flex items-center justify-between">
            Korrali
            <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[10px]">▼</span>
          </div>
          
          <div className="text-sm font-medium mb-1 mt-4">Channels</div>
          <div className="text-sm py-1 px-2 rounded -mx-2 hover:bg-[#350d36]"># general</div>
          <div className="text-sm py-1 px-2 rounded -mx-2 bg-[#1164A3] text-white font-medium"># all-korrali</div>
          <div className="text-sm py-1 px-2 rounded -mx-2 hover:bg-[#350d36]"># engineering</div>

          <div className="text-sm font-medium mb-1 mt-6">Apps</div>
          <div className="text-sm py-1 px-2 rounded -mx-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span> ThreadExtract
          </div>
        </div>
        
        {/* Slack Middle Pane (Channel) */}
        <div className="w-72 border-r border-slate-200 flex flex-col bg-white shrink-0">
          <div className="h-14 border-b border-slate-200 flex items-center px-4 font-bold text-slate-800">
            # all-korrali
          </div>
          <div className="p-4 flex flex-col gap-4">
             {/* Target message */}
             <div className="flex gap-3 bg-blue-50/50 p-2 -mx-2 rounded-lg border border-blue-100">
               <div className="w-8 h-8 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">A</div>
               <div>
                 <div className="font-bold text-slate-900 text-sm">Alice <span className="text-[10px] font-normal text-slate-500">10:30 AM</span></div>
                 <p className="text-slate-800 text-xs mt-0.5 font-medium">Production API is returning 503 errors on /api/users endpoint since 10:30 AM</p>
                 <div className="text-blue-600 text-xs font-medium mt-1">4 replies</div>
               </div>
             </div>
          </div>
        </div>

        {/* Slack Right Pane (Thread) */}
        <div className="flex-1 flex flex-col bg-white relative">
          <div className="h-14 border-b border-slate-200 flex items-center px-6 font-bold text-slate-800 justify-between">
            <span>Thread</span>
            <span className="text-slate-400 font-normal"># all-korrali</span>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-hidden bg-white">
             
             {/* Target Message in Thread */}
             <div className="flex gap-4 group relative">
               <div className="w-10 h-10 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shrink-0">A</div>
               <div>
                 <div className="flex items-baseline gap-2">
                   <span className="font-bold text-slate-900">Alice</span>
                   <span className="text-xs text-slate-500">10:30 AM</span>
                 </div>
                 <p className="text-slate-800 text-sm mt-0.5 leading-relaxed">Production API is experiencing a spike in 502 errors due to ConnectionTimeout when trying to reach the Redis cache.</p>
               </div>
               
               {/* Simulated Hover Reaction Bar */}
               <motion.div 
                 className="absolute -top-3 left-[320px] bg-white border border-slate-200 shadow-sm rounded-full px-2 py-1 flex gap-1 z-10"
                 initial={{ opacity: 0, y: 5 }}
                 animate={{ opacity: step >= 12 && step < 15 ? 1 : 0, y: step >= 12 ? 0 : 5 }}
               >
                 <span className="text-sm hover:bg-slate-100 rounded px-1 cursor-default bg-slate-100">🧠</span>
                 <span className="text-sm hover:bg-slate-100 rounded px-1 cursor-default">👀</span>
                 <span className="text-sm hover:bg-slate-100 rounded px-1 cursor-default">✅</span>
               </motion.div>

               {/* Applied Reaction */}
               <motion.div
                  className="absolute -bottom-4 left-14 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 flex items-center gap-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: step >= 13 ? 1 : 0, scale: step >= 13 ? 1 : 0.8 }}
               >
                  <span className="text-xs">🧠</span>
                  <span className="text-[11px] text-blue-600 font-bold">1</span>
               </motion.div>
             </div>

             <div className="border-t border-slate-100 my-2 relative">
               <span className="absolute -top-2.5 left-4 bg-white px-2 text-xs text-slate-400 font-medium">4 replies</span>
             </div>

             {/* Reply 1 */}
             <div className="flex gap-4">
               <div className="w-10 h-10 rounded bg-blue-500 text-white flex items-center justify-center font-bold text-lg shrink-0">B</div>
               <div>
                 <div className="flex items-baseline gap-2">
                   <span className="font-bold text-slate-900">Bob</span>
                   <span className="text-xs text-slate-500">10:32 AM</span>
                 </div>
                 <p className="text-slate-800 text-sm mt-0.5 leading-relaxed">CPU on the Redis cluster is pegged at 99%. The new &apos;Suggested Users&apos; feature is running an uncached KEYS * scan.</p>
               </div>
             </div>

             {/* ThreadExtract Bot Reply */}
             <AnimatePresence>
               {step >= 14 && (
                 <motion.div 
                   className="flex gap-4 bg-emerald-50/50 p-4 -mx-4 rounded-xl border border-emerald-100 mt-2"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                 >
                   <div className="w-10 h-10 rounded bg-gradient-to-br from-[#10b981] to-[#3b82f6] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">TE</div>
                   <div>
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold text-slate-900">ThreadExtract</span>
                       <span className="text-[10px] bg-slate-200 text-slate-600 px-1 rounded uppercase font-bold">APP</span>
                       <span className="text-xs text-slate-500">Just now</span>
                     </div>
                     <p className="text-slate-800 text-sm mt-0.5 leading-relaxed">
                       ✅ <span className="font-semibold text-[#10b981]">Thread extracted successfully!</span> View in Notion.
                     </p>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 7: Notion App UI */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 flex bg-white origin-right z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: step >= 15 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Notion Sidebar */}
        <div className="w-60 bg-[#F7F7F5] flex flex-col py-4 text-[#37352F] shrink-0 border-r border-[#EBEBEA] h-full text-sm">
          <div className="font-bold mb-4 flex items-center gap-2 hover:bg-slate-200/50 p-1 rounded transition-colors cursor-pointer text-sm px-4">
            <div className="w-5 h-5 bg-orange-500 rounded text-white flex items-center justify-center text-xs">K</div>
            Korrali Workspace
          </div>
          
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 py-1 text-slate-600 hover:bg-slate-200/50 rounded px-2 cursor-pointer">
              <span>🏠</span> Home
            </div>
            <div className="flex items-center gap-2 py-1 text-slate-600 hover:bg-slate-200/50 rounded px-2 cursor-pointer">
              <span>🔍</span> Search
            </div>
            <div className="flex items-center gap-2 py-1 text-slate-600 hover:bg-slate-200/50 rounded px-2 cursor-pointer">
              <span>⚙️</span> Settings
            </div>
          </div>

          <div className="px-2">
             <div className="text-xs font-semibold text-slate-400 mb-1 px-2 tracking-wide flex items-center justify-between">
                Teamspaces <span className="text-lg leading-none">+</span>
             </div>
             <div className="py-1 flex items-center gap-2 text-slate-700 hover:bg-[#EBEBEA] rounded px-2 cursor-pointer font-medium">
               <span className="text-[10px]">▼</span> 🏠 Korrali&apos;s HQ
             </div>
             <div className="pl-6">
                <div className="py-1 flex items-center gap-2 text-slate-600 hover:bg-[#EBEBEA] rounded px-2 cursor-pointer">
                  <span>🎯</span> Projects
                </div>
                <div className="py-1 flex items-center gap-2 font-medium bg-[#EBEBEA] rounded px-2 cursor-pointer">
                  <span>📄</span> Extracted Slack Threads
                </div>
                <div className="py-1 flex items-center gap-2 text-slate-600 hover:bg-[#EBEBEA] rounded px-2 cursor-pointer">
                  <span>📘</span> Docs
                </div>
             </div>
          </div>
        </div>

        {/* Notion Main Content */}
        <div className="flex-1 flex flex-col p-12 bg-white overflow-hidden">
          <div className="text-sm text-slate-400 mb-6 flex items-center gap-2">
            <span>🏠 Korrali&apos;s HQ</span> / <span>📄 Extracted Slack Threads</span>
          </div>
          <div className="flex flex-col mb-8">
            <span className="font-bold text-[#37352F] text-4xl tracking-tight">Extracted Slack Threads</span>
          </div>

          <div className="flex items-center gap-4 mb-4 border-b border-[#EBEBEA] pb-2 text-sm font-medium text-slate-600">
             <div className="flex items-center gap-2 border-b-2 border-slate-800 pb-2 -mb-[9px] text-slate-900">
               <span>⊞</span> Default view
             </div>
             <div className="flex items-center gap-2 text-slate-400 ml-auto">
               <span>Filter</span>
               <span>Sort</span>
               <span>🔍</span>
               <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold shadow-sm">New</button>
             </div>
          </div>

          {/* Notion Database Table */}
          <div className="w-full flex flex-col">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 text-sm text-slate-500 py-2 border-b border-[#EBEBEA]">
              <div className="col-span-4 flex items-center gap-1 font-medium hover:bg-slate-100 p-1 -ml-1 rounded cursor-pointer">Aa Name</div>
              <div className="col-span-8 flex items-center gap-1 hover:bg-slate-100 p-1 rounded cursor-pointer">+ Add property</div>
            </div>
            
            {/* Animated New Row */}
            <motion.div
              className="grid grid-cols-12 gap-4 text-sm text-[#37352F] py-2 border-b border-[#EBEBEA] group hover:bg-slate-50 cursor-pointer transition-colors"
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: step >= 16 ? "auto" : 0,
                opacity: step >= 16 ? 1 : 0, 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="col-span-4 font-semibold flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis p-1 -ml-1 rounded">
                <span>📄</span> Redis Connection Timeout
              </div>
              <div className="col-span-8 flex items-center text-slate-500">
                Created just now
              </div>
            </motion.div>

            {/* Existing Rows */}
            <div className="grid grid-cols-12 gap-4 text-sm text-[#37352F] py-2 border-b border-[#EBEBEA] group">
              <div className="col-span-4 font-medium flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis group-hover:bg-slate-50 p-1 -ml-1 rounded">
                <span>📄</span> Production API 503 Errors
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 text-sm text-[#37352F] py-2 border-b border-[#EBEBEA] group">
              <div className="col-span-4 font-medium flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis group-hover:bg-slate-50 p-1 -ml-1 rounded">
                <span>📄</span> Hello Message
              </div>
            </div>
            <div className="grid grid-cols-12 gap-4 text-sm text-[#37352F] py-2 border-b border-[#EBEBEA] group">
              <div className="col-span-4 font-medium flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis group-hover:bg-slate-50 p-1 -ml-1 rounded">
                <span>📄</span> Empty Thread
              </div>
            </div>
          </div>

        </div>
      </motion.div>

      {/* ========================================== */}
      {/* PHASE 8: Notion Page View */}
      {/* ========================================== */}
      <motion.div
        className="absolute inset-0 left-60 flex flex-col bg-white z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: step >= 18 ? 1 : 0, x: step >= 18 ? 0 : 20, pointerEvents: step >= 18 ? 'auto' : 'none' }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-xs text-slate-400 mb-2 flex items-center gap-2 p-8 pb-0">
          <span>🏠 Korrali&apos;s HQ</span> / <span>📄 Extracted Slack Threads</span> / <span>📄 Redis Connection Timeout</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 pt-2">
           <h1 className="text-2xl font-bold text-[#37352F] mb-2">Redis Connection Timeout</h1>
           
           <div className="flex items-center gap-2 text-slate-400 text-xs mb-3 cursor-pointer hover:bg-slate-100 p-1 w-max rounded">
             <span className="text-sm">+</span> Add a property
           </div>

           <div className="border-t border-[#EBEBEA] pt-3 mb-4">
             <div className="text-xs text-slate-500 mb-2">Comments</div>
             <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 shrink-0">
                  <img src="https://i.pravatar.cc/100?img=11" alt="avatar" className="w-full h-full object-cover" />
                </div>
                <span className="text-slate-400 text-xs">Add a comment...</span>
             </div>
           </div>

           <div className="border-t border-[#EBEBEA] pt-4 flex flex-col gap-3 text-[#37352F] text-[13px] leading-relaxed">
             <p className="text-[#0a85d1] underline cursor-pointer mb-1">
               [View Original Slack Thread](https://slack.com/app_redirect?team=T0B68DVA7TR&channel=C0B68DVJVP1&message_ts=1785692777.968409)
             </p>

             <h2 className="text-base font-bold mt-1">The Problem</h2>
             <p>The production API is experiencing a spike in 502 errors due to <code className="bg-slate-100 text-[#eb5757] px-1 rounded text-xs font-mono">ConnectionTimeout</code> when trying to reach the Redis cache, with CPU on the Redis cluster pegged at 99%.</p>

             <h2 className="text-base font-bold mt-2">The Solution</h2>
             <p>The issue was caused by the new &apos;Suggested Users&apos; feature running an uncached <code className="bg-slate-100 text-[#eb5757] px-1 rounded text-xs font-mono">KEYS *</code> scan against Redis every time a user logs in. Disabling the <code className="bg-slate-100 text-[#eb5757] px-1 rounded text-xs font-mono">enable_suggested_users</code> flag in LaunchDarkly resolved the issue. A Jira ticket will be opened to replace the <code className="bg-slate-100 text-[#eb5757] px-1 rounded text-xs font-mono">KEYS *</code> call with a proper <code className="bg-slate-100 text-[#eb5757] px-1 rounded text-xs font-mono">SCAN</code> loop or a different architecture for the suggestions.</p>
           </div>
        </div>
      </motion.div>


      {/* ========================================== */}
      {/* GLOBAL CURSOR */}
      {/* ========================================== */}
      <motion.div
        className="absolute z-50 w-6 h-6 pointer-events-none drop-shadow-2xl top-0 left-0"
        initial={{ x: 600, y: 500, opacity: 0 }}
        animate={{
          x: step === 0 ? 600 : 
             step === 1 ? 512 : // Dashboard connect button
             step === 2 ? 512 : 
             step === 3 ? 810 : // Slack OAuth Allow button
             step === 4 ? 810 : 
             step === 5 ? 512 : // Settings Connect Notion button
             step === 6 ? 512 : 
             step === 7 ? 512 : // Notion OAuth 1 Select pages
             step === 8 ? 512 : 
             step === 9 ? 512 : // Notion OAuth 2 Allow access
             step === 10 ? 512 : 
             step === 11 ? 512 : 
             step === 12 ? 770 : // Slack 🧠 emoji
             step >= 13 && step < 17 ? 770 : 
             step >= 17 ? 400 : 600, // Move to Notion row
          y: step === 0 ? 500 : 
             step === 1 ? 400 : // Dashboard connect button
             step === 2 ? 400 : 
             step === 3 ? 420 : // Slack OAuth Allow button
             step === 4 ? 420 : 
             step === 5 ? 260 : // Settings Connect Notion button
             step === 6 ? 260 : 
             step === 7 ? 360 : // Notion OAuth 1 Select pages
             step === 8 ? 360 : 
             step === 9 ? 420 : // Notion OAuth 2 Allow access
             step === 10 ? 420 : 
             step === 11 ? 420 : 
             step === 12 ? 145 : // Slack 🧠 emoji
             step >= 13 && step < 17 ? 145 : 
             step >= 17 ? 250 : 500, // Move to Notion row
          opacity: step >= 19 ? 0 : (step === 10 || step === 11) ? 0 : (step >= 15 && step < 17) ? 0 : 1, // Hide during Notion phase and Connected settings wait
          scale: isClicking ? 0.85 : 1, // Click effect
        }}
        transition={{
          x: { duration: 0.8, ease: "easeOut" },
          y: { duration: 0.8, ease: "easeOut" },
          scale: { duration: 0.1 },
          opacity: { duration: 0.2 }
        }}
      >
        <svg viewBox="0 0 24 24" fill="white" className="w-full h-full drop-shadow-md">
          <path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.7z" stroke="rgba(0,0,0,0.8)" strokeWidth="1" strokeLinejoin="round"/>
        </svg>
      </motion.div>

    </div>
  );
}
