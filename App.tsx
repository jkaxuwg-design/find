
import React, { useState, useEffect, useRef } from 'react';
import { DivinationInput, DivinationResult, Direction, Language, HistoryItem } from './types';
import { calculateDivination } from './services/divinationEngine';
import { storageProvider } from './services/storageEngine';

const translations = {
  zh: {
    title: '都能找',
    itemName: '丢失物品',
    lostLoc: '丢失地点',
    direction: '方位 (选填)',
    timeNow: '刚刚',
    timeHour: '1小时前',
    time12h: '12小时前',
    timeEarlier: '自定义时间',
    timeEarlierSub: '设定精准遗失时间',
    start: '开始寻找',
    liuyaoTitle: '六爻掷金钱',
    clickToToss: '点击掷爻',
    tossCurrent: '第 {n} 次掷金钱',
    analyzing: '正在同步云端天机...',
    summaryTitle: '卦辞总纲',
    locAnalysis: '地点辨析',
    meihua: '梅花易数 · 卦象精解',
    liuyao: '六爻寻真 · 动静契机',
    xlr: '小六壬卦位',
    retry: '再寻天机',
    historyTitle: '寻物档案',
    noHistory: '尚无寻物记录',
    confirm: '确认',
    cancel: '取消',
    itemState: '找回概率',
    shichen: ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'],
    directions: {
      NORTH: '正北', SOUTH: '正南', EAST: '正东', WEST: '正西',
      NORTHEAST: '东北', NORTHWEST: '西北', SOUTHEAST: '东南', SOUTHWEST: '西南',
      CENTER: '中央'
    },
    footer: '万物皆有迹 · 乾坤入袖中',
    error: '丢失物品名称？请以此心共鸣',
    calcError: '服务器连接超时，请重试',
    details: '详情'
  },
  en: {
    title: 'OmniFind',
    itemName: 'Item Name',
    lostLoc: 'Location',
    direction: 'Direction (Optional)',
    timeNow: 'Just now',
    timeHour: '1h ago',
    time12h: '12h ago',
    timeEarlier: 'Custom Time',
    timeEarlierSub: 'Set exact time of loss',
    start: 'FIND NOW',
    liuyaoTitle: 'Six Lines Toss',
    clickToToss: 'TOSS COINS',
    tossCurrent: 'Toss No.{n}',
    analyzing: 'Syncing with Cosmic Cloud...',
    summaryTitle: 'DIVINATION SUMMARY',
    locAnalysis: 'LOCATION ANALYSIS',
    meihua: 'I Ching · Plum Blossom Wisdom',
    liuyao: 'Six Lines · Change and Insight',
    xlr: 'Small Liu Ren Position',
    retry: 'SEARCH AGAIN',
    historyTitle: 'Records',
    noHistory: 'No history found',
    confirm: 'CONFIRM',
    cancel: 'CANCEL',
    itemState: 'Retrieval Chance',
    shichen: ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'],
    directions: {
      NORTH: 'North', SOUTH: 'South', EAST: 'East', WEST: 'West',
      NORTHEAST: 'Northeast', NORTHWEST: 'Northwest', SOUTHEAST: 'Southeast', SOUTHWEST: 'Southwest',
      CENTER: 'Center'
    },
    footer: 'Every object leaves a cosmic trace',
    error: 'What was lost? Focus your mind.',
    calcError: 'Cloud sync failed, please retry',
    details: 'Details'
  }
};

const StandardTaijiIcon = ({ className = "", size = "60" }: { className?: string, size?: string | number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={`${className} rotate-continuous`}>
    <circle cx="50" cy="50" r="47" fill="white" />
    <path d="M 50,3 A 47,47 0 0,1 50,97 A 23.5,23.5 0 0,1 50,50 A 23.5,23.5 0 0,0 50,3 Z" fill="black" />
    <circle cx="50" cy="26.5" r="6.5" fill="black" />
    <circle cx="50" cy="73.5" r="6.5" fill="white" />
  </svg>
);

const BaguaTaijiAnimation = ({ size = 200 }) => {
  const symbols = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
  return (
    <div className="relative flex items-center justify-center mx-auto my-6" style={{ width: size, height: size }}>
      <div className="absolute inset-0 animate-spin-slow">
        {symbols.map((s, i) => (
          <div
            key={i}
            className="absolute text-white/40 text-2xl font-sans"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${size / 2.2}px)`
            }}
          >
            {s}
          </div>
        ))}
      </div>
      <div className="relative z-10 bg-white rounded-full p-1 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
        <StandardTaijiIcon size={size * 0.45} />
      </div>
    </div>
  );
};

const XiaoLiuRenVisualizer = ({ result, lang }: { result: DivinationResult, lang: Language }) => {
  const names = lang === 'zh' ? ['大安', '留连', '速喜', '赤口', '小吉', '空亡'] : ['Peace', 'Delay', 'SwiftJoy', 'Conflict', 'SmallLuck', 'Void'];
  const currentText = lang === 'zh' ? result.xiaoliuren : result.xiaoliurenEn;
  const match = names.find(n => currentText.includes(n));
  return (
    <div className="relative w-24 h-24 mx-auto mb-1 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-white/5" />
      {names.map((name, i) => {
        const rad = ((i * 60 - 90) * Math.PI) / 180;
        const x = 50 + 42 * Math.cos(rad);
        const y = 50 + 42 * Math.sin(rad);
        return (
          <div key={i} className={`absolute transition-all duration-700 px-1 py-0.5 rounded-full text-[7px] font-bold ${match === name ? 'bg-white text-black scale-110 shadow-[0_0_8px_white]' : 'opacity-20 text-white'}`} style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>{name}</div>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    try { return (localStorage.getItem('app_lang') as Language) || 'zh'; } catch { return 'zh'; }
  });
  const t = translations[lang];
  const [showIntro, setShowIntro] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [phase, setPhase] = useState<'idle' | 'liuyao' | 'analyzing' | 'done'>('idle');
  const [formData, setFormData] = useState<DivinationInput>({
    itemName: '', lostLocation: '', direction: Direction.CENTER, lostTime: new Date().toISOString().slice(0, 16)
  });
  const [activeTimePreset, setActiveTimePreset] = useState<string>('now');
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [liuyaoStep, setLiuyaoStep] = useState(0);
  const [liuyaoCoins, setLiuyaoCoins] = useState<boolean[]>([true, true, true]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  
  const itemNameRef = useRef<HTMLInputElement>(null);

  const triggerHaptic = (pattern: VibratePattern = 30) => {
    try { if (typeof window !== 'undefined' && window.navigator?.vibrate) window.navigator.vibrate(pattern); } catch (e) {}
  };

  useEffect(() => {
    storageProvider.getAll().then(setHistory);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('app_lang', lang); } catch (e) {}
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, [lang]);

  const handleToss = () => {
    if (isSpinning || liuyaoStep >= 6) return;
    setIsSpinning(true);
    triggerHaptic([60, 30, 60]);
    setTimeout(() => {
      setLiuyaoCoins([Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]);
      setLiuyaoStep(s => s + 1);
      setIsSpinning(false);
      triggerHaptic(40);
    }, 800);
  };

  const setQuickTime = (hoursAgo: number, presetId: string) => {
    triggerHaptic(20);
    const d = new Date();
    d.setHours(d.getHours() - hoursAgo);
    setFormData(prev => ({ ...prev, lostTime: d.toISOString().slice(0, 16) }));
    setActiveTimePreset(presetId);
  };

  const getShiChen = (isoString: string) => {
    try {
      const h = new Date(isoString).getHours();
      const index = Math.floor(((h + 1) % 24) / 2);
      return t.shichen[index];
    } catch { return ''; }
  };

  const toggleLanguage = () => {
    triggerHaptic(40);
    setLang(prev => (prev === 'zh' ? 'en' : 'zh'));
  };

  useEffect(() => {
    if (liuyaoStep === 6 && !isSpinning && phase === 'liuyao') {
      const timer = setTimeout(async () => {
        setPhase('analyzing');
        try {
          const rawResult = calculateDivination(formData, lang);
          const isYin = (rawResult.probability % 2 === 0);
          const movingYaoIndex = (rawResult.probability % 6) + 1;
          const dirZh = (translations.zh.directions as any)[formData.direction];
          const dirEn = (translations.en.directions as any)[formData.direction];

          const detailZh = `第一步：辨析体用关系\n“体”代表失主，“用”代表丢失物品。当前卦象显示体用和谐，磁场能量在${dirZh}方位形成了稳定的感应。\n\n第二步：观察动爻变化\n当前动爻位于第${movingYaoIndex}爻。此爻动则暗示物品“${isYin ? '入库隐匿' : '破壳而出'}”。物品并非遗失在开阔地带，而是被夹杂在某种${isYin ? '容器、缝隙或重叠的布料' : '具有支撑功能的支架、边缘或挂钩'}中。\n\n第三步：判定物品状态\n寻物建议：莫要盲目远眺，应重点排查视线底部的死角。如果能在今日的“${getShiChen(new Date().toISOString())}”寻觅，成功率最高。`;
          const detailEn = `1. Ti-Yong Relationship Analysis\n"Ti" represents the seeker, while "Yong" represents the lost item. The current hexagram shows harmony between the two, with magnetic energy concentrated in the ${dirEn}.\n\n2. Moving Line Insight\nThe moving line is at position ${movingYaoIndex}. This motion suggests the item is "${isYin ? 'Enclosed' : 'Exposed'}". It is likely not in an open space, but caught within ${isYin ? 'containers, crevices, or overlapping fabrics' : 'supporting structures, shelf edges, or hooks'}.\n\n3. Final Retrieval Advice\nSearch Advice: Do not look far. Focus on blind spots at the lower level of your vision. Searching during the current "${getShiChen(new Date().toISOString())}" period will yield the best results.`;

          const finalResult = {
            ...rawResult,
            liuyao: detailZh.trim(),
            liuyaoEn: detailEn.trim()
          };

          const newItem: HistoryItem = { id: Date.now().toString(), timestamp: Date.now(), input: { ...formData }, result: finalResult };
          await storageProvider.save(newItem);
          const updatedHistory = await storageProvider.getAll();
          
          setHistory(updatedHistory);
          setResult(finalResult);
          setTimeout(() => { setPhase('done'); triggerHaptic([100, 50, 100]); }, 1200);
        } catch (err) {
          console.error("Calculation failed", err);
          setError(t.calcError);
          setPhase('idle');
          setLiuyaoStep(0);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [liuyaoStep, isSpinning, phase, formData, lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName.trim()) {
      setError(t.error);
      setIsShaking(true);
      triggerHaptic([40, 60, 40]);
      itemNameRef.current?.focus();
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setError('');
    triggerHaptic(60);
    setLiuyaoStep(0);
    setPhase('liuyao');
  };

  return (
    <div className={`min-h-screen w-full bg-black text-white ${lang === 'zh' ? 'font-serif' : 'font-sans'} flex flex-col items-center justify-center p-4 overflow-hidden relative`}>
      {showIntro && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="animate-origin-deep flex flex-col items-center">
            <div className="bg-white rounded-full p-2 overflow-hidden mb-4 shadow-[0_0_50px_rgba(255,255,255,0.2)]">
               <StandardTaijiIcon size="120" />
            </div>
            <div className={`tracking-[1em] uppercase opacity-80 text-center mr-[-1em] ${lang === 'zh' ? 'text-2xl font-serif' : 'text-xl font-light'}`}>{t.title}</div>
          </div>
        </div>
      )}

      <div className="fixed top-6 right-6 left-6 z-50 flex justify-between items-center pointer-events-none">
        <button onClick={() => { triggerHaptic(30); setShowHistory(true); }} className="pointer-events-auto p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/15 transition-all backdrop-blur-md">
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={toggleLanguage} className="pointer-events-auto px-5 py-2 border border-white/20 rounded-full text-[10px] tracking-widest hover:bg-white/10 transition-all uppercase font-bold backdrop-blur-md">
          {lang === 'zh' ? 'English' : '中文'}
        </button>
      </div>

      {!showIntro && phase === 'idle' && (
        <div className="z-10 w-full max-w-md animate-fadeIn flex flex-col items-center overflow-y-auto scrollbar-hide py-10">
          <div className="p-1 bg-white rounded-full mb-8 shadow-2xl overflow-hidden animate-spin-slow">
            <StandardTaijiIcon size="80" />
          </div>
          <h1 className={`font-extralight tracking-[0.2em] mb-12 uppercase text-center w-full ${lang === 'zh' ? 'text-6xl' : 'text-4xl'}`}>{t.title}</h1>
          
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
              <input 
                ref={itemNameRef}
                type="text" 
                value={formData.itemName} 
                onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                placeholder={t.itemName}
                className={`w-full bg-transparent border-b border-white/40 py-5 text-center focus:border-white focus:text-white text-white/90 outline-none transition-all placeholder:opacity-40 font-light ${lang === 'zh' ? 'text-4xl' : 'text-3xl'}`}
              />
              {error && <p className="absolute -bottom-8 left-0 right-0 text-white/60 text-[10px] text-center tracking-widest font-bold uppercase">{error}</p>}
            </div>
            
            <div className="bg-white/[0.03] backdrop-blur-lg border border-white/5 rounded-[32px] p-6 space-y-6">
              <input 
                type="text" 
                value={formData.lostLocation} 
                onChange={(e) => setFormData({...formData, lostLocation: e.target.value})}
                onFocus={() => triggerHaptic(10)}
                placeholder={t.lostLoc}
                className="w-full bg-transparent border-b border-white/20 py-2 text-center text-2xl focus:border-white focus:text-white text-white/80 outline-none transition-all placeholder:opacity-30 font-light"
              />
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setQuickTime(0, 'now')} className={`py-4 border border-white/10 rounded-2xl text-[12px] transition-all uppercase font-bold ${activeTimePreset === 'now' ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/60'}`}>{t.timeNow}</button>
                  <button type="button" onClick={() => setQuickTime(1, 'hour')} className={`py-4 border border-white/10 rounded-2xl text-[12px] transition-all uppercase font-bold ${activeTimePreset === 'hour' ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/60'}`}>{t.timeHour}</button>
                  <button type="button" onClick={() => setQuickTime(12, '12h')} className={`py-4 border border-white/10 rounded-2xl text-[12px] transition-all uppercase font-bold ${activeTimePreset === '12h' ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/60'}`}>{t.time12h}</button>
                  <button type="button" onClick={() => { triggerHaptic(40); setShowTimePicker(true); }} className={`flex flex-col items-center justify-center py-2 border border-white/10 rounded-2xl transition-all uppercase font-bold ${activeTimePreset === 'custom' ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-white/60'}`}>
                    <span className="text-[10px]">{t.timeEarlier}</span>
                    <span className="text-[7px] opacity-60 tracking-normal normal-case">{activeTimePreset === 'custom' ? formData.lostTime.replace('T', ' ') : t.timeEarlierSub}</span>
                  </button>
                </div>
              </div>

              <div className="relative group">
                 <select value={formData.direction} onFocus={() => triggerHaptic(10)} onChange={(e) => { setFormData({...formData, direction: e.target.value}); triggerHaptic(15); }} className="bg-white/5 text-[13px] p-4 w-full rounded-2xl outline-none appearance-none text-center border border-white/5 group-hover:bg-white/10 transition-all font-bold">
                    {Object.keys(Direction).map(d => <option key={d} value={d} className="bg-zinc-900">{(t.directions as any)[d]}</option>)}
                 </select>
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">▼</div>
              </div>
            </div>
            
            <button type="submit" className="w-full py-7 bg-white text-black rounded-full font-black text-xl tracking-[1.2em] transition-all active:scale-95 shadow-2xl uppercase hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]">
              {t.start}
            </button>
          </form>
        </div>
      )}

      {/* Time Picker Drawer */}
      <div className={`fixed inset-0 z-[150] transition-all duration-500 ${showTimePicker ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowTimePicker(false)} />
        <div className={`absolute bottom-0 left-0 right-0 p-8 bg-zinc-900 border-t border-white/10 rounded-t-[40px] transition-transform duration-500 transform ${showTimePicker ? 'translate-y-0' : 'translate-y-full'} max-h-[92vh] overflow-y-auto scrollbar-hide`}>
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
          <h3 className="text-center text-xs tracking-[0.5em] uppercase font-bold text-white/40 mb-10">{t.timeEarlierSub}</h3>
          
          <div className="space-y-8 px-4 pb-24 text-center">
             <div className="relative">
                <input 
                  type="datetime-local" 
                  value={formData.lostTime}
                  onChange={(e) => setFormData({...formData, lostTime: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 p-6 rounded-3xl text-xl text-center outline-none focus:border-white/50 transition-all text-white"
                  style={{ colorScheme: 'dark' }}
                />
                <div className="mt-8">
                   <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-2">{lang === 'zh' ? '当前时辰' : 'CURRENT TIME PERIOD'}</span>
                   <span className="text-3xl font-light text-white glow-white tracking-widest uppercase">{getShiChen(formData.lostTime)}</span>
                </div>
             </div>
             <div className="flex gap-4 pt-6">
                <button onClick={() => setShowTimePicker(false)} className="flex-1 py-5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest bg-white/5 text-white/60 active:scale-95 transition-all">{t.cancel}</button>
                <button onClick={() => { setActiveTimePreset('custom'); setShowTimePicker(false); triggerHaptic(60); }} className="flex-1 py-5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all">{t.confirm}</button>
             </div>
          </div>
        </div>
      </div>

      {phase === 'liuyao' && (
        <div className="z-10 w-full max-w-md animate-fadeIn flex flex-col items-center justify-around h-[80vh]">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-light tracking-widest uppercase text-white/90">{t.liuyaoTitle}</h2>
            <div className="px-8 py-2 border border-white/20 bg-white/5 rounded-full text-xs font-bold uppercase tracking-widest text-white/60">{liuyaoStep}/6</div>
          </div>
          <div className="flex space-x-6 h-32 items-center">
            {liuyaoCoins.map((isHeads, i) => (
              <div key={i} className={`w-28 h-28 rounded-full transition-all duration-[800ms] preserve-3d ${isSpinning ? 'animate-coin-toss' : (isHeads ? 'rotate-y-0' : 'rotate-y-180')}`}>
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-[#A6894B] via-[#7D6635] to-[#4D3F21] rounded-full flex items-center justify-center border-2 border-[#A6894B]/30 shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                   <div className="w-10 h-10 bg-black/90 rounded-sm" />
                </div>
                <div className="absolute inset-0 rotate-y-180 backface-hidden bg-gradient-to-br from-[#222] via-[#111] to-[#000] rounded-full flex items-center justify-center border-2 border-white/5 shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                   <div className="w-10 h-10 bg-black/95 rounded-sm border border-white/5" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleToss} disabled={isSpinning || liuyaoStep >= 6} className="w-56 h-56 rounded-full border border-white/10 flex flex-col items-center justify-center hover:border-white/30 transition-all active:scale-95 group bg-white/[0.02]">
            <span className="text-2xl font-black tracking-widest text-white/60 group-hover:text-white uppercase">{liuyaoStep >= 6 ? '✓' : t.clickToToss}</span>
            <div className="mt-2 text-[10px] opacity-40 uppercase font-bold">{liuyaoStep < 6 && t.tossCurrent.replace('{n}', (liuyaoStep+1).toString())}</div>
          </button>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="z-50 fixed inset-0 bg-black flex flex-col items-center justify-center space-y-12">
          <div className="relative w-56 h-56">
            <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full scale-50 shadow-[0_0_30px_white] overflow-hidden"><StandardTaijiIcon size="120" /></div>
          </div>
          <p className="text-2xl font-light tracking-[0.4em] animate-pulse uppercase text-white/60 text-center px-4">{t.analyzing}</p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="z-10 w-full max-w-2xl animate-revealResult space-y-4 overflow-y-auto max-h-[96vh] pb-40 scrollbar-hide pt-16 px-2">
          <BaguaTaijiAnimation size={180} />
          <div className="bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-[9px] tracking-[1.2em] opacity-30 uppercase font-black block mb-4">{t.summaryTitle}</span>
            <h2 className={`font-extralight leading-tight mb-8 tracking-tight ${lang === 'zh' ? 'text-3xl font-serif' : 'text-2xl font-sans'}`}>{lang === 'zh' ? result.summary : result.summaryEn}</h2>
            <div className="max-w-xs mx-auto space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{t.itemState}</span>
                <span className="text-3xl font-light text-white">{result.probability}%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden p-[0.5px] border border-white/10 shadow-inner">
                <div className="h-full bg-white transition-all duration-[2000ms] ease-out rounded-full shadow-[0_0_15px_white]" style={{ width: `${result.probability}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-white/[0.04] backdrop-blur-xl border border-white/5 rounded-2xl p-6 text-center shadow-lg">
                <span className="text-[8px] tracking-[0.2em] font-black uppercase text-white/20 block mb-3">{t.locAnalysis}</span>
                <p className={`font-light leading-relaxed opacity-70 ${lang === 'zh' ? 'text-[12px]' : 'text-[11px]'}`}>{lang === 'zh' ? result.locationAnalysis : result.locationAnalysisEn}</p>
             </div>
             <div className="bg-white/[0.04] backdrop-blur-xl border border-white/5 rounded-2xl p-4 text-center shadow-lg">
                <span className="text-[8px] tracking-[0.2em] font-black uppercase text-white/20 block mb-3">{t.xlr}</span>
                <XiaoLiuRenVisualizer result={result} lang={lang} />
                <p className="text-[10px] font-bold tracking-wide text-white/60 uppercase">{lang === 'zh' ? result.xiaoliuren.split('\n')[0] : result.xiaoliurenEn.split('\n')[0]}</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="border border-white/10 rounded-[32px] overflow-hidden bg-white/[0.06] backdrop-blur-xl p-8 shadow-2xl">
                <span className="text-[9px] tracking-[0.4em] font-black uppercase text-white/40 mb-5 block">{t.meihua}</span>
                <div className={`leading-relaxed text-white font-light italic whitespace-pre-line tracking-wide ${lang === 'zh' ? 'text-sm' : 'text-xs'}`}>
                   {lang === 'zh' ? result.meihua : result.meihuaEn}
                </div>
             </div>
             <div className="border border-white/5 rounded-[32px] overflow-hidden bg-white/[0.02] backdrop-blur-xl p-8 shadow-lg opacity-80">
                <span className="text-[9px] tracking-[0.4em] font-black uppercase text-white/30 mb-5 block">{t.liuyao}</span>
                <div className={`leading-relaxed text-white/80 italic whitespace-pre-line font-light tracking-wide ${lang === 'zh' ? 'text-sm' : 'text-xs'}`}>
                   {lang === 'zh' ? result.liuyao : result.liuyaoEn}
                </div>
             </div>
          </div>

          <div className="flex flex-col space-y-8 items-center pt-8 pb-12">
             <button onClick={() => { triggerHaptic(40); setPhase('idle'); setResult(null); setLiuyaoStep(0); }} className="px-14 py-5 bg-white text-black rounded-full text-xs font-bold tracking-[1em] uppercase hover:scale-105 transition-all shadow-xl active:scale-95">
                {t.retry}
             </button>
             <footer className="text-[10px] opacity-20 tracking-[1em] uppercase font-bold text-center w-full px-4">{t.footer}</footer>
          </div>
        </div>
      )}

      {/* History Drawer */}
      <div className={`fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl transition-all duration-700 ${showHistory ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute right-0 h-full w-full max-w-md bg-zinc-950 border-l border-white/5 p-8 flex flex-col transition-transform duration-500 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-12">
            <h3 className={`font-extralight tracking-widest uppercase ${lang === 'zh' ? 'text-2xl font-serif' : 'text-xl font-sans'}`}>{t.historyTitle}</h3>
            <button onClick={() => setShowHistory(false)} className="p-3 bg-white/5 rounded-full opacity-50 hover:opacity-100 transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6L18 18" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {history.length === 0 ? <p className="text-center opacity-20 mt-20 italic uppercase tracking-widest">{t.noHistory}</p> : history.map(item => (
              <div key={item.id} onClick={() => { triggerHaptic(40); setResult(item.result); setFormData(item.input); setPhase('done'); setShowHistory(false); }} className="p-6 border border-white/5 bg-white/[0.02] rounded-[24px] hover:bg-white/5 transition-all cursor-pointer group active:scale-98 relative">
                 <div className={`font-light text-white/90 group-hover:text-white transition-colors ${lang === 'zh' ? 'text-lg font-serif' : 'text-md font-sans'}`}>{item.input.itemName}</div>
                 <div className="text-[9px] opacity-30 mt-3 uppercase tracking-widest flex justify-between">
                   <span>{new Date(item.timestamp).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</span>
                   <span className="opacity-0 group-hover:opacity-100 transition-opacity">{t.details} →</span>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .rotate-continuous { animation: spin 20s linear infinite; }
        .animate-spin-slow { animation: spin 30s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .glow-white { filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        @keyframes revealResult { from { opacity: 0; filter: blur(40px); transform: translateY(80px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
        .animate-revealResult { animation: revealResult 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
        @keyframes coin-toss {
          0% { transform: translateY(0) rotateX(0) rotateY(0) scale(1); }
          50% { transform: translateY(-160px) rotateX(720deg) rotateY(1080deg) scale(1.2); }
          100% { transform: translateY(0) rotateX(1440deg) rotateY(2160deg) scale(1); }
        }
        .animate-coin-toss { animation: coin-toss 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
      `}</style>
    </div>
  );
};

export default App;
