"""
TALLER DE LABORATORIO FINAL 6: EL EXPERTO AUTOMÁTICO
Un Árbol de Decisión (scikit-learn) aprende la Base de Conocimientos de un
Sistema Experto de Marketing a partir de datos históricos.

    X = [Edad, Horas_Online, Compras_Previas]
    Y = 1: Hizo clic en el anuncio · 0: Lo ignoró

Ejecutar en consola:  python laboratorio.py
"""
import sys

import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text

# ==========================================
# 1. DATASET SIMULADO (Departamento de Marketing)
# ==========================================
# Patrón que se buscó al inventar los datos:
#   - Los clientes jóvenes (<= 30 años) que pasan 4 o más horas en línea hacen clic.
#   - Los clientes fieles (6 o más compras previas) hacen clic sin importar la edad.
#   - El resto ignora el anuncio.
NOMBRES_VARIABLES = ["Edad", "Horas_Online", "Compras_Previas"]

X = np.array([
    [22, 6, 1],
    [25, 5, 0],
    [19, 8, 2],
    [28, 4, 1],
    [24, 1, 0],
    [27, 2, 1],
    [21, 3, 0],
    [45, 6, 1],
    [52, 1, 0],
    [38, 3, 2],
    [60, 2, 1],
    [48, 5, 2],
    [33, 7, 0],
    [41, 2, 7],
    [55, 1, 9],
    [35, 3, 6],
])

Y = np.array([1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1])

ETIQUETAS = {0: "IGNORA el anuncio", 1: "HACE CLIC en el anuncio"}

# ==========================================
# 2. ENTRENAMIENTO (la IA crea las reglas)
# ==========================================
arbol = DecisionTreeClassifier(max_depth=3, random_state=42)
arbol.fit(X, Y)

reglas_texto = export_text(arbol, feature_names=NOMBRES_VARIABLES)


# ==========================================
# 3. TRADUCCIÓN DEL ÁRBOL A REGLAS SI... ENTONCES
# ==========================================
def extraer_reglas(modelo, nombres):
    """Recorre el árbol entrenado y genera una regla por cada hoja."""
    t = modelo.tree_
    reglas = []

    def recorrer(nodo, condiciones):
        if t.children_left[nodo] == t.children_right[nodo]:   # es una hoja
            clase = int(np.argmax(t.value[nodo]))
            reglas.append({
                "condiciones": condiciones,
                "clase": clase,
                "conclusion": ETIQUETAS[clase],
                "muestras": int(t.n_node_samples[nodo]),
            })
            return
        variable = nombres[t.feature[nodo]]
        umbral = round(float(t.threshold[nodo]), 2)
        recorrer(t.children_left[nodo], condiciones + [f"{variable} <= {umbral}"])
        recorrer(t.children_right[nodo], condiciones + [f"{variable} > {umbral}"])

    recorrer(0, [])
    for i, regla in enumerate(reglas, start=1):
        regla["id"] = f"R{i}"
        regla["texto"] = f"SI {' Y '.join(regla['condiciones'])} ENTONCES {regla['conclusion']}"
    return reglas


reglas_si_entonces = extraer_reglas(arbol, NOMBRES_VARIABLES)


def predecir(edad, horas_online, compras_previas):
    """Clasifica un cliente nuevo y devuelve el camino de decisiones recorrido."""
    muestra = np.array([[edad, horas_online, compras_previas]])
    clase = int(arbol.predict(muestra)[0])
    probabilidad = arbol.predict_proba(muestra)[0].tolist()

    t = arbol.tree_
    camino = []
    for nodo in arbol.decision_path(muestra).indices:
        if t.children_left[nodo] == t.children_right[nodo]:
            continue
        variable = NOMBRES_VARIABLES[t.feature[nodo]]
        umbral = round(float(t.threshold[nodo]), 2)
        valor = muestra[0, t.feature[nodo]]
        cumple = valor <= umbral
        camino.append(f"{variable} = {valor:g} {'<=' if cumple else '>'} {umbral}")

    return {"clase": clase, "conclusion": ETIQUETAS[clase],
            "probabilidad_clic": probabilidad[1] if len(probabilidad) > 1 else float(clase),
            "camino": camino}


# ==========================================
# 4. EJECUCIÓN EN CONSOLA
# ==========================================
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows
    print(f"Dataset: {len(X)} clientes · Variables: {NOMBRES_VARIABLES}")
    print(f"Exactitud sobre los datos de entrenamiento: {arbol.score(X, Y) * 100:.1f}%\n")

    print("Base de Reglas generada automáticamente (export_text):\n")
    print(reglas_texto)

    print("Las mismas reglas en formato SI... ENTONCES:")
    for regla in reglas_si_entonces:
        print(f"  {regla['id']}: {regla['texto']}  ({regla['muestras']} clientes)")

    print("\nPrueba con clientes nuevos:")
    for cliente in ([23, 6, 0], [50, 6, 1], [44, 1, 8]):
        r = predecir(*cliente)
        print(f"  {cliente} -> {r['conclusion']}  (camino: {' -> '.join(r['camino'])})")
