const fs = require('fs');
const filePath = 'C:\\Users\\shehab\\OneDrive\\Desktop\\E-learning stage\\elearning-web\\web\\src\\shared\\utils\\streakEngine.ts';

const content = fs.readFileSync('C:\\Users\\shehab\\OneDrive\\Desktop\\E-learning stage\\elearning-web\\web\\src\\shared\\utils\\streakEngine.ts', 'utf8');

// Find the second occurrence of the duplicate code and remove it
// Find the second occurrence of 'const [countdown, setCountdown] = useState(initialCountdown);'
const firstIdx = content.indexOf('const [countdown, setCountdown] = useState(initialCountdown);');
const secondIdx = content.indexOf('const [countdown, setCountdown] = useState(initialCountdown);', firstIdx + 1);

if (secondIdx !== -1) {
  // Find the end of the duplicate block (up to the return statement)
  const startIdx = content.indexOf('const [countdown, setCountdown] = useState(initialCountdown);', firstIdx + 1);
  // Find the return statement after the duplicate block
  const returnIdx = content.indexOf('  if (!isOpen) return null;', secondIdx);
  if (returnIdx !== -1) {
    // Remove the duplicate block (from the second declaration to just before 'if (!isOpen) return null;')
    const cleaned = content.slice(0, secondIdx) + content.slice(returnIdx);
    fs.writeFileSync('C:\\Users\\shehab\\OneDrive\\Desktop\\E-learning stage\\elearning-web\\web\\src\\components\\ui\\InactivityPrompt\\InactivityModal.tsx', cleaned, 'utf8');
    console.log('Fixed duplicate declarations');
  }
}