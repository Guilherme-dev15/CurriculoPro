import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Garante que o .env é lido

// Importa as rotas
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

// Importa os middlewares
import authenticateToken from './middleware/auth.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares Globais ---
app.use(cors());
app.use(express.json());

// --- Rotas ---

// Rotas públicas (ex: visualização de currículo)
app.use('/api/public', publicRoutes);

// Rotas de autenticação (login/register)
app.use('/api', authRoutes);

// Rotas de documentos (protegidas por autenticação)
app.use('/api/documents', authenticateToken, documentRoutes);

// --- Rota de Status ---
app.get('/', (req, res) => {
  res.json({ message: "API do CurriculoPro rodando com Prisma! (Refatorada)" });
});

// --- Gestor de Erros Global ---
// Deve ser o último 'app.use()'
app.use(globalErrorHandler);

// --- Inicialização do Servidor ---
app.listen(PORT, () => {
  console.log(`🚀 Servidor back-end rodando em http://localhost:${PORT}`);
});
