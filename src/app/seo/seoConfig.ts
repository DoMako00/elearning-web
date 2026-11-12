/* Site identity used for titles, descriptions and share previews.
   All three brands share one identity for now; add an entry to `brandIdentities` when a brand gets its own. */
export type SeoBrand = "medway" | "elite" | "nexus";

export interface SeoIdentity {
  siteName: string;
  description: string;
  themeColor: string;
  /** Absolute or root-relative URL of a 1200x630 share image. Share-image tags are omitted until this is set. */
  ogImage?: string;
}

export const defaultIdentity: SeoIdentity = {
  siteName: "GreenLearn",
  description: "GreenLearn is a private learning platform for students and instructors: courses, lessons, assignments and exams in one place.",
  themeColor: "#16793f",
};

export const brandIdentities: Partial<Record<SeoBrand, Partial<SeoIdentity>>> = {};

export const identityFor = (brand?: string): SeoIdentity => ({
  ...defaultIdentity,
  ...(brand ? brandIdentities[brand as SeoBrand] : undefined),
});
