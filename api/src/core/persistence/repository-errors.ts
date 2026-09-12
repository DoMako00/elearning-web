import type { RepositoryError, RepositoryErrorCode } from "./repository-result";

export type { RepositoryError, RepositoryErrorCode };

export const repositoryError = (
  code: RepositoryErrorCode,
  message: string,
  details?: Readonly<Record<string, unknown>>,
): RepositoryError => ({ code, message, details });

