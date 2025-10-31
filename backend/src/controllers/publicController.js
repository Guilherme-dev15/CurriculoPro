import prisma from '../prisma.js';

export const getPublicResume = async (req, res) => {
  const { publicId } = req.params;
  
  const doc = await prisma.document.findUnique({
    where: {
      publicId: publicId,
      isPublic: true,
      type: 'resume'
    },
    select: {
      id: true, // Necessário para registrar o ViewEvent
      data: true,
      lastModified: true
    }
  });

  if (!doc) {
    return res.status(404).json({ error: "Currículo não encontrado ou não é público." });
  }

  // Registra a Visualização (Assíncrono, "fire-and-forget")
  prisma.viewEvent.create({
    data: {
      documentId: doc.id
    }
  }).catch(err => {
    // Apenas loga o erro, não impede a resposta ao utilizador
    console.error("Falha ao registrar ViewEvent:", err);
  });

  // Retorna os dados do currículo (sem o ID interno do documento)
  const { id, ...publicData } = doc;
  res.json(publicData);
};
