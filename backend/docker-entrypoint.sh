#!/bin/sh
set -e

# Render expone la BD como postgresql://...; Spring Boot necesita jdbc:postgresql://...
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
  case "$DATABASE_URL" in
    jdbc:*) export SPRING_DATASOURCE_URL="$DATABASE_URL" ;;
    *) export SPRING_DATASOURCE_URL="jdbc:${DATABASE_URL}" ;;
  esac
fi

exec java -jar /app/app.jar
