const ARABIC_SCRIPT = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const ARABIC_RUN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]+/gu;

const commonArabicNames: Readonly<Record<string, string>> = {
  "محمد": "Mohamed",
  "محمود": "Mahmoud",
  "هبه": "Heba",
  "هبة": "Heba",
  "سلمى": "Salma",
  "سلمي": "Salma",
  "حنين": "Haneen",
  "عمر": "Omar",
  "احمد": "Ahmed",
  "مريم": "Mariam",
  "يوسف": "Youssef",
  "صلاح": "Salah",
  "صالح": "Saleh",
  "هاني": "Hany",
  "علي": "Ali",
  "حسن": "Hassan",
  "حسين": "Hussein",
  "نور": "Nour",
  "عبدالله": "Abdullah",
  "عبدالرحمن": "Abdelrahman",
};

const arabicLetters: Readonly<Record<string, string>> = {
  "ا": "a", "أ": "a", "إ": "e", "آ": "a", "ٱ": "a", "ء": "", "ؤ": "o", "ئ": "i",
  "ب": "b", "ت": "t", "ث": "th", "ج": "g", "ح": "h", "خ": "kh", "د": "d", "ذ": "z",
  "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "ة": "a", "و": "o", "ي": "y", "ى": "a",
};

function normalizeArabicWord(value: string) {
  return value.normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670\u0640]/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي");
}

function transliterateRun(run: string) {
  const normalized = normalizeArabicWord(run);
  const knownName = commonArabicNames[run] ?? commonArabicNames[normalized];
  if (knownName) return knownName;

  const transliterated = Array.from(run, (letter) => arabicLetters[letter] ?? "").join("");
  return transliterated ? transliterated[0]!.toUpperCase() + transliterated.slice(1) : run;
}

/** Converts Arabic-script profile names to a Latin display form without changing stored identity data. */
export function toEnglishStudentName(value: string | null | undefined): string {
  const name = value?.normalize("NFKC").trim() ?? "";
  if (!name || !ARABIC_SCRIPT.test(name)) return name;
  return name.replace(ARABIC_RUN, transliterateRun);
}

/** Keeps visibly synthetic/acceptance accounts out of real purchase selection. */
export function isAdminTestStudentName(value: string | null | undefined): boolean {
  const name = toEnglishStudentName(value).toLowerCase().replace(/[^a-z0-9]+/gu, " ").trim();
  return /\b(?:controlled|synthetic|acceptance|test)\b/u.test(name)
    || /^phase\s+\d+\b/u.test(name)
    // The owner identified this exact existing profile as a test account.
    || name === "mohamed salah";
}
