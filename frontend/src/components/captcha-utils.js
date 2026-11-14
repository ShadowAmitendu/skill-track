const CAPTCHA_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCaptchaCode(length = 6) {
  const chars = [];
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const buffer = new Uint32Array(length);
    window.crypto.getRandomValues(buffer);
    for (let i = 0; i < length; i += 1) {
      chars.push(CAPTCHA_ALPHABET[buffer[i] % CAPTCHA_ALPHABET.length]);
    }
  } else {
    for (let i = 0; i < length; i += 1) {
      chars.push(CAPTCHA_ALPHABET[Math.floor(Math.random() * CAPTCHA_ALPHABET.length)]);
    }
  }
  return chars.join("");
}

export function createSeededRng(seedText) {
  let state = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    state ^= seedText.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
