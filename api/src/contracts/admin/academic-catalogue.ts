/** Private catalogue metadata only; resource counts convey no delivery rights. */
export interface AcademicCatalogueChapter {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: 'active' | 'retired';
}
export interface AcademicCatalogueModule {
  readonly id: string;
  readonly academicInstitutionId: string;
  readonly code: string;
  readonly sourceDisplayLabel: string;
  readonly reviewStatus: 'unreviewed' | 'approved' | 'blocked' | 'retired';
  readonly resourceCount: number;
  readonly chapters: readonly AcademicCatalogueChapter[];
}
export interface AcademicCatalogueSemester {
  readonly id: string;
  readonly semesterNumber: number;
  readonly displayTitle: string;
  readonly status: string;
  readonly modules: readonly AcademicCatalogueModule[];
}
export interface AcademicCatalogueLevel {
  readonly id: string;
  readonly levelNumber: number;
  readonly displayTitle: string;
  readonly status: string;
  readonly semesters: readonly AcademicCatalogueSemester[];
}
export interface AcademicInstitutionIdentity {
  readonly id: string;
  readonly code: string;
  readonly displayName: string;
  readonly status: 'active' | 'retired';
}
export interface AcademicCatalogueInstitution extends AcademicInstitutionIdentity {
  readonly levels: readonly AcademicCatalogueLevel[];
}
export interface CommercialBrandCatalogueAccess {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly allowedAcademicInstitutions: readonly AcademicInstitutionIdentity[];
}
