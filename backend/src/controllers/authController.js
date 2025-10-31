import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

// Sem try/catch! O 'catchAsync' trata disso.

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios." });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password_hash: hashedPassword,
    },
  });

  res.status(201).json({ message: "Usuário registrado com sucesso!", user: { id: newUser.id, name: newUser.name, email: newUser.email } });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });

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
};
