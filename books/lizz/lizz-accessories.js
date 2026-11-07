/* ============================================================
   Lizz · 20 种装扮（全部内联 SVG，无图片、无 CDN）
   - viewBox 统一 0 0 100 100，与小狐狸头部（圆心 50,38 / 半径 21）对齐
   - 描边沿用狐狸的 #4a3b32，配色沿用 #f4b26f / #fffaf2 / #ffd166
   - 在 84px 的角落尺寸下仍能辨认：每个配件都控制在头部周围
   - 对外：LIZZWORD_LIZZ_ACCESSORIES.items / byId / svgOf / RARITY / headFragment
   ============================================================ */
(function () {
  "use strict";

  const RARITY = {
    common: { key: "common", label: "普通", color: "#5f7188", bg: "#f1f5f9", border: "#dbe3ef" },
    rare: { key: "rare", label: "稀有", color: "#2f55c9", bg: "#eaf1ff", border: "#c9d9ff" },
    epic: { key: "epic", label: "史诗", color: "#7b48d8", bg: "#f3edff", border: "#ddcdfb" },
    legendary: { key: "legendary", label: "传说", color: "#b07800", bg: "#fff6dd", border: "#f3dfa5" }
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
    }
  ];

  const byId = new Map(items.map((item) => [item.id, item]));

  function svgOf(id) {
    const item = byId.get(String(id || ""));
    return item ? item.svg : "";
  }

  window.LIZZWORD_LIZZ_ACCESSORIES = {
    RARITY,
    items,
    byId,
    svgOf,
    headFragment
  };
})();
