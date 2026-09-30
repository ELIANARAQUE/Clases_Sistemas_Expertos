from flask import Flask, render_template, request, jsonify

from laboratorio import (X_entrenamiento, Y_entrenamiento, ETIQUETAS, NOMBRES_VARIABLES,
                         PUNTO_EXPERIMENTO, clasificar, codigo_original, demo_dimensionalidad)

app = Flask(__name__)


def leer_punto(datos):
    punto = [float(v) for v in datos["punto"]]
    if len(punto) != 3 or min(punto) < 0:
        raise ValueError
    return punto


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/dataset', methods=['GET'])
def obtener_dataset():
    return jsonify({
        "variables": NOMBRES_VARIABLES,
        "punto_experimento": PUNTO_EXPERIMENTO,
        "prediccion_original": ETIQUETAS[codigo_original()],
        "filas": [{"x": x.tolist(), "y": int(y), "etiqueta": ETIQUETAS[int(y)]}
                  for x, y in zip(X_entrenamiento, Y_entrenamiento)],
    })


@app.route('/api/clasificar', methods=['POST'])
def clasificar_cliente():
    datos = request.get_json(silent=True) or {}
    try:
        punto = leer_punto(datos)
        k = int(datos.get("k", 3))
        return jsonify(clasificar(punto, k))
    except (KeyError, TypeError, ValueError) as error:
        mensaje = str(error) if str(error).startswith("K debe") else \
            "Ingrese edad, salario e hijos como números no negativos"
        return jsonify({"error": mensaje}), 400


@app.route('/api/comparar', methods=['POST'])
def comparar_k():
    datos = request.get_json(silent=True) or {}
    try:
        punto = leer_punto(datos)
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Ingrese edad, salario e hijos como números no negativos"}), 400
    return jsonify({"k1": clasificar(punto, 1), "k5": clasificar(punto, 5)})


@app.route('/api/dimensionalidad', methods=['GET'])
def dimensionalidad():
    return jsonify(demo_dimensionalidad())


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Clasificador Universal KNN...")
    app.run(debug=True, port=5007)
