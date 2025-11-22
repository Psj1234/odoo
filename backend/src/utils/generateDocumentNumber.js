export async function generateDocumentNumber(prefix, prisma, model) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  // Find the last document for this month
  const lastDoc = await prisma[model].findFirst({
    where: {
      documentNumber: {
        startsWith: `${prefix}-${year}${month}`
      }
    },
    orderBy: {
      documentNumber: 'desc'
    }
  });

  let sequence = 1;
  if (lastDoc) {
    const lastSequence = parseInt(lastDoc.documentNumber.split('-').pop());
    sequence = lastSequence + 1;
  }

  return `${prefix}-${year}${month}${String(sequence).padStart(4, '0')}`;
}

