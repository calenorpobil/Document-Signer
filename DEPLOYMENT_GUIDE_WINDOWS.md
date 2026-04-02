# Guía de Despliegue para Windows

## Scripts de Despliegue Automático

Este proyecto incluye scripts de Windows para facilitar el despliegue completo del sistema.

### Archivos Incluidos

1. **`deploy-windows.bat`** - Script principal de despliegue
2. **`stop-services.bat`** - Script para detener servicios

---

## Uso Rápido

### Desplegar el Proyecto

1. **Abre PowerShell o Command Prompt como Administrador**
   - Click derecho → "Ejecutar como administrador"

2. **Navega al directorio del proyecto**
   ```cmd
   cd "C:\Users\Carlos\Documents\proyectos\CodeCrypto\Document Signer"
   ```

3. **Ejecuta el script de despliegue**
   ```cmd
   deploy-windows.bat
   ```

4. **Espera a que complete**
   - El script automáticamente:
     - Verifica prerequisitos
     - Inicia Anvil (blockchain local)
     - Compila y despliega el contrato
     - Actualiza la configuración
     - Inicia la dApp de Next.js

5. **Accede a la dApp**
   - Abre tu navegador en: **http://localhost:3000**

### Detener Servicios

Para detener todos los servicios:

```cmd
stop-services.bat
```

O simplemente:
- Cierra la ventana de Anvil
- Presiona `Ctrl+C` en la ventana de la terminal

---

## ¿Qué Hace el Script de Despliegue?

### Paso 1: Verificación de Prerequisitos
- ✓ Node.js 18+
- ✓ npm
- ✓ Foundry (forge)
- ✓ Anvil

### Paso 2: Limpieza
- Detiene procesos de Anvil existentes
- Detiene procesos de Next.js en puerto 3000

### Paso 3: Iniciar Anvil
- Inicia nodo blockchain local en puerto 8545
- Configura 10 wallets con 10,000 ETH cada una
- Chain ID: 31337

### Paso 4: Compilar Contrato
- Ejecuta `forge build`
- Compila contratos Solidity

### Paso 5: Desplegar Contrato
- Ejecuta script de despliegue
- Usa wallet 0 de Anvil
- Extrae dirección del contrato desplegado

### Paso 6: Configurar e Iniciar dApp
- Actualiza `.env.local` con dirección del contrato
- Instala dependencias si es necesario
- Inicia Next.js en puerto 3000

---

## Wallets Disponibles

Después del despliegue, tienes acceso a 10 wallets de prueba:

| Wallet | Dirección | Clave Privada |
|--------|-----------|---------------|
| 0 | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| 1 | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| 2 | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |
| 3 | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| 4 | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a |
| 5 | 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc | 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba |
| 6 | 0x976EA74026E726554dB657fA54763abd0C3a0aa9 | 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e |
| 7 | 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 | 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356 |
| 8 | 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f | 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97 |
| 9 | 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 | 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6 |

---

## Solución de Problemas

### Error: "Node.js no esta instalado"

**Solución:**
1. Descarga Node.js desde https://nodejs.org/
2. Instala la versión LTS (18+)
3. Reinicia tu terminal

### Error: "Foundry no esta instalado"

**Solución:**
1. Abre PowerShell como administrador
2. Ejecuta: `curl -L https://foundry.paradigm.xyz | bash`
3. Ejecuta: `foundryup`
4. Reinicia tu terminal

### Error: "No se pudo iniciar Anvil"

**Posibles causas:**
- Puerto 8545 ya está en uso
- Anvil no está en el PATH

**Solución:**
1. Ejecuta `stop-services.bat`
2. Intenta de nuevo

### Error: "Error al desplegar el contrato"

**Solución:**
1. Verifica que Anvil esté corriendo
2. Abre una nueva terminal y ejecuta: `anvil`
3. Ejecuta el script de nuevo

### Error: "Puerto 3000 ya está en uso"

**Solución:**
1. Ejecuta `stop-services.bat`
2. O manualmente mata el proceso:
   ```cmd
   netstat -ano | find ":3000"
   taskkill /F /PID <numero_de_proceso>
   ```

### La dApp no muestra la dirección del contrato

**Solución:**
1. Verifica que el contrato se desplegó correctamente
2. Revisa el archivo `dapp/.env.local`
3. Actualiza manualmente la dirección si es necesario:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   ```

---

## Despliegue Manual (Alternativo)

Si prefieres hacerlo manualmente:

### 1. Iniciar Anvil
```cmd
anvil --port 8545 --chain-id 31337 --accounts 10 --balance 10000
```

### 2. Compilar Contrato
```cmd
forge build
```

### 3. Desplegar Contrato
```cmd
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 4. Actualizar .env.local
```cmd
cd dapp
copy .env.local .env.local.bak
```

Edita `dapp/.env.local` y actualiza:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (dirección de tu contrato)
```

### 5. Iniciar dApp
```cmd
cd dapp
npm run dev
```

---

## Configuración de MetaMask

Para conectar MetaMask a Anvil:

1. Abre MetaMask
2. Click en la red actual → "Add Network"
3. Ingresa:
   - **Network Name:** Anvil Local
   - **RPC URL:** http://localhost:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
4. Click "Save"

### Importar Wallet de Anvil a MetaMask

1. Abre MetaMask
2. Click en el círculo de cuenta → "Import account"
3. Pega la clave privada de una wallet de Anvil
4. Click "Import"

---

## Notas Importantes

⚠️ **ADVERTENCIAS:**

1. **Solo para desarrollo local** - Este script está diseñado para desarrollo y pruebas
2. **No usar en producción** - Las claves privadas están hardcodeadas
3. **Anvil es temporal** - Los datos se pierden al detener Anvil
4. **Recuerda detener los servicios** cuando no los uses

---

## Comandos Útiles

### Ver logs de Anvil
- Revisa la ventana de Anvil que se abre automáticamente

### Ver logs de Next.js
- Se muestran en la terminal donde ejecutaste `deploy-windows.bat`

### Reiniciar desde cero
```cmd
stop-services.bat
del /Q dapp\.env.local
deploy-windows.bat
```

### Verificar servicios corriendo
```cmd
tasklist | find "anvil.exe"
netstat -ano | find ":3000"
```

---

## Soporte

Si encuentras problemas:

1. Revisa esta guía de solución de problemas
2. Revisa los logs en la terminal
3. Verifica que todos los prerequisitos estén instalados
4. Intenta reiniciar tu computadora

Para más información, revisa:
- `README.md` - Documentación principal del proyecto
- `dapp/METAMASK_INTEGRATION.md` - Guía de MetaMask SDK