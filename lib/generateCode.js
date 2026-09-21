// BATAILLE — génération de code de bataille court (ex. "B7K92")
// Caractères ambigus (0/O, 1/I/L) exclus pour rester lisible à l'oral
// comme à l'écrit.

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

module.exports = { randomCode };
