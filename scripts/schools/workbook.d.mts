export interface ImportedSchool {
  id: string;
  import_key: string;
  name: string;
  slug: string;
  type: 'other';
  city: string;
  county: string;
}

export interface WorkbookImportResult {
  schools: ImportedSchool[];
  report: {
    source: {
      inspectedSheets: string[];
      dataSheets: number;
      sourceRows: number;
    };
    exactDuplicateRowsRemoved: number;
    invalidRows: unknown[];
    ambiguousDuplicates: unknown[];
    [key: string]: unknown;
  };
}

export function normalizeDisplay(value: unknown): string;
export function normalizeIdentity(value: unknown): string;
export function normalizeSearch(value: unknown): string;
export function deterministicUuid(value: string): string;
export function deterministicSlug(name: string, city: string, identityKey: string): string;
export function inspectSchoolWorkbook(workbookPath: string): WorkbookImportResult;
