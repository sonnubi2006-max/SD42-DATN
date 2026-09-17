FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace
COPY be/pom.xml pom.xml
RUN mvn -B -DskipTests dependency:go-offline

COPY be/src src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-jammy

RUN groupadd --system spring \
    && useradd --system --gid spring --home-dir /app spring

WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar

RUN mkdir -p /app/uploads/temp \
    && chown -R spring:spring /app

USER spring

EXPOSE 8080 9092

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
