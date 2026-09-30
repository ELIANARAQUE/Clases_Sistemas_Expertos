from flask import Flask, render_template, request, jsonify

from laboratorio import ESCENARIOS, analizar, predecir

app = Flask(__name__)

KERNELS = ("linear", "rbf")


class ParametrosInvalidos(ValueError):
    pass


def leer_parametros(datos):
    """Valida escenario, kernel, C y gamma enviados por la interfaz."""
    escenario = datos.get("escenario", "original")
    kernel = datos.get("kernel", "linear")
    if escenario not in ESCENARIOS or kernel not in KERNELS:
        raise ParametrosInvalidos("Escenario o kernel no válido")
    try:
        C = float(datos.get("C", 1.0))
        gamma = datos.get("gamma", "scale")
        gamma = "scale" if gamma in ("scale", "", None) else float(gamma)
    except (TypeError, ValueError):
        raise ParametrosInvalidos("C y gamma deben ser números")
    if C <= 0 or (gamma != "scale" and gamma <= 0):
        raise ParametrosInvalidos("C y gamma deben ser mayores que 0")
    return {"escenario": escenario, "kernel": kernel, "C": C, "gamma": gamma}


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/escenarios', methods=['GET'])
def listar_escenarios():
    return jsonify({clave: {"nombre": e["nombre"], "descripcion": e["descripcion"]}
                    for clave, e in ESCENARIOS.items()})


@app.route('/api/svm', methods=['POST'])
def entrenar_svm():
    try:
        parametros = leer_parametros(request.get_json(silent=True) or {})
    except ParametrosInvalidos as error:
        return jsonify({"error": str(error)}), 400
    return jsonify(analizar(**parametros))


@app.route('/api/predecir', methods=['POST'])
def predecir_punto():
    datos = request.get_json(silent=True) or {}
    try:
        parametros = leer_parametros(datos)
    except ParametrosInvalidos as error:
        return jsonify({"error": str(error)}), 400
    try:
        punto = [float(v) for v in datos["punto"]]
    except (KeyError, TypeError, ValueError):
        punto = []
    if len(punto) != 2:
        return jsonify({"error": "El punto debe tener 2 coordenadas numéricas"}), 400
    return jsonify(predecir(punto, **parametros))


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Laboratorio de Máquinas de Vectores de Soporte...")
    app.run(debug=True, port=5008)
