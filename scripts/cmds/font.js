const axios = require("axios");

module.exports = {
  config: {
    name: "font",
    aliases: ["fonts", "fstyle"],
    version: "2.0",
    author: "Rasel Mahmud",
    role: 0,
    shortDescription: "Convert text to stylish fonts",
    longDescription: "Transform your text into 50+ different stylish font styles",
    category: "fun",
    guide: {
      en: "{pn} <text> - Convert text\n{pn} list - Show all fonts\n{pn} preview <number> <text> - Preview specific font"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    
    if (!args[0]) {
      return api.sendMessage(
        createBox(`✏️ 𝐅𝐎𝐍𝐓 𝐂𝐎𝐍𝐕𝐄𝐑𝐓𝐄𝐑\n\n📌 𝐔𝐬𝐞: *font <text>\n📌 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: *font hello\n📌 𝐅𝐨𝐧𝐭 𝐋𝐢𝐬𝐭: *font list\n📌 𝐏𝐫𝐞𝐯𝐢𝐞𝐰: *font preview 5 hello`),
        threadID,
        messageID
      );
    }

    const input = args.join(" ").toLowerCase();
    
    // Font list command
    if (input === "list") {
      return showFontList(api, threadID, messageID);
    }
    
    // Preview specific font
    if (args[0] === "preview" && args[1]) {
      const fontNum = parseInt(args[1]);
      const text = args.slice(2).join(" ");
      
      if (isNaN(fontNum) || fontNum < 1 || fontNum > fonts.length) {
        return api.sendMessage(
          createBox(`❌ Invalid font number. Use numbers 1-${fonts.length}`),
          threadID,
          messageID
        );
      }
      
      if (!text) {
        return api.sendMessage(
          createBox(`❌ Please provide text to convert`),
          threadID,
          messageID
        );
      }
      
      return previewFont(api, threadID, messageID, fontNum, text);
    }
    
    // Convert text with all fonts
    return convertText(api, threadID, messageID, args.join(" "));
  }
};

// Font styles database - Now each font name is displayed in its own style
const fonts = [
  { id: 1, name: toBubble("Bubble"), func: (t) => toBubble(t) },
  { id: 2, name: toCircled("Circled"), func: (t) => toCircled(t) },
  { id: 3, name: toBoxed("Boxed"), func: (t) => toBoxed(t) },
  { id: 4, name: toBold("Bold"), func: (t) => toBold(t) },
  { id: 5, name: toItalic("Italic"), func: (t) => toItalic(t) },
  { id: 6, name: toBoldItalic("Bold Italic"), func: (t) => toBoldItalic(t) },
  { id: 7, name: toScript("Script"), func: (t) => toScript(t) },
  { id: 8, name: toBoldScript("Bold Script"), func: (t) => toBoldScript(t) },
  { id: 9, name: toFraktur("Fraktur"), func: (t) => toFraktur(t) },
  { id: 10, name: toDoubleStruck("Double Struck"), func: (t) => toDoubleStruck(t) },
  { id: 11, name: toSquared("Squares"), func: (t) => toSquared(t) },
  { id: 12, name: toCircles2("Circles"), func: (t) => toCircles2(t) },
  { id: 13, name: toMonospace("Monospace"), func: (t) => toMonospace(t) },
  { id: 14, name: toTwitter("Twitter"), func: (t) => toTwitter(t) },
  { id: 15, name: toSmallCaps("Small Caps"), func: (t) => toSmallCaps(t) },
  { id: 16, name: toSmallCaps2("Small Caps 2"), func: (t) => toSmallCaps2(t) },
  { id: 17, name: toSmallCaps3("Small Caps 3"), func: (t) => toSmallCaps3(t) },
  { id: 18, name: toUpDown("Up Down"), func: (t) => toUpDown(t) },
  { id: 19, name: toFlip("Flip"), func: (t) => toFlip(t) },
  { id: 20, name: toSuperScript("Super Script"), func: (t) => toSuperScript(t) },
  { id: 21, name: toSubScript("Sub Script"), func: (t) => toSubScript(t) },
  { id: 22, name: toAesthetic("Aesthetic"), func: (t) => toAesthetic(t) },
  { id: 23, name: toSymbols("Symbols"), func: (t) => toSymbols(t) },
  { id: 24, name: toCircled3("Circled 3"), func: (t) => toCircled3(t) },
  { id: 25, name: toFontA("Font A"), func: (t) => toFontA(t) },
  { id: 26, name: toFontB("Font B"), func: (t) => toFontB(t) },
  { id: 27, name: toFontC("Font C"), func: (t) => toFontC(t) },
  { id: 28, name: toFontD("Font D"), func: (t) => toFontD(t) },
  { id: 29, name: toFontE("Font E"), func: (t) => toFontE(t) },
  { id: 30, name: toFontF("Font F"), func: (t) => toFontF(t) },
  { id: 31, name: toSpecial1("Special 1"), func: (t) => toSpecial1(t) },
  { id: 32, name: toSpecial2("Special 2"), func: (t) => toSpecial2(t) },
  { id: 33, name: toSpecial3("Special 3"), func: (t) => toSpecial3(t) },
  { id: 34, name: toSpecial4("Special 4"), func: (t) => toSpecial4(t) },
  { id: 35, name: toSpecial5("Special 5"), func: (t) => toSpecial5(t) },
  { id: 36, name: toWings("Wings"), func: (t) => toWings(t) },
  { id: 37, name: toStars("Stars"), func: (t) => toStars(t) },
  { id: 38, name: toHearts("Hearts"), func: (t) => toHearts(t) },
  { id: 39, name: toFlowers("Flowers"), func: (t) => toFlowers(t) },
  { id: 40, name: toSansA("Sans A"), func: (t) => toSansA(t) },
  { id: 41, name: toSansB("Sans B"), func: (t) => toSansB(t) },
  { id: 42, name: toSansC("Sans C"), func: (t) => toSansC(t) },
  { id: 43, name: toSerifA("Serif A"), func: (t) => toSerifA(t) },
  { id: 44, name: toSerifB("Serif B"), func: (t) => toSerifB(t) },
  { id: 45, name: toCursive("Cursive"), func: (t) => toCursive(t) },
  { id: 46, name: toFancyA("Fancy A"), func: (t) => toFancyA(t) },
  { id: 47, name: toFancyB("Fancy B"), func: (t) => toFancyB(t) },
  { id: 48, name: toFancyC("Fancy C"), func: (t) => toFancyC(t) },
  { id: 49, name: toArabic("Arabic"), func: (t) => toArabic(t) },
  { id: 50, name: toCyrillic("Cyrillic"), func: (t) => toCyrillic(t) }
];

// Font conversion functions (same as before but updated)
function toBubble(text) {
  const bubbleMap = {
    'a': '🅐', 'b': '🅑', 'c': '🅒', 'd': '🅓', 'e': '🅔',
    'f': '🅕', 'g': '🅖', 'h': '🅗', 'i': '🅘', 'j': '🅙',
    'k': '🅚', 'l': '🅛', 'm': '🅜', 'n': '🅝', 'o': '🅞',
    'p': '🅟', 'q': '🅠', 'r': '🅡', 's': '🅢', 't': '🅣',
    'u': '🅤', 'v': '🅥', 'w': '🅦', 'x': '🅧', 'y': '🅨', 'z': '🅩',
    'A': '🅐', 'B': '🅑', 'C': '🅒', 'D': '🅓', 'E': '🅔',
    'F': '🅕', 'G': '🅖', 'H': '🅗', 'I': '🅘', 'J': '🅙',
    'K': '🅚', 'L': '🅛', 'M': '🅜', 'N': '🅝', 'O': '🅞',
    'P': '🅟', 'Q': '🅠', 'R': '🅡', 'S': '🅢', 'T': '🅣',
    'U': '🅤', 'V': '🅥', 'W': '🅦', 'X': '🅧', 'Y': '🅨', 'Z': '🅩'
  };
  return text.split('').map(char => bubbleMap[char] || char).join('');
}

function toCircled(text) {
  const circledMap = {
    'a': 'ⓐ', 'b': 'ⓑ', 'c': 'ⓒ', 'd': 'ⓓ', 'e': 'ⓔ',
    'f': 'ⓕ', 'g': 'ⓖ', 'h': 'ⓗ', 'i': 'ⓘ', 'j': 'ⓙ',
    'k': 'ⓚ', 'l': 'ⓛ', 'm': 'ⓜ', 'n': 'ⓝ', 'o': 'ⓞ',
    'p': 'ⓟ', 'q': 'ⓠ', 'r': 'ⓡ', 's': 'ⓢ', 't': 'ⓣ',
    'u': 'ⓤ', 'v': 'ⓥ', 'w': 'ⓦ', 'x': 'ⓧ', 'y': 'ⓨ', 'z': 'ⓩ',
    'A': 'Ⓐ', 'B': 'Ⓑ', 'C': 'Ⓒ', 'D': 'Ⓓ', 'E': 'Ⓔ',
    'F': 'Ⓕ', 'G': 'Ⓖ', 'H': 'Ⓗ', 'I': 'Ⓘ', 'J': 'Ⓙ',
    'K': 'Ⓚ', 'L': 'Ⓛ', 'M': 'Ⓜ', 'N': 'Ⓝ', 'O': 'Ⓞ',
    'P': 'Ⓟ', 'Q': 'Ⓠ', 'R': 'Ⓡ', 'S': 'Ⓢ', 'T': 'Ⓣ',
    'U': 'Ⓤ', 'V': 'Ⓥ', 'W': 'Ⓦ', 'X': 'Ⓧ', 'Y': 'Ⓨ', 'Z': 'Ⓩ'
  };
  return text.split('').map(char => circledMap[char] || char).join('');
}

function toBoxed(text) {
  const boxedMap = {
    'A': '🄰', 'B': '🄱', 'C': '🄲', 'D': '🄳', 'E': '🄴',
    'F': '🄵', 'G': '🄶', 'H': '🄷', 'I': '🄸', 'J': '🄹',
    'K': '🄺', 'L': '🄻', 'M': '🄼', 'N': '🄽', 'O': '🄾',
    'P': '🄿', 'Q': '🅀', 'R': '🅁', 'S': '🅂', 'T': '🅃',
    'U': '🅄', 'V': '🅅', 'W': '🅆', 'X': '🅇', 'Y': '🅈', 'Z': '🅉',
    'a': '🄰', 'b': '🄱', 'c': '🄲', 'd': '🄳', 'e': '🄴',
    'f': '🄵', 'g': '🄶', 'h': '🄷', 'i': '🄸', 'j': '🄹',
    'k': '🄺', 'l': '🄻', 'm': '🄼', 'n': '🄽', 'o': '🄾',
    'p': '🄿', 'q': '🅀', 'r': '🅁', 's': '🅂', 't': '🅃',
    'u': '🅄', 'v': '🅅', 'w': '🅆', 'x': '🅇', 'y': '🅈', 'z': '🅉'
  };
  return text.split('').map(char => boxedMap[char] || char).join('');
}

function toBold(text) {
  const boldMap = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲',
    'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
    'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼',
    'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
    'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘',
    'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
    'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢',
    'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
    'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

function toItalic(text) {
  const italicMap = {
    'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦',
    'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫',
    'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰',
    'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵',
    'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
    'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌',
    'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑',
    'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖',
    'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛',
    'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡'
  };
  return text.split('').map(char => italicMap[char] || char).join('');
}

function toBoldItalic(text) {
  const boldItalicMap = {
    'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚',
    'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟',
    'k': '𝙠', 'l': '𝙡', 'm': '𝙢', 'n': '𝙣', 'o': '𝙤',
    'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩',
    'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯',
    'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀',
    'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅',
    'K': '𝙆', 'L': '𝙇', 'M': '𝙈', 'N': '𝙉', 'O': '𝙊',
    'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏',
    'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕'
  };
  return text.split('').map(char => boldItalicMap[char] || char).join('');
}

function toScript(text) {
  const scriptMap = {
    'a': '𝒶', 'b': '𝒷', 'c': '𝒸', 'd': '𝒹', 'e': '𝑒',
    'f': '𝒻', 'g': '𝑔', 'h': '𝒽', 'i': '𝒾', 'j': '𝒿',
    'k': '𝓀', 'l': '𝓁', 'm': '𝓂', 'n': '𝓃', 'o': '𝑜',
    'p': '𝓅', 'q': '𝓆', 'r': '𝓇', 's': '𝓈', 't': '𝓉',
    'u': '𝓊', 'v': '𝓋', 'w': '𝓌', 'x': '𝓍', 'y': '𝓎', 'z': '𝓏',
    'A': '𝒜', 'B': 'ℬ', 'C': '𝒞', 'D': '𝒟', 'E': 'ℰ',
    'F': 'ℱ', 'G': '𝒢', 'H': 'ℋ', 'I': 'ℐ', 'J': '𝒥',
    'K': '𝒦', 'L': 'ℒ', 'M': 'ℳ', 'N': '𝒩', 'O': '𝒪',
    'P': '𝒫', 'Q': '𝒬', 'R': 'ℛ', 'S': '𝒮', 'T': '𝒯',
    'U': '𝒰', 'V': '𝒱', 'W': '𝒲', 'X': '𝒳', 'Y': '𝒴', 'Z': '𝒵'
  };
  return text.split('').map(char => scriptMap[char] || char).join('');
}

function toBoldScript(text) {
  const boldScriptMap = {
    'a': '𝓪', 'b': '𝓫', 'c': '𝓬', 'd': '𝓭', 'e': '𝓮',
    'f': '𝓯', 'g': '𝓰', 'h': '𝓱', 'i': '𝓲', 'j': '𝓳',
    'k': '𝓴', 'l': '𝓵', 'm': '𝓶', 'n': '𝓷', 'o': '𝓸',
    'p': '𝓹', 'q': '𝓺', 'r': '𝓻', 's': '𝓼', 't': '𝓽',
    'u': '𝓾', 'v': '𝓿', 'w': '𝔀', 'x': '𝔁', 'y': '𝔂', 'z': '𝔃',
    'A': '𝓐', 'B': '𝓑', 'C': '𝓒', 'D': '𝓓', 'E': '𝓔',
    'F': '𝓕', 'G': '𝓖', 'H': '𝓗', 'I': '𝓘', 'J': '𝓙',
    'K': '𝓚', 'L': '𝓛', 'M': '𝓜', 'N': '𝓝', 'O': '𝓞',
    'P': '𝓟', 'Q': '𝓠', 'R': '𝓡', 'S': '𝓢', 'T': '𝓣',
    'U': '𝓤', 'V': '𝓥', 'W': '𝓦', 'X': '𝓧', 'Y': '𝓨', 'Z': '𝓩'
  };
  return text.split('').map(char => boldScriptMap[char] || char).join('');
}

function toFraktur(text) {
  const frakturMap = {
    'a': '𝔞', 'b': '𝔟', 'c': '𝔠', 'd': '𝔡', 'e': '𝔢',
    'f': '𝔣', 'g': '𝔤', 'h': '𝔥', 'i': '𝔦', 'j': '𝔧',
    'k': '𝔨', 'l': '𝔩', 'm': '𝔪', 'n': '𝔫', 'o': '𝔬',
    'p': '𝔭', 'q': '𝔮', 'r': '𝔯', 's': '𝔰', 't': '𝔱',
    'u': '𝔲', 'v': '𝔳', 'w': '𝔴', 'x': '𝔵', 'y': '𝔶', 'z': '𝔷',
    'A': '𝔄', 'B': '𝔅', 'C': 'ℭ', 'D': '𝔇', 'E': '𝔈',
    'F': '𝔉', 'G': '𝔊', 'H': 'ℌ', 'I': 'ℑ', 'J': '𝔍',
    'K': '𝔎', 'L': '𝔏', 'M': '𝔐', 'N': '𝔑', 'O': '𝔒',
    'P': '𝔓', 'Q': '𝔔', 'R': 'ℜ', 'S': '𝔖', 'T': '𝔗',
    'U': '𝔘', 'V': '𝔙', 'W': '𝔚', 'X': '𝔛', 'Y': '𝔜', 'Z': 'ℨ'
  };
  return text.split('').map(char => frakturMap[char] || char).join('');
}

function toDoubleStruck(text) {
  const doubleMap = {
    'a': '𝕒', 'b': '𝕓', 'c': '𝕔', 'd': '𝕕', 'e': '𝕖',
    'f': '𝕗', 'g': '𝕘', 'h': '𝕙', 'i': '𝕚', 'j': '𝕛',
    'k': '𝕜', 'l': '𝕝', 'm': '𝕞', 'n': '𝕟', 'o': '𝕠',
    'p': '𝕡', 'q': '𝕢', 'r': '𝕣', 's': '𝕤', 't': '𝕥',
    'u': '𝕦', 'v': '𝕧', 'w': '𝕨', 'x': '𝕩', 'y': '𝕪', 'z': '𝕫',
    'A': '𝔸', 'B': '𝔹', 'C': 'ℂ', 'D': '𝔻', 'E': '𝔼',
    'F': '𝔽', 'G': '𝔾', 'H': 'ℍ', 'I': '𝕀', 'J': '𝕁',
    'K': '𝕂', 'L': '𝕃', 'M': '𝕄', 'N': 'ℕ', 'O': '𝕆',
    'P': 'ℙ', 'Q': 'ℚ', 'R': 'ℝ', 'S': '𝕊', 'T': '𝕋',
    'U': '𝕌', 'V': '𝕍', 'W': '𝕎', 'X': '𝕏', 'Y': '𝕐', 'Z': 'ℤ'
  };
  return text.split('').map(char => doubleMap[char] || char).join('');
}

function toSquared(text) {
  return text.toUpperCase().split('').map(char => char + '⃞').join('');
}

function toCircles2(text) {
  return text.toUpperCase().split('').map(char => char + '⃝').join('');
}

function toMonospace(text) {
  const monoMap = {
    'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎',
    'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓',
    'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘',
    'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝',
    'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣',
    'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴',
    'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹',
    'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾',
    'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃',
    'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉'
  };
  return text.split('').map(char => monoMap[char] || char).join('');
}

function toTwitter(text) {
  return '🐦 ' + text.split('').join(' ') + ' 💙';
}

function toSmallCaps(text) {
  const smallCapsMap = {
    'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ',
    'f': 'ꜰ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ',
    'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ',
    'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': 'ꜱ', 't': 'ᴛ',
    'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ',
    'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ',
    'F': 'ꜰ', 'G': 'ɢ', 'H': 'ʜ', 'I': 'ɪ', 'J': 'ᴊ',
    'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ',
    'P': 'ᴘ', 'Q': 'ǫ', 'R': 'ʀ', 'S': 'ꜱ', 'T': 'ᴛ',
    'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x', 'Y': 'ʏ', 'Z': 'ᴢ'
  };
  return text.split('').map(char => smallCapsMap[char] || char).join('');
}

function toSmallCaps2(text) {
  return text.toLowerCase().split('').map(char => char.toUpperCase() + '̲').join('');
}

function toSmallCaps3(text) {
  return text.toLowerCase().split('').map(char => char + '̶').join('');
}

function toUpDown(text) {
  return text.split('').map(char => char + '̑').join('');
}

function toFlip(text) {
  const flipMap = {
    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ',
    'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ',
    'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o',
    'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ',
    'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
    'A': '∀', 'B': '𐐒', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ',
    'F': 'Ⅎ', 'G': 'פ', 'H': 'H', 'I': 'I', 'J': 'ſ',
    'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O',
    'P': 'Ԁ', 'Q': 'Ό', 'R': 'ᴚ', 'S': 'S', 'T': '⊥',
    'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z'
  };
  return text.split('').map(char => flipMap[char] || char).join('');
}

function toSuperScript(text) {
  const superMap = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
    'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
    'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
    'p': 'ᵖ', 'q': 'ᑫ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ',
    'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ'
  };
  return text.split('').map(char => superMap[char] || char).join('');
}

function toSubScript(text) {
  const subMap = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
    'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ'
  };
  return text.split('').map(char => subMap[char] || char).join('');
}

function toAesthetic(text) {
  return text.split('').map(char => char + ' ').join('').toUpperCase();
}

function toSymbols(text) {
  return text.toUpperCase().split('').map(char => char + '​').join('');
}

function toCircled3(text) {
  return text.toUpperCase().split('').map(char => char + '⃠').join('');
}

function toFontA(text) { return text.toUpperCase().split('').join('.') + '.'; }
function toFontB(text) { return text.toUpperCase().split('').join('-') + '-'; }
function toFontC(text) { return '『' + text + '』'; }
function toFontD(text) { return '【' + text + '】'; }
function toFontE(text) { return "『" + text.split('').join("』『") + "』"; }
function toFontF(text) { return '≪' + text + '≫'; }
function toSpecial1(text) { return '✦' + text + '✦'; }
function toSpecial2(text) { return '❖' + text + '❖'; }
function toSpecial3(text) { return '◈' + text + '◈'; }
function toSpecial4(text) { return '▣' + text + '▣'; }
function toSpecial5(text) { return '◉' + text + '◉'; }
function toWings(text) { return '𓆩' + text + '𓆪'; }
function toStars(text) { return '★' + text + '★'; }
function toHearts(text) { return '♥' + text + '♥'; }
function toFlowers(text) { return '✿' + text + '✿'; }
function toSansA(text) { return '『' + text.toUpperCase() + '』'; }
function toSansB(text) { return '【' + text.toUpperCase() + '】'; }
function toSansC(text) { return "『" + text.toUpperCase().split('').join("』『") + "』"; }
function toSerifA(text) { return '「' + text + '」'; }
function toSerifB(text) { return '〖' + text + '〗'; }
function toCursive(text) { return '𝓬𝓾𝓻𝓼𝓲𝓿𝓮: ' + text; }
function toFancyA(text) { return '♚' + text + '♚'; }
function toFancyB(text) { return '♛' + text + '♛'; }
function toFancyC(text) { return '♜' + text + '♜'; }
function toArabic(text) { return '﷽ ' + text; }
function toCyrillic(text) {
  const cyrMap = {
    'a': 'а', 'b': 'б', 'c': 'ц', 'd': 'д', 'e': 'е',
    'f': 'ф', 'g': 'г', 'h': 'х', 'i': 'и', 'j': 'й',
    'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
    'p': 'п', 'q': 'к', 'r': 'р', 's': 'с', 't': 'т',
    'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс', 'y': 'ы', 'z': 'з'
  };
  return text.toLowerCase().split('').map(char => cyrMap[char] || char).join('');
}

// Box formatting function
function createBox(content) {
  return `╔════❰  𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n${content}\n╚══════════════════╝`;
}

// Helper functions
async function showFontList(api, threadID, messageID) {
  let list = "🎨 𝐀𝐕𝐀𝐈𝐋𝐀𝐁𝐋𝐄 𝐅𝐎𝐍𝐓 𝐒𝐓𝐘𝐋𝐄𝐒 (50+)\n━━━━━━━━━━━━━━━━━━━━━━\n\n";
  
  for (let i = 0; i < fonts.length; i += 2) {
    const font1 = fonts[i];
    const font2 = fonts[i + 1];
    
    if (font2) {
      list += `${font1.id}. ${font1.name}  ${font2.id}. ${font2.name}\n`;
    } else {
      list += `${font1.id}. ${font1.name}\n`;
    }
  }
  
  list += "\n━━━━━━━━━━━━━━━━━━━━━━\n";
  list += "📌 𝐔𝐬𝐞: *font <text>\n";
  list += "📌 𝐏𝐫𝐞𝐯𝐢𝐞𝐰: *font preview <number> <text>\n";
  list += "📌 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: *font preview 5 hello";
  
  await api.sendMessage(createBox(list), threadID, messageID);
}

async function previewFont(api, threadID, messageID, fontNum, text) {
  const font = fonts.find(f => f.id === fontNum);
  
  if (!font) {
    return api.sendMessage(
      createBox(`❌ Font #${fontNum} not found. Use *font list to see all fonts.`),
      threadID,
      messageID
    );
  }
  
  const converted = font.func(text);
  
  const preview = `🅵🅾🅽🆃 🅿🆁🅴🆅🅸🅴🆆 #${fontNum}\n\n🆂🆃🆈🅻🅴: ${font.name}\n🆃🅴🆇🆃: "${text}"\n🅲🅾🅽🆅🅴🆁🆃🅴🅳: "${converted}"\n\n📋 𝐂𝐨𝐩𝐲 𝐭𝐡𝐢𝐬: ${converted}\n📌 𝐅𝐨𝐧𝐭 𝐈𝐃: ${fontNum}`;
  
  await api.sendMessage(createBox(preview), threadID, messageID);
}

async function convertText(api, threadID, messageID, text) {
  if (text.length > 50) {
    return api.sendMessage(
      createBox("❌ Text too long! Maximum 50 characters allowed."),
      threadID,
      messageID
    );
  }
  
  let result = `🎨 𝐅𝐎𝐍𝐓 𝐂𝐎𝐍𝐕𝐄𝐑𝐓𝐄𝐑\n\n📝 𝐎𝐫𝐢𝐠𝐢𝐧𝐚𝐥: "${text}"\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Show first 10 fonts as preview
  for (let i = 0; i < 10; i++) {
    const font = fonts[i];
    if (font) {
      const converted = font.func(text);
      result += `${font.id}. ${font.name}\n`;
      result += `   "${converted}"\n\n`;
    }
  }
  
  result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  result += `📌 𝐒𝐞𝐞 𝐚𝐥𝐥 50+ 𝐟𝐨𝐧𝐭𝐬: *font list\n`;
  result += `📌 𝐏𝐫𝐞𝐯𝐢𝐞𝐰 𝐚 𝐟𝐨𝐧𝐭: *font preview <number> <text>\n`;
  result += `📌 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: *font preview 15 hello`;
  
  await api.sendMessage(createBox(result), threadID, messageID);
}
