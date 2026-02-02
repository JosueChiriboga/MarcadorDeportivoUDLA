# MarcadorUdla - Phase 1 (Login scaffold)

This workspace contains a minimal scaffold for Phase 1 requested: a login UI and a protected backend using .NET 9 and Angular 20.

What you get:

- Backend: ASP.NET Core (net9.0) API with JWT authentication and an /api/auth/login endpoint.
- Frontend: Angular 20 app (zoneless, standalone components, SSR-ready) with a styled login page using colors from the supplied image and three roles (Administrador, Visualizador, Juez). After login the app navigates to a blank page (phase 1 requirement).

Important notes and assumptions:

- This is a small scaffold intended to be extended. Passwords are stored as SHA256 hashes in-memory for demo only. Replace with a proper user store & secure password hashing in production.
- Replace the JWT secret in `backend/appsettings.json` before deploying to any real environment.

## Quick start (Windows PowerShell)

## NOTA: Conectar a la base de datos "pgAmin 4", versión 9.9

## Versión Python 3.13.9

## --------- MARCADOR UDLA -------------

## 1er Paso: Iniciar pgAdmin 4 (verificar conexión exitosa)

## 2do Paso: Abrir el programa MARCADORUDLA (Visual Studio Code) e ingresar a "appsettings" para configurar la conexión con su base de datos: USERNAME, PASSWORD, PORT. Verificar en pgAdmin 4. Ingresar despues a "setup-database.ps" para configurar: $pgHost = "localhost", $pgPort = "5432", $pgUser = "postgres", $pgPass = "admin", $dbName = "marcadorudla"

## 3er Paso: Abrir una nueva terminal e ingresar los siguientes comandos:

### Backend (.NET 9):

1. Open a PowerShell terminal in `backend` folder:

```powershell
cd backend
dotnet restore
dotnet run
```

By default the API will listen on the ports printed by dotnet (usually http://localhost:5000 or similar).

## 4to Paso: Verificar que no exista error entre la base de datos y la terminal del Backend

## 5to Paso: Una vez que el Backend funciona con exito, abrir una nueva terminal para el Frontend

## 6to Paso: No imgresar los comandos para el Frontend:

### Frontend (Angular 20):

## (NO INGRESAR ESTOS COMANDOS)

1. Open a PowerShell terminal in `frontend/frontend-app` folder:

```powershell
cd frontend/frontend-app
npm install
npx ng serve --open
```

## 7mo Paso: Ingresar estos comandos en orden, tomando en cuenta la ubicación en la DESKTOP.

## Copiar y pegar los siguientes comandos en la terminal del Frontend:

### Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

### cd "D:\Mis Documentos\Desktop\GitHub\MarcadorUdla\MarcadorUdla\frontend\frontend-app"

### npx ng serve --open

The Angular dev server will start on http://localhost:4200 and automatically open in your browser.

**Note:** For the frontend to call the backend API during development, you'll need to either:

- Add CORS policy on the backend, or
- Configure an Angular proxy (see below)

## Demo credentials (in-memory demo)

- **Administrador**: username `admin` / password `adminpass` (role: `Administrador`)
- **Visualizador**: username `viewer` / password `viewerpass` (role: `Visualizador`)
- **Juez**: username `juez` / password `juezpass` (role: `Juez`)

## Project Structure

```
MarcadorUdla/
├── backend/                          # .NET 9 API
│   ├── Controllers/
│   │   └── AuthController.cs         # Login endpoint & protected endpoint
│   ├── Models/
│   │   ├── LoginRequest.cs
│   │   └── User.cs
│   ├── Services/
│   │   ├── IUserService.cs
│   │   └── UserService.cs            # In-memory user store (demo)
│   ├── Program.cs                    # Startup & DI configuration
│   ├── JwtSettings.cs
│   ├── appsettings.json
│   └── MarcadorUdla.csproj
│
└── frontend/
    └── frontend-app/                 # Angular 20 workspace
        ├── src/
        │   ├── app/
        │   │   ├── app.component.ts  # Root component
        │   │   ├── app.config.ts     # App providers (HTTP, Router, Auth)
        │   │   ├── app.routes.ts     # Route definitions
        │   │   ├── login.component.ts
        │   │   ├── blank.component.ts
        │   │   └── auth.interceptor.ts
        │   ├── main.ts               # Bootstrap
        │   ├── styles.css            # Global styles (UDLA colors)
        │   └── index.html
        ├── angular.json
        └── package.json
```

## Technology Stack

- **Backend**: ASP.NET Core 9.0, JWT Bearer authentication, MVC pattern (Models/Controllers/Services)
- **Frontend**: Angular 20 (standalone components, zoneless, SSR-ready), TypeScript, CSS

## Next steps / suggestions

1. **Add CORS or proxy config** so the frontend can call the backend:
   - Backend CORS example (add to `Program.cs` before `app.Run()`):

   ```csharp
   app.UseCors(policy => policy
       .WithOrigins("http://localhost:4200")
       .AllowAnyMethod()
       .AllowAnyHeader()
       .AllowCredentials());
   ```

   - Or add Angular proxy: create `frontend/frontend-app/proxy.conf.json`:

   ```json
   {
     "/api": {
       "target": "http://localhost:5000",
       "secure": false
     }
   }
   ```

   Then run: `npx ng serve --proxy-config proxy.conf.json --open`

2. **Replace in-memory users** with a proper database and ASP.NET Identity.

3. **Add role-based authorization** (policy-based) and UI flows per role.

4. **Add validation, logging, and unit tests**.

5. **Use environment variables** for sensitive config (JWT secret, connection strings).

## Troubleshooting

- If you see "This command is not available when running the Angular CLI outside a workspace", make sure you're in the `frontend/frontend-app` directory.
- If the browser shows connection errors to `/api/auth/login`, add CORS or proxy config (see Next steps above).
- The backend expects requests to `/api/auth/login`. The frontend calls this endpoint relatively, so you may need proxy config for local dev.
