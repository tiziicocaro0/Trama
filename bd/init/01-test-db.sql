-- Crea la base de los tests la primera vez que se levanta el contenedor.
CREATE DATABASE IF NOT EXISTS trama_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON trama_test.* TO 'trama'@'%';
