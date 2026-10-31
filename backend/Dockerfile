
# Etapa 1: Compilar el proyecto con Java 21 y Maven
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests package

# Etapa 2: Ejecutar Spring Boot
FROM eclipse-temurin:21-jre

WORKDIR /app

# Carpeta de archivos adjuntos: en Docker Compose se monta el volumen trama-uploads
RUN mkdir -p /app/uploads

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
