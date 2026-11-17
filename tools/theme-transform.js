/* 把站点 CSS 里的硬编码颜色换成带 fallback 的变量，并生成 theme.css。
   默认（light）取值与原值完全一致，所以不改变现有外观。 */
const fs = require('fs');

const FILES = [
  { path: 'index.html', styleOnly: true },
  { path: 'books/lizz/lizz.css' },
  { path: 'books/lizz/study.css' },
  { path: 'books/lizz/account.css' },
  { path: 'books/lizz/games/games.css' }
];

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2, chroma = max - min;
  let h = 0, s = 0;
  if (chroma) {
    s = l > 0.5 ? chroma / (2 - max - min) : chroma / (max + min);
    if (max === r) h = ((g - b) / chroma) % 6;
    else if (max === g) h = (b - r) / chroma + 2;
    else h = (r - g) / chroma + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s, l, chroma };
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  const to = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}
const norm = (hex) => {
  let h = hex.replace('#', '').toLowerCase();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return h;
};

/* 站点主底色 #f3f6fa 的明度，作为 paper/green 页面色的基准 */
const PAGE_REF_L = rgbToHsl(...hexToRgb('#f3f6fa')).l;

function rgbToHex(literal) {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(literal);
  if (!m) throw new Error('无法解析颜色: ' + literal);
  return '#' + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
}

function relLum(hex) {
  const f = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
}
function contrast(a, b) {
  const x = relLum(a), y = relLum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/* 护眼底色比纯白暗，原来的浅灰小字会看不清：按需要压深，色相不变 */
function readableOn(hex, bg, target) {
  let out = norm(hex).length === 6 ? '#' + norm(hex) : hex;
  for (let i = 0; i < 24 && contrast(out, bg) < target; i++) {
    out = '#' + hexToRgb(out).map((v) => Math.max(0, Math.round(v * 0.93)).toString(16).padStart(2, '0')).join('');
  }
  return out;
}

/* 家族判定：chroma 小的都算中性（浅蓝灰也是中性），避免把 #f3f6fa 当成彩色 */
function familyOf(hsl) {
  const { l, chroma } = hsl;
  if (chroma <= 0.16) {
    if (l >= 0.98) return 'card';
    if (l >= 0.93) return 'page';
    if (l >= 0.86) return 'panel';
    if (l >= 0.78) return 'line';
    if (l >= 0.60) return 'muted2';
    if (l >= 0.42) return 'muted1';
    if (l >= 0.26) return 'ink2';
    return 'ink1';
  }
  if (l >= 0.85) return 'tint';
  if (l >= 0.62) return 'tint2';
  if (l >= 0.45) return 'accent';
  return 'accentDeep';
}

const tokens = new Map(); // hex6[+aNN] -> { orig:Set, hsl, family, roles:Set, alpha }
/* 透明度后缀固定两位：hex6 恒为 6 位，加后缀恒为 9 位，
   这样 #7d6a55 这种本身以 aNN 结尾的颜色不会被误认成半透明 token */
const alphaKey = (hex, a) => norm(hex) + (a < 1 ? 'a' + String(Math.round(a * 100)).padStart(2, '0') : '');
function noteToken(hex, role, alpha) {
  const a = alpha == null ? 1 : alpha;
  const key = alphaKey(hex, a);
  if (!tokens.has(key)) {
    const rgb = hexToRgb(norm(hex));
    const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    tokens.set(key, { orig: new Set(), hsl, family: familyOf(hsl), roles: new Set(), alpha: a });
  }
  const t = tokens.get(key);
  t.orig.add('#' + norm(hex));
  t.roles.add(role);
}

const SKIP_PROPS = /^(box-shadow|text-shadow|fill|stroke|scrollbar-color)$/;
function roleOf(prop) {
  const p = prop.toLowerCase();
  if (p === 'color' || p === '-webkit-text-fill-color' || p === 'caret-color') return 'text';
  return 'bg';
}

function transformCss(css) {
  return css.replace(/([-a-zA-Z]+)\s*:\s*([^;{}]+)([;}])/g, (whole, prop, value, end) => {
    const p = prop.toLowerCase();
    // 自定义属性（--lz-skin-fur 等）是狐狸毛色/装扮调色板，不能跟着主题变
    if (p.startsWith('--')) return whole;
    if (SKIP_PROPS.test(p)) return whole;
    const trimmed = value.trim();
    if (!trimmed || trimmed[0] === '"' || trimmed[0] === "'") return whole;
    if (/url\(/i.test(value)) return whole;
    const role = roleOf(prop);
    const varName = (key) => (role === 'text' ? '--t' : '--c') + key;
    let hit = false;
    // 已经包裹过的部分先摘出来，只登记 token，保证脚本可重复运行
    const kept = [];
    let next = value.replace(/var\(--[ct][0-9a-f]{3,6}(?:a\d{2})?,\s*(?:#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))\)/gi, (m) => {
      kept.push(m);
      return '\u0000' + (kept.length - 1) + '\u0000';
    });
    for (const m of kept) {
      const g = /var\(--([ct])([0-9a-f]{3,6}(?:a\d{2})?),\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]*\))\)/i.exec(m);
      if (!g) continue;
      // 透明度以 fallback 字面量为准，不靠 key 猜（key 里的 aNN 可能只是颜色本身）
      const lit = g[3];
      const am = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)$/i.exec(lit);
      noteToken(lit[0] === '#' ? lit : rgbToHex(lit), g[1] === 't' ? 'text' : 'bg', am ? Number(am[1]) : 1);
    }
    next = next.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (m, body) => {
      noteToken('#' + body, role, 1);
      hit = true;
      return 'var(' + varName(norm('#' + body)) + ', #' + body.toLowerCase() + ')';
    });
    next = next.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi, (m, r, g, b, a) => {
      const alpha = a == null ? 1 : Number(a);
      if (alpha < 0.05) return m;
      const hex = rgbToHex(m);
      noteToken(hex, role, alpha);
      hit = true;
      const key = alphaKey(hex, alpha);
      return 'var(' + varName(key) + ', ' + m + ')';
    });
    next = next.replace(/\u0000(\d+)\u0000/g, (m, i) => kept[Number(i)]);
    return hit ? prop + ': ' + next.trim() + end : whole;
  });
}

/* 读取每个文件的 CSS 文本 */
const sources = FILES.map((f) => {
  const raw = fs.readFileSync(f.path, 'utf8');
  if (!f.styleOnly) return { ...f, raw, css: raw, pre: '', post: '' };
  const start = raw.indexOf('<style>');
  const end = raw.indexOf('</style>', start);
  if (start < 0 || end < 0) throw new Error('找不到 style 块: ' + f.path);
  return { ...f, raw, pre: raw.slice(0, start + 7), css: raw.slice(start + 7, end), post: raw.slice(end) };
});

/* 先整体替换，收集全部 token */
for (const s of sources) s.out = transformCss(s.css);

/* 生成各主题的取值 */
function valueFor(t, role, theme) {
  const { h, s, l } = t.hsl;
  const fam = t.family;
  const orig = [...t.orig][0];
  if (theme === 'light') return orig;
  const neutral = ['card', 'page', 'panel', 'line', 'muted2', 'muted1', 'ink2', 'ink1'].includes(fam);

  if (theme === 'dark') {
    if (neutral) {
      if (role === 'text') {
        return { card: '#f2f5fa', page: '#f2f5fa', panel: '#e9eef6', line: '#dfe6f0', muted2: '#8b98ab', muted1: '#a7b2c2', ink2: '#c6cedb', ink1: '#e9eef6' }[fam];
      }
      // 深色文字色被用作背景时（深色按钮/徽章）保持原样，只把浅色表面翻成深色
      if (['muted2', 'muted1', 'ink2', 'ink1'].includes(fam)) return orig;
      if (fam === 'page') {
        const dl = Math.max(0.075, Math.min(0.125, 0.085 + (l - 0.93) * 0.7));
        return hslToHex(222, 0.20, dl);
      }
      return { card: '#1b212a', panel: '#232b36', line: '#333d4b' }[fam];
    }
    if (role === 'text') {
      if (l >= 0.62) return orig;
      return hslToHex(h, Math.min(0.78, Math.max(s, 0.55)), 0.72);
    }
    if (fam === 'tint') return hslToHex(h, 0.30, 0.20);
    if (fam === 'tint2') return hslToHex(h, 0.28, 0.28);
    return orig;
  }

  /* paper / green：改中性表面与浅彩色底，并把偏浅的文字压到看得清 */
  const warm = theme === 'paper';
  const panelBg = warm ? '#efe8d8' : '#dcebd4';
  if (neutral && role === 'bg') {
    const map = warm
      ? { card: '#fffdf6', page: '#f5f0e3', panel: '#efe8d8', line: '#e0d6c1' }
      : { card: '#f6fbf3', page: '#e4f0dd', panel: '#dcebd4', line: '#c3d9bc' };
    if (map[fam]) {
      if (fam !== 'page') return map[fam];
      // 页面底色原本有深浅层次（渐变、分区），保留这点相对差，免得整页糊成一片
      const base = rgbToHsl(...hexToRgb(map.page));
      const dl = Math.max(-0.03, Math.min(0.03, (l - PAGE_REF_L) * 1.6));
      return hslToHex(base.h, base.s, base.l + dl);
    }
    return orig;
  }
  if (neutral && role === 'text') {
    const base = warm
      ? ({ muted2: '#8d887c', muted1: '#6b675e', ink2: '#4a4740', ink1: '#2b2a26' }[fam] || orig)
      : orig;
    return l < 0.8 ? readableOn(base, panelBg, 4.8) : base;
  }
  if (role === 'bg' && fam === 'tint') return hslToHex(h, 0.34, 0.94);
  if (role === 'bg' && fam === 'tint2') return hslToHex(h, 0.30, 0.88);
  if (role === 'text' && l < 0.8) return readableOn(orig, panelBg, 4.8);
  return orig;
}

/* 半透明色保留原来的透明度，只换底色 */
function paint(t, role, theme) {
  const hex = valueFor(t, role, theme);
  if (!t.alpha || t.alpha >= 1) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${t.alpha})`;
}

const THEMES = ['light', 'paper', 'green', 'dark'];
const keys = [...tokens.keys()].sort();
let css = `/* ============================================================
   LIZZWORD · 背景主题（由 tools/theme-transform.js 生成）
   ------------------------------------------------------------
   站点 CSS 里的颜色都写成 var(--cXXXXXX, 原色) / var(--tXXXXXX, 原色)：
   --c 用于背景与边框，--t 用于文字。light 取值与原设计完全一致，
   paper（护眼纸色）/ green（豆沙绿）/ dark（夜间）只覆盖需要变的量。
   重新生成：node tools/theme-transform.js
   ============================================================ */
:root {
  color-scheme: light;
`;
for (const k of keys) {
  const t = tokens.get(k);
  css += `  --c${k}: ${paint(t, 'bg', 'light')};\n`;
  if (t.roles.has('text')) css += `  --t${k}: ${paint(t, 'text', 'light')};\n`;
}
css += '}\n';

/* games.css 自带一套 --lzg-* 调色板，跟着主题一起覆盖 */
const LZG_PALETTE = [
  { name: '--lzg-ink', hex: '#3d3227', role: 'text' },
  { name: '--lzg-sub', hex: '#8b7965', role: 'text' },
  { name: '--lzg-green-soft', hex: '#e4f6ec', role: 'bg', family: 'tint' },
  { name: '--lzg-red-soft', hex: '#fde8e4', role: 'bg', family: 'tint' }
];
const lzgTokens = LZG_PALETTE.map((p) => {
  const rgb = hexToRgb(p.hex);
  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return { ...p, t: { orig: new Set([p.hex]), hsl, family: p.family || familyOf(hsl), roles: new Set([p.role]), alpha: 1 } };
});

const SELECTOR = { light: ':root', paper: 'html[data-theme="paper"]', green: 'html[data-theme="green"]', dark: 'html[data-theme="dark"]' };
for (const theme of THEMES.slice(1)) {
  const rows = [];
  for (const k of keys) {
    const t = tokens.get(k);
    const bg = paint(t, 'bg', theme);
    if (bg !== paint(t, 'bg', 'light')) rows.push(`  --c${k}: ${bg};`);
    if (t.roles.has('text')) {
      const tx = paint(t, 'text', theme);
      if (tx !== paint(t, 'text', 'light')) rows.push(`  --t${k}: ${tx};`);
    }
  }
  for (const p of lzgTokens) {
    const v = paint(p.t, p.role, theme);
    if (v !== paint(p.t, p.role, 'light')) rows.push(`  ${p.name}: ${v};`);
  }
  css += `\n${SELECTOR[theme]} {\n  color-scheme: ${theme === 'dark' ? 'dark' : 'light'};\n${rows.join('\n')}\n}\n`;
}

/* 主题选择器与浮层样式（手写，不参与 token 替换） */
css += `
/* ===== 主题选择器 ===== */
.theme-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--t64748b, #64748b);
}
.theme-pick select {
  font-family: inherit;
  font-size: 0.78rem;
  padding: 5px 8px;
  border-radius: 999px;
  border: 1px solid var(--ce5e9f0, #e5e9f0);
  background: var(--cffffff, #fff);
  color: var(--t475569, #475569);
  cursor: pointer;
}
html[data-theme="dark"] .theme-pick select { border-color: #333d4b; background: #232b36; color: #c6cedb; }
.theme-row { display: flex; justify-content: flex-end; margin-top: 10px; }
.theme-bar { display: flex; justify-content: flex-end; padding: 10px 14px 0; }
/* 插图是写死浅底的 SVG，夜间翻成深底，免得一大块白光刺眼 */
html[data-theme="dark"] .scene-art svg { filter: invert(0.94) hue-rotate(180deg); }
/* 翻牌背面在护眼浅色下变成近白，原来的白爪印会看不见，换成深棕 */
html[data-theme="paper"] .lzg-mcard-back,
html[data-theme="green"] .lzg-mcard-back { color: #3f2a12; }
`;

fs.writeFileSync('books/lizz/theme.css', css);
for (const s of sources) {
  const out = s.styleOnly ? s.pre + s.out + s.post : s.out;
  fs.writeFileSync(s.path, out);
}
console.log('tokens', keys.length, 'theme.css bytes', css.length);
const byFam = {};
for (const k of keys) { const f = tokens.get(k).family; byFam[f] = (byFam[f] || 0) + 1; }
console.log(byFam);