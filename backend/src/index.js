import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma.js';
import { Prisma } from '@prisma/client';
import authenticateToken from './middleware/auth.js';
import { nanoid } from 'nanoid';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Configuração dos Middlewares Globais ---
app.use(cors());
app.use(express.json());

// --- Rota Pública de Visualização (Com Rastreamento) ---
app.get('/api/public/resume/:publicId', async (req, res) => {
  try {
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

    // Registra a Visualização (Assíncrono)
    prisma.viewEvent.create({
      data: {
        documentId: doc.id
      }
    }).catch(err => {
      console.error("Falha ao registrar ViewEvent:", err);
    });

    // Remove o ID da resposta pública
    const { id, ...publicData } = doc;
    res.json(publicData);

  } catch (error) {
    console.error("Erro ao buscar currículo público:", error);
    res.status(500).json({ error: "Erro interno." });
  }
});

// --- Rota de Status ---
app.get('/', (req, res) => {
  res.json({ message: "API do CurriculoPro rodando com Prisma!" });
});

// --- Rotas de Autenticação ---
const authRouter = express.Router();

// --- INÍCIO DAS ROTAS RESTAURADAS ---
// POST /api/register
authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
      },
    });

    res.status(201).json({ message: "Usuário registrado com sucesso!", user: { id: newUser.id, name: newUser.name, email: newUser.email } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: "E-mail já está em uso." });
    }
    console.error("Erro ao registrar:", error);
    res.status(500).json({ error: "Erro interno ao registrar usuário." });
  }
});

// POST /api/login
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res.status(401).json({ error: "Credenciais inválidas." });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res.status(401).json({ error: "Credenciais inválidas." });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
});
// --- FIM DAS ROTAS RESTAURADAS ---

// Monta o roteador de autenticação no prefixo /api
app.use('/api', authRouter);

// --- Rotas de Documentos (Protegidas) ---
const documentRouter = express.Router();

// GET /api/documents
documentRouter.get('/', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { ownerId: req.user.userId },
    });
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});

// POST /api/documents
documentRouter.post('/', async (req, res) => {
  const { name, data, type } = req.body;
  if (!name || !data || !type) return res.status(400).json({ error: "Nome, tipo (type) e conteúdo (data) são obrigatórios." });
  try {
    const newDoc = await prisma.document.create({
      data: { name, type, data, ownerId: req.user.userId },
    });
    res.status(201).json(newDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar documento." });
  }
});

// PUT /api/documents/:id
documentRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, data, type } = req.body;
  if (!name || !data || !type) return res.status(400).json({ error: "Nome, tipo e dados são obrigatórios." });
  try {
    const updatedDoc = await prisma.document.update({
      where: { id: parseInt(id), ownerId: req.user.userId },
      data: { name, data, type },
    });
    res.json(updatedDoc);
  } catch (error) {
    console.error("Erro ao atualizar documento:", error);
    res.status(500).json({ error: "Erro ao atualizar documento." });
  }
});

// DELETE /api/documents/:id
documentRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.document.delete({
      where: { id: parseInt(id), ownerId: req.user.userId },
    });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
    res.status(500).json({ error: "Erro ao deletar documento." });
  }
});

// PATCH /api/documents/:id/share
documentRouter.patch('/:id/share', async (req, res) => {
  const { id } = req.params;
  const { enable } = req.body;
  try {
    const doc = await prisma.document.findUnique({ where: { id: parseInt(id), ownerId: req.user.userId }});
    if (!doc) return res.status(404).json({ error: "Documento não encontrado." });
    let publicId = doc.publicId;
    if (enable && !publicId) publicId = nanoid(12);
    const updatedDoc = await prisma.document.update({
      where: { id: parseInt(id) },
      data: { isPublic: enable, publicId: publicId },
      select: { id: true, isPublic: true, publicId: true }
    });
    res.json(updatedDoc);
  } catch (error) {
    console.error("Erro ao atualizar compartilhamento:", error);
    res.status(500).json({ error: "Erro ao atualizar compartilhamento." });
  }
});

// GET /api/documents/:id/analytics
documentRouter.get('/:id/analytics', async (req, res) => {
  const { id } = req.params;
  try {
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id), ownerId: req.user.userId },
      select: { id: true }
    });
    if (!document) return res.status(404).json({ error: "Documento não encontrado ou não pertence a você." });
    const viewCount = await prisma.viewEvent.count({
      where: { documentId: parseInt(id) },
    });
    res.json({ documentId: parseInt(id), totalViews: viewCount });
  } catch (error) {
    console.error("Erro ao buscar analytics:", error);
    res.status(500).json({ error: "Erro ao buscar dados de analytics." });
  }
});

// Monta o roteador de documentos no prefixo /api/documents
app.use('/api/documents', authenticateToken, documentRouter);

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor back-end rodando em http://localhost:${PORT}`);
});