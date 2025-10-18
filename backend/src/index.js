import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // 1. Importar a biblioteca JWT
import prisma from './prisma.js';
import { Prisma } from '@prisma/client';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "API do CurriculoPro rodando com Prisma!" });
});

// Endpoint de Cadastro (já existente)
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { name, email, password_hash },
    });

    res.status(201).json({ message: "Usuário criado com sucesso!", userId: user.id });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ error: "Este email já está em uso." });
    }
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor ao processar o cadastro." });
  }
});


// --- INÍCIO DO NOVO ENDPOINT DE LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios." });
  }

  try {
    // 1. Encontrar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // 2. Se o usuário não existir, retorne um erro
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." }); // Mensagem genérica por segurança
    }

    // 3. Comparar a senha enviada com a senha criptografada no banco
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // 4. Se a senha estiver correta, gerar um token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // Informações que queremos no token (payload)
      process.env.JWT_SECRET,                  // Nossa chave secreta do .env
      { expiresIn: '24h' }                     // Duração do token
    );

    // 5. Enviar o token de volta para o cliente
    res.status(200).json({
      message: "Login bem-sucedido!",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro interno do servidor durante o login." });
  }
});
// --- FIM DO NOVO ENDPOINT DE LOGIN ---


app.listen(PORT, () => {
  console.log(`🚀 Servidor back-end rodando em http://localhost:${PORT}`);
});