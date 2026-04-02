@echo off
setlocal enabledelayedexpansion

:: ============================================
:: Document Signer - Windows Deployment Script
:: ============================================

echo.
echo ============================================
echo   Document Signer - Deployment Script
echo ============================================
echo.

:: Configurar ruta del proyecto
set PROJECT_DIR=%~dp0
set DAPP_DIR=%PROJECT_DIR%dapp
set ENV_FILE=%DAPP_DIR%\.env.local

:: Navegar al directorio del proyecto
cd /d "%PROJECT_DIR%"

echo [INFO] Iniciando despliegue...
echo.

:: 1. Detener procesos existentes
echo [1/6] Deteniendo procesos existentes...
taskkill /F /IM anvil.exe >nul 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    for /f "tokens=*" %%b in ('tasklist /FI "PID eq %%a" /FO CSV ^| find "node.exe"') do (
        taskkill /F /PID %%a >nul 2>nul
    )
)
timeout /t 2 /nobreak >nul
echo   ✓ Procesos anteriores terminados
echo.

:: 2. Iniciar Anvil
echo [2/6] Iniciando Anvil...
start "Anvil Node" anvil --port 8545 --chain-id 31337 --accounts 10 --balance 10000
echo   Esperando a que Anvil inicie...
timeout /t 5 /nobreak >nul

:: Verificar que Anvil este corriendo
tasklist /FI "IMAGENAME eq anvil.exe" 2>nul | find /I "anvil.exe" >nul
if %errorlevel% neq 0 (
    echo   ERROR: No se pudo iniciar Anvil
    pause
    exit /b 1
)
echo   ✓ Anvil iniciado correctamente
echo.

:: 3. Compilar contrato
echo [3/6] Compilando contrato...
call forge build
if %errorlevel% neq 0 (
    echo   ERROR: Error al compilar
    pause
    exit /b 1
)
echo   ✓ Contrato compilado
echo.

:: 4. Desplegar contrato
echo [4/6] Desplegando contrato...
if exist "broadcast\Deploy.s.sol\31337" (
    rmdir /s /q "broadcast\Deploy.s.sol\31337"
)

forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 > "%TEMP%\deploy_output.txt" 2>&1

if %errorlevel% neq 0 (
    echo   ERROR: Error al desplegar
    type "%TEMP%\deploy_output.txt"
    pause
    exit /b 1
)
echo   ✓ Contrato desplegado
echo.

:: 5. Configurar dApp
echo [5/6] Configurando dApp...
cd /d "%DAPP_DIR%"

:: Buscar direccion del contrato
set CONTRACT_ADDRESS=
for /f "tokens=*" %%i in ('findstr /C:"Deployed contract address:" "%TEMP%\deploy_output.txt"') do (
    for /f "tokens=*" %%a in ("%%i") do set CONTRACT_ADDRESS=%%a
)

if not defined CONTRACT_ADDRESS (
    for /f "tokens=*" %%i in ('findstr /C:"Contract deployed at:" "%TEMP%\deploy_output.txt"') do (
        for /f "tokens=*" %%a in ("%%i") do set CONTRACT_ADDRESS=%%a
    )
)

if defined CONTRACT_ADDRESS (
    echo   Contract address: %CONTRACT_ADDRESS%
    
    :: Actualizar .env.local
    if exist "%ENV_FILE%" copy "%ENV_FILE%" "%ENV_FILE%.bak" >nul
    
    (
        echo # Contract Configuration
        echo NEXT_PUBLIC_CONTRACT_ADDRESS=%CONTRACT_ADDRESS%
        echo NEXT_PUBLIC_RPC_URL=http://localhost:8545
        echo NEXT_PUBLIC_CHAIN_ID=31337
        echo.
        echo # MetaMask SDK Configuration
        echo NEXT_PUBLIC_METAMASK_SDK_CHAIN_ID=31337
        echo NEXT_PUBLIC_METAMASK_SDK_RPC_URL=http://localhost:8545
    ) > "%ENV_FILE%"
    
    echo   ✓ .env.local actualizado
) else (
    echo   ADVERTENCIA: No se pudo extraer la direccion del contrato
    echo   Actualiza manualmente dapp\.env.local
)
echo.

:: 6. Iniciar dApp
echo [6/6] Iniciando dApp...
if not exist "node_modules" (
    echo   Instalando dependencias...
    call npm install
)

cls
echo.
echo   ============================================
echo     ¡Despliegue completado!
echo   ============================================
echo.
echo   SERVICIOS CORRIENDO:
echo   • Anvil: http://localhost:8545
echo   • dApp:  http://localhost:3000
echo.
if defined CONTRACT_ADDRESS (
    echo   CONTRATO: %CONTRACT_ADDRESS%
    echo.
)
echo   WALLETS DE ANVIL:
echo   • Wallet 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
echo   • Clave: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
echo.
echo   Para detener: Cierra Anvil y presiona Ctrl+C aqui
echo   ============================================
echo.

call npm run dev

:: Limpieza
echo.
echo   Deteniendo servicios...
taskkill /F /IM anvil.exe >nul 2>nul
echo   ✓ Servicios detenidos
pause