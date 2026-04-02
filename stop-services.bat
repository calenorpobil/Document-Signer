@echo off
:: ============================================
:: Document Signer - Stop Services Script
:: ============================================
:: Este script detiene todos los servicios
:: ============================================

echo.
echo ============================================
echo   Document Signer - Stop Services
echo ============================================
echo.

echo   Deteniendo servicios...
echo.

:: Matar procesos de Anvil
echo   [1/2] Deteniendo Anvil...
taskkill /F /IM anvil.exe >nul 2>nul
if %errorlevel% equ 0 (
    echo   ✓ Anvil terminado
) else (
    echo   ℹ Anvil no estaba corriendo
)

:: Matar procesos de Next.js en puerto 3000
echo   [2/2] Deteniendo Next.js...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    for /f "tokens=*" %%b in ('tasklist /FI "PID eq %%a" /FO CSV ^| find "node.exe"') do (
        taskkill /F /PID %%a >nul 2>nul
        if %errorlevel% equ 0 (
            echo   ✓ Proceso %%a terminado
        )
    )
)

echo.
echo   ✓ Todos los servicios han sido detenidos
echo.
pause