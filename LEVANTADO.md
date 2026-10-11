# Levantar MySQL

Con Docker Desktop abierto, crear un `.env` en la raíz del repo:

```
MYSQL_PASSWORD=...
MYSQL_ROOT_PASSWORD=...
```

Después, desde la raíz:

```bash
docker compose up -d
```

Para probar que anda:

```bash
docker exec -it trama-mysql mysql -u trama -p trama
```

Conexión: `jdbc:mysql://localhost:3307/trama`, usuario `trama`, contraseña la del `.env`.

Para apagarlo: `docker compose stop`. Ojo que `docker compose down -v` borra los datos.
