"""
TALLER DE LABORATORIO 4: MOTOR LÓGICO DE RECURSOS HUMANOS
Inferencia difusa (Modelo Mamdani): el bono anual depende del Desempeño y
la Antigüedad del empleado.

    AND (T-Norma)   -> min()
    OR  (T-Conorma) -> max()

Ejecutar en consola:  python laboratorio.py
"""
import sys

# ==========================================
# 1. GRADOS DE MEMBRESÍA (resultado de la fuzzificación)
# ==========================================
# Empleado del ejemplo de la guía + otros dos casos de prueba.
empleados_db = {
    "EMP-001": {
        "nombre": "Empleado A (ejemplo de la guía)",
        "grados": {
            "desempeno_pobre": 0.1,
            "desempeno_promedio": 0.3,
            "desempeno_excelente": 0.85,
            "antiguedad_corta": 0.4,
            "antiguedad_larga": 0.6,
        },
    },
    "EMP-002": {
        "nombre": "Empleado B (recién llegado, bajo rendimiento)",
        "grados": {
            "desempeno_pobre": 0.7,
            "desempeno_promedio": 0.3,
            "desempeno_excelente": 0.0,
            "antiguedad_corta": 0.8,
            "antiguedad_larga": 0.2,
        },
    },
    "EMP-003": {
        "nombre": "Empleado C (constante, varios años)",
        "grados": {
            "desempeno_pobre": 0.1,
            "desempeno_promedio": 0.9,
            "desempeno_excelente": 0.2,
            "antiguedad_corta": 0.3,
            "antiguedad_larga": 0.7,
        },
    },
}


# ==========================================
# 2. EVALUACIÓN DE REGLAS MAMDANI
# ==========================================
def evaluar_reglas_bono(grados):
    # REGLA 1: SI Desempeño es POBRE  O  Antigüedad es CORTA  ENTONCES Bono BAJO
    activacion_r1 = max(grados["desempeno_pobre"], grados["antiguedad_corta"])

    # REGLA 2: SI Desempeño es PROMEDIO ENTONCES Bono MEDIO
    activacion_r2 = grados["desempeno_promedio"]

    # REGLA 3: SI Desempeño es EXCELENTE  Y  Antigüedad es LARGA  ENTONCES Bono ALTO
    activacion_r3 = min(grados["desempeno_excelente"], grados["antiguedad_larga"])

    return {"BAJO": activacion_r1, "MEDIO": activacion_r2, "ALTO": activacion_r3}


def detalle_reglas(grados):
    """Explicación paso a paso de cada regla (para la interfaz web)."""
    g = grados
    return [
        {"id": "R1", "regla": "SI Desempeño POBRE O Antigüedad CORTA → Bono BAJO",
         "calculo": f"max({g['desempeno_pobre']}, {g['antiguedad_corta']})",
         "resultado": max(g["desempeno_pobre"], g["antiguedad_corta"])},
        {"id": "R2", "regla": "SI Desempeño PROMEDIO → Bono MEDIO",
         "calculo": "desempeno_promedio",
         "resultado": g["desempeno_promedio"]},
        {"id": "R3", "regla": "SI Desempeño EXCELENTE Y Antigüedad LARGA → Bono ALTO",
         "calculo": f"min({g['desempeno_excelente']}, {g['antiguedad_larga']})",
         "resultado": min(g["desempeno_excelente"], g["antiguedad_larga"])},
    ]


def analizar(grados):
    activaciones = evaluar_reglas_bono(grados)
    ganadora = max(activaciones, key=activaciones.get)
    return {"grados": grados, "activaciones": activaciones,
            "reglas": detalle_reglas(grados), "bono_dominante": ganadora}


# ==========================================
# 3. AGREGACIÓN (pregunta teórica, punto 4)
# ==========================================
def agregar(*fuerzas):
    """Agregación Mamdani: varias reglas con la misma conclusión se unen con la T-Conorma (OR = max)."""
    return max(fuerzas)


# ==========================================
# 4. EJECUCIÓN EN CONSOLA
# ==========================================
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows
    for id_emp, emp in empleados_db.items():
        resultado = analizar(emp["grados"])
        print(f"\n===== {id_emp}: {emp['nombre']} =====")
        print("Grados de entrada:", emp["grados"])
        for r in resultado["reglas"]:
            print(f"  {r['id']}: {r['regla']}  ->  {r['calculo']} = {r['resultado']}")
        print("  Niveles de activación:", resultado["activaciones"])
        print("  Bono con mayor activación:", resultado["bono_dominante"])

    print("\n===== PREGUNTA TEÓRICA: AGREGACIÓN DE 'BONO ALTO' =====")
    fuerza_final_alto = max(0.4, 0.7)   # T-Conorma (OR) entre las dos reglas
    print("fuerza_final_alto = max(0.4, 0.7) =", fuerza_final_alto)
