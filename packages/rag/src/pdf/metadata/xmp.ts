export interface XmpExtractedFields {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  language: string | null;
  creationDate: string | null;
  modDate: string | null;
}

const XMP_FIELD_MAP: Record<string, keyof XmpExtractedFields> = {
  "dc:title": "title",
  "dc:creator": "author",
  "dc:description": "subject",
  "dc:subject": "keywords",
  "dc:language": "language",
  "xmp:CreateDate": "creationDate",
  "xmp:ModifyDate": "modDate",
  "xmp:MetadataDate": "modDate",
};

export function extractXmpFields(rawXml: string | null): XmpExtractedFields | null {
  if (!rawXml || rawXml.trim().length === 0) return null;

  const fields: XmpExtractedFields = {
    title: null,
    author: null,
    subject: null,
    keywords: null,
    language: null,
    creationDate: null,
    modDate: null,
  };

  for (const [xmlTag, target] of Object.entries(XMP_FIELD_MAP)) {
    const value = extractXmlValue(rawXml, xmlTag);
    if (value !== null) {
      if (target === "keywords") {
        const existing = fields.keywords;
        if (existing) {
          fields.keywords = `${existing}, ${value}`;
        } else {
          fields.keywords = value;
        }
      } else if (target === "author") {
        const existing = fields.author;
        if (existing) {
          fields.author = `${existing}, ${value}`;
        } else {
          fields.author = value;
        }
      } else {
        if (fields[target] === null) {
          (fields as unknown as Record<string, string | null>)[target] = value;
        }
      }
    }
  }

  const hasAnyValue = Object.values(fields).some((v) => v !== null);
  return hasAnyValue ? fields : null;
}

function extractXmlValue(xml: string, tag: string): string | null {
  const openTagPattern = `<${tag}[^>]*>`;
  const closeTag = `</${tag}>`;

  const TAG_RE = new RegExp(openTagPattern);
  const openMatch = TAG_RE.exec(xml);
  if (!openMatch) return null;

  const startIdx = openMatch.index + openMatch[0].length;
  const endIdx = xml.indexOf(closeTag, startIdx);
  if (endIdx === -1) return null;

  const inner = xml.slice(startIdx, endIdx).trim();
  return inner || null;
}
