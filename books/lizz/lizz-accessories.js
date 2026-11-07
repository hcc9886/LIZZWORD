/* ============================================================
   Lizz · 200 件装扮（全部内联 SVG，无图片、无 CDN）
   - viewBox 统一 0 0 100 100，与小狐狸头部（圆心 50,38 / 半径 21）对齐
   - 描边沿用狐狸的 #4a3b32，配色沿用 #f4b26f / #fffaf2 / #ffd166
   - 50 件配饰（头/面部）+ 50 套衣服（学校 / 日常 / 华丽 / 抽象四条路线）
     + 50 对翅膀 + 50 件手持物
   - 衣服沿狐狸身体轮廓（肩 57 → 底 92）贴合，不是盖一块矩形
   - 翅膀画在身体两侧、避开头部；手持物贴在右前爪附近
   - 在 84px 的角落尺寸下仍能辨认：每个配件都控制在头部 / 身体周围
   - 对外：LIZZWORD_LIZZ_ACCESSORIES.items / byId / svgOf / RARITY / ROUTES /
          CATEGORY_LABELS / SLOTS / slotOf / thumbOf /
          headFragment / bodyFragment / figureFragment
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
    outfit: "衣服",
    wings: "翅膀",
    handheld: "手持物"
  };

  // 四个可以同时穿戴的部位，顺序即绘制顺序（从后到前）
  const SLOTS = ["wings", "outfit", "handheld", "accessory"];

  function slotOf(item) {
    if (!item) return "";
    return item.category;
  }

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

  /* ============================================================
     翅膀 / 手持物的绘制工具
     - 翅膀只画左半，右半用 translate(100 0) scale(-1 1) 镜像，
       保证左右严格对称、且不会越过 0..100 的坐标系
     - 手持物统一挂在右前爪（约 62,86）附近，避免挡住脸
     ============================================================ */
  const OUTLINE = "#4a3b32";

  function wingPair(inner) {
    return `<g>${inner}</g><g transform="translate(100 0) scale(-1 1)">${inner}</g>`;
  }

  function sparkle(cx, cy, r, fill) {
    const k = r * 0.3;
    return `<path d="M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z" fill="${fill}"/>`;
  }

  function star5(cx, cy, outer, inner, fill) {
    const points = [];
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      points.push(`${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`);
    }
    return `<polygon points="${points.join(" ")}" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }

  function heartShape(cx, cy, s, fill) {
    return `<path d="M${cx} ${cy + s}C${cx - s * 1.6} ${cy + s * 0.2} ${cx - s} ${cy - s * 1.2} ${cx} ${cy - s * 0.4}C${cx + s} ${cy - s * 1.2} ${cx + s * 1.6} ${cy + s * 0.2} ${cx} ${cy + s}Z" fill="${fill}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>`;
  }

  /* ---------- 翅膀：10 个家族 × 5 种变化 ---------- */
  function butterflyWing(v, c) {
    const shapes = [
      `<ellipse cx="17" cy="55" rx="13.5" ry="8.5" transform="rotate(-22 17 55)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8"/>
       <ellipse cx="20" cy="69" rx="9.5" ry="7" transform="rotate(14 20 69)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6"/>`,
      `<ellipse cx="16" cy="53" rx="14" ry="9.5" transform="rotate(-28 16 53)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8"/>
       <ellipse cx="22" cy="70" rx="10" ry="7.5" transform="rotate(18 22 70)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6"/>`,
      `<ellipse cx="14" cy="56" rx="12" ry="10" transform="rotate(-12 14 56)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8"/>
       <ellipse cx="24" cy="68" rx="8" ry="6" transform="rotate(26 24 68)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6"/>`,
      `<ellipse cx="18" cy="54" rx="15" ry="8" transform="rotate(-32 18 54)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8"/>
       <ellipse cx="19" cy="71" rx="11" ry="8" transform="rotate(10 19 71)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6"/>`,
      `<ellipse cx="16" cy="52" rx="12" ry="7" transform="rotate(-24 16 52)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8"/>
       <ellipse cx="12" cy="62" rx="10" ry="7.5" transform="rotate(-6 12 62)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <ellipse cx="19" cy="73" rx="9" ry="7" transform="rotate(18 19 73)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" opacity=".92"/>`
    ][v];
    const motifs = [
      `<circle cx="14" cy="53" r="2.1" fill="#fffaf2"/><circle cx="22" cy="50" r="1.4" fill="#fffaf2"/><circle cx="17" cy="70" r="1.6" fill="#fffaf2" opacity=".9"/>`,
      `<path d="M9 60Q16 52 26 57" fill="none" stroke="#fffaf2" stroke-width="1.4" opacity=".85"/><path d="M15 73Q20 68 25 73" fill="none" stroke="#fffaf2" stroke-width="1.2" opacity=".8"/>`,
      `${sparkle(13, 51, 3.2, "#fffaf2")}${sparkle(24, 68, 2.4, "#fffaf2")}`,
      `<circle cx="16" cy="54" r="3.4" fill="none" stroke="#fffaf2" stroke-width="1.2"/><circle cx="20" cy="70" r="2.2" fill="none" stroke="#fffaf2" stroke-width="1.1"/>`,
      `<circle cx="14" cy="51" r="1.8" fill="#fffaf2"/><circle cx="11" cy="61" r="1.4" fill="#fffaf2"/><circle cx="19" cy="72" r="1.5" fill="#fffaf2"/>`
    ][v];
    return wingPair(`${shapes}${motifs}`);
  }

  function featherWing(v, c) {
    return wingPair([
      `<path d="M35 57Q27 45 12 40Q18 52 19 59Q23 66 32 67Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M35 66Q27 60 15 63Q23 72 31 73Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M18 45Q24 53 27 61M23 51Q28 58 30 64" fill="none" stroke="#fffaf2" stroke-width="1.2" opacity=".8"/>`,
      `<path d="M35 56Q28 42 13 34Q19 48 21 56Q25 63 33 65Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M36 60Q30 50 19 46Q25 56 27 63Q30 68 35 69Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M36 67Q29 62 20 66Q27 74 33 75Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round" opacity=".85"/>`,
      `<path d="M35 56Q26 38 8 32Q16 50 18 58Q24 66 33 66Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M35 66Q28 54 16 52Q24 62 27 68Q31 71 35 70Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M15 39Q22 51 27 61M20 45Q26 56 30 63" fill="none" stroke="#fffaf2" stroke-width="1.1" opacity=".8"/>`,
      `<path d="M35 58Q30 48 20 44Q14 44 10 50Q16 56 22 64Q28 71 34 70Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M36 68Q30 66 22 70Q16 78 12 80Q20 82 28 80Q34 78 36 72Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M19 47Q24 57 28 65M22 68Q27 73 31 76" fill="none" stroke="#fffaf2" stroke-width="1.1" opacity=".8"/>`,
      `<path d="M36 58Q28 46 12 38Q17 50 20 58Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M36 60Q30 52 16 52Q20 60 24 64Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <path d="M36 66Q30 62 18 66Q22 72 28 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <path d="M36 72Q31 70 24 76Q28 82 34 80Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>`
    ][v]);
  }

  function batWing(v, c) {
    return wingPair([
      `<path d="M34 61L8 48Q5 56 12 59Q8 64 14 67Q10 72 17 75Q15 81 24 82Q29 83 33 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M12 57Q22 59 30 66M14 66Q21 68 27 73" fill="none" stroke="${c[1]}" stroke-width="1.3"/>`,
      `<path d="M34 58L10 42Q6 52 13 55Q8 62 15 65Q11 72 18 74Q15 80 24 82Q30 84 34 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M14 55Q22 60 30 67M16 66Q23 70 28 75" fill="none" stroke="${c[1]}" stroke-width="1.3"/>`,
      `<path d="M34 62L6 50Q4 60 11 62Q6 68 13 70Q9 76 17 77Q26 84 33 73Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M10 55Q18 58 26 64M12 65Q18 68 24 72M14 74Q19 76 23 79" fill="none" stroke="${c[1]}" stroke-width="1.1" opacity=".7"/>`,
      `<path d="M34 60L9 44Q7 54 14 57Q9 63 16 66Q12 73 20 75Q28 81 34 71Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       ${sparkle(18, 60, 3, c[1])}${sparkle(25, 72, 2.2, c[1])}`,
      `<path d="M34 59L7 46L15 54L11 60L19 63L16 70L24 72L22 79L29 77L34 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M10 50L15 54M13 60L19 63M17 70L24 72" fill="none" stroke="${c[1]}" stroke-width="1.2"/>`
    ][v]);
  }

  function dragonWing(v, c) {
    return wingPair([
      `<path d="M34 58L6 45L16 55L10 61L21 64L17 71L27 71L25 79L34 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M10 49L14 55L18 53L21 59L25 57" fill="none" stroke="${c[1]}" stroke-width="1.2" opacity=".8"/>`,
      `<path d="M34 56L4 44L15 54L8 60L20 63L15 70L26 69L23 78L34 73Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M8 48L15 54L20 48L26 55L31 50" fill="none" stroke="${c[1]}" stroke-width="1.2"/>`,
      `<path d="M34 60L7 42L17 54L11 58L22 62L16 68L27 70L24 78L34 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M12 52L16 58L22 55L26 62L31 58" fill="none" stroke="#fffaf2" stroke-width="1.2" opacity=".7"/>`,
      `<path d="M34 57L5 43L16 54L9 60L21 62L15 69L27 69L24 78L34 73Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M9 47L14 54L19 50L24 57L30 53" fill="none" stroke="${c[1]}" stroke-width="1.3"/>
       <circle cx="14" cy="58" r="1.4" fill="${c[1]}"/>`,
      `<path d="M34 61L4 50L12 56L8 62L17 64L13 71L22 72L20 80L29 78L34 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M10 54L15 58L20 55L24 62L29 60" fill="none" stroke="${c[1]}" stroke-width="1.1"/>`
    ][v]);
  }

  function crystalWing(v, c) {
    return wingPair([
      `<g stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round">
         <polygon points="34,58 16,46 10,58 22,68" fill="${c[0]}"/>
         <polygon points="30,68 18,64 14,78 26,80" fill="${c[1]}"/>
       </g>
       <path d="M16 46L22 68M10 58L22 68" stroke="#fffaf2" stroke-width="1" opacity=".7"/>`,
      `<g stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round">
         <polygon points="34,56 14,42 8,58 22,66" fill="${c[0]}"/>
         <polygon points="33,62 22,54 18,68 28,72" fill="${c[1]}"/>
         <polygon points="31,70 20,66 16,80 28,81" fill="${c[0]}" opacity=".9"/>
       </g>`,
      `<g stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round">
         <polygon points="34,58 12,44 8,60 22,70" fill="${c[0]}"/>
         <polygon points="34,64 18,60 14,76 26,78" fill="${c[1]}"/>
         <polygon points="28,52 20,44 16,58 24,62" fill="${c[2]}" opacity=".85"/>
       </g>`,
      `<g stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round">
         <polygon points="34,56 8,46 12,60 24,66" fill="${c[0]}"/>
         <polygon points="34,62 16,58 12,78 26,76" fill="${c[1]}"/>
       </g>
       ${sparkle(18, 56, 3.4, "#fffaf2")}${sparkle(26, 70, 2.2, "#fffaf2")}`,
      `<g stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round">
         <polygon points="34,58 18,42 10,52 16,60 8,64 20,70 16,80 28,78" fill="${c[0]}"/>
         <polygon points="32,58 22,50 20,64 28,68" fill="${c[1]}"/>
       </g>
       ${sparkle(15, 58, 3, "#fffaf2")}${sparkle(25, 73, 2.6, "#fffaf2")}`
    ][v]);
  }

  function petalWing(v, c) {
    return wingPair([
      `<ellipse cx="19" cy="55" rx="11" ry="6.5" transform="rotate(-28 19 55)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <ellipse cx="23" cy="65" rx="9" ry="6" transform="rotate(14 23 65)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.5"/>
       <ellipse cx="14" cy="66" rx="6" ry="8" transform="rotate(-8 14 66)" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.4" opacity=".9"/>`,
      `<ellipse cx="18" cy="54" rx="12" ry="7" transform="rotate(-32 18 54)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <ellipse cx="15" cy="62" rx="12" ry="6.5" transform="rotate(-6 15 62)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.5"/>
       <ellipse cx="24" cy="68" rx="9" ry="6" transform="rotate(20 24 68)" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.4"/>`,
      `<ellipse cx="20" cy="52" rx="8" ry="5" transform="rotate(-30 20 52)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.4"/>
       <ellipse cx="13" cy="60" rx="8" ry="5" transform="rotate(-10 13 60)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.4"/>
       <ellipse cx="21" cy="63" rx="9" ry="5.5" transform="rotate(24 21 63)" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.4"/>
       <ellipse cx="18" cy="72" rx="8" ry="5.5" transform="rotate(16 18 72)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.4"/>`,
      `<g transform="translate(24 60)" stroke="${OUTLINE}" stroke-width="1.2">
         ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<ellipse cx="0" cy="-11" rx="3.4" ry="8" fill="${i % 2 ? c[1] : c[0]}" transform="rotate(${i * 45})"/>`).join("")}
         <circle cx="0" cy="0" r="4" fill="#8b5a2b"/>
       </g>`,
      `<ellipse cx="19" cy="54" rx="12" ry="7" transform="rotate(-30 19 54)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" opacity=".94"/>
       <ellipse cx="22" cy="65" rx="10" ry="6" transform="rotate(16 22 65)" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.5" opacity=".94"/>
       <ellipse cx="14" cy="70" rx="7" ry="9" transform="rotate(-10 14 70)" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.5" opacity=".9"/>`
    ][v]);
  }

  function leafWing(v, c) {
    return wingPair([
      `<path d="M34 60Q22 50 8 53Q16 62 24 68Q30 71 34 65Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M33 68Q22 66 14 75Q24 80 32 76Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M16 56Q23 60 28 67" fill="none" stroke="#fffaf2" stroke-width="1.1" opacity=".8"/>`,
      `<path d="M34 60L12 48L18 58L10 62L20 68L16 76L26 74L32 68Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M16 52L20 60M13 64L21 69M18 73L24 72" fill="none" stroke="${c[1]}" stroke-width="1.2"/>`,
      `<path d="M34 62Q24 56 12 60Q18 66 26 72Q31 72 34 68Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M34 70Q22 68 13 76Q22 81 30 79Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M16 63Q22 66 26 70" fill="none" stroke="#fffaf2" stroke-width="1.1" opacity=".8"/>`,
      `<path d="M34 58Q24 48 12 50Q16 58 22 64Q28 68 34 66Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M28 68Q18 66 12 74Q20 80 28 78Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M16 54Q22 58 26 63M16 78Q20 72 24 68" fill="none" stroke="${c[2]}" stroke-width="1.2"/>`,
      `<path d="M34 62Q22 52 10 54Q14 62 20 68Q27 72 34 68Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round" opacity=".95"/>
       <path d="M34 70Q22 68 14 76Q22 82 30 79Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round" opacity=".95"/>
       <path d="M20 70Q26 64 30 60M18 74Q24 72 28 70" fill="none" stroke="${c[2]}" stroke-width="1.2"/>
       ${sparkle(22, 60, 2.4, "#fffaf2")}`
    ][v]);
  }

  function mechWing(v, c) {
    return wingPair([
      `<path d="M34 62L8 52L20 68L18 76L26 70L34 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M8 52L20 68" stroke="${c[1]}" stroke-width="1.2"/>`,
      `<path d="M35 58L12 50L10 62L24 66L20 76L35 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <circle cx="20" cy="61" r="3.6" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.3"/>
       <circle cx="20" cy="61" r="1.3" fill="${OUTLINE}"/>`,
      `<path d="M35 60L10 48L14 62L8 66L24 70L20 78L35 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <g transform="translate(22 60)" stroke="${OUTLINE}" stroke-width="1.2">
         ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="-1.4" y="-9" width="2.8" height="4" rx="1" fill="${c[1]}" transform="rotate(${i * 60})"/>`).join("")}
         <circle r="6" fill="${c[1]}"/>
         <circle r="2" fill="${OUTLINE}"/>
       </g>`,
      `<path d="M35 58L14 46Q8 54 14 60L10 64Q18 72 28 70L34 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M16 50Q24 56 30 64M12 60Q20 64 26 70" fill="none" stroke="${c[1]}" stroke-width="1.2"/>
       <circle cx="18" cy="56" r="2" fill="${c[2]}"/>`,
      `<path d="M35 60L8 46L16 58L10 63L22 66L18 74L29 72L34 76Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7" stroke-linejoin="round"/>
       <path d="M14 52L20 60L26 56L30 64" fill="none" stroke="${c[1]}" stroke-width="1.2"/>
       ${sparkle(22, 62, 2.6, c[2])}`
    ][v]);
  }

  function flameWing(v, c) {
    return wingPair([
      `<path d="M34 68Q26 66 19 58Q18 64 12 66Q20 74 17 82Q26 83 34 75Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M31 66Q25 60 23 53Q27 61 31 65Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.2"/>`,
      `<path d="M34 70Q24 68 16 60Q16 68 10 66Q16 74 14 82Q24 84 34 76Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M32 68Q24 64 20 56Q24 66 30 68Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <path d="M28 74Q22 72 18 64Q22 72 27 74Z" fill="#fffaf2" opacity=".8"/>`,
      `<path d="M34 68Q26 64 20 54Q18 62 12 64Q18 72 16 80Q24 84 34 76Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M33 66Q26 60 24 50Q28 60 33 66Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <path d="M30 75Q24 72 20 64Q24 72 30 75Z" fill="${c[2]}"/>`,
      `<path d="M34 70Q26 66 20 56Q18 64 12 62Q16 70 12 78Q20 86 30 80L34 76Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M34 62Q28 54 22 46Q26 58 30 62Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <path d="M33 72Q26 68 22 60Q26 70 31 73Z" fill="${c[2]}"/>
       <circle cx="24" cy="74" r="1.5" fill="#fffaf2"/>`,
      `<path d="M34 66Q24 62 18 52Q18 60 12 60Q18 68 16 76Q24 82 34 76Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M34 72Q26 70 20 62Q24 72 30 74Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       ${[0, 1, 2, 3].map((i) => `<path d="M${30 - i * 6} ${56 + i * 2}q-2-6 1-10" fill="none" stroke="#fffaf2" stroke-width="1" opacity=".7"/>`).join("")}`
    ][v]);
  }

  function starryWing(v, c) {
    return wingPair([
      `<path d="M34 58Q22 46 6 48Q13 57 17 62Q12 71 22 75Q28 82 34 73Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       ${sparkle(14, 58, 2.8, "#fffaf2")}${sparkle(22, 69, 1.9, "#ffd166")}<circle cx="10" cy="65" r="1.2" fill="#fffaf2"/><circle cx="27" cy="64" r="1" fill="#8ec5ff"/>`,
      `<path d="M34 56Q22 44 4 50Q12 58 16 62Q10 70 20 74Q26 82 34 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       ${sparkle(13, 57, 3.2, "#fffaf2")}${sparkle(23, 68, 2.2, "#ffd166")}
       <path d="M4 50L14 56M6 55L15 60" fill="none" stroke="#8ec5ff" stroke-width="1" opacity=".8"/>`,
      `<path d="M34 60Q24 48 8 46Q10 58 18 62Q12 70 20 76Q28 82 34 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <ellipse cx="18" cy="61" rx="7" ry="5" fill="${c[1]}" opacity=".5"/>
       ${sparkle(12, 55, 2.4, "#fffaf2")}${sparkle(24, 70, 2.8, "#fffaf2")}<circle cx="16" cy="68" r="1.1" fill="#ffd166"/>`,
      `<path d="M34 57Q24 46 6 44Q14 54 18 58Q12 66 20 70Q16 76 26 78Q31 82 34 72Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M8 50Q18 54 24 63M10 60Q18 60 23 68" fill="none" stroke="${c[1]}" stroke-width="2" opacity=".7"/>
       ${sparkle(20, 58, 2.2, "#fffaf2")}`,
      `<path d="M34 60Q24 46 8 48Q14 58 18 62Q12 70 22 76Q28 82 34 74Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <ellipse cx="20" cy="62" rx="8" ry="7" fill="none" stroke="${c[1]}" stroke-width="2" transform="rotate(-20 20 62)"/>
       <circle cx="20" cy="62" r="3" fill="${c[1]}"/>
       ${sparkle(11, 54, 2.2, "#fffaf2")}${sparkle(28, 74, 2.4, "#fffaf2")}`
    ][v]);
  }

  /* ---------- 手持物：10 个家族 × 5 种变化 ---------- */
  function balloonProp(v, c) {
    const string = `<path d="M62 86Q68 72 73 59" fill="none" stroke="#8b5a2b" stroke-width="1.3"/>`;
    const shapes = [
      `${string}<ellipse cx="74" cy="47" rx="9" ry="11" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7"/>
       <path d="M72 58l2 2.4 2-2.4" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <ellipse cx="70" cy="43" rx="2.6" ry="3.6" fill="#fffaf2" opacity=".5"/>`,
      `${string}${heartShape(74, 48, 9, c[0])}
       <ellipse cx="70" cy="43" rx="2.2" ry="3" fill="#fffaf2" opacity=".45"/>`,
      `${string}${star5(74, 48, 10, 4.8, c[0])}${sparkle(86, 42, 2.6, "#fffaf2")}`,
      `${string}<path d="M64 52Q60 44 68 42Q70 34 79 37Q87 36 86 45Q93 48 86 53Q84 58 78 56Q74 60 70 56Q66 57 64 52Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <circle cx="72" cy="46" r="2" fill="#fffaf2" opacity=".7"/>`,
      `<path d="M62 86Q66 74 68 60M62 86Q70 74 76 62M62 86Q74 76 84 66" fill="none" stroke="#8b5a2b" stroke-width="1.3"/>
       <ellipse cx="68" cy="46" rx="7" ry="8.5" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5"/>
       <ellipse cx="76" cy="54" rx="7" ry="8.5" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.5"/>
       <ellipse cx="84" cy="64" rx="6.5" ry="8" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.5"/>
       <ellipse cx="85" cy="61" rx="1.8" ry="2.4" fill="#fffaf2" opacity=".5"/>`
    ][v];
    return shapes;
  }

  function wandProp(v, c) {
    const stick = `<path d="M60 86L72 58" fill="none" stroke="#8b5a2b" stroke-width="2.4" stroke-linecap="round"/>`;
    const shapes = [
      `${stick}${star5(75, 52, 9, 4.2, c[0])}${sparkle(86, 44, 2.6, "#fffaf2")}`,
      `${stick}<path d="M77 43A9 9 0 1 0 77 61A7 7 0 1 1 77 43Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       ${sparkle(86, 48, 2.4, "#fffaf2")}`,
      `${stick}${heartShape(76, 54, 9, c[0])}`,
      `${stick}<polygon points="76,42 85,53 76,65 67,53" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M76 46L76 61M70 53L82 53" stroke="#fffaf2" stroke-width="1" opacity=".65"/>
       ${sparkle(86, 44, 2.4, "#fffaf2")}`,
      `${stick}<path d="M68 54Q68 42 76 40Q84 42 84 54Q80 50 76 54Q72 50 68 54Z" fill="#fffaf2" stroke="${OUTLINE}" stroke-width="1.2"/>
       <path d="M69 51Q69 44 76 42Q83 44 83 51" fill="none" stroke="#e2725b" stroke-width="2"/>
       <path d="M70 48Q70 43 76 42Q82 43 82 48" fill="none" stroke="#ffd166" stroke-width="2"/>
       <path d="M72 46Q72 43 76 43Q80 43 80 46" fill="none" stroke="#8ec5ff" stroke-width="2"/>`
    ][v];
    return shapes;
  }

  function umbrellaProp(v, c) {
    const canopyPath = "M61 55Q78 33 95 55Q91 49 87 55Q83 49 79 55Q75 49 71 55Q67 49 63 55Q62 51 61 55Z";
    const handle = `<path d="M78 55V80Q78 86 73 84" fill="none" stroke="#8b5a2b" stroke-width="2.2" stroke-linecap="round"/>`;
    const shapes = [
      `${handle}<path d="${canopyPath}" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M78 38Q78 46 78 55" stroke="${c[1]}" stroke-width="1.1"/>`,
      `${handle}<path d="${canopyPath}" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <circle cx="70" cy="47" r="1.6" fill="${c[1]}"/><circle cx="78" cy="41" r="1.6" fill="${c[1]}"/><circle cx="86" cy="47" r="1.6" fill="${c[1]}"/>
       <circle cx="74" cy="51" r="1.4" fill="${c[1]}"/><circle cx="82" cy="51" r="1.4" fill="${c[1]}"/>`,
      `${handle}<path d="${canopyPath}" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <path d="M63 54q2 4 4 0q2 4 4 0q2 4 4 0q2 4 4 0q2 4 4 0q2 4 4 0" fill="none" stroke="${c[1]}" stroke-width="1.2"/>
       <circle cx="78" cy="36" r="2" fill="${c[1]}" stroke="${OUTLINE}" stroke-width=".8"/>`,
      `${handle}<path d="${canopyPath}" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       ${sparkle(70, 45, 2.6, "#fffaf2")}${sparkle(86, 47, 2.2, "#fffaf2")}<circle cx="79" cy="41" r="1.1" fill="#ffd166"/>`,
      `${handle}<path d="${canopyPath}" fill="#fffaf2" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M64 50Q78 35 92 50" fill="none" stroke="#e2725b" stroke-width="2.4"/>
       <path d="M67 46Q78 37 89 46" fill="none" stroke="#ffd166" stroke-width="2.2"/>
       <path d="M71 42Q78 38 85 42" fill="none" stroke="#8ec5ff" stroke-width="2"/>
       <path d="M75 40Q78 38 81 40" fill="none" stroke="#7fb98a" stroke-width="1.6"/>`
    ][v];
    return shapes;
  }

  function swordProp(v, c) {
    const shapes = [
      `<path d="M80 44L84 48L70 72L66 68Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M64 74L74 66" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/>
       <path d="M67 74L61 84" stroke="#8b5a2b" stroke-width="2.6" stroke-linecap="round"/>
       <circle cx="60" cy="86" r="2.2" fill="#ffd166" stroke="${OUTLINE}" stroke-width="1"/>`,
      `<path d="M82 40L86 44L68 74L64 70Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M62 72L74 64" stroke="${c[1]}" stroke-width="3.2" stroke-linecap="round"/>
       <path d="M65 75L60 85" stroke="#4a3b32" stroke-width="2.6" stroke-linecap="round"/>
       <circle cx="59" cy="87" r="2" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1"/>`,
      `<path d="M82 38L88 44L70 74L64 68Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8" stroke-linejoin="round"/>
       <path d="M62 70L74 64" stroke="#ffd166" stroke-width="3.4" stroke-linecap="round"/>
       <path d="M66 76L60 86" stroke="#8b5a2b" stroke-width="2.8" stroke-linecap="round"/>
       <circle cx="59" cy="88" r="2.4" fill="#8ec5ff" stroke="${OUTLINE}" stroke-width="1"/>`,
      `<path d="M80 42Q86 44 82 50L68 74L64 70Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       <path d="M80 42Q78 36 84 34Q82 40 80 44" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <path d="M62 72L74 64" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/>
       <path d="M65 75L60 85" stroke="#4a3b32" stroke-width="2.6" stroke-linecap="round"/>`,
      `<path d="M82 38L87 43L70 74L64 68Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6" stroke-linejoin="round"/>
       ${sparkle(80, 46, 3, "#fffaf2")}
       <path d="M62 70L74 64" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/>
       <path d="M66 76L60 86" stroke="#2b3242" stroke-width="2.8" stroke-linecap="round"/>
       <circle cx="59" cy="88" r="2.2" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1"/>`
    ][v];
    return shapes;
  }

  function bouquetProp(v, c) {
    const stems = `<path d="M62 86Q66 74 70 64M62 86Q70 76 76 68M62 86Q60 76 64 70" fill="none" stroke="#7fb98a" stroke-width="1.6"/>`;
    const shapes = [
      `${stems}${blossom(72, 60, 3.4, c[0], c[1])}${blossom(78, 67, 3, c[2], c[3])}${blossom(64, 68, 2.8, "#fff3c4", "#ffd166")}
       <path d="M68 72Q62 68 60 74" fill="${c[4]}" stroke="${OUTLINE}" stroke-width="1" stroke-linejoin="round"/>`,
      `${stems}<circle cx="71" cy="59" r="5.2" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.4"/><circle cx="71" cy="59" r="2.4" fill="none" stroke="#fffaf2" stroke-width="1"/>
       <circle cx="79" cy="66" r="4.6" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.4"/><circle cx="64" cy="69" r="4.2" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.4"/>
       <path d="M62 80Q68 84 76 80" fill="none" stroke="${c[2]}" stroke-width="1.4"/>`,
      `${stems}${sunflower(73, 60, 8)}
       <path d="M68 72Q62 68 60 74" fill="#7fb98a" stroke="${OUTLINE}" stroke-width="1" stroke-linejoin="round"/>`,
      `${stems}<path d="M70 62q-5-4-4-10 3 2 4 5 1-3 4-5 1 6-4 10z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>
       <path d="M78 68q-4-3-3-8 2 2 3 4 1-2 3-4 1 5-3 8z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.1" stroke-linejoin="round"/>
       <path d="M63 70q-4-3-3-8 2 2 3 4 1-2 3-4 1 5-3 8z" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.1" stroke-linejoin="round"/>`,
      `${stems}<circle cx="72" cy="60" r="4.4" fill="${c[0]}" opacity=".85" stroke="${OUTLINE}" stroke-width="1.2"/>
       <circle cx="79" cy="67" r="3.8" fill="${c[1]}" opacity=".85" stroke="${OUTLINE}" stroke-width="1.2"/>
       <circle cx="64" cy="69" r="3.4" fill="${c[2]}" opacity=".85" stroke="${OUTLINE}" stroke-width="1.2"/>
       ${sparkle(73, 54, 2.6, "#fffaf2")}${sparkle(84, 62, 2, "#fffaf2")}`
    ][v];
    return shapes;
  }

  function bookProp(v, c) {
    const shapes = [
      `<rect x="56" y="70" width="24" height="18" rx="2.4" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <path d="M61 70v18" stroke="${c[1]}" stroke-width="2"/>
       <path d="M66 76h9M66 80h7" stroke="#fffaf2" stroke-width="1.4"/>`,
      `<path d="M52 76Q62 70 70 76L70 88Q62 82 52 88Z" fill="#fffaf2" stroke="${OUTLINE}" stroke-width="1.4"/>
       <path d="M70 76Q78 70 86 76L86 88Q78 82 70 88Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.4"/>
       <path d="M56 79Q62 76 66 79M56 83Q62 80 66 83M74 79Q78 76 82 79" stroke="${c[1]}" stroke-width="1.1" fill="none"/>`,
      `<rect x="55" y="68" width="26" height="20" rx="3" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.8"/>
       <rect x="59" y="72" width="18" height="12" rx="1.6" fill="${c[1]}" opacity=".5"/>
       ${star5(68, 78, 5.4, 2.6, "#ffd166")}
       <path d="M55 80Q48 76 44 82M81 80Q88 76 92 82" fill="none" stroke="${c[2]}" stroke-width="1.2" opacity=".8"/>`,
      `<rect x="55" y="69" width="26" height="19" rx="2.4" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <circle cx="63" cy="76" r="1.2" fill="#fffaf2"/><circle cx="72" cy="74" r="1.2" fill="#fffaf2"/><circle cx="77" cy="82" r="1.2" fill="#fffaf2"/>
       <path d="M63 76L72 74L77 82M63 76L70 83" stroke="${c[1]}" stroke-width="1" fill="none"/>`,
      `<rect x="55" y="69" width="26" height="19" rx="2.6" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7"/>
       <rect x="58" y="72" width="20" height="13" rx="1.4" fill="none" stroke="${c[1]}" stroke-width="1.2"/>
       <path d="M81 72v13" stroke="${c[1]}" stroke-width="2.4"/>
       <circle cx="68" cy="78" r="2" fill="${c[1]}"/>`
    ][v];
    return shapes;
  }

  function lanternProp(v, c) {
    const stick = `<path d="M62 86L70 64" fill="none" stroke="#8b5a2b" stroke-width="1.8" stroke-linecap="round"/>`;
    const shapes = [
      `${stick}<ellipse cx="74" cy="73" rx="9" ry="11" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <path d="M65 73h18M67 66q7 5 14 0M67 80q7 5 14 0" fill="none" stroke="${c[1]}" stroke-width="1.1"/>
       <path d="M74 84v6" stroke="${c[1]}" stroke-width="1.2"/>`,
      `${stick}<ellipse cx="73" cy="75" rx="8" ry="9.5" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <ellipse cx="69" cy="60" rx="3" ry="8" transform="rotate(-14 69 60)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <ellipse cx="77" cy="60" rx="3" ry="8" transform="rotate(14 77 60)" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.2"/>
       <circle cx="70" cy="73" r="1.2" fill="${OUTLINE}"/><circle cx="76" cy="73" r="1.2" fill="${OUTLINE}"/>
       <path d="M72 79q1.5 2 3 0" fill="none" stroke="${OUTLINE}" stroke-width="1"/>`,
      `${stick}${star5(74, 72, 12, 5.4, c[0])}${sparkle(86, 64, 2.4, "#fffaf2")}`,
      `${stick}<path d="M78 64a10 10 0 1 0 0 18 8 8 0 1 1 0-18z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5"/>
       ${sparkle(83, 68, 2.2, "#fffaf2")}<path d="M74 84v4" stroke="${c[1]}" stroke-width="1.2"/>`,
      `${stick}<circle cx="74" cy="73" r="10" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <ellipse cx="74" cy="73" rx="14" ry="4" fill="none" stroke="${c[1]}" stroke-width="1.4" opacity=".8"/>
       ${sparkle(70, 70, 2.2, "#fffaf2")}<circle cx="79" cy="77" r="1" fill="#ffd166"/><circle cx="72" cy="79" r=".9" fill="#8ec5ff"/>`
    ][v];
    return shapes;
  }

  function pinwheelProp(v, c) {
    const stem = `<path d="M82 48L62 86" fill="none" stroke="#8b5a2b" stroke-width="2" stroke-linecap="round"/>`;
    const shapes = [
      `${stem}<g transform="translate(82 48)">
         <path d="M0 0L-3 -13Q8 -11 10 -2Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.3"/>
         <path d="M0 0L13 -3Q11 8 2 10Z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.3"/>
         <path d="M0 0L3 13Q-8 11 -10 2Z" fill="${c[2]}" stroke="${OUTLINE}" stroke-width="1.3"/>
         <path d="M0 0L-13 3Q-11 -8 -2 -10Z" fill="${c[3]}" stroke="${OUTLINE}" stroke-width="1.3"/>
         <circle r="2.6" fill="${OUTLINE}"/>
       </g>`,
      `${stem}<g transform="translate(82 48)">
         ${[0, 1, 2, 3, 4].map((i) => `<path d="M0 0L-3 -12Q7 -10 8 -2Z" fill="${c[i % c.length]}" stroke="${OUTLINE}" stroke-width="1.2" transform="rotate(${i * 72})"/>`).join("")}
         <circle r="2.4" fill="${OUTLINE}"/>
       </g>`,
      `${stem}<g transform="translate(82 48)">
         ${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="0" cy="-8" rx="3.2" ry="6" fill="${i % 2 ? c[1] : c[0]}" stroke="${OUTLINE}" stroke-width="1.1" transform="rotate(${i * 60})"/>`).join("")}
         <circle r="3" fill="#8b5a2b" stroke="${OUTLINE}" stroke-width="1"/>
       </g>`,
      `${stem}<g transform="translate(82 48)">
         ${[0, 1, 2, 3].map((i) => `<path d="M0 0L-2 -9L-8 -6L-4 -1Z" fill="${c[i % c.length]}" stroke="${OUTLINE}" stroke-width="1.1" transform="rotate(${i * 90})"/>`).join("")}
         <circle r="2.2" fill="${OUTLINE}"/>
       </g>`,
      `${stem}<g transform="translate(82 48)">
         ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M0 0L-3 -11Q8 -9 9 -2Z" fill="${c[i % c.length]}" opacity=".82" stroke="${OUTLINE}" stroke-width="1" transform="rotate(${i * 60})"/>`).join("")}
         ${sparkle(0, 0, 3.4, "#fffaf2")}
       </g>`
    ][v];
    return shapes;
  }

  function flagProp(v, c) {
    const pole = `<path d="M72 88V42" stroke="#8b5a2b" stroke-width="2.2" stroke-linecap="round"/>`;
    const shapes = [
      `${pole}<path d="M72 44Q81 41 90 46L90 58Q81 53 72 56Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>`,
      `${pole}<path d="M72 44L91 51L72 58Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <circle cx="81" cy="51" r="1.8" fill="#fffaf2"/>`,
      `${pole}<path d="M72 44Q82 41 90 46L90 60Q82 55 72 58Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <circle cx="81" cy="51" r="3.4" fill="#fffaf2"/><circle cx="79.8" cy="50" r="1" fill="${c[0]}"/><circle cx="82.2" cy="50" r="1" fill="${c[0]}"/>
       <path d="M79 55l4-4M79 51l4 4" stroke="#fffaf2" stroke-width="1.2"/>`,
      `${pole}<rect x="72" y="44" width="18" height="15" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.4"/>
       <path d="M72 44h6v6h6v-6h6M78 50h6v6h6v-6" fill="${c[1]}" stroke="${OUTLINE}" stroke-width=".8"/>`,
      `${pole}<path d="M72 44Q81 40 90 47Q84 52 90 58Q81 55 72 59Z" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.5" stroke-linejoin="round"/>
       <path d="M74 47Q80 44 86 48M74 53Q80 50 86 54" fill="none" stroke="${c[1]}" stroke-width="1.6" opacity=".8"/>`
    ][v];
    return shapes;
  }

  function plushProp(v, c) {
    return [
      `<circle cx="72" cy="73" r="9" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.7"/>
       <circle cx="66" cy="65" r="3.4" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.3"/>
       <circle cx="78" cy="65" r="3.4" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.3"/>
       <circle cx="69" cy="72" r="1.3" fill="${OUTLINE}"/><circle cx="75" cy="72" r="1.3" fill="${OUTLINE}"/>
       <ellipse cx="72" cy="78" rx="4" ry="3" fill="#fff3c4" stroke="${OUTLINE}" stroke-width=".8"/>
       <path d="M63 80Q60 87 66 88M81 80Q84 87 78 88" fill="none" stroke="${OUTLINE}" stroke-width="1.4"/>`,
      `<ellipse cx="72" cy="79" rx="10" ry="8" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <circle cx="72" cy="66" r="8" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <circle cx="69" cy="65" r="1.2" fill="${OUTLINE}"/><circle cx="75" cy="65" r="1.2" fill="${OUTLINE}"/>
       <path d="M72 68l4 2-4 2z" fill="${c[1]}" stroke="${OUTLINE}" stroke-width=".8"/>
       <path d="M63 78Q58 76 61 83" fill="none" stroke="${OUTLINE}" stroke-width="1.3"/>`,
      `<circle cx="72" cy="72" r="8.5" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <path d="M64 66l3-5 2 5M80 66l-3-5-2 5" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.2" stroke-linejoin="round"/>
       <circle cx="69" cy="71" r="1.2" fill="${OUTLINE}"/><circle cx="75" cy="71" r="1.2" fill="${OUTLINE}"/>
       <path d="M72 74l-2 2M72 74l2 2M64 74l-4-1M64 76l-4 2M80 74l4-1M80 76l4 2" stroke="${OUTLINE}" stroke-width="1" fill="none"/>
       <path d="M81 82q8 2 6-6" fill="none" stroke="${OUTLINE}" stroke-width="1.5"/>`,
      `${star5(73, 74, 12, 5.2, c[0])}
       <circle cx="69" cy="72" r="1.2" fill="${OUTLINE}"/><circle cx="77" cy="72" r="1.2" fill="${OUTLINE}"/>
       <path d="M71 77q2 2 4 0" fill="none" stroke="${OUTLINE}" stroke-width="1"/>
       ${sparkle(84, 66, 2.2, "#fffaf2")}`,
      `<circle cx="72" cy="75" r="9" fill="${c[0]}" stroke="${OUTLINE}" stroke-width="1.6"/>
       <path d="M66 65l-2-5 4 2M78 65l2-5-4 2" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.1" stroke-linejoin="round"/>
       <path d="M62 71q-7-2-5 6q0 4 4 3M82 71q7-2 5 6q0 4-4 3" fill="${c[1]}" stroke="${OUTLINE}" stroke-width="1.1" stroke-linejoin="round" opacity=".9"/>
       <circle cx="69" cy="74" r="1.3" fill="${OUTLINE}"/><circle cx="75" cy="74" r="1.3" fill="${OUTLINE}"/>
       <ellipse cx="72" cy="80" rx="3.6" ry="3" fill="#fff3c4" stroke="${OUTLINE}" stroke-width=".8"/>`
    ][v];
  }


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

  /* ===== 50 种翅膀：10 个家族 × 5 种变化，四档稀有度都有 ===== */
  const wingItems = [
    { id: "wing-butterfly-1", name: "花瓣蝶翼", en: "Petal Butterfly", category: "wings", rarity: "common", price: 35, hint: "像把春天折成了两半。", svg: butterflyWing(0, ["#ffb3c0", "#ffd9e2", "#fff3c4"]) },
    { id: "wing-butterfly-2", name: "粉蝶翼", en: "Pink Butterfly", category: "wings", rarity: "common", price: 50, hint: "轻轻一扇，好像就要飞起来。", svg: butterflyWing(1, ["#f7a8c4", "#ffd3e0", "#fffaf2"]) },
    { id: "wing-butterfly-3", name: "蓝蝶翼", en: "Blue Butterfly", category: "wings", rarity: "rare", price: 70, hint: "蓝色的小翅膀，适合安静地背书。", svg: butterflyWing(2, ["#8ec5ff", "#cfe7ff", "#fffaf2"]) },
    { id: "wing-butterfly-4", name: "星点蝶翼", en: "Star Butterfly", category: "wings", rarity: "rare", price: 95, hint: "翅膀上落着几颗小星星。", svg: butterflyWing(3, ["#b48cf2", "#e0d4ff", "#ffd166"]) },
    { id: "wing-butterfly-5", name: "幻彩蝶翼", en: "Prism Butterfly", category: "wings", rarity: "epic", price: 180, hint: "颜色会跟着心情变，别盯太久。", svg: butterflyWing(4, ["#ffd166", "#ffb3c0", "#8ec5ff"]) },

    { id: "wing-feather-1", name: "小白羽翼", en: "Snow Feather", category: "wings", rarity: "common", price: 50, hint: "最朴素，也最像天使的一对。", svg: featherWing(0, ["#fffaf2", "#f1f5f9", "#ffffff"]) },
    { id: "wing-feather-2", name: "云朵羽翼", en: "Cloud Feather", category: "wings", rarity: "rare", price: 75, hint: "软软的，像刚晒过的被子。", svg: featherWing(1, ["#f7fbff", "#dce9ff", "#fffaf2"]) },
    { id: "wing-feather-3", name: "金边羽翼", en: "Gilded Feather", category: "wings", rarity: "epic", price: 170, hint: "每一根羽毛都镶了金边。", svg: featherWing(2, ["#ffe8a3", "#ffd166", "#fffaf2"]) },
    { id: "wing-feather-4", name: "银月羽翼", en: "Silver Moon Feather", category: "wings", rarity: "epic", price: 220, hint: "月光落在羽毛上，凉凉的。", svg: featherWing(3, ["#e8eefc", "#c9d9ff", "#fffaf2"]) },
    { id: "wing-feather-5", name: "圣光羽翼", en: "Holy Light Feather", category: "wings", rarity: "legendary", price: 320, hint: "戴上它，走路都轻了半斤。", svg: featherWing(4, ["#fff3c4", "#fffaf2", "#ffd166"]) },

    { id: "wing-bat-1", name: "小蝙蝠翼", en: "Little Bat", category: "wings", rarity: "common", price: 40, hint: "万圣节限定，平时也能戴。", svg: batWing(0, ["#b08cc0", "#8e6aa8", "#d9c8e8"]) },
    { id: "wing-bat-2", name: "紫夜蝠翼", en: "Purple Night Bat", category: "wings", rarity: "rare", price: 70, hint: "夜里出门，颜色刚刚好。", svg: batWing(1, ["#7b48d8", "#4b2f8f", "#c7b3ff"]) },
    { id: "wing-bat-3", name: "血月蝠翼", en: "Blood Moon Bat", category: "wings", rarity: "epic", price: 160, hint: "有点凶，其实很怕黑。", svg: batWing(2, ["#b33a4a", "#7d2431", "#f1a0a8"]) },
    { id: "wing-bat-4", name: "黑曜蝠翼", en: "Obsidian Bat", category: "wings", rarity: "epic", price: 200, hint: "黑得发亮，像一块磨过的石头。", svg: batWing(3, ["#3a3f4f", "#23262f", "#8496b8"]) },
    { id: "wing-bat-5", name: "幽冥蝠翼", en: "Gloom Bat", category: "wings", rarity: "legendary", price: 300, hint: "传说中来自很远的夜。", svg: batWing(4, ["#1f2a55", "#14182b", "#8ec5ff"]) },

    { id: "wing-dragon-1", name: "小青龙翼", en: "Little Azure Dragon", category: "wings", rarity: "common", price: 60, hint: "鳞片还没长齐，先飞两步。", svg: dragonWing(0, ["#7fb98a", "#a8dcc0", "#e8f7ee"]) },
    { id: "wing-dragon-2", name: "赤龙翼", en: "Crimson Dragon", category: "wings", rarity: "rare", price: 100, hint: "红色的龙翼，扇一下有风。", svg: dragonWing(1, ["#e2725b", "#f2a08e", "#ffd166"]) },
    { id: "wing-dragon-3", name: "冰龙翼", en: "Frost Dragon", category: "wings", rarity: "epic", price: 190, hint: "边缘结着薄薄的一层霜。", svg: dragonWing(2, ["#8ec5ff", "#d6ebff", "#fffaf2"]) },
    { id: "wing-dragon-4", name: "金龙翼", en: "Gold Dragon", category: "wings", rarity: "legendary", price: 350, hint: "金色鳞片，看一眼就很贵。", svg: dragonWing(3, ["#ffd166", "#f0b429", "#fff3c4"]) },
    { id: "wing-dragon-5", name: "暗影龙翼", en: "Shadow Dragon", category: "wings", rarity: "legendary", price: 420, hint: "影子里的龙，只露出翅膀。", svg: dragonWing(4, ["#2b2a3d", "#4b3f72", "#b48cf2"]) },

    { id: "wing-crystal-1", name: "玻璃碎片翼", en: "Glass Shard", category: "wings", rarity: "common", price: 45, hint: "拼起来是一对，散开是很多片。", svg: crystalWing(0, ["#dce9ff", "#b9c8ff", "#fffaf2"]) },
    { id: "wing-crystal-2", name: "蓝水晶翼", en: "Blue Crystal", category: "wings", rarity: "rare", price: 90, hint: "像把海水冻成了翅膀。", svg: crystalWing(1, ["#8ec5ff", "#4d8fd6", "#d6ebff"]) },
    { id: "wing-crystal-3", name: "粉水晶翼", en: "Pink Crystal", category: "wings", rarity: "rare", price: 110, hint: "亮晶晶的，适合拍照。", svg: crystalWing(2, ["#ffb3c0", "#ff8fa8", "#ffe8a3"]) },
    { id: "wing-crystal-4", name: "紫晶翼", en: "Amethyst", category: "wings", rarity: "epic", price: 210, hint: "紫晶会随光换颜色。", svg: crystalWing(3, ["#b48cf2", "#7b48d8", "#e0d4ff"]) },
    { id: "wing-crystal-5", name: "星钻翼", en: "Star Diamond", category: "wings", rarity: "legendary", price: 380, hint: "据说一颗星星只有一对。", svg: crystalWing(4, ["#d6ebff", "#ffd166", "#fffaf2"]) },

    { id: "wing-petal-1", name: "小雏菊翼", en: "Daisy Petal", category: "wings", rarity: "common", price: 30, hint: "花瓣小小，飞起来有香味。", svg: petalWing(0, ["#fffaf2", "#ffd166", "#fff3c4"]) },
    { id: "wing-petal-2", name: "玫瑰花瓣翼", en: "Rose Petal", category: "wings", rarity: "rare", price: 65, hint: "每片花瓣都朝着太阳。", svg: petalWing(1, ["#f07a8a", "#ffb3c0", "#ffe8a3"]) },
    { id: "wing-petal-3", name: "樱花翼", en: "Cherry Blossom", category: "wings", rarity: "rare", price: 85, hint: "落下来的都是花瓣，不是雪。", svg: petalWing(2, ["#ffd6e2", "#ffb3c0", "#fff3ff"]) },
    { id: "wing-petal-4", name: "向日葵翼", en: "Sunflower", category: "wings", rarity: "epic", price: 140, hint: "背着太阳也能发光。", svg: petalWing(3, ["#ffd166", "#f0b429", "#fff3c4"]) },
    { id: "wing-petal-5", name: "彩虹花翼", en: "Rainbow Flower", category: "wings", rarity: "legendary", price: 260, hint: "把所有颜色都别在背后。", svg: petalWing(4, ["#ffb3c0", "#8ec5ff", "#a8dcc0"]) },

    { id: "wing-leaf-1", name: "嫩叶翼", en: "Fresh Leaf", category: "wings", rarity: "common", price: 30, hint: "春天刚发的新叶，软软的。", svg: leafWing(0, ["#a8dcc0", "#7fb98a", "#e8f7ee"]) },
    { id: "wing-leaf-2", name: "枫叶翼", en: "Maple Leaf", category: "wings", rarity: "common", price: 55, hint: "秋天专门做的颜色。", svg: leafWing(1, ["#e2725b", "#b33a4a", "#ffd166"]) },
    { id: "wing-leaf-3", name: "银杏翼", en: "Ginkgo", category: "wings", rarity: "rare", price: 70, hint: "像两把小小的金扇子。", svg: leafWing(2, ["#ffd166", "#e8c887", "#fff3c4"]) },
    { id: "wing-leaf-4", name: "藤蔓翼", en: "Vine", category: "wings", rarity: "rare", price: 95, hint: "藤条会自己找方向。", svg: leafWing(3, ["#7fb98a", "#5f9e73", "#8ec5ff"]) },
    { id: "wing-leaf-5", name: "生命之树翼", en: "Tree of Life", category: "wings", rarity: "epic", price: 190, hint: "背后长出一棵会发光的树。", svg: leafWing(4, ["#5f9e73", "#a8dcc0", "#ffd166"]) },

    { id: "wing-mech-1", name: "纸飞机翼", en: "Paper Plane", category: "wings", rarity: "common", price: 45, hint: "折一折就能飞，别拆开。", svg: mechWing(0, ["#fffaf2", "#dce9ff", "#8ec5ff"]) },
    { id: "wing-mech-2", name: "铁片翼", en: "Iron Plate", category: "wings", rarity: "rare", price: 75, hint: "叮当作响，但很结实。", svg: mechWing(1, ["#9db4d8", "#6b7fa8", "#dbe3ef"]) },
    { id: "wing-mech-3", name: "齿轮翼", en: "Gear Wing", category: "wings", rarity: "rare", price: 120, hint: "转起来有点吵，效率很高。", svg: mechWing(2, ["#c98a4b", "#8b5a2b", "#ffd166"]) },
    { id: "wing-mech-4", name: "蒸汽翼", en: "Steam Wing", category: "wings", rarity: "epic", price: 180, hint: "呼出一口气，就能滑翔。", svg: mechWing(3, ["#b08cc0", "#8e6aa8", "#ffd166"]) },
    { id: "wing-mech-5", name: "飞船翼", en: "Starship Wing", category: "wings", rarity: "epic", price: 240, hint: "像从很远的星球开过来的。", svg: mechWing(4, ["#8496b8", "#2b3242", "#ffd166"]) },

    { id: "wing-flame-1", name: "小火苗翼", en: "Little Flame", category: "wings", rarity: "common", price: 40, hint: "暖洋洋的，不会烫。", svg: flameWing(0, ["#ffd166", "#f4b26f", "#fff3c4"]) },
    { id: "wing-flame-2", name: "篝火翼", en: "Campfire", category: "wings", rarity: "rare", price: 80, hint: "围着一小堆火，适合讲故事。", svg: flameWing(1, ["#e2725b", "#ffd166", "#fff3c4"]) },
    { id: "wing-flame-3", name: "蓝焰翼", en: "Blue Flame", category: "wings", rarity: "epic", price: 170, hint: "冷焰，看着就很安静。", svg: flameWing(2, ["#8ec5ff", "#4d8fd6", "#d6ebff"]) },
    { id: "wing-flame-4", name: "凤凰翼", en: "Phoenix", category: "wings", rarity: "legendary", price: 370, hint: "传说烧过一次，又回来了。", svg: flameWing(3, ["#e2725b", "#ffd166", "#b33a4a"]) },
    { id: "wing-flame-5", name: "太阳翼", en: "Solar Wing", category: "wings", rarity: "legendary", price: 400, hint: "戴久了会觉得有点热。", svg: flameWing(4, ["#ffd166", "#f0b429", "#fffaf2"]) },

    { id: "wing-starry-1", name: "夜晚翼", en: "Night Sky", category: "wings", rarity: "common", price: 55, hint: "把夜空剪下来一对。", svg: starryWing(0, ["#2b3242", "#4a5878", "#fffaf2"]) },
    { id: "wing-starry-2", name: "流星翼", en: "Meteor", category: "wings", rarity: "rare", price: 100, hint: "飞过去的时候记得许愿。", svg: starryWing(1, ["#3a3f8f", "#6b5bd2", "#ffd166"]) },
    { id: "wing-starry-3", name: "银河翼", en: "Milky Way", category: "wings", rarity: "epic", price: 220, hint: "翅膀里有一条很慢的河。", svg: starryWing(2, ["#1f2a55", "#3a3f8f", "#b48cf2"]) },
    { id: "wing-starry-4", name: "极光翼", en: "Aurora", category: "wings", rarity: "legendary", price: 340, hint: "颜色会流动，像真的极光。", svg: starryWing(3, ["#2b2a3d", "#7fb98a", "#8ec5ff"]) },
    { id: "wing-starry-5", name: "黑洞翼", en: "Black Hole", category: "wings", rarity: "legendary", price: 410, hint: "别靠太近，会被吸走注意力。", svg: starryWing(4, ["#14182b", "#4b3f72", "#ffd166"]) }
  ];

  /* ===== 50 件手持物：10 个家族 × 5 种变化，四档稀有度都有 ===== */
  const handheldItems = [
    { id: "hand-balloon-1", name: "红气球", en: "Red Balloon", category: "handheld", rarity: "common", price: 30, hint: "线头抓得很紧，不会飞走。", svg: balloonProp(0, ["#e2725b"]) },
    { id: "hand-balloon-2", name: "爱心气球", en: "Heart Balloon", category: "handheld", rarity: "common", price: 45, hint: "一颗心，飘在爪子边。", svg: balloonProp(1, ["#ff8fa8"]) },
    { id: "hand-balloon-3", name: "星星气球", en: "Star Balloon", category: "handheld", rarity: "rare", price: 70, hint: "摘一颗星星当气球。", svg: balloonProp(2, ["#ffd166"]) },
    { id: "hand-balloon-4", name: "云朵气球", en: "Cloud Balloon", category: "handheld", rarity: "rare", price: 85, hint: "软绵绵，捏一下会回弹。", svg: balloonProp(3, ["#dce9ff"]) },
    { id: "hand-balloon-5", name: "彩虹气球", en: "Rainbow Balloons", category: "handheld", rarity: "epic", price: 160, hint: "三只气球，三种心情。", svg: balloonProp(4, ["#e2725b", "#ffd166", "#8ec5ff"]) },

    { id: "hand-wand-1", name: "星星魔杖", en: "Star Wand", category: "handheld", rarity: "common", price: 50, hint: "挥一下，单词就记住了。", svg: wandProp(0, ["#ffd166"]) },
    { id: "hand-wand-2", name: "月亮魔杖", en: "Moon Wand", category: "handheld", rarity: "rare", price: 75, hint: "弯弯的月亮，适合晚安。", svg: wandProp(1, ["#dce9ff"]) },
    { id: "hand-wand-3", name: "爱心魔杖", en: "Heart Wand", category: "handheld", rarity: "rare", price: 80, hint: "点一下，心就软了。", svg: wandProp(2, ["#ff8fa8"]) },
    { id: "hand-wand-4", name: "水晶魔杖", en: "Crystal Wand", category: "handheld", rarity: "epic", price: 180, hint: "水晶里好像有水在晃。", svg: wandProp(3, ["#8ec5ff"]) },
    { id: "hand-wand-5", name: "彩虹魔杖", en: "Rainbow Wand", category: "handheld", rarity: "legendary", price: 300, hint: "七种颜色，一次挥完。", svg: wandProp(4, ["#ffb3c0"]) },

    { id: "hand-umbrella-1", name: "小黄伞", en: "Little Yellow Umbrella", category: "handheld", rarity: "common", price: 45, hint: "晴天也撑着，图个好看。", svg: umbrellaProp(0, ["#ffd166", "#f0b429"]) },
    { id: "hand-umbrella-2", name: "波点伞", en: "Polka Dot Umbrella", category: "handheld", rarity: "rare", price: 70, hint: "雨点落在上面会弹开。", svg: umbrellaProp(1, ["#ffb3c0", "#fffaf2"]) },
    { id: "hand-umbrella-3", name: "花边伞", en: "Lace Umbrella", category: "handheld", rarity: "rare", price: 90, hint: "伞边一圈小花，雨天也甜。", svg: umbrellaProp(2, ["#a8dcc0", "#fffaf2"]) },
    { id: "hand-umbrella-4", name: "星空伞", en: "Starry Umbrella", category: "handheld", rarity: "epic", price: 190, hint: "伞下是一片小小的夜空。", svg: umbrellaProp(3, ["#2b3242", "#fffaf2"]) },
    { id: "hand-umbrella-5", name: "彩虹伞", en: "Rainbow Umbrella", category: "handheld", rarity: "legendary", price: 320, hint: "雨停了，伞还是彩虹色。", svg: umbrellaProp(4, ["#fffaf2"]) },

    { id: "hand-sword-1", name: "木剑", en: "Wooden Sword", category: "handheld", rarity: "common", price: 55, hint: "练习用的，打人不疼。", svg: swordProp(0, ["#c98a4b", "#8b5a2b"]) },
    { id: "hand-sword-2", name: "铁剑", en: "Iron Sword", category: "handheld", rarity: "rare", price: 80, hint: "有点重，但握得住。", svg: swordProp(1, ["#c9d9e8", "#ffd166"]) },
    { id: "hand-sword-3", name: "骑士剑", en: "Knight Sword", category: "handheld", rarity: "epic", price: 170, hint: "护手是金色的，很神气。", svg: swordProp(2, ["#dbe3ef", "#ffd166"]) },
    { id: "hand-sword-4", name: "火焰剑", en: "Flame Sword", category: "handheld", rarity: "epic", price: 230, hint: "剑身有火，烤棉花糖正好。", svg: swordProp(3, ["#e2725b", "#ffd166"]) },
    { id: "hand-sword-5", name: "星辰剑", en: "Star Sword", category: "handheld", rarity: "legendary", price: 360, hint: "剑尖上有一颗不肯落的星。", svg: swordProp(4, ["#3a3f8f", "#ffd166"]) },

    { id: "hand-bouquet-1", name: "小雏菊花束", en: "Daisy Bouquet", category: "handheld", rarity: "common", price: 40, hint: "刚摘的，还带着露水。", svg: bouquetProp(0, ["#fffaf2", "#ffd166", "#ffd6e2", "#ffe8a3", "#7fb98a"]) },
    { id: "hand-bouquet-2", name: "玫瑰捧花", en: "Rose Bouquet", category: "handheld", rarity: "rare", price: 75, hint: "送给谁都不太对，先自己拿着。", svg: bouquetProp(1, ["#f07a8a", "#ffb3c0", "#a8dcc0"]) },
    { id: "hand-bouquet-3", name: "向日葵花束", en: "Sunflower Bouquet", category: "handheld", rarity: "rare", price: 95, hint: "一大捧太阳，抱得动。", svg: bouquetProp(2, ["#ffd166"]) },
    { id: "hand-bouquet-4", name: "郁金香花束", en: "Tulip Bouquet", category: "handheld", rarity: "epic", price: 150, hint: "花苞还没开，正好。", svg: bouquetProp(3, ["#ffb3c0", "#ffd166", "#b48cf2"]) },
    { id: "hand-bouquet-5", name: "极光花束", en: "Aurora Bouquet", category: "handheld", rarity: "legendary", price: 280, hint: "花会发光，晚上更好看。", svg: bouquetProp(4, ["#7fb98a", "#8ec5ff", "#ffb3c0"]) },

    { id: "hand-book-1", name: "单词本", en: "Word Notebook", category: "handheld", rarity: "common", price: 35, hint: "随身带着，翻到哪背到哪。", svg: bookProp(0, ["#8ec5ff", "#2f55c9"]) },
    { id: "hand-book-2", name: "故事书", en: "Story Book", category: "handheld", rarity: "rare", price: 65, hint: "背完单词就奖励自己一页。", svg: bookProp(1, ["#f07a8a", "#b33a4a"]) },
    { id: "hand-book-3", name: "魔法书", en: "Magic Book", category: "handheld", rarity: "epic", price: 180, hint: "书页会自己翻，别吓到。", svg: bookProp(2, ["#4b2f8f", "#b48cf2", "#ffd166"]) },
    { id: "hand-book-4", name: "星图册", en: "Star Atlas", category: "handheld", rarity: "epic", price: 210, hint: "每一页都是一片天空。", svg: bookProp(3, ["#1f2a55", "#8ec5ff"]) },
    { id: "hand-book-5", name: "远古典籍", en: "Ancient Tome", category: "handheld", rarity: "legendary", price: 340, hint: "字有点旧，但还看得清。", svg: bookProp(4, ["#8b5a2b", "#ffd166"]) },

    { id: "hand-lantern-1", name: "纸灯笼", en: "Paper Lantern", category: "handheld", rarity: "common", price: 50, hint: "里面有一小团暖光。", svg: lanternProp(0, ["#ffb3c0", "#f07a8a"]) },
    { id: "hand-lantern-2", name: "兔子灯", en: "Rabbit Lantern", category: "handheld", rarity: "rare", price: 85, hint: "耳朵会晃，走路也晃。", svg: lanternProp(1, ["#ffe8a3", "#f0b429"]) },
    { id: "hand-lantern-3", name: "星星灯", en: "Star Lantern", category: "handheld", rarity: "epic", price: 160, hint: "星星形状的灯，挂哪都亮。", svg: lanternProp(2, ["#ffd166"]) },
    { id: "hand-lantern-4", name: "月亮灯", en: "Moon Lantern", category: "handheld", rarity: "epic", price: 200, hint: "一小瓣月亮，捧在爪子里。", svg: lanternProp(3, ["#dce9ff", "#8ec5ff"]) },
    { id: "hand-lantern-5", name: "银河灯", en: "Galaxy Lantern", category: "handheld", rarity: "legendary", price: 330, hint: "灯里转着一小片银河。", svg: lanternProp(4, ["#1f2a55", "#b48cf2"]) },

    { id: "hand-pinwheel-1", name: "四叶风车", en: "Four Leaf Pinwheel", category: "handheld", rarity: "common", price: 35, hint: "跑起来才转得欢。", svg: pinwheelProp(0, ["#e2725b", "#ffd166", "#8ec5ff", "#7fb98a"]) },
    { id: "hand-pinwheel-2", name: "彩虹风车", en: "Rainbow Pinwheel", category: "handheld", rarity: "rare", price: 70, hint: "四种颜色，四种转速。", svg: pinwheelProp(1, ["#e2725b", "#ffd166", "#7fb98a", "#8ec5ff", "#b48cf2"]) },
    { id: "hand-pinwheel-3", name: "花朵风车", en: "Flower Pinwheel", category: "handheld", rarity: "rare", price: 80, hint: "风一吹，像开了一朵花。", svg: pinwheelProp(2, ["#ffb3c0", "#ffe8a3"]) },
    { id: "hand-pinwheel-4", name: "星星风车", en: "Star Pinwheel", category: "handheld", rarity: "epic", price: 150, hint: "每片叶子都是一颗星。", svg: pinwheelProp(3, ["#ffd166", "#8ec5ff", "#ffb3c0", "#b48cf2"]) },
    { id: "hand-pinwheel-5", name: "极光风车", en: "Aurora Pinwheel", category: "handheld", rarity: "legendary", price: 300, hint: "转起来有极光的颜色。", svg: pinwheelProp(4, ["#7fb98a", "#8ec5ff", "#b48cf2", "#ffb3c0", "#ffd166"]) },

    { id: "hand-flag-1", name: "小旗子", en: "Little Flag", category: "handheld", rarity: "common", price: 30, hint: "给自己加油用的。", svg: flagProp(0, ["#8ec5ff"]) },
    { id: "hand-flag-2", name: "三角旗", en: "Pennant", category: "handheld", rarity: "rare", price: 60, hint: "小小的，举得很高。", svg: flagProp(1, ["#ffd166"]) },
    { id: "hand-flag-3", name: "海盗旗", en: "Pirate Flag", category: "handheld", rarity: "rare", price: 90, hint: "旗上画着骷髅，其实是贴纸。", svg: flagProp(2, ["#2b3242"]) },
    { id: "hand-flag-4", name: "冠军旗", en: "Champion Flag", category: "handheld", rarity: "epic", price: 170, hint: "先举着，迟早用得上。", svg: flagProp(3, ["#e2725b", "#fffaf2"]) },
    { id: "hand-flag-5", name: "极光旗", en: "Aurora Flag", category: "handheld", rarity: "legendary", price: 290, hint: "旗面会流动，像风有颜色。", svg: flagProp(4, ["#7fb98a", "#8ec5ff"]) },

    { id: "hand-plush-1", name: "小熊玩偶", en: "Little Bear", category: "handheld", rarity: "common", price: 55, hint: "毛有点旧了，还是最好抱。", svg: plushProp(0, ["#c98a4b"]) },
    { id: "hand-plush-2", name: "小鸭玩偶", en: "Little Duck", category: "handheld", rarity: "rare", price: 70, hint: "捏一下会叫，声音很轻。", svg: plushProp(1, ["#ffd166", "#f0b429"]) },
    { id: "hand-plush-3", name: "猫咪玩偶", en: "Little Cat", category: "handheld", rarity: "rare", price: 95, hint: "胡须是缝上去的。", svg: plushProp(2, ["#dbe3ef"]) },
    { id: "hand-plush-4", name: "星星玩偶", en: "Star Doll", category: "handheld", rarity: "epic", price: 180, hint: "抱着它，晚上不做噩梦。", svg: plushProp(3, ["#ffd166"]) },
    { id: "hand-plush-5", name: "龙龙玩偶", en: "Dragon Doll", category: "handheld", rarity: "legendary", price: 400, hint: "小是小，气势很足。", svg: plushProp(4, ["#7fb98a", "#a8dcc0"]) }
  ];

  items.push(...wingItems, ...handheldItems);

  // 老存档里没有 category / route，统一补默认值，保证 200 件都能被筛选到
  items.forEach((item) => {
    if (!item.category) item.category = "accessory";
    if (item.category === "outfit" && !item.route) item.route = "daily";
  });

  const byId = new Map(items.map((item) => [item.id, item]));

  function svgOf(id) {
    const item = byId.get(String(id || ""));
    return item ? item.svg : "";
  }

  // 图鉴 / 商店缩略图：按真实层序合成
  // 翅膀 → 身体（含衣服）→ 手持物 → 头部配饰
  function thumbOf(item) {
    if (!item) return "";
    if (item.category === "wings") return `${item.svg}${bodyFragment}${headFragment}`;
    if (item.category === "handheld") return `${bodyFragment}${item.svg}${headFragment}`;
    if (item.category === "outfit") return `${bodyFragment}${item.svg}${headFragment}`;
    return `${bodyFragment}${headFragment}${item.svg}`;
  }

  window.LIZZWORD_LIZZ_ACCESSORIES = {
    RARITY,
    ROUTES,
    CATEGORY_LABELS,
    SLOTS,
    slotOf,
    thumbOf,
    items,
    byId,
    svgOf,
    headFragment,
    bodyFragment,
    figureFragment
  };
})();
