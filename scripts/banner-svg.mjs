// Animated banner: start lights that count up and go out, and a scrolling chequered strip.
const MONO = "ui-monospace,'SF Mono',Consolas,'Liberation Mono',monospace";
const LIGHT_OFF = '#2a2a2e';
const LIGHT_ON = '#e10600';

function startLights() {
  const housing = '<rect x="486" y="24" width="146" height="36" rx="6" fill="#151518"/>';
  const lights = [0, 1, 2, 3, 4].map((i) => {
    const on = (0.1 + 0.1 * i).toFixed(2);
    return `<circle cx="${504 + i * 26}" cy="42" r="9" fill="${LIGHT_OFF}">` +
      `<animate attributeName="fill" calcMode="discrete" values="${LIGHT_OFF};${LIGHT_ON};${LIGHT_OFF};${LIGHT_OFF}" ` +
      `keyTimes="0;${on};0.65;1" dur="6s" repeatCount="indefinite"/></circle>`;
  }).join('');
  return housing + lights;
}

export function renderBanner({ helmetBase64, trophyBase64 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="160" viewBox="0 0 900 160" role="img" aria-label="João Vítor Mamede · Software Engineering · Full Stack Developer">` +
    `<defs>` +
    `<pattern id="check" width="20" height="20" patternUnits="userSpaceOnUse">` +
    `<rect width="20" height="20" fill="#ffffff"/><rect width="10" height="10" fill="#0b0b0d"/><rect x="10" y="10" width="10" height="10" fill="#0b0b0d"/>` +
    `</pattern>` +
    `<clipPath id="strip"><rect y="140" width="900" height="20"/></clipPath>` +
    `</defs>` +
    `<rect width="900" height="160" fill="#0b0b0d"/>` +
    `<rect width="10" height="160" fill="#e10600"/>` +
    `<text x="44" y="70" fill="#ffffff" font-family="${MONO}" font-size="34" font-weight="700" letter-spacing="2">JOÃO VÍTOR MAMEDE</text>` +
    `<text x="44" y="102" fill="#9a9aa2" font-family="${MONO}" font-size="15" letter-spacing="1">SOFTWARE ENGINEERING · FULL STACK DEVELOPER</text>` +
    `<rect x="44" y="116" width="48" height="4" fill="#e10600"/>` +
    startLights() +
    `<image href="data:image/png;base64,${helmetBase64}" x="650" y="14" width="124" height="107" style="image-rendering:pixelated"/>` +
    `<image href="data:image/png;base64,${trophyBase64}" x="790" y="16" width="78" height="104" style="image-rendering:pixelated"/>` +
    `<g clip-path="url(#strip)"><g>` +
    `<animateTransform attributeName="transform" type="translate" from="0 0" to="-20 0" dur="1.2s" repeatCount="indefinite"/>` +
    `<rect y="140" width="940" height="20" fill="url(#check)"/>` +
    `</g></g>` +
    `</svg>`;
}
