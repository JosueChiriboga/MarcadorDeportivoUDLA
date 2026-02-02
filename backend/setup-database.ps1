# Script para verificar y configurar la base de datos PostgreSQL
$ErrorActionPreference = "Stop"

# Parámetros de conexión
$pgHost = "localhost"
$pgPort = "5432"
$pgUser = "postgres"
$pgPass = "admin"
$dbName = "marcadorudla"

# Función para verificar si PostgreSQL está instalado
function Test-PostgreSQLInstallation {
    try {
        $null = Get-Command psql -ErrorAction Stop
        Write-Host "✓ PostgreSQL está instalado correctamente" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ PostgreSQL no está instalado o no está en el PATH" -ForegroundColor Red
        Write-Host "Por favor, instala PostgreSQL desde: https://www.postgresql.org/download/" -ForegroundColor Yellow
        return $false
    }
}

# Función para verificar la conexión a PostgreSQL
function Test-PostgreSQLConnection {
    try {
        $env:PGPASSWORD = $pgPass
        $testConnection = psql -h $pgHost -p $pgPort -U $pgUser -c "\conninfo" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Conexión a PostgreSQL exitosa" -ForegroundColor Green
            return $true
        }
        return $false
    }
    catch {
        Write-Host "✗ Error al conectar a PostgreSQL: $_" -ForegroundColor Red
        return $false
    }
}

# Función para crear la base de datos si no existe
function New-DatabaseIfNotExists {
    try {
        $env:PGPASSWORD = $pgPass
        $dbExists = psql -h $pgHost -p $pgPort -U $pgUser -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'"
        if ($dbExists) {
            Write-Host "✓ Base de datos '$dbName' ya existe" -ForegroundColor Green
        }
        else {
            $null = psql -h $pgHost -p $pgPort -U $pgUser -c "CREATE DATABASE $dbName"
            Write-Host "✓ Base de datos '$dbName' creada exitosamente" -ForegroundColor Green
        }
        return $true
    }
    catch {
        Write-Host "✗ Error al crear la base de datos: $_" -ForegroundColor Red
        return $false
    }
}

# Ejecutar verificaciones
Write-Host "Iniciando configuración de la base de datos..." -ForegroundColor Cyan

if (-not (Test-PostgreSQLInstallation)) {
    exit 1
}

if (-not (Test-PostgreSQLConnection)) {
    Write-Host "Verifica que PostgreSQL esté corriendo y que las credenciales sean correctas" -ForegroundColor Yellow
    exit 1
}

if (-not (New-DatabaseIfNotExists)) {
    exit 1
}

# Configurar variables de entorno para la aplicación
Write-Host "`nConfigurando variables de entorno para la aplicación..." -ForegroundColor Cyan

$env:ASPNETCORE_ENVIRONMENT = "Development"
[System.Environment]::SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development", "User")

Write-Host "✓ Configuración completada exitosamente" -ForegroundColor Green
Write-Host "`nPuedes iniciar la aplicación con: dotnet run" -ForegroundColor Cyan