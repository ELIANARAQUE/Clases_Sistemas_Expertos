from flask import Flask, render_template, request, jsonify

from laboratorio import conjuntos, conductores, clasificar, fuzzificar

app = Flask(__name__)

# Universo del discurso para graficar las funciones de membresía (0 a 20 años)
UNIVERSO = [round(i * 0.1, 1) for i in range(0, 201)]


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/conjuntos', methods=['GET'])
def obtener_conjuntos():
    curvas = {nombre: [] for nombre in conjuntos}
    for x in UNIVERSO:
        for nombre, grado in fuzzificar(x).items():
            curvas[nombre].append(grado)
    return jsonify({"vertices": conjuntos, "universo": UNIVERSO, "curvas": curvas})


@app.route('/api/conductores', methods=['GET'])
def evaluar_conductores():
    return jsonify([clasificar(anios) for anios in conductores])


@app.route('/api/evaluar', methods=['POST'])
def evaluar_conductor():
    datos = request.get_json(silent=True) or {}
    try:
        anios = float(datos.get("anios"))
    except (TypeError, ValueError):
        return jsonify({"error": "Ingrese los años de experiencia como número"}), 400
    if anios < 0:
        return jsonify({"error": "Los años de experiencia no pueden ser negativos"}), 400
    return jsonify(clasificar(anios))


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Sistema Experto Difuso de Conductores...")
    app.run(debug=True, port=5003)
