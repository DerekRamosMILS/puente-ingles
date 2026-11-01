-- ============================================================
--  Puente · Esquema de la base de datos (MySQL 8 o superior)
--  Se ejecuta automáticamente al arrancar el servidor
--  (DB_AUTO_INIT=true) o con: npm run db:init
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(80)  NOT NULL,
  correo        VARCHAR(120) NOT NULL,
  password_hash CHAR(60)     NOT NULL,
  rol           ENUM('admin', 'editor') NOT NULL DEFAULT 'editor',
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_correo UNIQUE (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recursos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo          VARCHAR(120) NOT NULL,
  descripcion     VARCHAR(500) NOT NULL,
  url             VARCHAR(255) NOT NULL,
  tipo            ENUM('curso', 'video', 'podcast', 'lectura', 'ejercicios', 'app', 'herramienta') NOT NULL,
  nivel           ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2') NOT NULL,
  habilidad       ENUM('escucha', 'lectura', 'escritura', 'conversacion', 'gramatica', 'vocabulario') NOT NULL,
  duracion_min    SMALLINT UNSIGNED NULL,
  requiere_cuenta BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_por      INT UNSIGNED NULL,
  creado_en       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recursos_usuario FOREIGN KEY (creado_por)
    REFERENCES usuarios (id) ON DELETE SET NULL,
  INDEX idx_recursos_nivel (nivel),
  INDEX idx_recursos_habilidad (habilidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
