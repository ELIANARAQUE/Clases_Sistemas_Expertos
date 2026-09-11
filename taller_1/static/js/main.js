 
// ==========================================
// DATOS TEMPORALES (Simulación de Base de Datos)
// ==========================================
const servidores = [
    {
        id: "SRV-001",
        nombre: "Servidor Base de Datos Principal",
        cpu_uso: 45,
        memoria_libre: 20,
        ping_respuesta: 15,
        temperatura: 72,
        ventilador_activo: true
    },
    {
        id: "SRV-002",
        nombre: "Servidor de Aplicaciones Web",
        cpu_uso: 85,
        memoria_libre: 10,
        ping_respuesta: 120,
        temperatura: 82,
        ventilador_activo: false
    },
    {
        id: "SRV-003",
        nombre: "Servidor de Respaldo (Backup)",
        cpu_uso: 12,
        memoria_libre: 80,
        ping_respuesta: 45,
        temperatura: 55,
        ventilador_activo: true
    }
];
// ==========================================
// RENDERIZADO DE TARJETAS
// ==========================================
function renderizarServidores() {
    const contenedor = document.getElementById('contenedor-servidores');
    contenedor.innerHTML = '';

    servidores.forEach(servidor => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'tarjeta-servidor';

        tarjeta.innerHTML = `
            <p class="id-servidor">ID: ${servidor.id}</p>
            <h2>${servidor.nombre}</h2>
            <ul class="lista-metricas">
                <li><span>CPU:</span> <span>${servidor.cpu_uso}%</span></li>
                <li><span>Memoria Libre:</span> <span>${servidor.memoria_libre}%</span></li>
                <li><span>Ping:</span> <span>${servidor.ping_respuesta} ms</span></li>
                <li><span>Temperatura:</span> <span>${servidor.temperatura} °C</span></li>
                <li><span>Ventilador:</span> <span>${servidor.ventilador_activo ? 'Activo' : 'Apagado'}</span></li>
            </ul>
            <button class="btn-diagnosticar" onclick="diagnosticar('${servidor.id}')">Diagnosticar</button>
        `;

        contenedor.appendChild(tarjeta);
    });
}
// ==========================================
// MOTOR DE INFERENCIA (Simulación en JS para pruebas)
// ==========================================
function diagnosticarLocal(hechos) {
    if (hechos.temperatura > 80 && !hechos.ventilador_activo) {
        return { tipo: "critico", texto: "CRÍTICO: Riesgo de sobrecalentamiento inminente. Apagar equipo y revisar ventilador." };
    }
    if (hechos.cpu_uso >= 80 || hechos.ping_respuesta > 100) {
        return { tipo: "advertencia", texto: "ADVERTENCIA: Rendimiento degradado. Alto uso de CPU o latencia elevada." };
    }
    if (hechos.memoria_libre < 15) {
        return { tipo: "advertencia", texto: "ADVERTENCIA: Memoria RAM casi agotada. Se recomienda reiniciar servicios." };
    }
    return { tipo: "estable", texto: "ESTABLE: Servidor operando dentro de los parámetros normales." };
}
// ==========================================
// FUNCIÓN PRINCIPAL DE DIAGNÓSTICO
// ==========================================
function diagnosticar(idServidor) {
    // Buscar el servidor en la lista
    const servidor = servidores.find(s => s.id === idServidor);
    if (!servidor) return;

    // Ejecutar el motor de inferencia (simulado en JS)
    const resultado = diagnosticarLocal(servidor);

    // Mostrar en el modal
    abrirModal(servidor, resultado);
}
// ==========================================
// MANEJO DEL MODAL
// ==========================================
function abrirModal(servidor, resultado) {
    const modal = document.getElementById('modal');
    const titulo = document.getElementById('modal-titulo');
    const infoServidor = document.getElementById('modal-servidor');
    const veredicto = document.getElementById('modal-veredicto');
    const metricas = document.getElementById('modal-metricas');

    titulo.textContent = "Diagnóstico del Servidor";
    infoServidor.textContent = `${servidor.nombre} (${servidor.id})`;

    veredicto.textContent = resultado.texto;
    veredicto.className = `veredicto ${resultado.tipo}`;

    metricas.innerHTML = `
        CPU: ${servidor.cpu_uso}%<br>
        Memoria Libre: ${servidor.memoria_libre}%<br>
        Ping: ${servidor.ping_respuesta} ms<br>
        Temperatura: ${servidor.temperatura} °C<br>
        Ventilador: ${servidor.ventilador_activo ? 'Activo' : 'Apagado'}
    `;

    modal.classList.add('activo');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('activo');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderizarServidores();
});