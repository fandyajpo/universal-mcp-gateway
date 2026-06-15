export function createDocumentData(docDef, workspaceId, uploadedByUserId) {
  const now = new Date();
  const content = docDef.paragraphs.join("\n\n");

  return {
    tenantId: workspaceId,
    title: docDef.title,
    description: docDef.description,
    source: docDef.source,
    contentType: docDef.contentType,
    status: docDef.status,
    metadata: docDef.metadata || {},
    tags: docDef.tags || [],
    uploadedBy: uploadedByUserId,
    createdAt: now,
    updatedAt: now,
  };
}
