/**
 * Direct-Postgres read seam for the private app schema. Prompt 38 supplies no
 * implementation, driver, connection, or environment access for this contract.
 */
export interface ReadQueryRequest {
  readonly label: string;
  readonly text: string;
  readonly values: readonly string[];
}

export interface ReadQueryResult<Row> {
  readonly rows: readonly Row[];
}

export interface ReadQueryTransport {
  query<Row extends Record<string, unknown>>(request: ReadQueryRequest): Promise<ReadQueryResult<Row>>;
}
