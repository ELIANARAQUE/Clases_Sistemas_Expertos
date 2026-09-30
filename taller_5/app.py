from flask import Flask, render_template, request, jsonify

from laboratorio import X_DESCUENTO, MU_DESCUENTO, centroide_detallado, sistema_frenado, fuzz

app = Flask(__name__)


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/validacion', methods=['GET'])
def datos_validacion():
    return jsonify({"x": X_DESCUENTO, "mu": MU_DESCUENTO,
                    "skfuzzy_disponible": fuzz is not None})


@app.route('/api/centroide', methods=['POST'])
def calcular_centroide():
    datos = request.get_json(silent=True) or {}
    try:
        x = [float(v) for v in datos["x"]]
        mu = [float(v) for v in datos["mu"]]
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "x y mu deben ser listas de números"}), 400
    if len(x) != len(mu) or not x:
        return jsonify({"error": "x y mu deben tener la misma cantidad de elementos"}), 400
    if any(not 0 <= m <= 1 for m in mu):
        return jsonify({"error": "Los grados μ deben estar entre 0 y 1"}), 400
    try:
        return jsonify({"x": x, "mu": mu, **centroide_detallado(x, mu)})
    except ValueError as error:
        return jsonify({"error": str(error)}), 400


@app.route('/api/frenado', methods=['POST'])
def calcular_frenado():
    datos = request.get_json(silent=True) or {}
    try:
        centro = float(datos.get("centro", 70))
        sigma = float(datos.get("sigma", 10))
        altura = float(datos.get("altura", 1.0))
    except (TypeError, ValueError):
        return jsonify({"error": "Parámetros inválidos"}), 400
    if not (0 <= centro <= 100 and sigma > 0 and 0 < altura <= 1):
        return jsonify({"error": "Centro 0-100, sigma > 0 y altura entre 0 y 1"}), 400
    return jsonify({"centro": centro, "sigma": sigma, "altura": altura,
                    **sistema_frenado(centro, sigma, altura)})


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Sistema de Defuzzificación...")
    app.run(debug=True, port=5005)
