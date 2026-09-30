"""
TALLER DE LABORATORIO 5: DEFUZZIFICACIÓN
Método del Centroide (COG) implementado con operaciones matriciales de NumPy.

    COG = Σ (x · μ(x)) / Σ μ(x)

Ejecutar en consola:  python laboratorio.py
(scikit-fuzzy es opcional: si está instalado se usa para comparar resultados)
"""
import sys

import numpy as np

try:
    import skfuzzy as fuzz
except ImportError:          # el laboratorio funciona igual con el centroide propio
    fuzz = None


# ==========================================
# 1. CENTROIDE (COG) CON NUMPY
# ==========================================
def centroide(x, curva):
    """Centro de gravedad de un conjunto difuso: np.sum(x * curva) / np.sum(curva)."""
    x = np.asarray(x, dtype=float)
    curva = np.asarray(curva, dtype=float)
    area = np.sum(curva)
    if area == 0:
        raise ValueError("El área total es 0: ninguna regla se activó, no hay centroide.")
    return float(np.sum(x * curva) / area)


def centroide_detallado(x, curva):
    """Igual que centroide() pero devuelve también el numerador y el denominador."""
    x = np.asarray(x, dtype=float)
    curva = np.asarray(curva, dtype=float)
    numerador = float(np.sum(x * curva))
    denominador = float(np.sum(curva))
    return {"numerador": numerador, "denominador": denominador,
            "productos": (x * curva).tolist(), "resultado": centroide(x, curva)}


# ==========================================
# 2. VALIDACIÓN CON EL TALLER ANALÍTICO
# ==========================================
X_DESCUENTO = [10, 20, 30, 40]
MU_DESCUENTO = [0.2, 0.8, 0.8, 0.0]


# ==========================================
# 3. ESCENARIO: FRENADO AUTOMÁTICO (0 a 100 N)
# ==========================================
def campana_gauss(x, centro, sigma):
    """Función de membresía gaussiana con np.exp()."""
    return np.exp(-((x - centro) ** 2) / (2 * sigma ** 2))


def sistema_frenado(centro=70, sigma=10, altura=1.0, puntos=100):
    """
    Genera el universo de fuerza de frenado (x con 100 elementos entre 0 y 100 N),
    la campana de Gauss centrada en `centro` y, opcionalmente, la trunca a `altura`
    (el corte que produciría una regla Mamdani). Luego la defuzzifica con COG.
    """
    x = np.linspace(0, 100, puntos)
    curva = campana_gauss(x, centro, sigma)
    curva = np.fmin(curva, altura)
    resultado = {
        "x": x.round(3).tolist(),
        "curva": curva.round(5).tolist(),
        "fuerza": centroide(x, curva),
        "fuerza_skfuzzy": None,
    }
    if fuzz is not None:
        curva_sk = np.fmin(fuzz.gaussmf(x, centro, sigma), altura)
        resultado["fuerza_skfuzzy"] = float(fuzz.defuzz(x, curva_sk, 'centroid'))
    return resultado


# ==========================================
# 4. EJECUCIÓN EN CONSOLA
# ==========================================
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows

    print("=== VALIDACIÓN (Taller Analítico: descuento comercial) ===")
    d = centroide_detallado(X_DESCUENTO, MU_DESCUENTO)
    print("x  =", X_DESCUENTO)
    print("mu =", MU_DESCUENTO)
    print(f"Numerador   Σ(x·μ) = {' + '.join(f'{p:g}' for p in d['productos'])} = {d['numerador']:g}")
    print(f"Denominador Σ(μ)   = {d['denominador']:g}")
    print(f"Descuento recomendado (COG) = {d['numerador']:g} / {d['denominador']:g} = {d['resultado']:.2f}%")

    print("\n=== FRENADO AUTOMÁTICO (campana de Gauss centrada en 70 N) ===")
    frenado = sistema_frenado(centro=70, sigma=10)
    print("Elementos en x:", len(frenado["x"]))
    print(f"Fuerza de frenado exacta (centroide NumPy): {frenado['fuerza']:.4f} N")
    if frenado["fuerza_skfuzzy"] is not None:
        print(f"Comprobación con skfuzzy.defuzz('centroid'): {frenado['fuerza_skfuzzy']:.4f} N")
    else:
        print("(scikit-fuzzy no está instalado: se omite la comparación)")

    truncado = sistema_frenado(centro=70, sigma=10, altura=0.6)
    print(f"Con la campana truncada a 0.6 (corte Mamdani): {truncado['fuerza']:.4f} N")
