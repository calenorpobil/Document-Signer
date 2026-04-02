#!/bin/bash

# ============================================
# Document Signer - Stop Services Script
# ============================================
# Este script detiene todos los servicios
# ============================================

echo ""
echo "============================================"
echo "  Document Signer - Stop Services"
echo "============================================"
echo ""

echo "Deteniendo servicios..."
echo ""

# Matar procesos de Anvil
echo "[1/2] Deteniendo Anvil..."
if pgrep -f "anvil" > /dev/null; then
    pkill -f "anvil" || true
    echo "  ✓ Anvil terminado"
else
    echo "  ℹ Anvil no estaba corriendo"
fi

# Matar procesos de Next.js en puerto 3000
echo "[2/2] Deteniendo Next.js..."
if lsof -ti:3000 > /dev/null 2>&1; then
    lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1 || true
    echo "  ✓ Next.js terminado"
else
    echo "  ℹ Next.js no estaba corriendo"
fi

echo ""
echo "✓ Todos los servicios han sido detenidos"
echo ""