/**
 * Creates the global CSS string for any platform app.
 *
 * @param {Object} theme
 * @param {string} theme.accent       - Primary accent color value (e.g. '#d4a843')
 * @param {string} theme.accentDim    - Dimmed accent (e.g. '#8a6a20')
 * @param {string} theme.accentGlow   - Glow rgba (e.g. 'rgba(212,168,67,0.15)')
 * @param {string} theme.accentHover  - Button hover background
 * @param {string} theme.accentShadow - Button hover box-shadow rgba
 * @param {string} [theme.btnTextColor='var(--bg)'] - Button primary text color
 * @param {string} [theme.ghostAccent] - Ghost button hover color (defaults to accent)
 * @param {string} [theme.hexShadow]  - Hex score drop-shadow rgba
 * @param {string} [theme.glowPulse50] - glowPulse keyframe 50% rgba
 * @param {string} [theme.extraVars=''] - Additional :root CSS variables
 * @param {string} [theme.extraKeyframes=''] - Additional @keyframes
 * @param {string} [theme.extraCSS=''] - Additional CSS rules
 */
export function createGlobalCSS(theme) {
  const {
    accent,
    accentDim,
    accentGlow,
    accentHover,
    accentShadow,
    btnTextColor = 'var(--bg)',
    ghostAccent = accent,
    hexShadow = accentShadow,
    glowPulse50 = accentShadow,
    extraVars = '',
    extraKeyframes = '',
    extraCSS = '',
  } = theme;

  return `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Space+Mono:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #050508;
    --surface: #0d0d14;
    --border: #1a1a28;
    --border-bright: #2a2a40;
    --text: #e2ddd6;
    --muted: #6b6580;
    --faint: #2a2535;
    --teal: #3dd6c8;
    --teal-dim: #1a7a72;
    --rose: #e86060;
    --green: #5dd68a;
    --amber: #e8a840;
    --cream: #f5f0e8;
    --cream-surface: #ede6d8;
    --cream-border: #d5cdb8;
    --cream-text: #1a1a1a;
    --cream-muted: #6b6560;
    ${extraVars}
  }
  body { background: var(--bg); color: var(--text); font-family: 'Space Mono', monospace; overflow-x: hidden; }
  ::selection { background: ${accentGlow}; }
  .serif { font-family: 'Playfair Display', Georgia, serif; }

  body::before {
    content: '';
    position: fixed; inset: 0; z-index: 9999; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
  @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px ${accentGlow}; } 50% { box-shadow: 0 0 40px ${glowPulse50}; } }
  @keyframes drawIn { from { stroke-dashoffset: 1000; } to { stroke-dashoffset: 0; } }
  @keyframes floatIn { from { opacity: 0; transform: translateY(20px) scale(0.8); } to { opacity: 1; transform: translateY(0) scale(1); } }
  @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes barGrowH { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  ${extraKeyframes}

  .animate-fade-up   { animation: fadeUp 0.7s ease forwards; }
  .animate-fade-up-1 { animation: fadeUp 0.7s 0.1s ease forwards; opacity:0; }
  .animate-fade-up-2 { animation: fadeUp 0.7s 0.2s ease forwards; opacity:0; }
  .animate-fade-up-3 { animation: fadeUp 0.7s 0.3s ease forwards; opacity:0; }
  .animate-fade-up-4 { animation: fadeUp 0.7s 0.4s ease forwards; opacity:0; }
  .animate-fade-up-5 { animation: fadeUp 0.7s 0.5s ease forwards; opacity:0; }
  .animate-fade-up-6 { animation: fadeUp 0.7s 0.6s ease forwards; opacity:0; }
  .animate-fade-up-7 { animation: fadeUp 0.7s 0.7s ease forwards; opacity:0; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 1px; position: relative; overflow: hidden; }
  .card::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,${accentDim},transparent); }

  .drop-zone { border: 1px dashed var(--border-bright); cursor: pointer; transition: all 0.3s; }
  .drop-zone:hover, .drop-zone.over { border-color: ${accent}; background: ${accentGlow}; }
  .drop-zone:hover .upload-icon { transform: translateY(-4px); color: ${accent}; }
  .upload-icon { transition: all 0.3s; color: var(--muted); }

  .btn-primary { background: ${accent}; color: ${btnTextColor}; border: none; padding: 14px 40px; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
  .btn-primary:hover { background: ${accentHover}; transform: translateY(-1px); box-shadow: 0 8px 32px ${accentShadow}; }

  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border-bright); padding: 10px 24px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; cursor: pointer; transition: all 0.2s; }
  .btn-ghost:hover { border-color: ${ghostAccent}; color: ${ghostAccent}; }

  .chapter { position: relative; padding: 100px 0; }
  .chapter-dark { background: var(--bg); color: var(--text); }
  .chapter-light { background: var(--cream); color: var(--cream-text); --text: var(--cream-text); --muted: var(--cream-muted); --faint: var(--cream-border); }
  .chapter-light .card { background: var(--cream-surface); border-color: var(--cream-border); }
  .chapter-light .card::before { background: linear-gradient(90deg,transparent,${accentDim},transparent); }

  .chapter-opener { min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px 24px; }

  .chapter-divider { width: 60px; height: 1px; background: ${accent}; margin: 0 auto; }

  .scroll-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s ease; }
  .scroll-reveal.visible { opacity: 1; transform: translateY(0); }
  .scroll-reveal-delay-1 { transition-delay: 0.1s; }
  .scroll-reveal-delay-2 { transition-delay: 0.2s; }
  .scroll-reveal-delay-3 { transition-delay: 0.3s; }
  .scroll-reveal-delay-4 { transition-delay: 0.4s; }

  .hex-score { filter: drop-shadow(0 0 24px ${hexShadow}); }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border-bright); }
  ${extraCSS}
`;
}
