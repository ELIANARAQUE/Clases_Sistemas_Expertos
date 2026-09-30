from flask import Flask, render_template, request, jsonify

from laboratorio import (SALIDAS_ESPERADAS, PESOS_AND, SESGO_AND, PESOS_OR, SESGO_OR,
                         tabla_verdad)

app = Flask(__name__)


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/compuertas', methods=['GET'])
def compuertas():
    """Tablas de verdad de la guía (AND) y de la solución encontrada (OR)."""
    return jsonify({
        "AND": tabla_verdad(PESOS_AND, SESGO_AND, "AND"),
        "OR": tabla_verdad(PESOS_OR, SESGO_OR, "OR"),
    })


@app.route('/api/evaluar', methods=['POST'])
def evaluar():
    datos = request.get_json(silent=True) or {}
    compuerta = datos.get("compuerta", "OR")
    if compuerta not in SALIDAS_ESPERADAS:
        return jsonify({"error": "Compuerta no válida"}), 400
    try:
        pesos = [float(datos["w1"]), float(datos["w2"])]
        sesgo = float(datos["b"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "W1, W2 y b deben ser números"}), 400
    return jsonify(tabla_verdad(pesos, sesgo, compuerta))


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Laboratorio del Perceptrón...")
    app.run(debug=True, port=5009)
