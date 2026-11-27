#!/bin/sh
set -e

# Render expone la BD como postgresql://user:pass@host/db; Spring Boot necesita
# jdbc:postgresql://host/db SIN credenciales embebidas (el driver PG las rechaza;
# el usuario/clave van por SPRING_DATASOURCE_USERNAME/PASSWORD). Forzamos SSL.
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
  case "$DATABASE_URL" in
    jdbc:*) export SPRING_DATASOURCE_URL="$DATABASE_URL" ;;
    *)
      raw="${DATABASE_URL#jdbc:}"
      scheme="${raw%%://*}"
      rest="${raw#*://}"
      hostportdb="$rest"
      case "$rest" in *@*) hostportdb="${rest#*@}" ;; esac
      case "$scheme" in postgres|postgresql) scheme="postgresql" ;; esac
      export SPRING_DATASOURCE_URL="jdbc:${scheme}://${hostportdb}"
      case "$SPRING_DATASOURCE_URL" in
        *\?*) ;;
        *) export SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL}?sslmode=require" ;;
      esac
      ;;
  esac
fi

exec java -jar /app/app.jar
