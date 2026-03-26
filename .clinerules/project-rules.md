# TAREA A DESARROLLAR

- El estudiante debe de resolver con la IA en proyecto cuando haya visto los videos asociados, haciendo los cambios que considere oportuno.


# ETH Database Document - dApp de Verificación de Documentos

## Descripción del Proyecto

Este proyecto implementa una **dApp (aplicación descentralizada)** para almacenar y verificar la autenticidad de documentos utilizando blockchain Ethereum. La aplicación funciona completamente en el cliente, sin necesidad de servidor backend. El sistema permite:

- **Almacenamiento seguro**: Guardar hashes de archivos junto con timestamps y firmas digitales
- **Firma digital**: Los usuarios pueden firmar hashes de documentos usando wallets de Anvil
- **Selección de cuenta**: Interfaz para elegir entre 10 wallets de prueba de Anvil
- **Verificación**: Comprobar la autenticidad de un documento proporcionando el archivo y la dirección del firmante
- **Desarrollo simplificado**: **Sin necesidad de MetaMask** - usa wallets integradas de Anvil
- **Totalmente descentralizado**: Sin servidores centralizados, todo funciona en el navegador

## Arquitectura del Sistema

### 1. Contrato Inteligente (Solidity + Foundry)
- **DocumentRegistry.sol**: Contrato principal que almacena hashes de documentos
- **Funcionalidades**:
  - `storeDocumentHash(bytes32 hash, uint256 timestamp, bytes signature)`: Almacena hash con timestamp y firma
  - `verifyDocument(bytes32 hash, address signer, bytes signature)`: Verifica la autenticidad de un documento
  - `getDocumentInfo(bytes32 hash)`: Obtiene información de un documento almacenado

### 2. dApp Frontend (Next.js)
- **Tecnologías**: Next.js 14+ + TypeScript + Tailwind CSS + Ethers.js v6
- **Arquitectura**: Aplicación descentralizada que funciona 100% en el cliente
- **Provider**: `JsonRpcProvider` conectado directamente a Anvil (http://localhost:8545)
- **Wallets**: Sistema integrado con las 10 wallets de prueba de Anvil
- **Gestión de Estado**: Context API de React para compartir estado de wallet globalmente
- **Funcionalidades**:
  - Subida de archivos y cálculo de hash SHA-256 usando Ethers.js
  - **Wallets integradas de Anvil** - Sin necesidad de extensión MetaMask
  - Selector de wallet con las 10 cuentas de prueba de Anvil
  - Criptografía y firmas manejadas por Ethers.js con `ethers.Wallet`
  - Interfaz para verificación de documentos
  - Visualización del estado de documentos en blockchain
  - Conexión directa a Anvil usando `JsonRpcProvider`
  - Gestión de múltiples wallets con cambio dinámico
  - Alertas de confirmación antes de firmar y almacenar

## Especificaciones Técnicas

### Contrato Inteligente

```solidity
// Estructura de datos para documentos
struct Document {
    bytes32 hash;
    uint256 timestamp;
    address signer;
    bytes signature;
    bool exists;
}

// Eventos
event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp, bytes signature);
event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid);
```

**Funciones principales**:
- `storeDocumentHash(bytes32 hash, uint256 timestamp, bytes signature)`: Almacena hash con timestamp y firma
- `verifyDocument(bytes32 hash, address signer, bytes signature)`: Verifica firma usando ECDSA
- `getDocumentInfo(bytes32 hash)`: Consulta información completa del documento (hash, timestamp, signer, signature)
- `isDocumentStored(bytes32 hash)`: Verifica si un hash existe
- `getDocumentSignature(bytes32 hash)`: Obtiene la firma de un documento específico

### Aplicación Web

**Componentes principales**:
- `FileUploader`: Componente para subir archivos
- `DocumentSigner`: Interfaz para firmar hashes con wallets de Anvil
- `DocumentVerifier`: Herramienta de verificación de documentos
- `DocumentHistory`: Lista de documentos almacenados
- `WalletSelector`: Selector dropdown de las 10 wallets de Anvil

**Contextos y Providers**:
- `MetaMaskContext`: Context Provider de React que gestiona el estado de wallet globalmente
- `MetaMaskProvider`: Provider que envuelve la aplicación y comparte estado
- `useMetaMask`: Hook personalizado para acceder al contexto de wallet

**Hooks personalizados**:
- `useContract`: Hook para interactuar con el contrato inteligente
- `useFileHash`: Hook para calcular hashes de archivos
- `useMetaMask`: Hook que proporciona acceso a wallets de Anvil (re-exportado del contexto)

**Utilidades**:
- `EthersUtils`: Utilidades criptográficas usando Ethers.js v6
- `HashUtils`: Cálculo de hashes con `keccak256`
- `ethers.Wallet`: Creación dinámica de wallets con claves privadas de Anvil
- `JsonRpcProvider`: Conexión directa a nodo Anvil

**Flujo de trabajo (100% descentralizado con Anvil + Ethers.js)**:
1. Usuario selecciona wallet de Anvil (0-9) → Se crea `ethers.Wallet` con clave privada
2. Usuario sube archivo → Se calcula hash SHA-256/keccak256 usando Ethers.js
3. **Alert de confirmación** → Usuario ve mensaje y confirma firma
4. Usuario firma hash → Se genera firma digital usando `wallet.signMessage()`
5. **Alert de confirmación** → Usuario ve detalles y confirma almacenamiento
6. Se almacena en blockchain vía `JsonRpcProvider`: hash + timestamp + signer + firma
7. Para verificar: archivo + dirección → verifica firma usando `ethers.verifyMessage()`
8. **Sin extensiones**: No requiere MetaMask ni extensiones del navegador
9. **Ethers.js v6**: Manejo completo de criptografía, hashes y firmas
10. **Context API**: Estado compartido de wallet entre todos los componentes
11. **Anvil local**: Desarrollo y pruebas con nodo local

## Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- Foundry (incluye Anvil)
- ~~MetaMask~~ **No requerido** - Usa wallets integradas de Anvil
- Anvil (nodo local de Ethereum incluido en Foundry)
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

### 1. Configuración del Contrato (Foundry)

```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Inicializar proyecto
forge init eth-database-document
cd eth-database-document

# Instalar dependencias
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Configuración de la dApp (Next.js)

```bash
# Crear aplicación Next.js con TypeScript y Tailwind
npx create-next-app@latest dapp --typescript --tailwind --eslint --app
cd dapp

# Instalar dependencias Web3 y blockchain
npm install ethers@^6.0.0
npm install @types/node

# Dependencias para UI
npm install next-themes lucide-react @tanstack/react-query

# Ya NO se requiere:
# - @metamask/detect-provider (no usa MetaMask)
# - @metamask/sdk (no usa MetaMask)
# - wagmi (no es necesario con JsonRpcProvider directo)
```

## Estructura del Proyecto

```
eth-database-document/
├── contracts/
│   ├── DocumentRegistry.sol
│   └── interfaces/
│       └── IDocumentRegistry.sol
├── test/
│   └── DocumentRegistry.t.sol
├── script/
│   └── Deploy.s.sol
├── dapp/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── providers.tsx (envuelve app con MetaMaskProvider)
│   │   └── layout.tsx
│   ├── components/
│   │   ├── FileUploader.tsx
│   │   ├── DocumentSigner.tsx (con alertas de confirmación)
│   │   ├── DocumentVerifier.tsx (manejo mejorado de errores)
│   │   └── DocumentHistory.tsx
│   ├── contexts/
│   │   └── MetaMaskContext.tsx (Context Provider global)
│   ├── hooks/
│   │   ├── useContract.ts
│   │   ├── useFileHash.ts
│   │   └── useMetaMask.ts (re-exporta del contexto)
│   ├── utils/
│   │   ├── ethers.ts (EthersUtils con Ethers.js v6)
│   │   └── hash.ts (HashUtils con keccak256)
│   ├── types/
│   │   └── ethereum.d.ts
│   └── next.config.js
├── foundry.toml
├── package.json
└── README.md
```

## Uso del Sistema

### 1. Iniciar Anvil (Terminal 1)

```bash
# Iniciar nodo local Anvil
anvil

# Anvil iniciará con 10 wallets de prueba precargadas
# Cada wallet tiene 10,000 ETH
# RPC: http://localhost:8545
# Chain ID: 31337
```

### 2. Desplegar el Contrato (Terminal 2)

```bash
cd sc

# Compilar contrato
forge build

# Ejecutar tests
forge test

# Desplegar en Anvil usando la primera wallet de prueba
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Anota la dirección del contrato desplegado
```

### 3. Configuración de la dApp (Terminal 3)

```bash
cd dapp

# Crear archivo .env.local
cat > .env.local << EOF
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337
EOF

# Ejecutar en modo desarrollo
npm run dev

# La dApp estará disponible en http://localhost:3000 (o siguiente puerto disponible)
# Funciona completamente en el cliente, sin backend
# No requiere extensión MetaMask
```

### 4. Flujo de Usuario

#### Almacenar Documento:
1. **Conectar wallet**: Hacer clic en "Connect Wallet" y seleccionar una de las 10 wallets de Anvil
2. **Subir archivo**: Cargar archivo (PDF, imagen, etc.)
3. **Calcular hash**: El sistema calcula automáticamente el hash keccak256 usando Ethers.js
4. **Firmar**: Hacer clic en "Sign Document"
   - Aparece alert de confirmación mostrando el mensaje a firmar
   - Confirmar para generar firma con `wallet.signMessage()`
   - Alert de éxito muestra la firma generada
5. **Almacenar**: Hacer clic en "Store on Blockchain"
   - Aparece alert de confirmación con detalles completos
   - Confirmar para almacenar en Anvil vía `JsonRpcProvider`
   - Alert de éxito muestra el transaction hash

#### Verificar Documento:
1. **Ir a pestaña "Verify"**
2. **Subir archivo original** a verificar
3. **Ingresar dirección del firmante** (dirección de wallet de Anvil que firmó)
4. **Hacer clic en "Verify Document"**
5. El sistema:
   - Calcula el hash del archivo con Ethers.js
   - Consulta blockchain vía `JsonRpcProvider`
   - Recupera la firma almacenada
   - Verifica firma con `ethers.verifyMessage()`
6. **Muestra resultado**: Válido o inválido con detalles completos

#### Cambiar de Wallet:
1. Si está conectado, hacer clic en el botón de la wallet actual
2. Se despliega dropdown con las 10 wallets disponibles
3. Seleccionar nueva wallet
4. El estado se actualiza globalmente gracias al Context Provider

## Seguridad

### Consideraciones de Seguridad:
- **Hash keccak256 con Ethers.js v6**: Garantiza integridad del archivo usando librería confiable
- **Firma ECDSA con ethers.Wallet**: Autentica al firmante usando claves privadas de Anvil
- **Timestamp**: Previene ataques de replay
- **Verificación on-chain**: Garantiza inmutabilidad
- **JsonRpcProvider**: Conexión directa segura a nodo Anvil local
- **Alertas de confirmación**: Usuario debe confirmar explícitamente cada firma y transacción
- **Context API**: Estado compartido evita inconsistencias entre componentes
- **Criptografía robusta**: Ethers.js v6 proporciona implementaciones seguras y probadas

### ⚠️ Notas para Desarrollo:
- **Solo para desarrollo local**: Las claves privadas están hardcodeadas en el código
- **No usar en producción**: Este sistema es solo para pruebas y desarrollo
- **Anvil local**: Solo funciona con nodo Anvil local, no con redes públicas
- **Wallets de prueba**: Las 10 wallets son las estándar de Anvil, no contienen valor real

### Mejores Prácticas:
- Validar formato de archivos antes de procesarlos
- Implementar límites de tamaño de archivo
- **Usar solo en Anvil local** - No desplegar en redes públicas con claves hardcodeadas
- Verificar firmas antes de almacenar usando `ethers.verifyMessage()`
- Validar conexión a Anvil antes de operaciones
- Confirmar operaciones con alerts de confirmación
- Manejar errores de red apropiadamente
- Usar Ethers.js v6 para todas las operaciones criptográficas
- Validar hashes generados por Ethers.js
- Logging detallado con emojis para debugging

## Testing

### Tests del Contrato:
```bash
# Ejecutar todos los tests
forge test

# Tests con cobertura
forge coverage

# Tests específicos
forge test --match-test testStoreDocument
```

### Tests de la dApp (Next.js):
```bash
cd dapp

# Tests unitarios
npm test

# Tests con Jest
npm run test:watch

# Tests de integración Web3
npm run test:integration

# Tests de componentes React
npm run test:components
```

## Despliegue

### ⚠️ Importante - Solo Desarrollo Local

Esta aplicación está configurada **exclusivamente para desarrollo local** con Anvil. **NO debe usarse en redes públicas** debido a que las claves privadas están hardcodeadas.

### Red Soportada:
- **Solo Desarrollo Local**: Anvil (incluido en Foundry)
- ~~Testnet~~: No soportado con esta configuración
- ~~Mainnet~~: **NUNCA usar esta configuración en mainnet**

### Variables de Entorno (dApp):
```env
# .env.local
# Dirección del contrato desplegado en Anvil
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# RPC URL de Anvil local
NEXT_PUBLIC_RPC_URL=http://localhost:8545

# Chain ID de Anvil
NEXT_PUBLIC_CHAIN_ID=31337
```

**Nota**: No se requieren otras variables de entorno como:
- ~~NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID~~ (no usa WalletConnect)
- ~~NEXT_PUBLIC_ALCHEMY_API_KEY~~ (conecta directamente a Anvil)
- ~~NEXT_PUBLIC_INFURA_ID~~ (no usa proveedores externos)

## Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

MIT License - ver archivo LICENSE para detalles.

## Contacto

Para preguntas o soporte, crear un issue en el repositorio.

---

## 🔧 Cambios Técnicos Implementados

### Alternativa a MetaMask

Este proyecto implementa una **alternativa completa a MetaMask** para simplificar el desarrollo local:

#### ❌ Antes (con MetaMask):
```typescript
// Requería MetaMask instalado
const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const signature = await signer.signMessage(message)
```

**Problemas**:
- Requiere extensión MetaMask instalada
- Usuario debe aprobar cada transacción manualmente
- Cada componente tenía su propia instancia de hook (estado desincronizado)
- Configuración compleja para desarrollo

#### ✅ Ahora (con Wallets de Anvil):
```typescript
// Usa JsonRpcProvider y wallets integradas
const provider = new ethers.JsonRpcProvider('http://localhost:8545')
const wallet = new ethers.Wallet(privateKey, provider)
const signature = await wallet.signMessage(message)
```

**Ventajas**:
- ✅ Sin necesidad de extensión del navegador
- ✅ Wallets precargadas con ETH de prueba
- ✅ Selector visual de 10 wallets de Anvil
- ✅ Estado global compartido con Context API
- ✅ Cambio instantáneo entre wallets
- ✅ Desarrollo más rápido y simple

### Provider: BrowserProvider vs JsonRpcProvider

#### 🔄 Cambio de Provider

**Antes**: `ethers.BrowserProvider`
- Envuelve `window.ethereum` (inyectado por MetaMask)
- Requiere aprobación de usuario para cada operación
- Solo funciona si MetaMask está instalado

**Ahora**: `ethers.JsonRpcProvider`
- Conexión HTTP directa al nodo
- No requiere extensiones del navegador
- Ideal para desarrollo local con Anvil
- Control programático completo

```typescript
// Configuración del Provider
const RPC_URL = 'http://localhost:8545'
const provider = new ethers.JsonRpcProvider(RPC_URL)

// Crear wallet dinámicamente
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

// Firmar mensajes
const signature = await wallet.signMessage(message)

// Enviar transacciones
const tx = await contract.connect(wallet).functionName(params)
```

### Context API para Estado Global

Implementamos **React Context API** para compartir el estado de la wallet entre todos los componentes:

```typescript
// contexts/MetaMaskContext.tsx
export function MetaMaskProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  // ... más estado

  return (
    <MetaMaskContext.Provider value={{
      account,
      isConnected,
      connect,
      signMessage,
      // ... más funciones
    }}>
      {children}
    </MetaMaskContext.Provider>
  )
}

// Usar en cualquier componente
const { account, isConnected, signMessage } = useMetaMask()
```

**Beneficios**:
- Estado sincronizado en toda la aplicación
- Un solo punto de verdad
- Evita re-renders innecesarios
- Fácil de testear y mantener

### Características Adicionales

1. **Alertas de Confirmación**: Usuario ve exactamente qué está firmando
2. **Logging Detallado**: Consola con emojis para debugging fácil
3. **Manejo de Errores Mejorado**: Mensajes claros y específicos
4. **10 Wallets Disponibles**: Selector visual de todas las wallets de Anvil
5. **Hot Reload**: Cambios reflejados instantáneamente en desarrollo

---

**Nota**: Este proyecto está configurado exclusivamente para desarrollo local. Para uso en producción, se debería implementar integración con MetaMask/WalletConnect real sin hardcodear claves privadas.
