/* ============================================================
   Lizz · 100 件装扮（全部内联 SVG，无图片、无 CDN）
   - viewBox 统一 0 0 100 100，与小狐狸头部（圆心 50,38 / 半径 21）对齐
   - 描边沿用狐狸的 #4a3b32，配色沿用 #f4b26f / #fffaf2 / #ffd166
   - 50 件配饰（头/面部）+ 50 套衣服（学校 / 日常 / 华丽 / 抽象四条路线）
   - 衣服沿狐狸身体轮廓（肩 57 → 底 92）贴合，不是盖一块矩形
   - 在 84px 的角落尺寸下仍能辨认：每个配件都控制在头部周围
   - 对外：LIZZWORD_LIZZ_ACCESSORIES.items / byId / svgOf / RARITY / ROUTES /
          CATEGORY_LABELS / headFragment / bodyFragment / figureFragment
   ============================================================ */
(function () {
  "use strict";

  const RARITY = {
    common: { key: "common", label: "普通", color: "#5f7188", bg: "#f1f5f9", border: "#dbe3ef" },
    rare: { key: "rare", label: "稀有", color: "#2f55c9", bg: "#eaf1ff", border: "#c9d9ff" },
    epic: { key: "epic", label: "史诗", color: "#7b48d8", bg: "#f3edff", border: "#ddcdfb" },
    legendary: { key: "legendary", label: "传说", color: "#b07800", bg: "#fff6dd", border: "#f3dfa5" }
  };

  const ROUTES = {
    school: "学校",
    daily: "日常",
    glam: "华丽",
    abstract: "抽象"
  };

  const CATEGORY_LABELS = {
    accessory: "配饰",
    outfit: "衣服"
  };

  // 一朵五瓣小花，减少重复代码；颜色成对交替使用
  function blossom(cx, cy, r, petal, core) {
    const petals = [];
    for (let i = 0; i < 5; i += 1) {
      const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      petals.push(
        `<circle cx="${(cx + Math.cos(angle) * r).toFixed(1)}" cy="${(cy + Math.sin(angle) * r).toFixed(1)}" r="${(r * 0.7).toFixed(1)}" fill="${petal}" stroke="#4a3b32" stroke-width="0.6"/>`
      );
    }
    petals.push(`<circle cx="${cx}" cy="${cy}" r="${(r * 0.48).toFixed(1)}" fill="${core}" stroke="#4a3b32" stroke-width="0.7"/>`);
    return petals.join("");
  }

  // 一圈放射状花瓣，用于向日葵一类的大花
  function sunflower(cx, cy, r) {
    let out = "";
    for (let i = 0; i < 8; i += 1) {
      out += `<ellipse cx="${cx}" cy="${(cy - r).toFixed(1)}" rx="${(r * 0.34).toFixed(1)}" ry="${(r * 0.62).toFixed(1)}" fill="#ffd166" stroke="#4a3b32" stroke-width="0.6" transform="rotate(${i * 45} ${cx} ${cy})"/>`;
    }
    out += `<circle cx="${cx}" cy="${cy}" r="${(r * 0.42).toFixed(1)}" fill="#8b5a2b" stroke="#4a3b32" stroke-width="0.7"/>`;
    return out;
  }

  /* 商店缩略图用的简化狐狸头：只保留头、耳朵、眼睛与鼻子，让装扮更突出 */
  const headFragment = `
    <circle cx="50" cy="38" r="21" fill="#f4b26f" stroke="#4a3b32" stroke-width="2"/>
    <path d="M31 24Q27 14 31 4Q38 10 46 19Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
    <path d="M31 18Q29 12 31 8Q35 11 40 15Z" fill="#ffe3cb"/>
    <path d="M65 21Q76 24 79 33Q82 41 78 45Q73 48 70 42Q67 34 68 27Q65 24 65 21Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 26Q75 30 76 36Q77 41 74 41Q70 37 69 30Z" fill="#ffe3cb"/>
    <ellipse cx="50" cy="48" rx="13" ry="9.5" fill="#fff"/>
    <circle cx="41.5" cy="37" r="2.6" fill="#4a3b32"/>
    <circle cx="58.5" cy="37" r="2.6" fill="#4a3b32"/>
    <circle cx="42.4" cy="36.1" r=".9" fill="#fff"/>
    <circle cx="59.4" cy="36.1" r=".9" fill="#fff"/>
    <path d="M47.6 45.5h4.8l-2.4 2.8z" fill="#4a3b32"/>
    <path d="M48.4 50.5q1.6 2.4 3.2 0" fill="none" stroke="#4a3b32" stroke-width="1.5" stroke-linecap="round"/>`;

  /* 商店缩略图用的身体基座：尾巴 + 坐姿身体 + 白肚皮 + 两只脚，与狐狸本体同比例 */
  const bodyFragment = `
    <ellipse cx="50" cy="93" rx="21" ry="3.5" fill="#e3eaf4"/>
    <path d="M59 83c6 9 17 12 25 8 6-3 7-10 3-14-3-3-8-2-8 2 0 3 3 5 6 4" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M40 57c-6 4-8 14-8 23 0 8 7 12 18 12s18-4 18-12c0-9-2-19-8-23z" fill="#f4b26f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
    <path d="M44 66c0 12 2 20 6 20s6-8 6-20c0-5-12-5-12 0z" fill="#fff"/>
    <ellipse cx="41" cy="91" rx="5.5" ry="3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8"/>
    <ellipse cx="59" cy="91" rx="5.5" ry="3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8"/>`;

  const figureFragment = `${bodyFragment}${headFragment}`;

  const items = [
    /* ---------- 普通 · 8 件 ---------- */
    {
      id: "flower-crown",
      name: "花环",
      en: "Flower Crown",
      rarity: "common",
      price: 40,
      hint: "一圈春天的味道，戴上就舍不得摘。",
      svg: `<g>
        <path d="M26 34Q23 22 34 16Q44 10 54 10Q66 12 74 21Q78 29 73 36" fill="none" stroke="#7fb98a" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
        ${blossom(27, 31, 2.9, "#ff9eb5", "#ffe8a3")}
        ${blossom(32, 21, 2.7, "#ffd166", "#fff3c4")}
        ${blossom(40, 13.5, 2.9, "#ffb3c0", "#ffe8a3")}
        ${blossom(49, 9.5, 2.6, "#a8dcc0", "#fff6cf")}
        ${blossom(58.5, 10.5, 2.8, "#ff9eb5", "#fff3c4")}
        ${blossom(66.5, 16, 2.6, "#ffd166", "#ffe8a3")}
        ${blossom(72.5, 24.5, 2.8, "#ffb3c0", "#fff3c4")}
        ${blossom(75, 32.5, 2.5, "#a8dcc0", "#ffe8a3")}
        <path d="M24 35Q19 39 18 44Q21 45 24 42" fill="#9ed4a8" stroke="#4a3b32" stroke-width="1.1" stroke-linejoin="round"/>
      </g>`
    },
    {
      id: "glasses",
      name: "眼镜",
      en: "Round Glasses",
      rarity: "common",
      price: 45,
      hint: "看起来更有学问了一点点。",
      svg: `<g>
        <circle cx="41.5" cy="37" r="7.2" fill="#dce9ff" fill-opacity=".5" stroke="#4a3b32" stroke-width="1.8"/>
        <circle cx="58.5" cy="37" r="7.2" fill="#dce9ff" fill-opacity=".5" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M48.7 37h2.6" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M34.3 35.2Q30 35.8 28 38.4M65.7 35.2Q70 35.8 72 38.4" fill="none" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M37.6 33.6Q40.5 32 43.6 33" fill="none" stroke="#fff" stroke-width="1.2" opacity=".85"/>
      </g>`
    },
    {
      id: "bow",
      name: "蝴蝶结",
      en: "Pink Bow",
      rarity: "common",
      price: 30,
      hint: "小小一只，扎在头顶右侧。",
      svg: `<g transform="translate(62 17) rotate(10)">
        <path d="M0 0c-6-5-11-2-11 3 0 5 5 8 11 3z" fill="#f07a8a" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M0 0c6-5 11-2 11 3 0 5-5 8-11 3z" fill="#f58f9d" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="3.1" fill="#ffb3c0" stroke="#4a3b32" stroke-width="1.5"/>
        <path d="M-7-1q3 2 6 0" fill="none" stroke="#fff" stroke-width=".9" opacity=".7"/>
      </g>`
    },
    {
      id: "straw-hat",
      name: "草帽",
      en: "Straw Hat",
      rarity: "common",
      price: 50,
      hint: "适合在太阳底下慢慢背单词。",
      svg: `<g>
        <ellipse cx="50" cy="19.5" rx="27" ry="6.2" fill="#f2d08a" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M38 19.5Q39 6 50 5Q61 6 62 19.5Z" fill="#f8e5b6" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M38.5 15Q50 18 61.5 15" fill="none" stroke="#f4b26f" stroke-width="3"/>
        <path d="M42 9.5Q50 12 58 9.5" fill="none" stroke="#e8c887" stroke-width="1" opacity=".8"/>
      </g>`
    },
    {
      id: "scarf",
      name: "围巾",
      en: "Blue Scarf",
      rarity: "common",
      price: 40,
      hint: "脖子暖和了，说话也更大声一点。",
      svg: `<g>
        <path d="M33 55Q50 63 67 55Q69 61 50 66Q31 61 33 55Z" fill="#8ec5ff" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M60 61Q66 67 64 77L57 75Q59 68 55 62Z" fill="#7db8f4" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M57.5 73.5L56 78M60 74.5L58.6 79M62.4 75.2L61 79.6" stroke="#4a3b32" stroke-width="1.1" stroke-linecap="round"/>
        <path d="M36 57.5Q50 62.5 64 57.5" fill="none" stroke="#d6ebff" stroke-width="1.4" opacity=".8"/>
      </g>`
    },
    {
      id: "bell-collar",
      name: "铃铛项圈",
      en: "Bell Collar",
      rarity: "common",
      price: 45,
      hint: "走一步响一下，想藏都藏不住。",
      svg: `<g>
        <path d="M34 55Q50 62 66 55" fill="none" stroke="#e2725b" stroke-width="4.4" stroke-linecap="round"/>
        <circle cx="50" cy="63.5" r="4.4" fill="#ffd166" stroke="#4a3b32" stroke-width="1.6"/>
        <path d="M47.6 62.2h4.8" stroke="#4a3b32" stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="50" cy="66.4" r="1.2" fill="#4a3b32"/>
      </g>`
    },
    {
      id: "headphones",
      name: "耳机",
      en: "Headphones",
      rarity: "common",
      price: 55,
      hint: "背词的时候，世界安静了一点。",
      svg: `<g>
        <path d="M27 37Q28 12 50 12Q72 12 73 37" fill="none" stroke="#6b7fa8" stroke-width="4.2" stroke-linecap="round"/>
        <rect x="23" y="31" width="9" height="16" rx="4.5" fill="#9db4d8" stroke="#4a3b32" stroke-width="1.8"/>
        <rect x="68" y="31" width="9" height="16" rx="4.5" fill="#9db4d8" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M27 35v9M72 35v9" stroke="#fff" stroke-width="1" opacity=".55"/>
      </g>`
    },
    {
      id: "eyepatch",
      name: "眼罩",
      en: "Eyepatch",
      rarity: "common",
      price: 35,
      hint: "只看一只眼睛，也能看清单词。",
      svg: `<g>
        <path d="M31 32Q50 27 70 31" fill="none" stroke="#4a3b32" stroke-width="1.6"/>
        <ellipse cx="58.5" cy="37" rx="7" ry="6" fill="#2f3a4a" stroke="#4a3b32" stroke-width="1.6"/>
        <path d="M55.5 34.6Q58 32.8 61.3 34.4" fill="none" stroke="#8496b8" stroke-width="1.1"/>
        <circle cx="31.5" cy="32.1" r="1.4" fill="#4a3b32"/>
      </g>`
    },

    /* ---------- 稀有 · 6 件 ---------- */
    {
      id: "sunglasses",
      name: "墨镜",
      en: "Sunglasses",
      rarity: "rare",
      price: 80,
      hint: "谁也不许看出我其实很紧张。",
      svg: `<g>
        <path d="M29.5 33.5Q50 30 70.5 33.5" fill="none" stroke="#4a3b32" stroke-width="2"/>
        <rect x="32.5" y="32.6" width="16" height="9" rx="4.2" fill="#2b3242" stroke="#4a3b32" stroke-width="1.8"/>
        <rect x="51.5" y="32.6" width="16" height="9" rx="4.2" fill="#2b3242" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M48.4 36.4h3.2" stroke="#4a3b32" stroke-width="2"/>
        <path d="M36 35.4h6.5M55 35.4h6.5" stroke="#7f93b8" stroke-width="1.1" opacity=".75"/>
        <path d="M31 34.5Q27 35.5 25.5 38.5M69 34.5Q73 35.5 74.5 38.5" fill="none" stroke="#4a3b32" stroke-width="1.4"/>
      </g>`
    },
    {
      id: "mask",
      name: "面具",
      en: "Masquerade Mask",
      rarity: "rare",
      price: 90,
      hint: "遮住半张脸，胆子就大了一点点。",
      svg: `<g>
        <path d="M27 33Q34 28 42 31Q50 34 58 31Q66 28 73 33Q72 43 66 46Q58 49 50 45Q42 49 34 46Q28 43 27 33Z" fill="#b48cf2" fill-opacity=".92" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <ellipse cx="39" cy="36.5" rx="4.6" ry="2.7" fill="#fff3ff" fill-opacity=".55"/>
        <ellipse cx="61" cy="36.5" rx="4.6" ry="2.7" fill="#fff3ff" fill-opacity=".55"/>
        <path d="M73 31Q80 20 75 14Q69 22 72 30Z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M74.5 24Q76.5 20 75.5 17" stroke="#e0a100" stroke-width=".9" fill="none"/>
        <path d="M32 44Q50 49 68 44" fill="none" stroke="#ffd166" stroke-width="1.4"/>
      </g>`
    },
    {
      id: "beret",
      name: "贝雷帽",
      en: "Beret",
      rarity: "rare",
      price: 75,
      hint: "斜着戴，才有一点艺术家的样子。",
      svg: `<g transform="rotate(-10 48 16)">
        <ellipse cx="48" cy="16" rx="20" ry="7.5" fill="#e2725b" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M35 13Q44 8 58 10" fill="none" stroke="#f3a08c" stroke-width="2"/>
        <circle cx="62" cy="8.5" r="3.2" fill="#e2725b" stroke="#4a3b32" stroke-width="1.5"/>
      </g>`
    },
    {
      id: "cat-ears",
      name: "猫耳",
      en: "Cat Ears",
      rarity: "rare",
      price: 85,
      hint: "喵一声很难，但戴上不难。",
      svg: `<g>
        <path d="M30 17L34 4L46 12Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M33.5 13L35.5 8L40.5 11.5Z" fill="#ffd9e2"/>
        <path d="M70 17L66 4L54 12Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M66.5 13L64.5 8L59.5 11.5Z" fill="#ffd9e2"/>
        <path d="M33 15.5Q38 17 42 14.5M67 15.5Q62 17 58 14.5" fill="none" stroke="#e8975b" stroke-width="1.1"/>
      </g>`
    },
    {
      id: "antlers",
      name: "鹿角",
      en: "Antlers",
      rarity: "rare",
      price: 95,
      hint: "分叉的角，像把小小的树枝顶在头上。",
      svg: `<g stroke="#a9713a" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M40 17Q36 9 28 2"/>
        <path d="M35 10L27 8.5M37 6L31 2.5M33 4.5L28.5 5"/>
        <path d="M60 17Q64 9 72 2"/>
        <path d="M65 10L73 8.5M63 6L69 2.5M67 4.5L71.5 5"/>
        <circle cx="28" cy="2" r="1.8" fill="#d9c39a" stroke="#4a3b32" stroke-width="1"/>
        <circle cx="72" cy="2" r="1.8" fill="#d9c39a" stroke="#4a3b32" stroke-width="1"/>
      </g>`
    },
    {
      id: "monocle",
      name: "单片眼镜",
      en: "Monocle",
      rarity: "rare",
      price: 85,
      hint: "只戴一边，显得很认真。",
      svg: `<g>
        <circle cx="58.5" cy="37" r="8" fill="#fff7d6" fill-opacity=".22" stroke="#d9a441" stroke-width="2.6"/>
        <path d="M66 42Q70 52 73 62" fill="none" stroke="#d9a441" stroke-width="1.7"/>
        <circle cx="73.5" cy="64" r="2" fill="#d9a441" stroke="#4a3b32" stroke-width=".7"/>
        <path d="M54 32.5Q57 30.8 60.5 32" fill="none" stroke="#fff" stroke-width="1.1" opacity=".85"/>
      </g>`
    },

    /* ---------- 史诗 · 4 件 ---------- */
    {
      id: "crown",
      name: "皇冠",
      en: "Crown",
      rarity: "epic",
      price: 150,
      hint: "今天这块角落，归它管。",
      svg: `<g>
        <path d="M34 21L34 12L40 17L50 8L60 17L66 12L66 21Z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M34 21h32v3H34z" fill="#f0c14b" stroke="#4a3b32" stroke-width="1.8"/>
        <circle cx="40" cy="15" r="1.5" fill="#e2725b" stroke="#4a3b32" stroke-width=".6"/>
        <circle cx="50" cy="11.8" r="1.5" fill="#8ec5ff" stroke="#4a3b32" stroke-width=".6"/>
        <circle cx="60" cy="15" r="1.5" fill="#e2725b" stroke="#4a3b32" stroke-width=".6"/>
        <circle cx="43" cy="22.7" r="1" fill="#fff3c4"/>
        <circle cx="57" cy="22.7" r="1" fill="#fff3c4"/>
      </g>`
    },
    {
      id: "wizard-hat",
      name: "巫师帽",
      en: "Wizard Hat",
      rarity: "epic",
      price: 140,
      hint: "魔法还没学会，帽子先戴上。",
      svg: `<g>
        <ellipse cx="50" cy="20" rx="28" ry="6" fill="#6b5bd2" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M35 19Q40 6 54 1L64 18Z" fill="#7a6ae0" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M38 16Q50 11 61 15" fill="none" stroke="#ffd166" stroke-width="3.4"/>
        <path d="M52 10l1.2 2.6 2.6.5-2 1.8.6 2.7-2.4-1.4-2.4 1.4.6-2.7-2-1.8 2.6-.5z" fill="#ffd166" stroke="#4a3b32" stroke-width=".6"/>
        <circle cx="47" cy="13" r=".9" fill="#fff3c4"/>
      </g>`
    },
    {
      id: "doctor-mask",
      name: "医生口罩",
      en: "Doctor Mask",
      rarity: "epic",
      price: 130,
      hint: "很小心、很讲卫生的一只狐狸。",
      svg: `<g>
        <path d="M38 44h24q3 0 3 3v7q0 5-6 5h-18q-6 0-6-5v-7q0-3 3-3z" fill="#cfe6fb" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M38 45Q30 41 30 38M62 45Q70 41 70 38" fill="none" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M38 49h24M38 52.5h24M38 56h24" stroke="#9fc4e8" stroke-width="1.2"/>
        <path d="M41 46.5v8M59 46.5v8" stroke="#fff" stroke-width="1" opacity=".55"/>
      </g>`
    },
    {
      id: "space-helmet",
      name: "太空头盔",
      en: "Space Helmet",
      rarity: "epic",
      price: 170,
      hint: "去很远的地方，也把单词带上。",
      svg: `<g>
        <circle cx="50" cy="38" r="28" fill="#dceaff" fill-opacity=".28" stroke="#6f8fbe" stroke-width="2.8"/>
        <circle cx="50" cy="38" r="24" fill="none" stroke="#fff" stroke-width="1" opacity=".35"/>
        <path d="M30 22Q40 12 54 13" fill="none" stroke="#fff" stroke-width="2.6" opacity=".8"/>
        <path d="M35 58Q50 68 65 58" fill="none" stroke="#9fb7d8" stroke-width="2" opacity=".65"/>
        <rect x="74" y="42" width="8" height="10" rx="3" fill="#9fb7d8" stroke="#4a3b32" stroke-width="1.6"/>
        <circle cx="78" cy="47" r="1.6" fill="#ffd166"/>
        <path d="M76.5 44v6" stroke="#fff" stroke-width=".8" opacity=".5"/>
      </g>`
    },

    /* ---------- 传说 · 2 件 ---------- */
    {
      id: "halo",
      name: "天使光环",
      en: "Halo",
      rarity: "legendary",
      price: 240,
      hint: "没有做坏事，只是背了很多单词。",
      svg: `<g>
        <ellipse cx="50" cy="8" rx="14.5" ry="4" fill="none" stroke="#ffd166" stroke-width="7" opacity=".2"/>
        <ellipse cx="50" cy="8" rx="14.5" ry="4" fill="none" stroke="#ffd166" stroke-width="3.6"/>
        <ellipse cx="50" cy="8" rx="14.5" ry="4" fill="none" stroke="#fff8cf" stroke-width="1.2" opacity=".95"/>
        <path d="M24 6l1-2.4 2.4-1-2.4-1L24 1.6 23 3.6l-2.4 1 2.4 1z" fill="#ffe8a3" stroke="#e0a100" stroke-width=".5"/>
        <path d="M76 10l.8-2 2-.8-2-.8-.8-2-.8 2-2 .8 2 .8z" fill="#ffe8a3" stroke="#e0a100" stroke-width=".5"/>
      </g>`
    },
    {
      id: "dragon-horns",
      name: "龙角",
      en: "Dragon Horns",
      rarity: "legendary",
      price: 280,
      hint: "看起来不好惹，其实还是社恐。",
      svg: `<g>
        <path d="M41 18Q36 8 30 2Q40 4 45 14Z" fill="#d9c39a" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M59 18Q64 8 70 2Q60 4 55 14Z" fill="#d9c39a" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M34 7q3 .6 5 3M35.5 11q2.4.4 4 2.4M66 7q-3 .6-5 3M64.5 11q-2.4.4-4 2.4" fill="none" stroke="#a9713a" stroke-width="1.2"/>
        <circle cx="30" cy="2" r="1.5" fill="#f6e4c8" stroke="#4a3b32" stroke-width=".7"/>
        <circle cx="70" cy="2" r="1.5" fill="#f6e4c8" stroke="#4a3b32" stroke-width=".7"/>
      </g>`
    },

    /* ---------- 新增配饰 · 普通 10 件 ---------- */
    {
      id: "star-clip",
      name: "星星发夹",
      en: "Star Clip",
      category: "accessory",
      rarity: "common",
      price: 35,
      hint: "别在耳朵旁边，闪一点点就够。",
      svg: `<g transform="translate(35 18)">
        <path d="M0-7l2.1 4.4 4.6.6-3.4 3.2.8 4.6-4.1-2.2-4.1 2.2.8-4.6-3.4-3.2 4.6-.6z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.4" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="1.1" fill="#fff3c4"/>
      </g>`
    },
    {
      id: "cherry-pin",
      name: "樱桃发绳",
      en: "Cherry Pin",
      category: "accessory",
      rarity: "common",
      price: 40,
      hint: "两颗小樱桃，扎在耳朵边上。",
      svg: `<g>
        <path d="M66 23q-1-7 4-10" fill="none" stroke="#4a3b32" stroke-width="1.6"/>
        <circle cx="63" cy="27" r="4" fill="#e2725b" stroke="#4a3b32" stroke-width="1.4"/>
        <circle cx="71" cy="23" r="3.4" fill="#f07a8a" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M61 25q2-2 4 0M69 21q2-2 3.4 0" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/>
      </g>`
    },
    {
      id: "headband",
      name: "发带",
      en: "Headband",
      category: "accessory",
      rarity: "common",
      price: 45,
      hint: "把耳朵中间那撮毛压住一点点。",
      svg: `<g>
        <path d="M31 29Q38 13 50 12Q62 13 69 29" fill="none" stroke="#f07a8a" stroke-width="4" stroke-linecap="round"/>
        <path d="M31 29Q38 13 50 12Q62 13 69 29" fill="none" stroke="#ffb3c0" stroke-width="1.4" stroke-linecap="round"/>
      </g>`
    },
    {
      id: "newsboy-cap",
      name: "报童帽",
      en: "Newsboy Cap",
      category: "accessory",
      rarity: "common",
      price: 55,
      hint: "帽檐压得低低的，显得很忙。",
      svg: `<g>
        <path d="M30 23q4-14 20-14 14 0 20 13-20 6-40 1z" fill="#8b6b4a" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M28 23q22 7 44 2l2 3q-24 6-48 1z" fill="#6f5439" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M38 13q12-4 24 1" fill="none" stroke="#a3815c" stroke-width="1.2"/>
        <circle cx="50" cy="9" r="1.8" fill="#a3815c" stroke="#4a3b32" stroke-width=".9"/>
      </g>`
    },
    {
      id: "bucket-hat",
      name: "渔夫帽",
      en: "Bucket Hat",
      category: "accessory",
      rarity: "common",
      price: 60,
      hint: "帽檐一圈，连耳朵都想藏起来。",
      svg: `<g>
        <path d="M34 20Q38 8 50 8Q62 8 66 20Q50 25 34 20Z" fill="#8ec5ff" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M31 21Q50 27 69 21L72 26Q50 33 28 26Z" fill="#7db8f4" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M37 13Q50 10 63 13" fill="none" stroke="#d6ebff" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "visor",
      name: "遮阳帽檐",
      en: "Sun Visor",
      category: "accessory",
      rarity: "common",
      price: 50,
      hint: "只有一圈帽檐，头发还是露在外面。",
      svg: `<g>
        <path d="M32 22Q50 28 68 22L71 27Q50 35 29 27Z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M34 19Q50 24 66 19" fill="none" stroke="#e2725b" stroke-width="3.4"/>
        <path d="M40 22Q50 25 60 22" fill="none" stroke="#fff3c4" stroke-width="1"/>
      </g>`
    },
    {
      id: "sleep-mask",
      name: "睡眠眼罩",
      en: "Sleep Mask",
      category: "accessory",
      rarity: "common",
      price: 45,
      hint: "戴上就可以假装自己还没醒。",
      svg: `<g>
        <path d="M31 33Q50 26 69 33" fill="none" stroke="#4a3b32" stroke-width="1.6"/>
        <rect x="35" y="32" width="30" height="10" rx="5" fill="#b48cf2" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M41 37q2 2 4 0M55 37q2 2 4 0" fill="none" stroke="#fff3ff" stroke-width="1.4"/>
        <path d="M38 34q6-2 12 0" fill="none" stroke="#d8c0ff" stroke-width="1"/>
      </g>`
    },
    {
      id: "face-sticker",
      name: "星星贴纸",
      en: "Star Stickers",
      category: "accessory",
      rarity: "common",
      price: 35,
      hint: "贴在两颊，像刚被表扬过。",
      svg: `<g>
        <g transform="translate(-6 9)">
          <path d="M41.5 31.5l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.7-2.6 3.7-.5z" fill="#ffd166" stroke="#4a3b32" stroke-width=".9" stroke-linejoin="round"/>
        </g>
        <g transform="translate(24.5 9)">
          <path d="M41.5 31.5l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.7-2.6 3.7-.5z" fill="#8ec5ff" stroke="#4a3b32" stroke-width=".9" stroke-linejoin="round"/>
        </g>
      </g>`
    },
    {
      id: "freckles",
      name: "小雀斑",
      en: "Freckles",
      category: "accessory",
      rarity: "common",
      price: 30,
      hint: "不用化妆，也有一点小俏皮。",
      svg: `<g fill="#b07a5a">
        <circle cx="34" cy="43.5" r=".9"/>
        <circle cx="37" cy="45.5" r=".8"/>
        <circle cx="33.5" cy="47" r=".7"/>
        <circle cx="66" cy="43.5" r=".9"/>
        <circle cx="63" cy="45.5" r=".8"/>
        <circle cx="66.5" cy="47" r=".7"/>
      </g>`
    },
    {
      id: "ear-flower",
      name: "耳后小花",
      en: "Ear Flower",
      category: "accessory",
      rarity: "common",
      price: 40,
      hint: "只有一朵，但位置刚刚好。",
      svg: `<g>
        ${blossom(31, 24, 3.1, "#ff9eb5", "#ffe8a3")}
        <path d="M28 27q-3 2-3 5" fill="none" stroke="#7fb98a" stroke-width="1.2"/>
      </g>`
    },

    /* ---------- 新增配饰 · 稀有 9 件 ---------- */
    {
      id: "aviator",
      name: "飞行员墨镜",
      en: "Aviator Shades",
      category: "accessory",
      rarity: "rare",
      price: 95,
      hint: "镜片往下垂，像随时要出发。",
      svg: `<g>
        <path d="M29.5 33.5Q50 30 70.5 33.5" fill="none" stroke="#d9a441" stroke-width="2"/>
        <path d="M32 33Q40 31 47 35V41Q43 45 38 43Q33 40 32 33Z" fill="#2b3242" stroke="#d9a441" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M68 33Q60 31 53 35V41Q57 45 62 43Q67 40 68 33Z" fill="#2b3242" stroke="#d9a441" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M46.5 35.5h7" stroke="#d9a441" stroke-width="2"/>
        <path d="M36 35h6M58 35h6" stroke="#7f93b8" stroke-width="1"/>
      </g>`
    },
    {
      id: "heart-glasses",
      name: "爱心眼镜",
      en: "Heart Glasses",
      category: "accessory",
      rarity: "rare",
      price: 100,
      hint: "看什么都像值得喜欢的样子。",
      svg: `<g>
        <path d="M41.5 31.5c-4 0-6 3-6 6 0 4 4 7 6 9 2-2 6-5 6-9 0-3-2-6-6-6z" fill="#ff8fab" fill-opacity=".55" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M58.5 31.5c-4 0-6 3-6 6 0 4 4 7 6 9 2-2 6-5 6-9 0-3-2-6-6-6z" fill="#ff8fab" fill-opacity=".55" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M47.5 37h3" stroke="#4a3b32" stroke-width="1.6"/>
        <path d="M34 34Q30 35 28 38M66 34Q70 35 72 38" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "gold-mask",
      name: "金色半面具",
      en: "Gold Half Mask",
      category: "accessory",
      rarity: "rare",
      price: 110,
      hint: "只遮上半张脸，下半张还是自己。",
      svg: `<g>
        <path d="M27 33Q34 28 42 31Q50 34 58 31Q66 28 73 33Q72 42 66 45Q58 48 50 45Q42 48 34 45Q28 42 27 33Z" fill="#e6c15a" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M38 36.5q3-1 6 0M56 36.5q3-1 6 0" fill="none" stroke="#8a6a10" stroke-width="1.2"/>
        <path d="M33 32q-3-2-6-1M67 32q3-2 6-1" fill="none" stroke="#fff3c4" stroke-width="1.2"/>
        <path d="M73 31q7-11 3-17-5 8-3 16z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.4" stroke-linejoin="round"/>
      </g>`
    },
    {
      id: "devil-horns",
      name: "小恶魔角",
      en: "Devil Horns",
      category: "accessory",
      rarity: "rare",
      price: 105,
      hint: "只是看着凶，其实一说话就脸红。",
      svg: `<g>
        <path d="M38 18Q32 8 34 2Q42 6 45 15Z" fill="#c94f45" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M62 18Q68 8 66 2Q58 6 55 15Z" fill="#c94f45" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M36 8q3 2 5 4M64 8q-3 2-5 4" fill="none" stroke="#e88a80" stroke-width="1"/>
        <circle cx="34.5" cy="2.5" r="1.5" fill="#f3a08c" stroke="#4a3b32" stroke-width=".6"/>
        <circle cx="65.5" cy="2.5" r="1.5" fill="#f3a08c" stroke="#4a3b32" stroke-width=".6"/>
      </g>`
    },
    {
      id: "bunny-ears",
      name: "兔耳",
      en: "Bunny Ears",
      category: "accessory",
      rarity: "rare",
      price: 100,
      hint: "耳朵变长了，偷听单词更清楚。",
      svg: `<g>
        <ellipse cx="40" cy="15" rx="6" ry="14" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.8" transform="rotate(-12 40 15)"/>
        <ellipse cx="40" cy="16" rx="3" ry="9" fill="#ffd3dc" transform="rotate(-12 40 16)"/>
        <ellipse cx="60" cy="15" rx="6" ry="14" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.8" transform="rotate(12 60 15)"/>
        <ellipse cx="60" cy="16" rx="3" ry="9" fill="#ffd3dc" transform="rotate(12 60 16)"/>
      </g>`
    },
    {
      id: "sunflower-crown",
      name: "向日葵花环",
      en: "Sunflower Crown",
      category: "accessory",
      rarity: "rare",
      price: 90,
      hint: "把一整个下午的太阳戴在头上。",
      svg: `<g>
        <path d="M28 30Q30 18 40 13Q50 8 60 11Q71 15 76 28" fill="none" stroke="#7fb98a" stroke-width="2.4" stroke-linecap="round"/>
        ${sunflower(32, 25, 3.3)}
        ${sunflower(50, 12, 3.7)}
        ${sunflower(68, 24, 3.3)}
        <path d="M26 31q-3 3-3 6" fill="none" stroke="#9ed4a8" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "bandana",
      name: "头巾",
      en: "Bandana",
      category: "accessory",
      rarity: "rare",
      price: 85,
      hint: "在额头上打一个结，像要去做点什么。",
      svg: `<g>
        <path d="M30 27Q50 17 70 27L69 34Q50 25 31 34Z" fill="#e2725b" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M31 30Q50 21 69 30" fill="none" stroke="#fffaf2" stroke-width="1.2" stroke-dasharray="3 3"/>
        <path d="M68 29l8-4-2 8-6-1z" fill="#c94f45" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M70 30q2 3 1 6" fill="none" stroke="#a33b32" stroke-width="1"/>
      </g>`
    },
    {
      id: "snow-goggles",
      name: "雪地护目镜",
      en: "Snow Goggles",
      category: "accessory",
      rarity: "rare",
      price: 115,
      hint: "不管下不下雪，都先护住眼睛。",
      svg: `<g>
        <rect x="31" y="31" width="38" height="13" rx="6" fill="#8ec5ff" fill-opacity=".6" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M35 34q7-3 13 0M52 34q7-3 13 0" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>
        <path d="M31 37h-4v6M69 37h4v6" fill="none" stroke="#e2725b" stroke-width="2.4"/>
        <path d="M35 41q15 4 30 0" fill="none" stroke="#5b8bd0" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "pirate-hat",
      name: "海盗帽",
      en: "Pirate Hat",
      category: "accessory",
      rarity: "rare",
      price: 105,
      hint: "单词就是宝藏，今天先挖一组。",
      svg: `<g>
        <path d="M28 20q10-14 22-14 12 0 22 14-11 4-22 4t-22-4z" fill="#2b3242" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M28 20q22 6 44 0l2 4q-24 7-48 0z" fill="#1f2633" stroke="#4a3b32" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="50" cy="10" r="2.6" fill="#fffaf2" stroke="#4a3b32" stroke-width=".8"/>
        <path d="M46 12q4 4 8 0" fill="none" stroke="#8ec5ff" stroke-width="1"/>
      </g>`
    },

    /* ---------- 新增配饰 · 史诗 7 件 ---------- */
    {
      id: "butterfly-mask",
      name: "蝴蝶面具",
      en: "Butterfly Mask",
      category: "accessory",
      rarity: "epic",
      price: 175,
      hint: "翅膀停在脸上，说话也轻了一点。",
      svg: `<g>
        <path d="M50 30q-8-6-16-2-7 4-6 10 1 7 10 7 8 0 12-6z" fill="#b48cf2" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M50 30q8-6 16-2 7 4 6 10-1 7-10 7-8 0-12-6z" fill="#b48cf2" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <ellipse cx="40" cy="37" rx="4" ry="2.4" fill="#fff3ff" fill-opacity=".6"/>
        <ellipse cx="60" cy="37" rx="4" ry="2.4" fill="#fff3ff" fill-opacity=".6"/>
        <path d="M50 30v10" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M50 30q-1-8-5-10M50 30q1-8 5-10" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "gem-circlet",
      name: "宝石额饰",
      en: "Gem Circlet",
      category: "accessory",
      rarity: "epic",
      price: 190,
      hint: "额前一颗，走路都不敢太快。",
      svg: `<g>
        <path d="M29 26Q50 17 71 26" fill="none" stroke="#d9a441" stroke-width="2.6"/>
        <path d="M50 18l4 9-4 9-4-9z" fill="#8ec5ff" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="38" cy="22" r="2" fill="#b48cf2" stroke="#4a3b32" stroke-width=".8"/>
        <circle cx="62" cy="22" r="2" fill="#b48cf2" stroke="#4a3b32" stroke-width=".8"/>
        <path d="M46 20q4 4 0 8" stroke="#fff" stroke-width="1" opacity=".8"/>
      </g>`
    },
    {
      id: "neon-visor",
      name: "霓虹面罩",
      en: "Neon Visor",
      category: "accessory",
      rarity: "epic",
      price: 180,
      hint: "从很远的地方就能被认出来。",
      svg: `<g>
        <rect x="29" y="31" width="42" height="10" rx="5" fill="#1b2336" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M33 36h36" stroke="#5ff3d0" stroke-width="6" opacity=".25"/>
        <path d="M33 36h36" stroke="#5ff3d0" stroke-width="2.4"/>
        <path d="M29 35Q25 36 24 39M71 35Q75 36 76 39" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "phoenix-plume",
      name: "凤羽头饰",
      en: "Phoenix Plume",
      category: "accessory",
      rarity: "epic",
      price: 210,
      hint: "两根羽毛，替你把气势撑起来。",
      svg: `<g>
        <path d="M50 22Q44 10 34 4Q40 16 41 24" fill="none" stroke="#e2725b" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M50 22Q56 10 66 4Q60 16 59 24" fill="none" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M34 4q-3 5-1 9M66 4q3 5 1 9" fill="none" stroke="#f3a08c" stroke-width="1.2"/>
        <path d="M50 22v-8" stroke="#4a3b32" stroke-width="1.2"/>
        <circle cx="34" cy="4" r="2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
        <circle cx="66" cy="4" r="2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "knight-helm",
      name: "骑士头盔",
      en: "Knight Helm",
      category: "accessory",
      rarity: "epic",
      price: 200,
      hint: "很重，但背单词的时候很有底气。",
      svg: `<g>
        <path d="M29 36Q29 14 50 12Q71 14 71 36v10q-21 8-42 0z" fill="#9db4d8" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M40 30h20M38 36h24" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M50 30v12" stroke="#4a3b32" stroke-width="1.6"/>
        <path d="M34 24q8-6 16-6" fill="none" stroke="#dce9ff" stroke-width="1.6"/>
        <path d="M38 12q-2-6 2-10M62 12q2-6-2-10" fill="none" stroke="#e2725b" stroke-width="2.2"/>
      </g>`
    },
    {
      id: "flower-veil",
      name: "花饰面纱",
      en: "Flower Veil",
      category: "accessory",
      rarity: "epic",
      price: 165,
      hint: "薄薄一层，把紧张藏进去一点。",
      svg: `<g>
        <path d="M28 24q22-10 44 0l-4 26q-18 6-36 0z" fill="#fff0f6" fill-opacity=".5" stroke="#e8b8cf" stroke-width="1.2" stroke-dasharray="2 2"/>
        ${blossom(50, 20, 3.2, "#ff9eb5", "#ffe8a3")}
        ${blossom(38, 23, 2.4, "#ffb3c0", "#fff3c4")}
        ${blossom(62, 23, 2.4, "#ffd166", "#fff6cf")}
      </g>`
    },
    {
      id: "cat-mask",
      name: "猫脸面具",
      en: "Cat Mask",
      category: "accessory",
      rarity: "epic",
      price: 160,
      hint: "戴上以后，连叫一声都变自然了。",
      svg: `<g>
        <path d="M29 30Q50 24 71 30Q70 46 50 52Q30 46 29 30Z" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M31 30l-4-8 10 3M69 30l4-8-10 3" fill="#f4b26f" stroke="#4a3b32" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M38 35q3-2 6 0M56 35q3-2 6 0" fill="none" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M46 42h8l-4 3z" fill="#4a3b32"/>
        <path d="M33 40l-6-2M33 43h-7M67 40l6-2M67 43h7" stroke="#4a3b32" stroke-width="1"/>
      </g>`
    },

    /* ---------- 新增配饰 · 传说 4 件 ---------- */
    {
      id: "galaxy-crown",
      name: "星河王冠",
      en: "Galaxy Crown",
      category: "accessory",
      rarity: "legendary",
      price: 340,
      hint: "整片夜空都压在这一圈上。",
      svg: `<g>
        <path d="M31 23l-2-14 12 7 9-12 9 12 12-7-2 14z" fill="#1f2a55" stroke="#4a3b32" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M31 23q19 6 38 0" fill="none" stroke="#ffd166" stroke-width="2.4"/>
        <circle cx="41" cy="10" r="2" fill="#8ec5ff"/>
        <circle cx="50" cy="6" r="2.2" fill="#ffd166"/>
        <circle cx="59" cy="10" r="2" fill="#b48cf2"/>
        <circle cx="39" cy="20" r="1" fill="#fffaf2"/>
        <circle cx="50" cy="21" r="1.1" fill="#fffaf2"/>
        <circle cx="61" cy="20" r="1" fill="#fffaf2"/>
      </g>`
    },
    {
      id: "moon-mask",
      name: "月神面具",
      en: "Moon Mask",
      category: "accessory",
      rarity: "legendary",
      price: 320,
      hint: "月亮把脸借给你一晚上。",
      svg: `<g>
        <path d="M50 15c-12 0-20 9-20 20 0 10 8 18 20 18s20-8 20-18c0-11-8-20-20-20z" fill="#f7f2e8" fill-opacity=".9" stroke="#4a3b32" stroke-width="1.8"/>
        <path d="M50 15c-12 0-20 9-20 20" fill="none" stroke="#d9a441" stroke-width="2.2"/>
        <ellipse cx="41" cy="36" rx="4.6" ry="2.4" fill="#8ec5ff" fill-opacity=".5"/>
        <ellipse cx="59" cy="36" rx="4.6" ry="2.4" fill="#8ec5ff" fill-opacity=".5"/>
        <path d="M46 48q4 3 8 0" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M50 26l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.7-2.6 3.7-.5z" fill="#ffd166" stroke="#4a3b32" stroke-width=".6"/>
      </g>`
    },
    {
      id: "golden-laurel",
      name: "金桂冠",
      en: "Golden Laurel",
      category: "accessory",
      rarity: "legendary",
      price: 300,
      hint: "不是奖杯，但也很想被看见。",
      svg: `<g>
        <path d="M28 28Q34 18 46 16M72 28Q66 18 54 16" fill="none" stroke="#c9a227" stroke-width="2"/>
        <ellipse cx="31" cy="26" rx="4" ry="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8" transform="rotate(-30 31 26)"/>
        <ellipse cx="36" cy="20" rx="4" ry="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8" transform="rotate(-50 36 20)"/>
        <ellipse cx="42" cy="17" rx="4" ry="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8" transform="rotate(-70 42 17)"/>
        <ellipse cx="69" cy="26" rx="4" ry="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8" transform="rotate(30 69 26)"/>
        <ellipse cx="64" cy="20" rx="4" ry="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8" transform="rotate(50 64 20)"/>
        <ellipse cx="58" cy="17" rx="4" ry="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8" transform="rotate(70 58 17)"/>
        <circle cx="50" cy="16" r="2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "aurora-veil",
      name: "极光面纱",
      en: "Aurora Veil",
      category: "accessory",
      rarity: "legendary",
      price: 420,
      hint: "把最安静的那片光，罩在脸上。",
      svg: `<g>
        <path d="M28 22Q50 10 72 22Q74 44 64 53Q50 59 36 53Q26 44 28 22Z" fill="#a8f0d8" fill-opacity=".35" stroke="#7fe0c4" stroke-width="1.6"/>
        <path d="M33 24Q50 15 67 24Q69 40 60 48Q50 53 40 48Q31 40 33 24Z" fill="#b9c8ff" fill-opacity=".4" stroke="#8ec5ff" stroke-width="1.2"/>
        <path d="M38 27Q50 20 62 27Q63 38 57 44Q50 48 43 44Q37 38 38 27Z" fill="#ffd8f0" fill-opacity=".35" stroke="#ffb3c0" stroke-width="1"/>
        <circle cx="50" cy="14" r="2.4" fill="#fffaf2" stroke="#8ec5ff" stroke-width=".8"/>
        <path d="M42 12l1-2.4 2.4-1-2.4-1-1-2.4-1 2.4-2.4 1 2.4 1z" fill="#fff3ff"/>
      </g>`
    },

    /* ---------- 衣服 · 学校路线 13 套 ---------- */
    {
      id: "school-sailor",
      name: "水手服",
      en: "Sailor Uniform",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 45,
      hint: "领子后面还有一个方方的结。",
      svg: `<g>
        <path d="M39 55q11 6 22 0l5 9-7 4-2 10q-8 3-16 0l-2-10-7-4z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M36 63l7 4 3 4-6 1z" fill="#3f5f9e" stroke="#4a3b32" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M64 63l-7 4-3 4 6 1z" fill="#3f5f9e" stroke="#4a3b32" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M45.5 66h9l-4.5 3.5z" fill="#e2725b" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M38 79q12 4 24 0l5 11q-17 5-34 0z" fill="#3f5f9e" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 82v8M50 82v9M58 82v8" stroke="#2c4577" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "school-blazer",
      name: "校服外套",
      en: "School Blazer",
      category: "outfit",
      route: "school",
      rarity: "rare",
      price: 70,
      hint: "袖口有一道细细的白边。",
      svg: `<g>
        <path d="M39 55q11 6 22 0l6 10-7 4-2 14q-8 3-16 0l-2-14-7-4z" fill="#34456b" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 56l6 7 6-7 4 4-10 8-10-8z" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M44 56l-4 5 5 7 3-10zM56 56l4 5-5 7-3-10z" fill="#2b3a5c" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M46 69l4 3 4-3" fill="none" stroke="#e2725b" stroke-width="1.6"/>
        <circle cx="50" cy="78" r="1.4" fill="#ffd166" stroke="#4a3b32" stroke-width=".6"/>
      </g>`
    },
    {
      id: "school-gym",
      name: "运动背心",
      en: "Gym Tank",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 50,
      hint: "跑起来的时候，背后会鼓一小块风。",
      svg: `<g>
        <path d="M42 56q8 4 16 0l4 8-5 3v14q-7 2-14 0V67l-5-3z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 56q8 4 16 0" fill="none" stroke="#e2725b" stroke-width="3"/>
        <path d="M44 55v8M56 55v8" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M46 72h8" stroke="#e2725b" stroke-width="2"/>
      </g>`
    },
    {
      id: "school-pe-shorts",
      name: "运动短裤",
      en: "PE Shorts",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 45,
      hint: "侧面三道白杠，是跑得快的意思。",
      svg: `<g>
        <path d="M36 66q14 4 28 0l2 6-3 2-1 10q-6 2-10-2-4 4-10 2l-1-10-3-2z" fill="#3f5f9e" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M37 68q13 4 26 0" fill="none" stroke="#fffaf2" stroke-width="1.4"/>
        <path d="M43 72l-1 9M57 72l1 9" stroke="#fffaf2" stroke-width="1.6"/>
      </g>`
    },
    {
      id: "school-backpack",
      name: "双肩书包",
      en: "Backpack",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 60,
      hint: "里面装着的，是明天要背的词。",
      svg: `<g>
        <path d="M42 55q-2 10 2 20M58 55q3 10 1 20" fill="none" stroke="#8b5a2b" stroke-width="3.2" stroke-linecap="round"/>
        <rect x="61" y="64" width="14" height="18" rx="5" fill="#c98a4b" stroke="#4a3b32" stroke-width="2"/>
        <path d="M63 67q5 3 10 0" fill="none" stroke="#f0c48b" stroke-width="1.4"/>
        <rect x="66" y="72" width="6" height="7" rx="2" fill="#ffd166" stroke="#4a3b32" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "school-satchel",
      name: "斜挎书包",
      en: "Satchel",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 55,
      hint: "带子压过胸口，走路会响一下。",
      svg: `<g>
        <path d="M38 54q14 8 24 20" fill="none" stroke="#8b5a2b" stroke-width="3" stroke-linecap="round"/>
        <rect x="60" y="76" width="18" height="13" rx="4" fill="#c98a4b" stroke="#4a3b32" stroke-width="2"/>
        <path d="M62 79q7 3 14 0" fill="none" stroke="#f0c48b" stroke-width="1.4"/>
        <rect x="67" y="81" width="4" height="4" rx="1" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "school-tie",
      name: "领带",
      en: "School Tie",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 35,
      hint: "系得不太正，但也没人管。",
      svg: `<g>
        <path d="M42 55q8 5 16 0l3 5-5 3-6-4-6 4-5-3z" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M47 61h6l-1 5 3 3-2 12-4 3-4-3-2-12 3-3z" fill="#e2725b" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M47 62l3 2 3-2" fill="none" stroke="#b45345" stroke-width="1"/>
      </g>`
    },
    {
      id: "school-hoodie",
      name: "连帽卫衣",
      en: "School Hoodie",
      category: "outfit",
      route: "school",
      rarity: "common",
      price: 65,
      hint: "帽子放下来，抽绳还是垂着。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 13q-9 3-18 0l-2-13-7-4z" fill="#8fbf8a" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 55q8 8 16 0-2 7-8 9-6-2-8-9z" fill="#7aa876" stroke="#4a3b32" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M47 62q3 3 6 0" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M43 70q7 3 14 0" fill="none" stroke="#e8f3e6" stroke-width="1.6"/>
        <circle cx="47.5" cy="76" r="1" fill="#fffaf2"/>
        <circle cx="52.5" cy="76" r="1" fill="#fffaf2"/>
      </g>`
    },
    {
      id: "school-labcoat",
      name: "白大褂",
      en: "Lab Coat",
      category: "outfit",
      route: "school",
      rarity: "rare",
      price: 80,
      hint: "口袋里总有一支不知道谁的笔。",
      svg: `<g>
        <path d="M38 55q12 6 24 0l5 9-6 3-1 20q-9 3-18 0l-1-20-6-3z" fill="#f7fbff" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M45 56l5 6 5-6 2 3-7 8-7-8z" fill="#dce9f6" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M50 62v25" stroke="#c3d6e6" stroke-width="1.4"/>
        <path d="M38 78h24" stroke="#c3d6e6" stroke-width="1.2"/>
        <rect x="55" y="68" width="6" height="4" rx="1" fill="#8ec5ff" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "school-track",
      name: "校队夹克",
      en: "Track Jacket",
      category: "outfit",
      route: "school",
      rarity: "rare",
      price: 85,
      hint: "拉链拉到一半，是故意的。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 13q-8 3-16 0l-2-13-7-4z" fill="#2f55c9" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M38 63l7 4M62 63l-7 4" stroke="#ffd166" stroke-width="2.2"/>
        <path d="M44 57v18M56 57v18" stroke="#ffd166" stroke-width="1.4"/>
        <path d="M42 79h16" stroke="#fffaf2" stroke-width="3"/>
      </g>`
    },
    {
      id: "school-grad",
      name: "学士袍",
      en: "Graduate Robe",
      category: "outfit",
      route: "school",
      rarity: "epic",
      price: 150,
      hint: "还没毕业，但先把袍子穿好。",
      svg: `<g>
        <path d="M39 55q11 6 22 0l8 14-8 4-1 12q-10 4-20 0l-1-12-8-4z" fill="#242b3d" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 56l8 6 8-6" fill="none" stroke="#3a4560" stroke-width="2"/>
        <path d="M46 62q4 3 8 0" fill="none" stroke="#8ec5ff" stroke-width="2"/>
        <path d="M44 74l6-3 6 3" fill="none" stroke="#8ec5ff" stroke-width="2"/>
        <path d="M50 62v14" stroke="#ffd166" stroke-width="2"/>
      </g>`
    },
    {
      id: "school-cheer",
      name: "啦啦队服",
      en: "Cheer Uniform",
      category: "outfit",
      route: "school",
      rarity: "rare",
      price: 95,
      hint: "不会喊口号，但会认真挥两下。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l4 7-5 3v9q-7 2-14 0v-9l-5-3z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M39 77q11 4 22 0l3 7q-14 4-28 0z" fill="#e2725b" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 68h14" stroke="#e2725b" stroke-width="2.4"/>
        <path d="M44 58l6 5 6-5" fill="none" stroke="#e2725b" stroke-width="2"/>
      </g>`
    },
    {
      id: "school-cardigan",
      name: "针织开衫",
      en: "School Cardigan",
      category: "outfit",
      route: "school",
      rarity: "rare",
      price: 75,
      hint: "扣子只扣中间那颗，比较自在。",
      svg: `<g>
        <path d="M38 55q12 6 24 0l5 9-6 3-1 15q-9 3-18 0l-1-15-6-3z" fill="#e8c887" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M50 58v25" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M44 58l-4 5 5 7 3-10zM56 58l4 5-5 7-3-10z" fill="#f3dcae" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="50" cy="66" r="1.2" fill="#b0895a"/>
        <circle cx="50" cy="74" r="1.2" fill="#b0895a"/>
      </g>`
    },

    /* ---------- 衣服 · 日常路线 13 套 ---------- */
    {
      id: "daily-pajama",
      name: "睡衣",
      en: "Pajamas",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 40,
      hint: "印着小星星，适合背到最后。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 12q-9 3-18 0l-2-12-7-4z" fill="#cfe0ff" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 58l8 5 8-5" fill="none" stroke="#fffaf2" stroke-width="2"/>
        <circle cx="42" cy="70" r="1.6" fill="#ffd166"/>
        <circle cx="57" cy="75" r="1.2" fill="#ffd166"/>
        <circle cx="47" cy="80" r="1" fill="#fffaf2"/>
        <path d="M43 64q3-2 6 0" fill="none" stroke="#8ec5ff" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "daily-overalls",
      name: "背带裤",
      en: "Overalls",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 60,
      hint: "胸前的扣子总有一边是歪的。",
      svg: `<g>
        <path d="M40 55q10 4 20 0l4 8-6 3-2 16q-8 3-16 0l-2-16-6-3z" fill="#5b8bd0" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 55l-2 12M57 55l2 12" stroke="#4a3b32" stroke-width="3" stroke-linecap="round"/>
        <rect x="47" y="57" width="6" height="5" rx="1.5" fill="#ffd166" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M40 70h20" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M43 70v8h14v-8" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
        <circle cx="45" cy="60" r="1" fill="#fffaf2"/>
        <circle cx="55" cy="60" r="1" fill="#fffaf2"/>
      </g>`
    },
    {
      id: "daily-raincoat",
      name: "雨衣",
      en: "Raincoat",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 55,
      hint: "帽檐上的水滴，总也甩不掉。",
      svg: `<g>
        <path d="M37 54q13 8 26 0l6 12-7 4-1 15q-10 4-20 0l-1-15-7-4z" fill="#ffd166" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M50 60v25" stroke="#e0a100" stroke-width="1.2"/>
        <circle cx="50" cy="64" r="1.3" fill="#4a3b32"/>
        <circle cx="50" cy="72" r="1.3" fill="#4a3b32"/>
        <circle cx="50" cy="80" r="1.3" fill="#4a3b32"/>
        <path d="M40 58q-2 6-1 11M60 58q2 6 1 11" fill="none" stroke="#f0c14b" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "daily-wintercoat",
      name: "冬季大衣",
      en: "Winter Coat",
      category: "outfit",
      route: "daily",
      rarity: "rare",
      price: 80,
      hint: "领口一圈毛，风就进不来了。",
      svg: `<g>
        <path d="M38 55q12 6 24 0l6 10-6 3-1 17q-9 3-18 0l-1-17-6-3z" fill="#9a6b5a" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 56l6 6 6-6 2 4-8 8-8-8z" fill="#f3e2d4" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M50 62v21" stroke="#7a5245" stroke-width="1.4"/>
        <path d="M41 78h18" stroke="#c9a88f" stroke-width="1.4"/>
        <circle cx="46" cy="68" r="1" fill="#ffd166"/>
        <circle cx="54" cy="68" r="1" fill="#ffd166"/>
      </g>`
    },
    {
      id: "daily-tee",
      name: "夏日T恤",
      en: "Summer Tee",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 35,
      hint: "胸前一个小太阳，晒得很开心。",
      svg: `<g>
        <path d="M40 55q10 5 20 0l5 9-6 3v14q-9 3-18 0V67l-6-3z" fill="#7fb98a" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 57l6 5 6-5" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
        <circle cx="50" cy="72" r="4" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.2"/>
        <path d="M50 65v-2M50 81v2M43 72h-2M59 72h2" stroke="#fffaf2" stroke-width="1.4"/>
      </g>`
    },
    {
      id: "daily-apron",
      name: "围裙",
      en: "Apron",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 45,
      hint: "口袋里有面粉，也有一点小骄傲。",
      svg: `<g>
        <path d="M41 56q9 5 18 0l4 8-6 3-1 15q-8 3-14 0l-1-15-6-3z" fill="#f3e2d4" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 55l6 5 6-5" fill="none" stroke="#e2725b" stroke-width="1.6"/>
        <path d="M46 65h8v10h-8z" fill="#fbeef0" stroke="#4a3b32" stroke-width="1.2"/>
        <circle cx="50" cy="70" r="2" fill="#e2725b"/>
      </g>`
    },
    {
      id: "daily-denim",
      name: "牛仔外套",
      en: "Denim Jacket",
      category: "outfit",
      route: "daily",
      rarity: "rare",
      price: 75,
      hint: "口袋缝线歪歪的，但很结实。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 13q-9 3-18 0l-2-13-7-4z" fill="#5a86bf" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 57l6 5 6-5" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M44 62v16M56 62v16" stroke="#3f6aa0" stroke-width="1.4"/>
        <path d="M46 68h4v3h-4zM50 68h4v3h-4z" fill="#3f6aa0"/>
        <circle cx="47.5" cy="62.5" r=".8" fill="#ffd166"/>
        <circle cx="52.5" cy="62.5" r=".8" fill="#ffd166"/>
      </g>`
    },
    {
      id: "daily-sweater",
      name: "毛衣",
      en: "Knit Sweater",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 60,
      hint: "袖子有点长，正好用来藏手。",
      svg: `<g>
        <path d="M38 55q12 6 24 0l7 11-7 4-2 12q-9 3-18 0l-2-12-7-4z" fill="#d98f8f" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 57q8 4 16 0" fill="none" stroke="#f3c4c4" stroke-width="2"/>
        <path d="M43 65q7 3 14 0M43 73q7 3 14 0" fill="none" stroke="#f3c4c4" stroke-width="1.4"/>
        <path d="M38 55l6 8M62 55l-6 8" stroke="#b97676" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "daily-puffer",
      name: "羽绒服",
      en: "Puffer Jacket",
      category: "outfit",
      route: "daily",
      rarity: "rare",
      price: 85,
      hint: "鼓鼓的，像随时可以滚下山。",
      svg: `<g>
        <path d="M37 54q13 8 26 0l7 12-8 4-1 15q-10 4-20 0l-1-15-8-4z" fill="#e2725b" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M40 62q10 4 20 0M40 70q10 4 20 0M40 78q10 4 20 0" fill="none" stroke="#f3a08c" stroke-width="1.4"/>
        <path d="M50 62v22" stroke="#b45345" stroke-width="1.2"/>
        <rect x="46" y="58" width="8" height="4" rx="1.5" fill="#ffd166" stroke="#4a3b32" stroke-width="1"/>
      </g>`
    },
    {
      id: "daily-beach",
      name: "沙滩衬衫",
      en: "Beach Shirt",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 50,
      hint: "上面印着波浪，假装在海边。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 13q-9 3-18 0l-2-13-7-4z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 57l6 6 6-6 2 3-8 7-8-7z" fill="#8ec5ff" stroke="#4a3b32" stroke-width="1.1" stroke-linejoin="round"/>
        <path d="M42 66l4-3 4 3 4-3 4 3" fill="none" stroke="#8ec5ff" stroke-width="2"/>
        <path d="M43 74l4-3 4 3 4-3 4 3" fill="none" stroke="#8ec5ff" stroke-width="2"/>
      </g>`
    },
    {
      id: "daily-sundress",
      name: "吊带裙",
      en: "Sundress",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 65,
      hint: "肩膀空空的，风一吹就凉快。",
      svg: `<g>
        <path d="M43 55l-1 8M57 55l1 8" fill="none" stroke="#4a3b32" stroke-width="2"/>
        <path d="M42 62q8 3 16 0l4 12-6 3-1 10q-9 4-18 0l-1-10-6-3z" fill="#ffb3c0" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 66q7 3 14 0" fill="none" stroke="#fff3c4" stroke-width="1.4"/>
        <circle cx="50" cy="72" r="2.2" fill="#fff3c4" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "daily-cottage",
      name: "田园裙",
      en: "Cottage Dress",
      category: "outfit",
      route: "daily",
      rarity: "rare",
      price: 70,
      hint: "裙摆一走路就轻轻晃。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l5 9-7 4-2 10 4 12q-13 4-26 0l4-12-2-10-7-4z" fill="#a8dcc0" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 66q8 3 16 0" fill="none" stroke="#fffaf2" stroke-width="2"/>
        <path d="M43 80q7 3 14 0" fill="none" stroke="#7fb98a" stroke-width="1.4"/>
        <circle cx="46" cy="70" r="1.4" fill="#fffaf2"/>
        <circle cx="54" cy="72" r="1.4" fill="#fffaf2"/>
      </g>`
    },
    {
      id: "daily-bathrobe",
      name: "浴袍",
      en: "Bathrobe",
      category: "outfit",
      route: "daily",
      rarity: "common",
      price: 65,
      hint: "腰带松了也不管，反正刚洗完。",
      svg: `<g>
        <path d="M37 54q13 9 26 0l7 12-7 5-1 15q-10 4-20 0l-1-15-7-5z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M50 58v26" stroke="#d9d0bf" stroke-width="1.4"/>
        <path d="M40 60q6 10 10 22" fill="none" stroke="#d9d0bf" stroke-width="1.2"/>
        <path d="M45 66h10" stroke="#8ec5ff" stroke-width="3"/>
        <circle cx="50" cy="66" r="2" fill="#8ec5ff" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },

    /* ---------- 衣服 · 华丽路线 12 套 ---------- */
    {
      id: "glam-ribbon",
      name: "缎带裙",
      en: "Ribbon Dress",
      category: "outfit",
      route: "glam",
      rarity: "rare",
      price: 70,
      hint: "腰上那个结，系了三次才满意。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l4 8-6 3-1 9 5 13q-12 4-24 0l5-13-1-9-6-3z" fill="#f07a8a" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 57q6 4 12 0" fill="none" stroke="#fff3c4" stroke-width="1.6"/>
        <path d="M43 73q7 3 14 0" fill="none" stroke="#ffd166" stroke-width="2"/>
        <path d="M50 70l-6-4v8zM50 70l6-4v8z" fill="#ffd166" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="50" cy="70" r="1.6" fill="#e2725b" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "glam-cape",
      name: "披风",
      en: "Cape",
      category: "outfit",
      route: "glam",
      rarity: "rare",
      price: 90,
      hint: "走路带一点风，气势就出来了。",
      svg: `<g>
        <path d="M38 54q12 6 24 0l10 33q-22 8-44 0z" fill="#6b5bd2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M36 62q-4 10-3 20M64 62q4 10 3 20" fill="none" stroke="#8b7ce8" stroke-width="1.2"/>
        <path d="M42 57q8 5 16 0" fill="none" stroke="#ffd166" stroke-width="2.4"/>
        <circle cx="50" cy="57" r="2.2" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "glam-tuxedo",
      name: "燕尾服",
      en: "Tuxedo",
      category: "outfit",
      route: "glam",
      rarity: "epic",
      price: 130,
      hint: "后面有两片尾巴，坐下会压到。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 16q-9 3-18 0l-2-16-7-4z" fill="#242b3d" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 56l6 7 6-7 3 4-9 8-9-8z" fill="#fffaf2" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M47 63l3-2 3 2-3 18z" fill="#e2725b" stroke="#4a3b32" stroke-width="1" stroke-linejoin="round"/>
        <path d="M56 78l8 8q-2 3-5 3l-5-9z" fill="#1a2030" stroke="#4a3b32" stroke-width="1.4" stroke-linejoin="round"/>
        <circle cx="50" cy="68" r="1" fill="#ffd166"/>
        <circle cx="50" cy="76" r="1" fill="#ffd166"/>
      </g>`
    },
    {
      id: "glam-ballgown",
      name: "蓬蓬礼服",
      en: "Ball Gown",
      category: "outfit",
      route: "glam",
      rarity: "epic",
      price: 160,
      hint: "裙摆太宽，转个身要小心。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l4 8-6 3-1 7 12 18q-17 6-34 0l12-18-1-7-6-3z" fill="#b48cf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 66q7 3 14 0" fill="none" stroke="#fff3ff" stroke-width="1.6"/>
        <path d="M39 78q11 5 22 0" fill="none" stroke="#e6d6ff" stroke-width="1.2"/>
        <circle cx="50" cy="70" r="2.4" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "glam-fur",
      name: "毛披肩",
      en: "Fur Stole",
      category: "outfit",
      route: "glam",
      rarity: "epic",
      price: 150,
      hint: "蓬蓬的一圈，脖子看起来更短了。",
      svg: `<g>
        <path d="M36 56q14 8 28 0 4 6 0 10-14 6-28 0-4-4 0-10z" fill="#f3e2d4" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M39 58q3 5 0 8M47 58q3 5 0 8M55 58q3 5 0 8M63 58q3 5 0 8" fill="none" stroke="#d9c3a8" stroke-width="1"/>
        <circle cx="50" cy="63" r="2" fill="#fff" stroke="#4a3b32" stroke-width=".8"/>
        <circle cx="42" cy="64" r="1.4" fill="#fff" stroke="#4a3b32" stroke-width=".6"/>
        <circle cx="58" cy="64" r="1.4" fill="#fff" stroke="#4a3b32" stroke-width=".6"/>
      </g>`
    },
    {
      id: "glam-sequin",
      name: "亮片裙",
      en: "Sequin Dress",
      category: "outfit",
      route: "glam",
      rarity: "epic",
      price: 180,
      hint: "一动就闪，想低调都难。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l5 9-6 3-1 8 6 13q-13 4-26 0l6-13-1-8-6-3z" fill="#2f55c9" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="44" cy="70" r="1.2" fill="#8ec5ff"/>
        <circle cx="50" cy="67" r="1.2" fill="#fffaf2"/>
        <circle cx="56" cy="70" r="1.2" fill="#8ec5ff"/>
        <circle cx="47" cy="77" r="1.2" fill="#fffaf2"/>
        <circle cx="53" cy="77" r="1.2" fill="#fffaf2"/>
        <circle cx="50" cy="83" r="1.2" fill="#8ec5ff"/>
      </g>`
    },
    {
      id: "glam-pearl",
      name: "珍珠裙",
      en: "Pearl Dress",
      category: "outfit",
      route: "glam",
      rarity: "epic",
      price: 210,
      hint: "每一颗都小小的，但都很认真。",
      svg: `<g>
        <path d="M41 55q9 5 18 0l5 9-6 3-2 8 7 14q-14 4-28 0l7-14-2-8-6-3z" fill="#f7f2e8" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="44" cy="62" r="1.2" fill="#fff" stroke="#c9bda5" stroke-width=".6"/>
        <circle cx="49" cy="64" r="1.2" fill="#fff" stroke="#c9bda5" stroke-width=".6"/>
        <circle cx="54" cy="62" r="1.2" fill="#fff" stroke="#c9bda5" stroke-width=".6"/>
        <circle cx="45" cy="69" r="1.2" fill="#fff" stroke="#c9bda5" stroke-width=".6"/>
        <circle cx="55" cy="69" r="1.2" fill="#fff" stroke="#c9bda5" stroke-width=".6"/>
        <circle cx="50" cy="73" r="1.6" fill="#ffd166" stroke="#4a3b32" stroke-width=".7"/>
      </g>`
    },
    {
      id: "glam-velvet",
      name: "丝绒西装",
      en: "Velvet Suit",
      category: "outfit",
      route: "glam",
      rarity: "epic",
      price: 190,
      hint: "摸起来很软，看起来又很正式。",
      svg: `<g>
        <path d="M38 55q12 7 24 0l6 10-7 4-2 15q-9 3-18 0l-2-15-7-4z" fill="#5a2f6b" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 56l6 7 6-7 3 4-9 8-9-8z" fill="#7d4a94" stroke="#4a3b32" stroke-width="1.2" stroke-linejoin="round"/>
        <circle cx="50" cy="68" r="1" fill="#ffd166"/>
        <circle cx="50" cy="76" r="1" fill="#ffd166"/>
        <path d="M50 62v20" stroke="#3f1f4d" stroke-width="1"/>
      </g>`
    },
    {
      id: "glam-royalcape",
      name: "皇家披风",
      en: "Royal Cape",
      category: "outfit",
      route: "glam",
      rarity: "legendary",
      price: 260,
      hint: "披上以后，连背单词都像在宣旨。",
      svg: `<g>
        <path d="M37 54q13 7 26 0l12 35q-25 9-50 0z" fill="#7b1f3a" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M34 60q-5 12-3 22M66 60q5 12 3 22" fill="none" stroke="#c9a227" stroke-width="2"/>
        <path d="M40 57q10 5 20 0" fill="none" stroke="#ffd166" stroke-width="2.6"/>
        <path d="M50 60v25" stroke="#c9a227" stroke-width="1.2"/>
        <circle cx="50" cy="58" r="2.4" fill="#ffd166" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "glam-starcape",
      name: "星纹披风",
      en: "Star Cape",
      category: "outfit",
      route: "glam",
      rarity: "legendary",
      price: 280,
      hint: "每一颗星都是背下来过的一个词。",
      svg: `<g>
        <path d="M37 54q13 7 26 0l11 34q-24 8-48 0z" fill="#1f2a55" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 64l1.6 3.4 3.7.5-2.7 2.6.6 3.7-3.2-1.7-3.2 1.7.6-3.7-2.7-2.6 3.7-.5z" fill="#ffe8a3"/>
        <path d="M56 72l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" fill="#8ec5ff"/>
        <circle cx="50" cy="82" r="1.4" fill="#fffaf2"/>
        <circle cx="40" cy="78" r="1.2" fill="#fffaf2"/>
      </g>`
    },
    {
      id: "glam-coronation",
      name: "加冕礼裙",
      en: "Coronation Gown",
      category: "outfit",
      route: "glam",
      rarity: "legendary",
      price: 320,
      hint: "裙摆上的金线，是一针一针缝的。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l5 9-6 3-1 7 10 17q-16 6-32 0l10-17-1-7-6-3z" fill="#c9a227" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 66q7 3 14 0" fill="none" stroke="#fff3c4" stroke-width="1.6"/>
        <path d="M50 66v22" stroke="#e0b93c" stroke-width="1.4"/>
        <circle cx="50" cy="61" r="2.4" fill="#e2725b" stroke="#4a3b32" stroke-width=".8"/>
        <circle cx="44" cy="80" r="1.4" fill="#fffaf2"/>
        <circle cx="56" cy="80" r="1.4" fill="#fffaf2"/>
      </g>`
    },
    {
      id: "glam-bridal",
      name: "婚纱",
      en: "Bridal Gown",
      category: "outfit",
      route: "glam",
      rarity: "legendary",
      price: 300,
      hint: "裙摆很长，走慢一点才好看。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l4 8-6 3-1 6 13 20q-18 7-36 0l13-20-1-6-6-3z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M44 66q6 3 12 0" fill="none" stroke="#dce9ff" stroke-width="1.6"/>
        <path d="M38 80q12 6 24 0" fill="none" stroke="#dce9ff" stroke-width="1.2"/>
        <circle cx="50" cy="70" r="2" fill="#fff" stroke="#8ec5ff" stroke-width=".8"/>
        <path d="M46 84h8" stroke="#dce9ff" stroke-width="1"/>
      </g>`
    },

    /* ---------- 衣服 · 抽象路线 12 套 ---------- */
    {
      id: "abs-cloud",
      name: "云朵披风",
      en: "Cloud Cloak",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 100,
      hint: "轻得像没穿，但确实穿着。",
      svg: `<g>
        <path d="M37 56q-6 8-4 16 6 0 10 3 2-6 7-8 5 2 7 8 4-3 10-3 2-8-4-16-12-6-26 0z" fill="#dce9ff" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M40 64q10 4 20 0M40 73q10 4 20 0" fill="none" stroke="#fffaf2" stroke-width="1.6"/>
      </g>`
    },
    {
      id: "abs-bubble",
      name: "泡泡服",
      en: "Bubble Suit",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 95,
      hint: "每走一步，泡泡就换一个位置。",
      svg: `<g>
        <path d="M37 55q13 8 26 0l7 12-8 5-1 14q-9 3-18 0l-1-14-8-5z" fill="#8ec5ff" fill-opacity=".75" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="45" cy="68" r="3.4" fill="none" stroke="#fff" stroke-width="1.2"/>
        <circle cx="55" cy="74" r="4" fill="none" stroke="#fff" stroke-width="1.2"/>
        <circle cx="48" cy="80" r="2.4" fill="none" stroke="#fff" stroke-width="1"/>
      </g>`
    },
    {
      id: "abs-orbit",
      name: "轨道裙",
      en: "Orbit Dress",
      category: "outfit",
      route: "abstract",
      rarity: "epic",
      price: 130,
      hint: "裙摆外面还绕着两圈轨道。",
      svg: `<g>
        <path d="M42 55q8 4 16 0l5 9-6 3-1 8 9 15q-15 5-30 0l9-15-1-8-6-3z" fill="#2b3242" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="50" cy="74" rx="17" ry="5" fill="none" stroke="#ffd166" stroke-width="1.8"/>
        <ellipse cx="50" cy="76" rx="19" ry="6.5" fill="none" stroke="#8ec5ff" stroke-width="1.2"/>
        <circle cx="35" cy="73" r="1.8" fill="#ffd166"/>
        <circle cx="65" cy="77" r="1.5" fill="#8ec5ff"/>
        <path d="M44 66q6 3 12 0" fill="none" stroke="#4a5578" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "abs-static",
      name: "静电T恤",
      en: "Static Tee",
      category: "outfit",
      route: "abstract",
      rarity: "common",
      price: 60,
      hint: "头发会竖起来一点点，很合理。",
      svg: `<g>
        <path d="M40 55q10 5 20 0l5 9-6 3v14q-9 3-18 0V67l-6-3z" fill="#2b3242" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 62l5 6-3 4 4 5M58 62l-5 6 3 4-4 5" fill="none" stroke="#ffd166" stroke-width="1.2"/>
        <path d="M48 60h4l-2 5z" fill="#8ec5ff"/>
      </g>`
    },
    {
      id: "abs-pixel",
      name: "像素披风",
      en: "Pixel Cape",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 90,
      hint: "边缘一格一格的，像没加载完。",
      svg: `<g>
        <rect x="35" y="56" width="30" height="8" fill="#6b5bd2" stroke="#4a3b32" stroke-width="1.4"/>
        <rect x="31" y="64" width="38" height="8" fill="#8ec5ff" stroke="#4a3b32" stroke-width="1.4"/>
        <rect x="28" y="72" width="44" height="8" fill="#ffd166" stroke="#4a3b32" stroke-width="1.4"/>
        <rect x="26" y="80" width="48" height="8" fill="#e2725b" stroke="#4a3b32" stroke-width="1.4"/>
      </g>`
    },
    {
      id: "abs-ghost",
      name: "床单幽灵",
      en: "Ghost Sheet",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 70,
      hint: "只是扮一下，不会真的飘起来。",
      svg: `<g>
        <path d="M37 54q13 8 26 0l4 26q-3 3-6 1l-3 3-3-3-4 3-3-3-3 3-3-3-2 2-2-2z" fill="#f7fbff" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="45" cy="68" r="1.6" fill="#4a3b32"/>
        <circle cx="55" cy="68" r="1.6" fill="#4a3b32"/>
        <path d="M46 73q4 3 8 0" fill="none" stroke="#4a3b32" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "abs-rainbow",
      name: "彩虹连体衣",
      en: "Rainbow Suit",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 110,
      hint: "从头到脚都写着今天心情不错。",
      svg: `<g>
        <path d="M37 55q13 8 26 0l7 12-8 5-1 13q-10 4-20 0l-1-13-8-5z" fill="#fffaf2" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M38 61q12 5 24 0" fill="none" stroke="#e2725b" stroke-width="2.4"/>
        <path d="M37 68q13 5 26 0" fill="none" stroke="#ffd166" stroke-width="2.4"/>
        <path d="M37 75q13 5 26 0" fill="none" stroke="#7fb98a" stroke-width="2.4"/>
        <path d="M38 82q12 4 24 0" fill="none" stroke="#8ec5ff" stroke-width="2.4"/>
      </g>`
    },
    {
      id: "abs-noodle",
      name: "面条装",
      en: "Noodle Suit",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 85,
      hint: "看起来很好吃，但请别真咬。",
      svg: `<g>
        <path d="M40 55q10 5 20 0l5 9-6 3v15q-9 3-18 0V67l-6-3z" fill="#fff3c4" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M42 60q6 8 2 16M46 60q5 10 0 18M52 60q-4 10 1 18M57 60q-6 8-2 16" fill="none" stroke="#e8c887" stroke-width="1.6"/>
        <circle cx="50" cy="68" r="2.4" fill="#f4b26f" stroke="#4a3b32" stroke-width=".8"/>
      </g>`
    },
    {
      id: "abs-tvbox",
      name: "电视机纸箱",
      en: "TV Box",
      category: "outfit",
      route: "abstract",
      rarity: "rare",
      price: 75,
      hint: "屏幕里只有一个台，正在背单词。",
      svg: `<g>
        <path d="M36 56h28v26H36z" fill="#c98a4b" stroke="#4a3b32" stroke-width="2"/>
        <rect x="40" y="61" width="20" height="13" rx="2" fill="#2b3242" stroke="#4a3b32" stroke-width="1.4"/>
        <path d="M44 64q4-2 7 1" fill="none" stroke="#8ec5ff" stroke-width="1.2"/>
        <circle cx="46" cy="71" r="1" fill="#ffd166"/>
        <circle cx="54" cy="69" r="1.2" fill="#ffd166"/>
        <path d="M36 56q7-5 14 0M50 56q7-5 14 0" fill="none" stroke="#a9713a" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "abs-cardboard",
      name: "纸箱盔甲",
      en: "Cardboard Armor",
      category: "outfit",
      route: "abstract",
      rarity: "common",
      price: 65,
      hint: "胶带贴了三层，应该够结实。",
      svg: `<g>
        <path d="M39 56q11 5 22 0l4 9-5 3v13q-8 3-16 0V68l-5-3z" fill="#c98a4b" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M43 57v20M57 57v20" stroke="#a9713a" stroke-width="1.2"/>
        <path d="M38 67q12 4 24 0" stroke="#a9713a" stroke-width="1.4"/>
        <path d="M44 74h12" stroke="#8b5a2b" stroke-width="1.2"/>
      </g>`
    },
    {
      id: "abs-void",
      name: "虚空披风",
      en: "Void Cloak",
      category: "outfit",
      route: "abstract",
      rarity: "epic",
      price: 200,
      hint: "披风里没有口袋，只有一片安静。",
      svg: `<g>
        <path d="M37 54q13 8 26 0l11 34q-24 8-48 0z" fill="#14182b" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <path d="M40 62q10 5 20 0M39 72q11 5 22 0M38 81q12 4 24 0" fill="none" stroke="#6b5bd2" stroke-width="1.2" opacity=".8"/>
        <circle cx="42" cy="66" r="1" fill="#fffaf2"/>
        <circle cx="58" cy="70" r=".9" fill="#fffaf2"/>
        <circle cx="48" cy="78" r=".8" fill="#8ec5ff"/>
      </g>`
    },
    {
      id: "abs-galaxy",
      name: "星河身体",
      en: "Galaxy Body",
      category: "outfit",
      route: "abstract",
      rarity: "legendary",
      price: 240,
      hint: "身体里装着一小片宇宙，别问怎么装的。",
      svg: `<g>
        <path d="M37 55q13 8 26 0l7 12-8 5-1 13q-10 4-20 0l-1-13-8-5z" fill="#1f2a55" stroke="#4a3b32" stroke-width="2" stroke-linejoin="round"/>
        <ellipse cx="50" cy="72" rx="13" ry="9" fill="#3a3f8f" opacity=".7"/>
        <circle cx="44" cy="67" r="1.4" fill="#fffaf2"/>
        <circle cx="55" cy="70" r="1.1" fill="#8ec5ff"/>
        <circle cx="48" cy="78" r="1.2" fill="#ffd166"/>
        <circle cx="58" cy="81" r=".9" fill="#fffaf2"/>
        <circle cx="42" cy="82" r=".8" fill="#8ec5ff"/>
        <path d="M40 60q8 4 18 1" fill="none" stroke="#b48cf2" stroke-width="1.4" opacity=".8"/>
      </g>`
    }
  ];

  // 老存档里没有 category / route，统一补默认值，保证 100 件都能被筛选到
  items.forEach((item) => {
    if (!item.category) item.category = "accessory";
    if (item.category === "outfit" && !item.route) item.route = "daily";
  });

  const byId = new Map(items.map((item) => [item.id, item]));

  function svgOf(id) {
    const item = byId.get(String(id || ""));
    return item ? item.svg : "";
  }

  window.LIZZWORD_LIZZ_ACCESSORIES = {
    RARITY,
    ROUTES,
    CATEGORY_LABELS,
    items,
    byId,
    svgOf,
    headFragment,
    bodyFragment,
    figureFragment
  };
})();
