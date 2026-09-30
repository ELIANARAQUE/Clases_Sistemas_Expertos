from flask import Flask, render_template, request, jsonify

from laboratorio import empleados_db, analizar, agregar

app = Flask(__name__)

VARIABLES = ["desempeno_pobre", "desempeno_promedio", "desempeno_excelente",
             "antiguedad_corta", "antiguedad_larga"]


def leer_grado(valor):
    grado = float(valor)
    if not 0 <= grado <= 1:
        raise ValueError
    return round(grado, 4)


# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/empleados', methods=['GET'])
def listar_empleados():
    return jsonify(empleados_db)


@app.route('/api/bono/<id_empleado>', methods=['GET'])
def bono_empleado(id_empleado):
    empleado = empleados_db.get(id_empleado)
    if not empleado:
        return jsonify({"error": "Empleado no encontrado"}), 404
    return jsonify({"id": id_empleado, "nombre": empleado["nombre"], **analizar(empleado["grados"])})


@app.route('/api/bono', methods=['POST'])
def bono_personalizado():
    datos = request.get_json(silent=True) or {}
    try:
        grados = {v: leer_grado(datos[v]) for v in VARIABLES}
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "Cada grado de membresía debe ser un número entre 0 y 1"}), 400
    return jsonify({"id": "PERSONALIZADO", "nombre": "Empleado personalizado", **analizar(grados)})


@app.route('/api/agregacion', methods=['POST'])
def agregacion():
    datos = request.get_json(silent=True) or {}
    try:
        fuerzas = [leer_grado(f) for f in datos.get("fuerzas", [])]
    except (TypeError, ValueError):
        return jsonify({"error": "Las fuerzas deben estar entre 0 y 1"}), 400
    if not fuerzas:
        return jsonify({"error": "Envíe al menos una fuerza"}), 400
    return jsonify({"fuerzas": fuerzas, "resultado": agregar(*fuerzas)})


# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Motor Difuso de Recursos Humanos...")
    app.run(debug=True, port=5004)
