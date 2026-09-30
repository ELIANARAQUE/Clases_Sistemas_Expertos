"""
TALLER DE LABORATORIO 8: FRONTERAS NO LINEALES (SVM)
Máquinas de Vectores de Soporte con scikit-learn: kernel 'linear' vs 'rbf'.

    Clase A (0, círculos): (2,2), (3,3), (4,2)
    Clase B (1, equis):    (6,6), (7,8), (8,7)

Ejecutar en consola:  python laboratorio.py
"""
import sys

import numpy as np
from sklearn.svm import SVC

ETIQUETAS = {0: "Clase A", 1: "Clase B"}

# ==========================================
# 1. DATASETS DE CADA ESCENARIO
# ==========================================
X_BASE = [[2, 2], [3, 3], [4, 2], [6, 6], [7, 8], [8, 7]]
Y_BASE = [0, 0, 0, 1, 1, 1]

ESCENARIOS = {
    "original": {
        "nombre": "Punto 1 · Código original",
        "descripcion": "Los 6 puntos del taller analítico.",
        "X": X_BASE,
        "Y": Y_BASE,
    },
    "trampa": {
        "nombre": "Puntos 2 a 4 · Engañando a la frontera",
        "descripcion": "Se agrega [5, 5] con etiqueta 0 (Clase A), pegado a la Clase B.",
        "X": X_BASE + [[5, 5]],
        "Y": Y_BASE + [0],
    },
    "rodeado": {
        "nombre": "Extra · Punto rodeado por el enemigo",
        "descripcion": "Además de [5, 5], se agrega [7, 7] como Clase A en medio de la Clase B.",
        "X": X_BASE + [[5, 5], [7, 7]],
        "Y": Y_BASE + [0, 0],
    },
}

PUNTOS_PRUEBA = [[5, 4], [5, 5], [7, 7]]


# ==========================================
# 2. ENTRENAMIENTO Y ANÁLISIS DEL MODELO
# ==========================================
def entrenar(escenario="original", kernel="linear", C=1.0, gamma="scale"):
    datos = ESCENARIOS[escenario]
    X = np.array(datos["X"], dtype=float)
    Y = np.array(datos["Y"])

    modelo_svm = SVC(kernel=kernel, C=C, gamma=gamma)
    modelo_svm.fit(X, Y)                       # aprende la ecuación del hiperplano
    return modelo_svm, X, Y


def analizar(escenario="original", kernel="linear", C=1.0, gamma="scale", resolucion=0.25):
    modelo_svm, X, Y = entrenar(escenario, kernel, C, gamma)

    resultado = {
        "escenario": escenario,
        "nombre": ESCENARIOS[escenario]["nombre"],
        "descripcion": ESCENARIOS[escenario]["descripcion"],
        "kernel": kernel, "C": C, "gamma": gamma,
        "puntos": [{"x": p.tolist(), "clase": int(c)} for p, c in zip(X, Y)],
        "vectores_soporte": modelo_svm.support_vectors_.tolist(),
        "exactitud": float(modelo_svm.score(X, Y)),
        "predicciones": [{"punto": p, "clase": int(modelo_svm.predict([p])[0])} for p in PUNTOS_PRUEBA],
        "hiperplano": None,
    }

    if kernel == "linear":
        w = modelo_svm.coef_[0]
        b = modelo_svm.intercept_[0]
        resultado["hiperplano"] = {
            "w": w.round(4).tolist(), "b": round(float(b), 4),
            "ecuacion": f"{w[0]:.3f}·x + {w[1]:.3f}·y + ({b:.3f}) = 0",
            "margen": round(float(2 / np.linalg.norm(w)), 4),
        }

    # Rejilla 0-10 para dibujar las regiones de decisión en la interfaz
    ejes = np.arange(0, 10 + resolucion, resolucion)
    xx, yy = np.meshgrid(ejes, ejes)
    rejilla = np.c_[xx.ravel(), yy.ravel()]
    resultado["rejilla"] = {
        "paso": resolucion,
        "n": len(ejes),
        "clases": modelo_svm.predict(rejilla).astype(int).tolist(),
        "decision": modelo_svm.decision_function(rejilla).round(3).tolist(),
    }
    return resultado


def predecir(punto, escenario="original", kernel="linear", C=1.0, gamma="scale"):
    modelo_svm, _, _ = entrenar(escenario, kernel, C, gamma)
    clase = int(modelo_svm.predict([punto])[0])
    return {"punto": punto, "clase": clase, "etiqueta": ETIQUETAS[clase],
            "distancia_frontera": round(float(modelo_svm.decision_function([punto])[0]), 4)}


# ==========================================
# 3. EJECUCIÓN EN CONSOLA
# ==========================================
def imprimir(escenario, kernel, **kwargs):
    r = analizar(escenario, kernel, **kwargs)
    extra = ", ".join(f"{k}={v}" for k, v in kwargs.items())
    print(f"\n--- {r['nombre']} · kernel='{kernel}'{' · ' + extra if extra else ''} ---")
    print("Los Vectores de Soporte son:\n", np.array(r["vectores_soporte"]))
    print(f"Exactitud sobre los datos de entrenamiento: {r['exactitud'] * 100:.1f}%")
    if r["hiperplano"]:
        h = r["hiperplano"]
        print(f"Hiperplano: {h['ecuacion']}   ancho de la calle (margen) = {h['margen']}")
    for p in r["predicciones"]:
        print(f"El punto {p['punto']} pertenece a la clase: {p['clase']}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows
    print("=== PUNTO 1: CÓDIGO ORIGINAL ===")
    imprimir("original", "linear")

    print("\n=== PUNTOS 2 Y 3: SE AGREGA [5, 5] CON ETIQUETA 0 Y SE REENTRENA EL LINEAL ===")
    imprimir("trampa", "linear")

    print("\n=== PUNTO 4: KERNEL RBF ===")
    imprimir("trampa", "rbf")

    print("\n=== EXTRA: PUNTO [7, 7] RODEADO POR LA CLASE B ===")
    imprimir("rodeado", "linear")
    imprimir("rodeado", "rbf")
    imprimir("rodeado", "rbf", gamma=1.0)
