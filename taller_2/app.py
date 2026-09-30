from flask import Flask, render_template, request, jsonify

from laboratorio import reglas, transacciones_db, analizar

app = Flask(__name__)


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/transacciones', methods=['GET'])
def listar_transacciones():
    return jsonify(transacciones_db)


@app.route('/api/reglas', methods=['GET'])
def listar_reglas():
    return jsonify([{"id": r["id"], "descripcion": r["descripcion"]} for r in reglas])


@app.route('/api/analizar/<id_tx>', methods=['GET'])
def analizar_transaccion(id_tx):
    tx = transacciones_db.get(id_tx)
    if not tx:
        return jsonify({"error": "Transacción no encontrada"}), 404
    return jsonify({"id": id_tx, "descripcion": tx["descripcion"],
                    "hechos_iniciales": tx["hechos"], **analizar(tx["hechos"])})


@app.route('/api/analizar', methods=['POST'])
def analizar_personalizada():
    datos = request.get_json(silent=True) or {}
    try:
        hechos = {
            "monto": float(datos.get("monto", 0)),
            "pais_extranjero": bool(datos.get("pais_extranjero", False)),
            "hora": int(datos.get("hora", 12)),
            "intentos_fallidos": int(datos.get("intentos_fallidos", 0)),
            "dispositivo_nuevo": bool(datos.get("dispositivo_nuevo", False)),
        }
    except (TypeError, ValueError):
        return jsonify({"error": "Datos de la transacción inválidos"}), 400
    return jsonify({"id": "PERSONALIZADA", "descripcion": "Transacción ingresada manualmente",
                    "hechos_iniciales": hechos, **analizar(hechos)})


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Sistema Experto de Detección de Fraude...")
    app.run(debug=True, port=5002)
