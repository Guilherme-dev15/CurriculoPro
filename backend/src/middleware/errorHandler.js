import { Prisma } from '@prisma/client';

// Este 'wrapper' de função de ordem superior captura erros em
// funções async e passa-os para o 'next()',
// que por sua vez aciona o 'globalErrorHandler'.
// Isto elimina a necessidade de 'try...catch' em todos os controllers!
export const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};


// Este é o nosso gestor de erros global.
// Todos os erros capturados pelo 'catchAsync' acabam aqui.
export const globalErrorHandler = (err, req, res, next) => {
  console.error("ERRO GLOBAL:", err.stack);

  // Gestão de erros conhecidos do Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') { // Violação de constraint única
      return res.status(400).json({ error: "E-mail já está em uso." });
    }
    if (err.code === 'P2025') { // Recurso não encontrado (ex: update/delete)
        return res.status(404).json({ error: "Recurso não encontrado." });
    }
  }

  // Erro genérico
  res.status(500).json({ error: err.message || "Erro interno do servidor." });
};
