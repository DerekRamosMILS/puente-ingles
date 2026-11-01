// Middleware de bitácora: imprime cada petición a la API con su estado y duración.
// Ejemplo: 2026-10-31T18:20:01.123Z  POST /api/recursos → 201 (12.4 ms) [admin]
export function registrarPeticion(req, res, next) {
  if (!req.originalUrl.startsWith('/api')) return next();

  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    const rol = req.usuario ? ` [${req.usuario.rol}]` : '';
    console.log(
      `${new Date().toISOString()}  ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms.toFixed(1)} ms)${rol}`
    );
  });
  return next();
}
