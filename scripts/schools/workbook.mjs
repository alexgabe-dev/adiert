import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { strFromU8, unzipSync } from 'fflate';

const DATA_COLUMNS = {
  county: 'B',
  city: 'C',
  name: 'D',
  contactName: 'E',
  phone: 'F',
  email: 'G',
  contacted: 'H',
  replied: 'I',
};

const IMPORT_NAMESPACE = '7d4d3cc7-5962-5ab5-90e4-40204332ce50';

function decodeXml(value) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function xmlText(xml) {
  return decodeXml(
    [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => match[1] ?? '').join(''),
  );
}

function requiredEntry(entries, path) {
  const value = entries[path];
  if (!value) throw new Error(`Az XLSX fájlból hiányzik: ${path}`);
  return strFromU8(value);
}

function parseSharedStrings(entries) {
  const entry = entries['xl/sharedStrings.xml'];
  if (!entry) return [];
  const xml = strFromU8(entry);
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) =>
    xmlText(match[1] ?? ''),
  );
}

function parseSheetDefinitions(entries) {
  const workbookXml = requiredEntry(entries, 'xl/workbook.xml');
  const relationshipsXml = requiredEntry(entries, 'xl/_rels/workbook.xml.rels');
  const targets = new Map(
    [...relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?>(?:<\/Relationship>)?/g)].map(
      (match) => {
        const attributes = match[1] ?? '';
        const id = attributes.match(/\bId="([^"]+)"/)?.[1];
        const target = attributes.match(/\bTarget="([^"]+)"/)?.[1];
        return [id, target];
      },
    ),
  );

  return [...workbookXml.matchAll(/<sheet\b([^>]*)\/?>(?:<\/sheet>)?/g)].map((match) => {
    const attributes = match[1] ?? '';
    const name = decodeXml(attributes.match(/\bname="([^"]+)"/)?.[1] ?? '');
    const relationshipId = attributes.match(/\br:id="([^"]+)"/)?.[1];
    const target = relationshipId ? targets.get(relationshipId) : null;
    if (!name || !target) throw new Error('Érvénytelen munkalap-hivatkozás az XLSX fájlban.');
    const normalizedTarget = target.replace(/^\/?xl\//, '');
    return { name, path: `xl/${normalizedTarget}` };
  });
}

function parseRows(xml, sharedStrings) {
  return [...xml.matchAll(/<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const rowNumber = Number(rowMatch[1]);
    const cells = {};
    for (const cellMatch of (rowMatch[2] ?? '').matchAll(
      /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g,
    )) {
      const attributes = cellMatch[1] ?? cellMatch[3] ?? '';
      const body = cellMatch[2] ?? '';
      const reference = attributes.match(/\br="([A-Z]+)\d+"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      let value = '';
      if (type === 'inlineStr') {
        value = xmlText(body);
      } else {
        const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
        value = type === 's' ? (sharedStrings[Number(rawValue)] ?? '') : decodeXml(rawValue);
      }
      cells[reference] = value;
    }
    return { rowNumber, cells };
  });
}

export function normalizeDisplay(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[\s\u00a0]+/g, ' ')
    .trim();
}

export function normalizeIdentity(value) {
  return normalizeDisplay(value).toLocaleLowerCase('hu-HU');
}

export function normalizeSearch(value) {
  return normalizeIdentity(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function namespaceBytes(namespace) {
  return Buffer.from(namespace.replaceAll('-', ''), 'hex');
}

export function deterministicUuid(value) {
  const bytes = createHash('sha1')
    .update(namespaceBytes(IMPORT_NAMESPACE))
    .update(Buffer.from(value, 'utf8'))
    .digest()
    .subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function deterministicSlug(name, city, identityKey) {
  const base = normalizeSearch(`${name}-${city}`).replaceAll(' ', '-').slice(0, 72) || 'iskola';
  const suffix = createHash('sha256').update(identityKey).digest('hex').slice(0, 10);
  return `${base.replace(/-+$/g, '')}-${suffix}`;
}

export function inspectSchoolWorkbook(workbookPath) {
  const workbookBuffer = readFileSync(workbookPath);
  const entries = unzipSync(new Uint8Array(workbookBuffer));
  const sharedStrings = parseSharedStrings(entries);
  const sheetDefinitions = parseSheetDefinitions(entries);
  const sheets = sheetDefinitions.map((sheet) => ({
    name: sheet.name,
    rows: parseRows(requiredEntry(entries, sheet.path), sharedStrings),
  }));

  const dataSheets = sheets.filter((sheet) => sheet.name !== 'Munka1');
  const sourceRows = [];
  const sheetStatistics = [];
  let whitespaceNormalizedRows = 0;
  const privateFieldCounts = {
    contactName: 0,
    phone: 0,
    email: 0,
    contacted: 0,
    replied: 0,
  };

  for (const sheet of dataSheets) {
    const rows = sheet.rows.filter(({ rowNumber }) => rowNumber > 1);
    sheetStatistics.push({ sheet: sheet.name, sourceRows: rows.length });
    for (const { rowNumber, cells } of rows) {
      for (const field of Object.keys(privateFieldCounts)) {
        if (normalizeDisplay(cells[DATA_COLUMNS[field]])) privateFieldCounts[field] += 1;
      }
      const rawPublicFields = [
        cells[DATA_COLUMNS.county] ?? '',
        cells[DATA_COLUMNS.city] ?? '',
        cells[DATA_COLUMNS.name] ?? '',
      ];
      const normalizedPublicFields = rawPublicFields.map(normalizeDisplay);
      if (rawPublicFields.some((value, index) => value !== normalizedPublicFields[index])) {
        whitespaceNormalizedRows += 1;
      }
      sourceRows.push({
        sheet: sheet.name,
        row: rowNumber,
        county: normalizedPublicFields[0] ?? '',
        city: normalizedPublicFields[1] ?? '',
        name: normalizedPublicFields[2] ?? '',
      });
    }
  }

  const invalidRows = [];
  const countyMismatches = [];
  const exactGroups = new Map();
  for (const row of sourceRows) {
    const missing = ['county', 'city', 'name'].filter((field) => !row[field]);
    if (missing.length > 0) {
      invalidRows.push({ ...row, missing });
      continue;
    }
    if (normalizeIdentity(row.sheet) !== normalizeIdentity(row.county)) {
      countyMismatches.push(row);
    }
    const identityKey = [row.name, row.city, row.county].map(normalizeIdentity).join('|');
    const group = exactGroups.get(identityKey) ?? [];
    group.push(row);
    exactGroups.set(identityKey, group);
  }

  const schools = [];
  const exactDuplicates = [];
  for (const [identityKey, rows] of [...exactGroups.entries()].sort(([left], [right]) =>
    left.localeCompare(right, 'hu-HU'),
  )) {
    const first = rows[0];
    if (!first) continue;
    if (rows.length > 1) {
      exactDuplicates.push({
        identityKey,
        name: first.name,
        city: first.city,
        county: first.county,
        sources: rows.map(({ sheet, row }) => ({ sheet, row })),
      });
    }
    schools.push({
      id: deterministicUuid(identityKey),
      import_key: identityKey,
      name: first.name,
      slug: deterministicSlug(first.name, first.city, identityKey),
      type: 'other',
      city: first.city,
      county: first.county,
    });
  }

  const locationsByName = new Map();
  for (const school of schools) {
    const nameKey = normalizeIdentity(school.name);
    const candidates = locationsByName.get(nameKey) ?? [];
    candidates.push(school);
    locationsByName.set(nameKey, candidates);
  }
  const ambiguousDuplicates = [...locationsByName.entries()]
    .filter(([, candidates]) => candidates.length > 1)
    .map(([nameKey, candidates]) => ({
      nameKey,
      candidates: candidates.map(({ id, name, city, county }) => ({ id, name, city, county })),
    }))
    .sort((left, right) => left.nameKey.localeCompare(right.nameKey, 'hu-HU'));

  const slugCount = new Set(schools.map(({ slug }) => slug)).size;
  const idCount = new Set(schools.map(({ id }) => id)).size;
  if (slugCount !== schools.length || idCount !== schools.length) {
    throw new Error('A determinisztikus iskolaazonosítók vagy slugok nem egyediek.');
  }

  return {
    schools,
    report: {
      source: {
        file: 'data/import/schools/school_DATA.xlsx',
        sha256: createHash('sha256').update(workbookBuffer).digest('hex'),
        inspectedSheets: sheets.map(({ name }) => name),
        dataSheets: dataSheets.length,
        sourceRows: sourceRows.length,
        sheetStatistics,
      },
      privacy: {
        privateColumnsExcluded: ['contactName', 'phone', 'email', 'contacted', 'replied'],
        populatedPrivateCells: privateFieldCounts,
      },
      normalization: {
        unicode: 'NFC',
        whitespace: 'trimmed and collapsed',
        identity: 'Hungarian locale lowercase of name + city + county',
        schoolType: 'other (not inferred from names)',
        whitespaceNormalizedRows,
        branchLikeSchoolsPreserved: schools.filter(({ name }) =>
          /(tagintézm|tagiskol|telephely|feladatellátási hely)/i.test(name),
        ).length,
      },
      invalidRows,
      countyMismatches,
      exactDuplicates,
      ambiguousDuplicates,
      exactDuplicateRowsRemoved: [...exactGroups.values()].reduce(
        (total, rows) => total + Math.max(0, rows.length - 1),
        0,
      ),
      finalSchoolCount: schools.length,
    },
  };
}
