// @vitest-environment node

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  deterministicSlug,
  deterministicUuid,
  inspectSchoolWorkbook,
  normalizeDisplay,
  normalizeSearch,
} from './workbook.mjs';

const workbookPath = resolve(process.cwd(), 'data/import/schools/school_DATA.xlsx');

describe('school workbook import', () => {
  it('normalizes Hungarian text deterministically without losing display accents', () => {
    expect(normalizeDisplay('  Árvíztűrő\u00a0  Tükörfúrógép  ')).toBe('Árvíztűrő Tükörfúrógép');
    expect(normalizeSearch('Árvíztűrő Tükörfúrógép')).toBe('arvizturo tukorfurogep');
    expect(deterministicUuid('iskola|város|vármegye')).toBe(
      deterministicUuid('iskola|város|vármegye'),
    );
    expect(deterministicSlug('Árvíztűrő Iskola', 'Őriszentpéter', 'identity')).toMatch(
      /^arvizturo-iskola-oriszentpeter-[a-f0-9]{10}$/,
    );
  });

  it('inspects every sheet and excludes private contact columns from output', () => {
    const result = inspectSchoolWorkbook(workbookPath);
    expect(result.report.source.inspectedSheets).toHaveLength(21);
    expect(result.report.source.dataSheets).toBe(20);
    expect(result.report.source.sourceRows).toBe(2790);
    expect(result.report.exactDuplicateRowsRemoved).toBe(16);
    expect(result.report.invalidRows).toHaveLength(1);
    expect(result.schools).toHaveLength(2773);
    expect(result.report.ambiguousDuplicates.length).toBeGreaterThan(0);
    expect(result.schools.every((school) => school.type === 'other')).toBe(true);
    expect(JSON.stringify(result.schools)).not.toMatch(/email|phone|contact|@/i);
    expect(new Set(result.schools.map(({ id }) => id)).size).toBe(result.schools.length);
    expect(new Set(result.schools.map(({ slug }) => slug)).size).toBe(result.schools.length);
    expect(existsSync(resolve(process.cwd(), 'public/school_data/school_DATA.xlsx'))).toBe(false);
  });
});
