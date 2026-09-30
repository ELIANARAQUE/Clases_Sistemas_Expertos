"""
TALLER DE LABORATORIO 7: CLASIFICADOR UNIVERSAL (KNN)
K Vecinos más Cercanos con scikit-learn, ahora en 3 dimensiones:
    [Edad, Salario (miles), Número de Hijos]  ->  0 = NO COMPRA · 1 = COMPRA

Ejecutar en consola:  python laboratorio.py
"""
import sys

import numpy as np
from sklearn.neighbors import KNeighborsClassifier

ETIQUETAS = {0: "NO COMPRA", 1: "COMPRA"}
NOMBRES_VARIABLES = ["Edad", "Salario (miles)", "Hijos"]


# ==========================================
# 1. CÓDIGO ORIGINAL DE LA GUÍA (2 dimensiones, 3 puntos)
# ==========================================
def codigo_original():
    X_entrenamiento = np.array([
        [20, 30],  # Punto A
        [40, 50],  # Punto B
        [35, 45],  # Punto C
    ])
    # Etiquetas: 0 = NO COMPRA, 1 = COMPRA
    Y_entrenamiento = np.array([0, 1, 1])

    modelo_knn = KNeighborsClassifier(n_neighbors=3)
    modelo_knn.fit(X_entrenamiento, Y_entrenamiento)

    nuevo_cliente = np.array([[30, 40]])
    prediccion = modelo_knn.predict(nuevo_cliente)
    return int(prediccion[0])


# ==========================================
# 2. DATASET AMPLIADO (13 filas, 3 columnas)
# ==========================================
# Se conservan A, B y C (con su número de hijos) y se agregan 10 clientes.
# El cliente 13 es un caso ATÍPICO: tiene el perfil de un comprador pero no compró.
X_entrenamiento = np.array([
    [20, 30, 0],   # 1  Punto A
    [40, 50, 1],   # 2  Punto B
    [35, 45, 2],   # 3  Punto C
    [22, 25, 0],   # 4
    [28, 32, 1],   # 5
    [45, 60, 2],   # 6
    [50, 55, 3],   # 7
    [30, 35, 0],   # 8
    [38, 42, 1],   # 9
    [25, 28, 0],   # 10
    [55, 70, 2],   # 11
    [42, 48, 2],   # 12
    [39, 46, 2],   # 13 (atípico)
])

# 3. Etiquetas actualizadas para que coincidan fila por fila
Y_entrenamiento = np.array([0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0])

PUNTO_EXPERIMENTO = [38, 47, 2]   # cliente nuevo para comparar K = 1 vs K = 5


# ==========================================
# 4. EXPERIMENTO CON EL VALOR DE K
# ==========================================
def clasificar(punto, k):
    """Entrena KNN con n_neighbors = k y explica la votación de los vecinos."""
    if not 1 <= k <= len(X_entrenamiento):
        raise ValueError(f"K debe estar entre 1 y {len(X_entrenamiento)}")
    modelo_knn = KNeighborsClassifier(n_neighbors=k)
    modelo_knn.fit(X_entrenamiento, Y_entrenamiento)   # "entrenar" = memorizar

    nuevo = np.array([punto], dtype=float)
    prediccion = int(modelo_knn.predict(nuevo)[0])
    distancias, indices = modelo_knn.kneighbors(nuevo)

    vecinos = [{"fila": int(i) + 1, "punto": X_entrenamiento[i].tolist(),
                "distancia": round(float(d), 4), "clase": int(Y_entrenamiento[i]),
                "etiqueta": ETIQUETAS[int(Y_entrenamiento[i])]}
               for d, i in zip(distancias[0], indices[0])]
    votos = {ETIQUETAS[c]: sum(1 for v in vecinos if v["clase"] == c) for c in ETIQUETAS}
    return {"punto": list(punto), "k": k, "clase": prediccion,
            "etiqueta": ETIQUETAS[prediccion], "vecinos": vecinos, "votos": votos}


# ==========================================
# 5. MALDICIÓN DE LA DIMENSIONALIDAD (demostración numérica)
# ==========================================
def demo_dimensionalidad(dimensiones=(2, 3, 10, 100, 1000), puntos=500, semilla=0):
    """
    Genera puntos aleatorios en [0, 1]^d y mide, desde un punto de consulta,
    el contraste relativo (d_max - d_min) / d_min. Si tiende a 0, el vecino
    "más cercano" y el "más lejano" están casi a la misma distancia.
    """
    rng = np.random.default_rng(semilla)
    resultados = []
    for d in dimensiones:
        datos = rng.random((puntos, d))
        consulta = rng.random(d)
        dist = np.linalg.norm(datos - consulta, axis=1)
        resultados.append({"dimensiones": d,
                           "distancia_min": round(float(dist.min()), 4),
                           "distancia_max": round(float(dist.max()), 4),
                           "contraste": round(float((dist.max() - dist.min()) / dist.min()), 4)})
    return resultados


# ==========================================
# 6. EJECUCIÓN EN CONSOLA
# ==========================================
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows

    print("=== 1. Código original (2D, 3 puntos, K = 3) ===")
    print("Clase predicha:", codigo_original(), f"({ETIQUETAS[codigo_original()]})")

    print(f"\n=== 2-4. Dataset ampliado: {len(X_entrenamiento)} filas x {X_entrenamiento.shape[1]} columnas ===")
    print(f"Punto nuevo: {PUNTO_EXPERIMENTO}  ({', '.join(NOMBRES_VARIABLES)})")
    for k in (1, 5):
        r = clasificar(PUNTO_EXPERIMENTO, k)
        print(f"\n  n_neighbors = {k}  ->  Clase predicha: {r['clase']} ({r['etiqueta']})")
        for v in r["vecinos"]:
            print(f"     vecino fila {v['fila']:>2} {v['punto']}  distancia = {v['distancia']:.4f}  -> {v['etiqueta']}")
        print(f"     Votos: {r['votos']}")

    print("\n=== 5. Maldición de la dimensionalidad (500 puntos aleatorios) ===")
    for fila in demo_dimensionalidad():
        print(f"  d = {fila['dimensiones']:>4}:  min = {fila['distancia_min']:>8.4f}  "
              f"max = {fila['distancia_max']:>8.4f}  contraste (max-min)/min = {fila['contraste']:.4f}")
