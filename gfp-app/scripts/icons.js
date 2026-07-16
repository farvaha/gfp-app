const sharp = require('sharp');
const fs = require('fs');
const path = 'assets/images/';
fs.mkdirSync(path, { recursive: true });

// Brand dumbbell mark, tilted, orange gradient on graphite.
function mark(fg = null, plain = false) {
  const grad = fg
    ? ''
    : `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0" stop-color="#FF8A5B"/><stop offset="1" stop-color="#FF6A2B"/>
       </linearGradient>`;
  const fill = fg || 'url(#g)';
  return `
    <defs>${grad}</defs>
    <g transform="rotate(-32 512 512)">
      <rect x="332" y="492" width="360" height="40" rx="20" fill="${fill}"/>
      <rect x="252" y="392" width="90" height="240" rx="34" fill="${fill}"/>
      <rect x="682" y="392" width="90" height="240" rx="34" fill="${fill}"/>
      <rect x="182" y="437" width="52" height="150" rx="24" fill="${fill}"/>
      <rect x="790" y="437" width="52" height="150" rx="24" fill="${fill}"/>
      ${plain ? '' : '<circle cx="512" cy="308" r="26" fill="#15C2A5"/>'}
    </g>`;
}

const svg = (inner, bg) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${bg}${inner}</svg>`);

(async () => {
  // Main icon: graphite rounded square + mark
  await sharp(svg(mark(), `<rect width="1024" height="1024" rx="200" fill="#14181C"/>
    <rect x="6" y="6" width="1012" height="1012" rx="196" fill="none" stroke="rgba(255,138,91,0.25)" stroke-width="10"/>`))
    .png().toFile(path + 'icon.png');

  // Adaptive foreground: mark scaled into safe zone, transparent bg
  await sharp(svg(`<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${mark()}</g>`, ''))
    .png().toFile(path + 'android-icon-foreground.png');

  // Adaptive background: solid graphite
  await sharp(svg('', `<rect width="1024" height="1024" fill="#14181C"/>`))
    .png().toFile(path + 'android-icon-background.png');

  // Monochrome: white mark, transparent
  await sharp(svg(`<g transform="translate(512 512) scale(0.62) translate(-512 -512)">${mark('#ffffff', true)}</g>`, ''))
    .png().toFile(path + 'android-icon-monochrome.png');

  // Splash: mark on transparent (splash bg set to #14181C in app.json)
  await sharp(svg(mark(), '')).resize(512, 512).png().toFile(path + 'splash-icon.png');

  // Favicon
  await sharp(svg(mark(), `<rect width="1024" height="1024" rx="200" fill="#14181C"/>`))
    .resize(48, 48).png().toFile(path + 'favicon.png');

  console.log('icons done');
})();
