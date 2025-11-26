# Configurar variables de entorno para desarrollo local
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:POSTGRES_CONNECTION_STRING = "Host=localhost;Database=marcadorudla;Username=postgres;Password=postgres;Port=5432"
$env:JWT_SECRET_KEY = "YourSuperSecretKeyHereItShouldBeAtLeast32CharactersLong"

Write-Host "Variables de entorno configuradas correctamente para desarrollo local" -ForegroundColor Green
Write-Host "ASPNETCORE_ENVIRONMENT: $env:ASPNETCORE_ENVIRONMENT"