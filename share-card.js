/* Canvas share card generator */
async function generateShareCardPNG({ score, avgCps, bestCps, dateText }) {
  const width = 1200, height = 630; // social card size
  const canvas = Object.assign(document.createElement('canvas'), { width, height });
  const ctx = canvas.getContext('2d');

  // Background
  const grd1 = ctx.createRadialGradient(width/2, -100, 50, width/2, height+100, width);
  grd1.addColorStop(0, 'rgba(0,229,255,0.14)');
  grd1.addColorStop(1, '#0B0F1A');
  ctx.fillStyle = grd1; ctx.fillRect(0,0,width,height);

  // Title
  ctx.font = '900 80px Inter, Arial, sans-serif';
  ctx.fillStyle = '#E6F1FF';
  ctx.fillText('Push The Button', 60, 150);

  // CTB neon
  ctx.font = '600 56px JetBrains Mono, monospace';
  ctx.fillStyle = '#00E5FF';
  ctx.shadowColor = '#00E5FF';
  ctx.shadowBlur = 22;
  ctx.fillText('CTB', 60, 230);
  ctx.shadowBlur = 0;

  // Stats panel
  ctx.fillStyle = '#0F1626'; ctx.globalAlpha = 0.9;
  roundRect(ctx, 60, 270, width-120, 220, 16, true);
  ctx.globalAlpha = 1;

  ctx.font = '600 24px Inter, Arial, sans-serif';
  ctx.fillStyle = '#93A4B7';
  ctx.fillText('Final score', 100, 325);
  ctx.fillText('Average CPS', 100, 385);
  ctx.fillText('Best 1s CPS', 100, 445);

  ctx.font = '800 48px Inter, Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(String(score), 340, 325);
  ctx.fillText(avgCps.toFixed(2), 340, 385);
  ctx.fillText(bestCps.toFixed(2), 340, 445);

  ctx.font = '600 22px Inter, Arial, sans-serif';
  ctx.fillStyle = '#93A4B7';
  ctx.fillText(dateText, 60, 540);

  // Big red circle for flair
  drawGlossyButton(ctx, width - 220, 170, 110);

  return canvas.toDataURL('image/png', 0.92);
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
}

function drawGlossyButton(ctx, x, y, radius) {
  // base
  const grd = ctx.createRadialGradient(x-30, y-20, radius*0.2, x, y, radius);
  grd.addColorStop(0, '#FF8080');
  grd.addColorStop(0.4, '#FF2E2E');
  grd.addColorStop(1, '#B00000');
  ctx.fillStyle = grd; ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2); ctx.fill();

  // gloss
  const gloss = ctx.createRadialGradient(x-30, y-35, radius*0.1, x-20, y-35, radius*0.6);
  gloss.addColorStop(0, 'rgba(255,255,255,.9)');
  gloss.addColorStop(0.4, 'rgba(255,255,255,.2)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss; ctx.beginPath();
  ctx.ellipse(x-20, y-35, radius*0.5, radius*0.35, 0, 0, Math.PI*2); ctx.fill();
}

window.generateShareCardPNG = generateShareCardPNG;
