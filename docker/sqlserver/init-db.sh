#!/usr/bin/env bash
set -euo pipefail

database_name="${MSSQL_DATABASE:-DATN_SD42}"
if [[ ! "${database_name}" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "MSSQL_DATABASE may only contain letters, numbers and underscores." >&2
    exit 1
fi

sqlcmd="/opt/mssql-tools18/bin/sqlcmd"
if [[ ! -x "${sqlcmd}" ]]; then
    sqlcmd="/opt/mssql-tools/bin/sqlcmd"
fi

until "${sqlcmd}" \
    -S sqlserver -U sa -P "${MSSQL_SA_PASSWORD}" -C \
    -Q "SELECT 1" >/dev/null 2>&1; do
    echo "Waiting for SQL Server..."
    sleep 3
done

"${sqlcmd}" \
    -S sqlserver -U sa -P "${MSSQL_SA_PASSWORD}" -C \
    -Q "IF DB_ID(N'${database_name}') IS NULL EXEC(N'CREATE DATABASE [${database_name}]');"

echo "Database ${database_name} is ready."
