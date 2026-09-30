"""
TALLER DE LABORATORIO 3: LÓGICA DIFUSA COMERCIAL
Fuzzificación de la "Experiencia" de un conductor según sus años trabajados.

Conjuntos difusos (funciones triangulares):
    Novato     -> (0, 0, 5)
    Intermedio -> (2, 5, 8)
    Experto    -> (5, 10, 20)

Ejecutar en consola:  python laboratorio.py
"""
import sys


# ==========================================
# 1. FUNCIÓN DE MEMBRESÍA TRIANGULAR
# ==========================================
def membresia_triangular(x, a, b, c):
    """
    Implementación computacional de la función a trozos:
        0                 si x <= a  o  x >= c
        (x - a) / (b - a) si a < x <= b
        (c - x) / (c - b) si b < x < c
    Caso especial: si a == b (como Novato = (0, 0, 5)) el triángulo es un
    "hombro izquierdo" y en x = b el grado es 1. Sin este ajuste la fórmula
    daría 0 en x = 0 y dividiría por cero en (b - a).
    """
    if x == b:
        return 1.0
    if x <= a or x >= c:
        return 0.0
    elif a < x <= b:
        return (x - a) / (b - a)
    elif b < x < c:
        return (c - x) / (c - b)
    return 0.0


# ==========================================
# 2. CONJUNTOS DIFUSOS DE LA EMPRESA
# ==========================================
conjuntos = {
    "novato": (0, 0, 5),
    "intermedio": (2, 5, 8),
    "experto": (5, 10, 20),
}

conductores = [3, 6, 12]  # años de experiencia a evaluar


def fuzzificar(anios):
    """Retorna los tres grados de membresía de un conductor."""
    return {nombre: round(membresia_triangular(anios, *vertices), 4)
            for nombre, vertices in conjuntos.items()}


def clasificar(anios):
    """Categoría con el MAYOR grado de verdad usando max()."""
    grados = fuzzificar(anios)
    categoria = max(grados, key=grados.get)
    if grados[categoria] == 0:
        categoria = "fuera de rango"
    return {"anios": anios, "grados": grados, "categoria": categoria}


# ==========================================
# 3. EJECUCIÓN EN CONSOLA
# ==========================================
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows
    print("Análisis Difuso de Experiencia de Conductores")
    print("=" * 46)
    for anios in conductores:
        resultado = clasificar(anios)
        g = resultado["grados"]
        print(f"\nConductor con {anios} años de experiencia:")
        print(f"  - Novato     : {g['novato']:.4f}  ({g['novato'] * 100:.2f}%)")
        print(f"  - Intermedio : {g['intermedio']:.4f}  ({g['intermedio'] * 100:.2f}%)")
        print(f"  - Experto    : {g['experto']:.4f}  ({g['experto'] * 100:.2f}%)")
        print(f"  => Categoría con mayor grado de verdad (max): {resultado['categoria'].upper()}")
