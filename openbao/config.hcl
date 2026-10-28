# Servidor OpenBao de TRAMA: guarda las claves de cifrado (KMS, criterio de la 0.3).
# Ver docs/plan-openbao.md.

# Dónde guarda las claves: en el volumen trama-openbao-data, cifradas por OpenBao.
# "raft" es el almacenamiento integrado de OpenBao (el "file" de Vault ya no existe).
storage "raft" {
  path    = "/openbao/file"
  node_id = "trama-openbao"
}

# Escucha en el puerto 8200 dentro de la red de Docker.
# Sin HTTPS: solo para el entorno local. En producción va con certificado (TLS).
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

# Dirección con la que lo encuentran los otros contenedores (backend y backup).
api_addr = "http://openbao:8200"

# Dirección interna que usa raft para comunicarse.
cluster_addr = "http://openbao:8201"

# Sin interfaz web: se maneja solo con comandos.
ui = false
