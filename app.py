from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ====Diccionario=========
servidores_db = {
    "SRV-001": {
        "nombre": "Servidor Base de Datos Principal",
        "cpu_uso": 45,
        "memoria_libre": 20,
        "ping_respuesta": 15,
        "temperatura": 72,
        "ventilador_activo": True
    },
    "SRV-002": {
        "nombre": "Servidor de Aplicaciones Web",
        "cpu_uso": 85,
        "memoria_libre": 10,
        "ping_respuesta": 120,
        "temperatura": 82,
        "ventilador_activo": False  # ¡Peligro!
    },
    "SRV-003": {
        "nombre": "Servidor de Respaldo (Backup)",
        "cpu_uso": 12,
        "memoria_libre": 80,
        "ping_respuesta": 45,
        "temperatura": 55,
        "ventilador_activo": True
    }
}
# =======hechos============
def diagnosticar_servidor(hechos):
    if hechos["temperatura"] > 80 and not hechos["ventilador_activo"]:
        return "CRÍTICO: Riesgo de sobrecalentamiento inminente. Apagar equipo y revisar ventilador."
    
    # condicion/regla 1
    elif hechos["cpu_uso"] >= 80 or hechos["ping_respuesta"] > 100:
        return "ADVERTENCIA: Rendimiento degradado. Alto uso de CPU o latencia elevada."
   
    # condicion/regla 2
    elif hechos["memoria_libre"] < 15:
        return "ADVERTENCIA: Memoria RAM casi agotada. Se recomienda reiniciar servicios."
    
    # condicion/regla 3
    else:
        return "ESTABLE: Servidor operando dentro de los parámetros normales."

# =====RUTAS DE FLASK ==========================================
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/diagnostico/<id_servidor>', methods=['GET'])
def obtener_diagnostico(id_servidor):
    hechos = servidores_db.get(id_servidor)
    if not hechos:
        return jsonify({"error": "Servidor no encontrado"}), 404
    
    # Ejecutamos el motor de inferencia/ iniciardor ?
    veredicto = diagnosticar_servidor(hechos)
    return jsonify({
        "id": id_servidor,
        "nombre": hechos["nombre"],
        "diagnostico": veredicto,
        "metricas": hechos
    })
# 4. EJECUCIÓN DEL SERVIDOR
if __name__ == '__main__':
    print("Iniciando Sistema Experto HelpDesk...")
    app.run(debug=True, port=5000)
