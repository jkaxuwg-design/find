
import { DivinationInput, DivinationResult, Direction, Language } from '../types';

const XIAO_LIU_REN_NAMES = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];
const XIAO_LIU_REN_NAMES_EN = ['Great Peace', 'Lingering', 'Swift Joy', 'Red Mouth', 'Small Luck', 'Void'];
const GUA_NAMES = ['', '乾天', '兑泽', '离火', '震雷', '巽风', '坎水', '艮山', '坤地'];
const GUA_NAMES_EN = ['', 'Heaven', 'Lake', 'Fire', 'Thunder', 'Wind', 'Water', 'Mountain', 'Earth'];
const GUA_ELEMENTS = ['', '金', '金', '火', '木', '木', '水', '土', '土'];
const GUA_ELEMENTS_EN = ['', 'Metal', 'Metal', 'Fire', 'Wood', 'Wood', 'Water', 'Earth', 'Earth'];

const directionMap: Record<string, { zh: string, en: string, element: string, feature: string, featureEn: string }> = {
  [Direction.NORTH]: { zh: '正北', en: 'North', element: '水', feature: '阴凉、低洼、有水或黑色物体处', featureEn: 'cool, low-lying, watery or black-colored area' },
  [Direction.SOUTH]: { zh: '正南', en: 'South', element: '火', feature: '明亮、高处、燥热、红色或电器旁', featureEn: 'bright, high, hot, red-colored or near electronics' },
  [Direction.EAST]: { zh: '正东', en: 'East', element: '木', feature: '花草、木家具、高大、青绿色物体处', featureEn: 'plants, wooden furniture, tall or green objects' },
  [Direction.WEST]: { zh: '正西', en: 'West', element: '金', feature: '金属、钱柜、白色或坚硬物体旁', featureEn: 'metal, safes, white or hard objects' },
  [Direction.NORTHEAST]: { zh: '东北', en: 'Northeast', element: '土', feature: '墙角、山坡、黄色物体或堆积物处', featureEn: 'corners, slopes, yellow objects or storage piles' },
  [Direction.NORTHWEST]: { zh: '西北', en: 'Northwest', element: '金', feature: '贵重物品旁、圆形或高大建筑内', featureEn: 'near valuables, circular or tall structures' },
  [Direction.SOUTHEAST]: { zh: '东南', en: 'Southeast', element: '木', feature: '风口、过道、细长物体或木艺旁', featureEn: 'breezy spots, corridors, slender objects or woodwork' },
  [Direction.SOUTHWEST]: { zh: '西南', en: 'Southwest', element: '土', feature: '储藏室、低矮、柔软物体 or 布料处', featureEn: 'storage rooms, low-lying areas, soft objects or fabrics' },
  [Direction.CENTER]: { zh: '中央', en: 'Center', element: '土', feature: '屋宅中心、桌几、土石堆旁', featureEn: 'center of the room, tables, or near piles of stones' },
};

export const calculateDivination = (input: DivinationInput, lang: Language): DivinationResult => {
  const { itemName, direction, lostTime, lostLocation } = input;
  const date = new Date(lostTime);
  const hour = date.getHours();
  const diZhiIndex = Math.floor(((hour + 1) % 24) / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const dirObj = directionMap[direction] || directionMap[Direction.CENTER];

  const analyzeLocation = (loc: string) => {
    if (/地铁|车|交通|路|Subway|Car|Bus|Road/.test(loc)) 
      return { element: '金', elementEn: 'Metal', desc: '金能克木，物在动处。', descEn: 'Metal controls Wood. Item is in motion.', feature: '物在金属构件、机械或交通枢纽旁。', featureEn: 'Item is near metal components, machinery, or transit hubs.' };
    if (/朋友|家|酒店|饭店|室内|Home|Hotel|Room/.test(loc)) 
      return { element: '土', elementEn: 'Earth', desc: '土能生金，物在隐蔽。', descEn: 'Earth creates Metal. Item is hidden.', feature: '物在稳固建筑内、墙角或柜底。', featureEn: 'Item is inside stable structures, corners, or under cabinets.' };
    return { element: '火', elementEn: 'Fire', desc: '火能炼金，物在显处。', descEn: 'Fire refines Metal. Item is visible.', feature: '物在明亮、温暖或电器、光照充足处。', featureEn: 'Item is in bright, warm areas or near electronics/light.' };
  };
  const locInfo = analyzeLocation(lostLocation);

  const itemWeight = itemName.length;
  const upperGuaNum = (itemWeight + hour + month) % 8 || 8;
  const lowerGuaNum = (itemWeight + hour + day + month) % 8 || 8;
  const dongYao = (itemWeight + hour + day + month + diZhiIndex + 1) % 6 || 6;

  const tiGuaNum = dongYao > 3 ? lowerGuaNum : upperGuaNum;
  const yongGuaNum = dongYao > 3 ? upperGuaNum : lowerGuaNum;
  const tiElement = GUA_ELEMENTS[tiGuaNum];
  const tiElementEn = GUA_ELEMENTS_EN[tiGuaNum];
  const yongElement = GUA_ELEMENTS[yongGuaNum];

  let prob = 60;
  let meihuaTheory = "";
  let meihuaTheoryEn = "";
  let meihuaPlain = "";
  let meihuaPlainEn = "";

  if (tiElement === yongElement) { 
    meihuaTheory = "体用比和"; 
    meihuaTheoryEn = "Harmonious Essence";
    meihuaPlain = "【白话】寻物大吉。物体与周围环境颜色或性质非常接近，就在你认为最可能的地方。";
    meihuaPlainEn = "Excellent luck. The item matches its surroundings closely, check the most obvious spot.";
    prob = 85; 
  } else if ((tiElement === '金' && yongElement === '木') || (tiElement === '木' && yongElement === '土') || (tiElement === '水' && yongElement === '火')) { 
    meihuaTheory = "体克用"; 
    meihuaTheoryEn = "Dominating Force";
    meihuaPlain = "【白话】虽然寻找有些费劲，但最终能找回。物体可能被盖住了。";
    meihuaPlainEn = "Takes effort but will be found. The item might be covered by something else.";
    prob = 75; 
  } else if ((yongElement === '土' && tiElement === '金') || (yongElement === '水' && tiElement === '木') || (yongElement === '金' && tiElement === '水')) { 
    meihuaTheory = "用生体"; 
    meihuaTheoryEn = "Supporting Flow";
    meihuaPlain = "【白话】易找。甚至会有他人提醒或者在你不经意间发现。";
    meihuaPlainEn = "Easy to find. Someone might assist you, or you will find it unexpectedly.";
    prob = 92; 
  } else { 
    meihuaTheory = "体生用"; 
    meihuaTheoryEn = "Exhausting Energy";
    meihuaPlain = "【白话】寻物波折较多。可能耗费额外精力，结果未必如愿。";
    meihuaPlainEn = "Challenging search. May require significant energy with uncertain results.";
    prob = 45; 
  }

  const xlrIndex = (month + day + (diZhiIndex + 1) - 2) % 6;
  const xlrState = XIAO_LIU_REN_NAMES[xlrIndex];
  const xlrStateEn = XIAO_LIU_REN_NAMES_EN[xlrIndex];
  if (xlrState === '空亡') prob = Math.max(12, prob - 50);
  if (xlrState === '大安') prob = Math.min(98, prob + 10);

  const yaoStatus = (dongYao <= 3) ? "下卦动，物在低处或内室" : "上卦动，物在高处或外围";
  const yaoStatusEn = (dongYao <= 3) ? "Lower line active: Item is low or deep inside" : "Upper line active: Item is high or peripheral";
  const movementEffect = (dongYao % 2 === 0) ? "阴爻动：被遮掩、压在下方" : "阳爻动：物有位移，可能在视野边缘";
  const movementEffectEn = (dongYao % 2 === 0) ? "Yin line: Hidden or underneath" : "Yang line: Displaced or at the edge of sight";

  const meihuaDetail = `【本卦：${GUA_NAMES[upperGuaNum]}${GUA_NAMES[lowerGuaNum]}】
${meihuaTheory} · 此物并未远去。
${meihuaPlain}

【变卦：第${dongYao}爻动】
暗示：${yaoStatus}。${movementEffect}。
建议往${dirObj.zh}方排查${dirObj.feature}。`;

  const meihuaDetailEn = `【Gua: ${GUA_NAMES_EN[upperGuaNum]}${GUA_NAMES_EN[lowerGuaNum]}】
${meihuaTheoryEn} - Not far away.
${meihuaPlainEn}

【Change: Line ${dongYao}】
Insight: ${yaoStatusEn}. ${movementEffectEn}.
Check ${dirObj.en} side near ${dirObj.featureEn}.`;

  const summary = xlrState === '空亡' 
    ? `【空亡】“${itemName}”踪迹全无，恐难寻回。` 
    : `【${xlrState}】“${itemName}”尚在${dirObj.zh}方，速去寻之。`;

  const summaryEn = xlrState === '空亡' 
    ? `[Void] "${itemName}" is elusive, difficult to retrieve.` 
    : `[${xlrStateEn}] "${itemName}" is likely to the ${dirObj.en}. Search promptly.`;

  const liuyaoDetail = `用神落于【${tiElement}】位，动爻${dongYao}。
物品当前呈现“${dongYao % 2 === 0 ? '伏藏' : '显露'}”之相。
【白话】${dongYao % 2 === 0 ? '东西躲起来了，可能掉进了缝隙或衣物下面。' : '东西在显眼处，换个角度看就能发现。'}`;

  const liuyaoDetailEn = `Focus Element: ${tiElementEn}, Change ${dongYao}.
State: ${dongYao % 2 === 0 ? 'Hidden' : 'Visible'}.
Insight: ${dongYao % 2 === 0 ? 'Tucked away in a gap or under fabrics.' : 'In plain sight, look from a different angle.'}`;

  return {
    meihua: meihuaDetail,
    meihuaEn: meihuaDetailEn,
    xiaoliuren: `测得：${xlrState}\n物在${xlrState === '空亡' ? '虚无处' : '近处'}。`,
    xiaoliurenEn: `Result: ${xlrStateEn}\nLocated ${xlrState === '空亡' ? 'far/lost' : 'nearby'}.`,
    liuyao: liuyaoDetail,
    liuyaoEn: liuyaoDetailEn,
    summary,
    summaryEn,
    locationAnalysis: `解析：${locInfo.desc}${locInfo.feature}`,
    locationAnalysisEn: `Analysis: ${locInfo.descEn} ${locInfo.featureEn}`,
    probability: prob
  };
};
