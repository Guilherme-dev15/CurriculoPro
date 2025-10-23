import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  // Pega o token do cabeçalho 'Authorization' (formato: "Bearer TOKEN")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // Se não há token, retorna erro 401 (Não Autorizado)
    return res.sendStatus(401); 
  }

  // Verifica se o token é válido e não expirou
  jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
    if (err) {
      // Se o token for inválido (ou expirado), retorna erro 403 (Proibido)
      return res.sendStatus(403); 
    }

    // Se o token for válido, adiciona as informações do usuário (payload do token) ao objeto `req`
    req.user = userPayload; 

    // Passa para a próxima função (a rota principal)
    next(); 
  });
}

export default authenticateToken;