#!/bin/bash

# ============================================
# Document Signer - Linux Deployment Script
# ============================================
# Este script despliega el proyecto completo:
# 1. Inicia Anvil (nodo local de Ethereum)
# 2. Compila y despliega el contrato inteligente
# 3. Actualiza la configuración de la dApp
# 4. Inicia la dApp de Next.js
# ============================================

set -e  # Salir en caso de error

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Obtener directorio del script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
DAPP_DIR="$PROJECT_DIR/dapp"
ENV_FILE="$DAPP_DIR/.env.local"

# Navegar al directorio del proyecto
cd "$PROJECT_DIR"

echo ""
echo "============================================"
echo "  Document Signer - Deployment Script"
echo "============================================"
echo ""

# 1. Verificar prerequisitos
print_info "Verificando prerequisitos..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi
print_success "Node.js encontrado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado"
    exit 1
fi
print_success "npm encontrado: $(npm --version)"

# Verificar Foundry
if ! command -v forge &> /dev/null; then
    print_error "Foundry (forge) no está instalado"
    echo "Instala Foundry: curl -L https://foundry.paradigm.xyz | bash"
    echo "Luego ejecuta: foundryup"
    exit 1
fi
print_success "Foundry (forge) encontrado: $(forge --version)"

# Verificar Anvil
if ! command -v anvil &> /dev/null; then
    print_error "Anvil no está instalado"
    echo "Ejecuta: foundryup"
    exit 1
fi
print_success "Anvil encontrado: $(anvil --version)"

echo ""

# 2. Detener procesos existentes
print_info "Deteniendo procesos existentes..."

# Matar procesos de Anvil existentes
if pgrep -f "anvil" > /dev/null; then
    pkill -f "anvil" || true
    print_success "Procesos de Anvil anteriores terminados"
else
    print_success "No hay procesos de Anvil corriendo"
fi

# Matar procesos de Next.js en puerto 3000
if lsof -ti:3000; then
    lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1 || true
    print_success "Procesos en puerto 3000 terminados"
else
    print_success "No hay procesos en puerto 3000"
fi

sleep 2

echo ""

# 3. Iniciar Anvil
print_info "Iniciando Anvil (nodo local de Ethereum)..."
echo "  Puerto: 8545"
echo "  Chain ID: 31337"
echo "  Wallets: 10 wallets con 10000 ETH cada una"

# Iniciar Anvil en segundo plano
nohup anvil --port 8545 --chain-id 31337 --accounts 10 --balance 10000 > /tmp/anvil.log 2>&1 &
ANVIL_PID=$!

echo "  Esperando a que Anvil inicie..."
sleep 5

# Verificar que Anvil esté corriendo
if ! ps -p $ANVIL_PID > /dev/null; then
    print_error "No se pudo iniciar Anvil"
    cat /tmp/anvil.log
    exit 1
fi

print_success "Anvil iniciado correctamente (PID: $ANVIL_PID)"

echo ""

# 4. Compilar contrato
print_info "Compilando contrato inteligente..."

if ! forge build; then
    print_error "Error al compilar el contrato"
    exit 1
fi

print_success "Contrato compilado exitosamente"

echo ""

# 5. Desplegar contrato
print_info "Desplegando contrato inteligente..."
echo "  RPC: http://localhost:8545"
echo "  Usando wallet 0 de Anvil"

# Limpiar broadcast anterior
rm -rf broadcast/Deploy.s.sol/31337

# Ejecutar despliegue
DEPLOY_OUTPUT=$(forge script script/Deploy.s.sol \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 2>&1)

if [ $? -ne 0 ]; then
    print_error "Error al desplegar el contrato"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

print_success "Contrato desplegado exitosamente"

# Leer dirección del contrato desde el broadcast JSON que genera Foundry
BROADCAST_JSON="$PROJECT_DIR/broadcast/Deploy.s.sol/31337/run-latest.json"
CONTRACT_ADDRESS=""

if [ -f "$BROADCAST_JSON" ]; then
    if command -v jq &> /dev/null; then
        CONTRACT_ADDRESS=$(jq -r '[.transactions[] | select(.contractAddress != null) | .contractAddress] | first' "$BROADCAST_JSON")
    else
        # Fallback sin jq: buscar con grep/sed
        CONTRACT_ADDRESS=$(grep -o '"contractAddress":"0x[0-9a-fA-F]*"' "$BROADCAST_JSON" | head -1 | sed 's/"contractAddress":"//;s/"//')
    fi
fi

if [ -n "$CONTRACT_ADDRESS" ] && [ "$CONTRACT_ADDRESS" != "null" ]; then
    print_success "Dirección del contrato: $CONTRACT_ADDRESS"
else
    print_warning "No se pudo extraer la dirección del contrato automáticamente"
    echo "  Puedes actualizar manualmente dapp/.env.local"
fi

echo ""

# 6. Configurar e iniciar dApp
print_info "Configurando e iniciando dApp..."

cd "$DAPP_DIR"

# Actualizar .env.local con la dirección del contrato
if [ -n "$CONTRACT_ADDRESS" ]; then
    print_info "Actualizando .env.local..."
    
    # Crear backup
    if [ -f "$ENV_FILE" ]; then
        cp "$ENV_FILE" "$ENV_FILE.bak"
        print_success "Backup creado: $ENV_FILE.bak"
    fi
    
    # Actualizar archivo
    cat > "$ENV_FILE" << EOF
# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=$CONTRACT_ADDRESS
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# MetaMask SDK Configuration
NEXT_PUBLIC_METAMASK_SDK_CHAIN_ID=31337
NEXT_PUBLIC_METAMASK_SDK_RPC_URL=http://localhost:8545
EOF
    
    print_success ".env.local actualizado"
fi

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    print_info "Instalando dependencias de la dApp..."
    npm install
else
    print_success "Dependencias de la dApp ya instaladas"
fi

# Limpiar consola
clear

echo ""
echo "============================================"
echo "  ¡Despliegue completado exitosamente!"
echo "============================================"
echo ""
echo "SERVICIOS CORRIENDO:"
echo "--------------------"
echo "• Anvil (blockchain local): http://localhost:8545"
echo "• dApp (Next.js):           http://localhost:3000"
echo ""

if [ -n "$CONTRACT_ADDRESS" ]; then
    echo "CONTRATO DESPLEGADO:"
    echo "--------------------"
    echo "• Dirección: $CONTRACT_ADDRESS"
    echo "• Red: Anvil Local (Chain ID: 31337)"
    echo ""
fi

echo "WALLETS DE ANVIL DISPONIBLES:"
echo "-----------------------------"
echo "• Wallet 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "• Wallet 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "• Wallet 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
echo "• Wallet 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906"
echo "• Wallet 4: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
echo "• Wallet 5: 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
echo "• Wallet 6: 0x976EA74026E726554dB657fA54763abd0C3a0aa9"
echo "• Wallet 7: 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
echo "• Wallet 8: 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
echo "• Wallet 9: 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
echo ""

echo "CLAVE PRIVADA (Wallet 0):"
echo "-------------------------"
echo "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""

echo "USO:"
echo "----"
echo "1. Abre tu navegador en: http://localhost:3000"
echo "2. Conecta tu wallet (MetaMask o Anvil)"
echo "3. Sube un documento y fírmalo"
echo "4. Verifica documentos en la pestaña 'Verify'"
echo ""

echo "PARA DETENER:"
echo "-------------"
echo "• Presiona Ctrl+C en esta ventana"
echo "• O ejecuta: ./stop-services.sh"
echo ""

echo "============================================"
echo ""

# Función de limpieza al salir
cleanup() {
    echo ""
    echo "============================================"
    echo "Deteniendo servicios..."
    echo "============================================"
    echo ""
    
    echo "Deteniendo Anvil (PID: $ANVIL_PID)..."
    kill $ANVIL_PID 2>/dev/null || true
    pkill -f "anvil" 2>/dev/null || true
    print_success "Anvil terminado"
    
    echo ""
    print_success "Limpieza completada"
    echo ""
    echo "¡Hasta luego!"
    echo ""
}

# Configurar trap para limpieza al salir
trap cleanup EXIT INT TERM

# Iniciar Next.js
npm run dev