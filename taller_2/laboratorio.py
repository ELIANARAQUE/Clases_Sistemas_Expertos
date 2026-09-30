"""
TALLER DE LABORATORIO 2: MOTOR DE FRAUDE BANCARIO
Sistema Experto con Motor de Inferencia Forward Chaining (Modus Ponens).

Se toma el motor del material de clase (lista de reglas con "condiciones" y
"conclusion" + ciclo while) y se adapta a un Sistema de Detección de Fraude.

Ejecutar en consola:  python laboratorio.py
"""
import operator
import sys

# ==========================================
# 1. BASE DE CONOCIMIENTOS (REGLAS)
# ==========================================
# Cada condición puede ser:
#   - Un valor exacto:        "pais_extranjero": True        (igualdad, como en clase)
#   - Una comparación:        "monto": (">", 5000)           (operador, valor)
OPERADORES = {
    ">": operator.gt,
    ">=": operator.ge,
    "<": operator.lt,
    "<=": operator.le,
    "==": operator.eq,
    "!=": operator.ne,
}

# El orden es intencional: las reglas "de alto nivel" van primero para que el
# encadenamiento se aprecie ciclo por ciclo en la traza (un hecho deducido en
# el ciclo N recién permite disparar otra regla en el ciclo N+1).
reglas = [
    {"id": "R1",
     "descripcion": "SI [Bloquear Tarjeta] ENTONCES [Notificar al Cliente]",
     "condiciones": {"bloquear_tarjeta": True},
     "conclusion": {"notificar_cliente": True}},

    {"id": "R2",
     "descripcion": "SI [Transacción Inusual] Y [País Extranjero] ENTONCES [Bloquear Tarjeta]",
     "condiciones": {"transaccion_inusual": True, "pais_extranjero": True},
     "conclusion": {"bloquear_tarjeta": True}},

    {"id": "R3",
     "descripcion": "SI [Transacción Inusual] Y [Horario Sospechoso] ENTONCES [Alerta de Fraude]",
     "condiciones": {"transaccion_inusual": True, "horario_sospechoso": True},
     "conclusion": {"alerta_fraude": True}},

    {"id": "R4",
     "descripcion": "SI [Posible Robo de Credenciales] Y [Dispositivo Nuevo] ENTONCES [Bloquear Tarjeta]",
     "condiciones": {"posible_robo": True, "dispositivo_nuevo": True},
     "conclusion": {"bloquear_tarjeta": True}},

    {"id": "R5",
     "descripcion": "SI [monto > 5000] ENTONCES [Transacción Inusual]",
     "condiciones": {"monto": (">", 5000)},
     "conclusion": {"transaccion_inusual": True}},

    {"id": "R6",
     "descripcion": "SI [hora < 6] ENTONCES [Horario Sospechoso]",
     "condiciones": {"hora": ("<", 6)},
     "conclusion": {"horario_sospechoso": True}},

    {"id": "R7",
     "descripcion": "SI [intentos fallidos de PIN >= 3] ENTONCES [Posible Robo de Credenciales]",
     "condiciones": {"intentos_fallidos": (">=", 3)},
     "conclusion": {"posible_robo": True}},
]

# ==========================================
# 2. BASE DE HECHOS (casos de prueba)
# ==========================================
transacciones_db = {
    "TX-001": {
        "descripcion": "Compra grande en el exterior",
        "hechos": {"monto": 8500, "pais_extranjero": True, "hora": 14,
                   "intentos_fallidos": 0, "dispositivo_nuevo": False},
    },
    "TX-002": {
        "descripcion": "Compra grande en la madrugada (nacional)",
        "hechos": {"monto": 6200, "pais_extranjero": False, "hora": 3,
                   "intentos_fallidos": 0, "dispositivo_nuevo": False},
    },
    "TX-003": {
        "descripcion": "PIN errado varias veces desde un celular nuevo",
        "hechos": {"monto": 300, "pais_extranjero": False, "hora": 20,
                   "intentos_fallidos": 4, "dispositivo_nuevo": True},
    },
    "TX-004": {
        "descripcion": "Compra cotidiana en supermercado",
        "hechos": {"monto": 120, "pais_extranjero": False, "hora": 11,
                   "intentos_fallidos": 0, "dispositivo_nuevo": False},
    },
}


# ==========================================
# 3. MOTOR DE INFERENCIA (FORWARD CHAINING)
# ==========================================
def condicion_cumplida(hechos, clave, esperado):
    """Evalúa UNA condición contra la memoria de trabajo."""
    if clave not in hechos:
        return False
    if isinstance(esperado, tuple):          # comparación numérica
        simbolo, valor = esperado
        return OPERADORES[simbolo](hechos[clave], valor)
    return hechos[clave] == esperado          # igualdad (motor original)


def motor_inferencia(hechos_iniciales, reglas):
    """
    Encadenamiento hacia adelante: recorre las reglas mientras se sigan
    agregando hechos nuevos. all() funciona como una compuerta AND:
    la regla solo se dispara si TODAS sus condiciones son verdaderas.
    Retorna la memoria final y la traza ciclo por ciclo.
    """
    hechos = dict(hechos_iniciales)          # copia: no se altera el caso original
    traza = []
    ciclo = 0
    nuevos_hechos = True

    while nuevos_hechos:
        nuevos_hechos = False
        ciclo += 1
        for regla in reglas:
            condiciones_cumplidas = all(
                condicion_cumplida(hechos, k, v) for k, v in regla["condiciones"].items()
            )
            if condiciones_cumplidas:
                for clave, valor in regla["conclusion"].items():
                    if clave not in hechos:  # Si es un HECHO NUEVO
                        hechos[clave] = valor
                        nuevos_hechos = True  # Dispara un nuevo ciclo
                        traza.append({"ciclo": ciclo, "regla": regla["id"],
                                      "descripcion": regla["descripcion"],
                                      "nuevo_hecho": f"{clave} = {valor}"})

    return hechos, traza, ciclo


def veredicto(hechos):
    """Traduce la memoria final a una decisión de negocio."""
    if hechos.get("bloquear_tarjeta"):
        return {"tipo": "critico",
                "texto": "BLOQUEO: Tarjeta bloqueada por sospecha de fraude. Se notifica al cliente."}
    if hechos.get("alerta_fraude") or hechos.get("posible_robo") or hechos.get("transaccion_inusual"):
        return {"tipo": "advertencia",
                "texto": "ALERTA: Transacción sospechosa. Requiere validación adicional del cliente."}
    return {"tipo": "estable",
            "texto": "APROBADA: No se detectaron patrones de fraude."}


def analizar(hechos_iniciales):
    hechos, traza, ciclos = motor_inferencia(hechos_iniciales, reglas)
    return {"memoria_final": hechos, "traza": traza, "ciclos": ciclos,
            "veredicto": veredicto(hechos)}


# ==========================================
# 4. EJECUCIÓN EN CONSOLA
# ==========================================
if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")  # tildes correctas en la consola de Windows
    for id_tx, tx in transacciones_db.items():
        print(f"\n===== {id_tx}: {tx['descripcion']} =====")
        print("Hechos iniciales:", tx["hechos"])
        resultado = analizar(tx["hechos"])
        for paso in resultado["traza"]:
            print(f"  Ciclo {paso['ciclo']}: Disparando {paso['regla']} -> Nuevo hecho: {paso['nuevo_hecho']}")
        print(f"  El motor se detuvo en el ciclo {resultado['ciclos']} (sin hechos nuevos).")
        print("  Memoria final:", resultado["memoria_final"])
        print("  VEREDICTO:", resultado["veredicto"]["texto"])
