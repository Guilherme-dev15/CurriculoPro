import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma.js';
import { Prisma } from '@prisma/client';
import authenticateToken from './middleware/auth.js';

const app = express();
// Lê a porta do .env, com um padrão de 3001
const PORT = process.env.PORT || 3001;

// --- Configuração dos Middlewares Globais ---
app.use(cors());
app.use(express.json()); // Middleware para parsear JSON

// --- Rota de Status ---
app.get('/', (req, res) => {
  res.json({ message: "API do CurriculoPro rodando com Prisma!" });
});

// --- Rotas de Autenticação ---
const authRouter = express.Router();

// POST /api/register
authRouter.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // CORREÇÃO: Usando 'password_hash' como definido no schema
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword, // Corrigido de 'password'
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

    // CORREÇÃO: Comparando com 'user.password_hash' do banco
    const validPassword = await bcrypt.compare(password, user.password_hash); // Corrigido de 'user.password'
    if (!validPassword)
      return res.status(401).json({ error: "Credenciais inválidas." });

    // CORREÇÃO: Usando a variável de ambiente JWT_SECRET
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, // Corrigido de 'JWT_SECRET' local
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: "Login bem-sucedido!",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
});

// Monta o roteador de autenticação no prefixo /api
app.use('/api', authRouter);

// --- Rotas de Documentos (Protegidas) ---
const documentRouter = express.Router();

// GET /api/documents
documentRouter.get('/', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      where: { ownerId: req.user.userId }, // req.user é injetado pelo middleware
    });
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar documentos." });
  }
});

// POST /api/documents
documentRouter.post('/', async (req, res) => {
  // MELHORIA: O schema exige 'type', que estava faltando
  const { name, data, type } = req.body;

  if (!name || !data || !type)
    return res.status(400).json({ error: "Nome, tipo (type) e conteúdo (data) são obrigatórios." });

  try {
    const newDoc = await prisma.document.create({
      data: {
        name,
        type, // Adicionado campo obrigatório
        data,
        ownerId: req.user.userId,
      },
    });
    res.status(201).json(newDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar documento." });
  }
});

// --- INÍCIO DAS MODIFICAÇÕES ---

// PUT /api/documents/:id (Atualizar um documento)
documentRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, data, type } = req.body; // Pega os dados atualizados

  if (!name || !data || !type) {
    return res.status(400).json({ error: "Nome, tipo e dados são obrigatórios." });
  }

  try {
    const updatedDoc = await prisma.document.update({
      where: {
        id: parseInt(id),
        // Garante que o usuário só possa editar seus próprios documentos
        ownerId: req.user.userId, 
      },
      data: {
        name,
        data,
        type,
        // 'lastModified' é atualizado automaticamente pelo Prisma
      },
    });
    res.json(updatedDoc); // Retorna o documento atualizado
  } catch (error) {
    // Trata erros (ex: documento não encontrado ou não pertencente ao usuário)
    console.error("Erro ao atualizar documento:", error);
    res.status(500).json({ error: "Erro ao atualizar documento." });
  }
});

// DELETE /api/documents/:id (Deletar um documento)
documentRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.document.delete({
      where: {
        id: parseInt(id),
        // Garante que o usuário só possa deletar seus próprios documentos
        ownerId: req.user.userId, 
      },
    });
    res.status(204).send(); // 204 = "No Content" (Sucesso sem corpo de resposta)
  } catch (error) {
    console.error("Erro ao deletar documento:", error);
    res.status(500).json({ error: "Erro ao deletar documento." });
  }
});

// --- FIM DAS MODIFICAÇÕES ---

// Monta o roteador de documentos no prefixo /api/documents
// O middleware 'authenticateToken' é aplicado a TODAS as rotas dentro deste roteador
app.use('/api/documents', authenticateToken, documentRouter);

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor back-end rodando em http://localhost:${PORT}`);
});