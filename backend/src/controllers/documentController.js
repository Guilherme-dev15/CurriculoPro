import prisma from '../prisma.js';
import { nanoid } from 'nanoid';

// GET /
export const getDocuments = async (req, res) => {
  const docs = await prisma.document.findMany({
    where: { ownerId: req.user.userId },
  });
  res.json(docs);
};

// POST /
export const createDocument = async (req, res) => {
  const { name, data, type } = req.body;
  if (!name || !data || !type) return res.status(400).json({ error: "Nome, tipo (type) e conteúdo (data) são obrigatórios." });

  const newDoc = await prisma.document.create({
    data: { name, type, data, ownerId: req.user.userId },
  });
  res.status(201).json(newDoc);
};

// PUT /:id
export const updateDocument = async (req, res) => {
  const { id } = req.params;
  const { name, data, type } = req.body;
  if (!name || !data || !type) return res.status(400).json({ error: "Nome, tipo e dados são obrigatórios." });

  // O Prisma (com 'P2025' no errorHandler) tratará o 'find' e 'auth'
  const updatedDoc = await prisma.document.update({
    where: { id: parseInt(id), ownerId: req.user.userId },
    data: { name, data, type, lastModified: new Date() }, // Atualiza lastModified
  });
  res.json(updatedDoc);
};

// DELETE /:id
export const deleteDocument = async (req, res) => {
  const { id } = req.params;
  
  await prisma.document.delete({
    where: { id: parseInt(id), ownerId: req.user.userId },
  });
  res.status(204).send();
};

// PATCH /:id/share
export const toggleSharing = async (req, res) => {
  const { id } = req.params;
  const { enable } = req.body;

  const doc = await prisma.document.findUnique({
    where: { id: parseInt(id), ownerId: req.user.userId }
  });

  if (!doc) return res.status(44).json({ error: "Documento não encontrado." });

  let publicId = doc.publicId;
  if (enable && !publicId) {
    publicId = nanoid(12); // Gera novo ID se estiver a ativar e não existir
  }

  const updatedDoc = await prisma.document.update({
    where: { id: parseInt(id) },
    data: { isPublic: !!enable, publicId: enable ? publicId : null }, // Limpa o publicId se desativar
    select: { id: true, isPublic: true, publicId: true }
  });
  res.json(updatedDoc);
};

// GET /:id/analytics
export const getDocumentAnalytics = async (req, res) => {
  const { id } = req.params;

  // Verifica se o documento existe e pertence ao utilizador
  const document = await prisma.document.findUnique({
    where: { id: parseInt(id), ownerId: req.user.userId },
    select: { id: true }
  });

  if (!document) return res.status(404).json({ error: "Documento não encontrado ou não pertence a você." });

  // Conta as visualizações
  const viewCount = await prisma.viewEvent.count({
    where: { documentId: parseInt(id) },
  });
  
  // (Futuramente, pode adicionar 'group by date' aqui)
  res.json({ documentId: parseInt(id), totalViews: viewCount });
};
