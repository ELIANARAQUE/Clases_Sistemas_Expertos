from flask import Flask, render_template, request, jsonify

from laboratorio import (X, Y, NOMBRES_VARIABLES, ETIQUETAS, arbol,
                         reglas_texto, reglas_si_entonces, predecir)

app = Flask(__name__)


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/dataset', methods=['GET'])
def obtener_dataset():
    return jsonify({
        "variables": NOMBRES_VARIABLES,
        "filas": [{"x": fila.tolist(), "y": int(y), "etiqueta": ETIQUETAS[int(y)]}
                  for fila, y in zip(X, Y)],
    })


@app.route('/api/reglas', methods=['GET'])
def obtener_reglas():
    return jsonify({
        "export_text": reglas_texto,
        "reglas": reglas_si_entonces,
        "exactitud": arbol.score(X, Y),
        "profundidad": int(arbol.get_depth()),
    })


@app.route('/api/predecir', methods=['POST'])
def predecir_cliente():
    datos = request.get_json(silent=True) or {}
    try:
        edad = float(datos["edad"])
        horas = float(datos["horas_online"])
        compras = float(datos["compras_previas"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Ingrese edad, horas online y compras previas como números"}), 400
    if min(edad, horas, compras) < 0:
        return jsonify({"error": "Los valores no pueden ser negativos"}), 400
    return jsonify({"cliente": [edad, horas, compras], **predecir(edad, horas, compras)})


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Experto Automático de Marketing...")
    app.run(debug=True, port=5006)
