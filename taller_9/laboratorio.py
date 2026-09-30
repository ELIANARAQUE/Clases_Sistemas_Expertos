"""
TALLER DE LABORATORIO 9: HACKEANDO LOS PESOS
Perceptrón construido desde cero con NumPy (sin librerías de IA).

    Z = (X1 · W1) + (X2 · W2) + b
    Salida = 1 si Z >= 0, 0 si Z < 0

Reto: ajustar MANUALMENTE los pesos (W) y el sesgo (b) para resolver la
Compuerta OR.

Ejecutar en consola:  python laboratorio.py
"""
import sys

import numpy as np


# ==========================================
# 1. FUNCIÓN DE ACTIVACIÓN (ESCALÓN)
# ==========================================
def funcion_escalon(z):
    if z >= 0:
        return 1
    else:
        return 0


# ==========================================
# 2. ESTRUCTURA DE LA NEURONA
# ==========================================
def perceptron(X, W, b):
    # Producto punto (Combinación lineal)
    # Equivalente a: (X[0]*W[0]) + (X[1]*W[1]) ...
    Z = np.dot(X, W) + b

    # Activación
    salida = funcion_escalon(Z)
    return salida


# ==========================================
# 3. COMPUERTAS LÓGICAS
# ==========================================
ENTRADAS = [[1, 1], [1, 0], [0, 1], [0, 0]]

SALIDAS_ESPERADAS = {
    "AND": {(1, 1): 1, (1, 0): 0, (0, 1): 0, (0, 0): 0},
    "OR": {(1, 1): 1, (1, 0): 1, (0, 1): 1, (0, 0): 0},
}

# Pesos y sesgo de la guía (resuelven AND)
PESOS_AND = [0.5, 0.5]
SESGO_AND = -0.8

# Solución encontrada a mano para OR (punto 5 del taller)
PESOS_OR = [0.5, 0.5]
SESGO_OR = -0.3


def tabla_verdad(pesos, sesgo, compuerta):
    """Evalúa las 4 entradas y compara con la salida esperada de la compuerta."""
    W = np.array(pesos, dtype=float)
    filas = []
    for x in ENTRADAS:
        X = np.array(x)
        z = float(np.dot(X, W) + sesgo)
        salida = perceptron(X, W, sesgo)
        esperado = SALIDAS_ESPERADAS[compuerta][tuple(x)]
        filas.append({"entrada": x, "z": round(z, 4), "salida": salida,
                      "esperado": esperado, "correcto": salida == esperado})
    return {"compuerta": compuerta, "pesos": list(pesos), "sesgo": sesgo,
            "filas": filas, "resuelve": all(f["correcto"] for f in filas)}


# ==========================================
# 4. EJECUCIÓN EN CONSOLA
# ==========================================
def imprimir(tabla):
    print(f"\nCompuerta {tabla['compuerta']} con W = {tabla['pesos']} y b = {tabla['sesgo']}")
    print("   X1  X2 |      Z  | Salida | Esperado")
    for f in tabla["filas"]:
        x1, x2 = f["entrada"]
        marca = "OK" if f["correcto"] else "FALLA"
        print(f"   {x1:>2}  {x2:>2} | {f['z']:>6.2f}  |   {f['salida']}    |    {f['esperado']}     {marca}")
    print("   => ¡Resuelve la compuerta!" if tabla["resuelve"] else "   => No resuelve la compuerta")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows

    # Código original de la guía
    entradas = np.array([1, 1])
    pesos = np.array(PESOS_AND)
    sesgo = SESGO_AND
    resultado = perceptron(entradas, pesos, sesgo)
    print("El Perceptrón disparó el valor:", resultado)

    print("\n=== PUNTO 2: VERIFICACIÓN DE LA COMPUERTA AND ===")
    imprimir(tabla_verdad(PESOS_AND, SESGO_AND, "AND"))

    print("\n=== ¿QUÉ PASA SI USAMOS LOS PESOS DEL AND PARA EL OR? ===")
    imprimir(tabla_verdad(PESOS_AND, SESGO_AND, "OR"))

    print("\n=== PUNTOS 3 A 5: EL RETO - COMPUERTA OR ===")
    imprimir(tabla_verdad(PESOS_OR, SESGO_OR, "OR"))
