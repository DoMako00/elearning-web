import type {
  AcademicYear,
  Chapter,
  DocumentAsset,
  Lesson,
  LessonResource,
  Module,
  Program,
  Semester,
  Subject,
  VideoAsset,
} from "../../domain";
import type { BrandScopedQuery, BrandScopedLookup, ContentNodeId, ResourceId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface ContentPath {
  readonly nodes: readonly ContentNode[];
}

/** Compatibility projection over the existing typed learning hierarchy entities. */
export type ContentNode = Program | AcademicYear | Semester | Subject | Module | Chapter | Lesson;

export interface ContentRepository {
  findContentNodeById(input: BrandScopedLookup<ContentNodeId>): Promise<RepositoryResult<ContentNode>>;
  findResourceById(input: BrandScopedLookup<ResourceId>): Promise<RepositoryResult<LessonResource | VideoAsset | DocumentAsset>>;
  findResourceBrand(input: BrandScopedLookup<ResourceId>): Promise<RepositoryResult<BrandScopedQuery["brand"]>>;
  findReleaseStateForResource(input: BrandScopedLookup<ResourceId>): Promise<RepositoryResult<"released" | "unreleased">>;
  findContentPath(input: BrandScopedLookup<ContentNodeId>): Promise<RepositoryResult<ContentPath>>;
}
