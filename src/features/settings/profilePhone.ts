const countryCodes = ["+971", "+966", "+965", "+974", "+973", "+968", "+962", "+44", "+1", "+20"] as const;

export const studentPhoneCountryCodes: readonly string[] = countryCodes;

export function splitStudentPhone(phone: string | null | undefined): { countryCode: string; nationalNumber: string } {
  const value = phone?.trim() ?? "";
  if (!value) return { countryCode: "+20", nationalNumber: "" };

  const matchedCode = [...countryCodes]
    .sort((left, right) => right.length - left.length)
    .find((code) => value.startsWith(code));

  if (!matchedCode) return { countryCode: "+20", nationalNumber: value };
  return { countryCode: matchedCode, nationalNumber: value.slice(matchedCode.length) };
}

export function normalizeStudentPhone(countryCode: string, nationalNumber: string): string | null {
  const input = nationalNumber.trim();
  if (!input) return null;

  const digits = input.replace(/\D/g, "");
  const value = input.startsWith("+")
    ? `+${digits}`
    : `+${countryCode.replace(/\D/g, "")}${digits.replace(/^0+/, "")}`;

  if (!/^\+[1-9]\d{7,14}$/.test(value)) {
    throw new Error("Enter a valid phone number with its country code, or leave the field blank.");
  }
  return value;
}
