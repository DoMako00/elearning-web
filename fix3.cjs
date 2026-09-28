const fs = require('fs');
const path = 'C:\\Users\\shehab\\OneDrive\\Desktop\\E-learning stage\\elearning-web\\web\\src\\components\\ui\\InactivityPrompt\\InactivityModal.tsx';
const content = fs.readFileSync(path, 'utf8');

const searchStr = '}, [];\n\n    if (!isOpen) return null;';
const insertIdx = content.indexOf(searchStr);

if (insertIdx !== -1) {
  const codeToInsert = `

  // Countdown timer - ONLY runs when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
      playTickSound();

      if (countdown === 10 && !hasPlayedWarningSound.current) {
        hasPlayedWarningSound.current = true;
        playWarningSound();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      setCountdown(initialCountdown);
    }
  }, [isOpen, initialCountdown]);

  // Reset warning sound flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasPlayedWarningSound.current = false;
    }
  }, [isOpen]);

  // Auto-close when countdown reaches 0
  useEffect(() => {
    if (isOpen && countdown <= 0) {
      onClose();
    }
  }, [countdown, onClose, isOpen]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onResume();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onResume]);\n`;

  const searchStr = '}, [];\n\n    if (!isOpen) return null;';
  const insertIdx = content.indexOf(searchStr);

  if (insertIdx !== -1) {
    const insertPos = insertIdx + searchStr.length;
    const newContent = content.slice(0, insertIdx + searchStr.length) + codeToInsert + content.slice(insertIdx + searchStr.length);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Successfully added missing code');
  } else {
    console.log('Search string not found');
  }