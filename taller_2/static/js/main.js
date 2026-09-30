// ==========================================
// COMUNICACIÓN CON EL BACKEND (Flask)
// ==========================================
async function api(url, datos) {
    const opciones = datos
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }
        : {};
    const respuesta = await fetch(url, opciones);
    const json = await respuesta.json();
    if (!respuesta.ok) throw new Error(json.error || 'Error en el servidor');
    return json;
}

const NOMBRES_HECHOS = {
    monto: 'Monto',
    pais_extranjero: 'País extranjero',
    hora: 'Hora',
    intentos_fallidos: 'Intentos fallidos',
    dispositivo_nuevo: 'Dispositivo nuevo'
};

function formatearValor(clave, valor) {
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
    if (clave === 'monto') return `$${Number(valor).toLocaleString('es-CO')}`;
    if (clave === 'hora') return `${valor}:00 h`;
    return valor;
}

// ==========================================
// RENDERIZADO DE REGLAS Y TARJETAS
// ==========================================
async function renderizarReglas() {
    const reglas = await api('/api/reglas');
    document.getElementById('lista-reglas').innerHTML = reglas
        .map(r => `<li><span>${r.id}</span> <span>${r.descripcion}</span></li>`)
        .join('');
}

async function renderizarTransacciones() {
    const transacciones = await api('/api/transacciones');
    const contenedor = document.getElementById('contenedor-transacciones');
    const tarjetaFormulario = document.getElementById('form-transaccion').closest('section');

    Object.entries(transacciones).forEach(([id, tx]) => {
        const tarjeta = document.createElement('section');
        tarjeta.className = 'tarjeta-servidor';
        tarjeta.innerHTML = `
            <p class="id-servidor">ID: ${id}</p>
            <h2>${tx.descripcion}</h2>
            <ul class="lista-metricas">
                ${Object.entries(tx.hechos).map(([k, v]) =>
                    `<li><span>${NOMBRES_HECHOS[k]}:</span> <span>${formatearValor(k, v)}</span></li>`
                ).join('')}
            </ul>
            <button class="btn-diagnosticar" onclick="analizarTransaccion('${id}')">Ejecutar motor</button>
        `;
        contenedor.insertBefore(tarjeta, tarjetaFormulario);
    });
}

// ==========================================
// EJECUCIÓN DEL MOTOR DE INFERENCIA
// ==========================================
async function analizarTransaccion(id) {
    try {
        mostrarResultado(await api(`/api/analizar/${id}`));
    } catch (error) {
        alert(error.message);
    }
}

async function analizarPersonalizada() {
    const form = document.getElementById('form-transaccion');
    if (!form.reportValidity()) return;
    const datos = {
        monto: Number(form.monto.value),
        hora: Number(form.hora.value),
        intentos_fallidos: Number(form.intentos_fallidos.value),
        pais_extranjero: form.pais_extranjero.checked,
        dispositivo_nuevo: form.dispositivo_nuevo.checked
    };
    try {
        mostrarResultado(await api('/api/analizar', datos));
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// MANEJO DEL MODAL
// ==========================================
function mostrarResultado(r) {
    const pasos = r.traza.length
        ? r.traza.map(p => `
            <li>
                <span class="ciclo">Ciclo ${p.ciclo} · ${p.regla}</span><br>
                ${p.descripcion}<br>
                <strong>Nuevo hecho:</strong> <code>${p.nuevo_hecho}</code>
            </li>`).join('')
        : '<li>Ninguna regla se disparó en el ciclo 1.</li>';

    const memoria = Object.entries(r.memoria_final)
        .map(([k, v]) => `${k} = ${v}`)
        .join('<br>');

    abrirModal(
        'Traza del Motor de Inferencia',
        `${r.descripcion} (${r.id})`,
        r.veredicto,
        `
        <p class="subtitulo-modal">Traza ciclo por ciclo</p>
        <ul class="traza">${pasos}</ul>
        <p class="descripcion">El motor se detuvo en el ciclo ${r.ciclos}: ninguna regla generó hechos nuevos.</p>
        <p class="subtitulo-modal">Memoria final de hechos</p>
        <div class="metricas-detalle">${memoria}</div>
        `
    );
}

function abrirModal(titulo, subtitulo, veredicto, html) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-subtitulo').textContent = subtitulo;
    const caja = document.getElementById('modal-veredicto');
    caja.textContent = veredicto.texto;
    caja.className = `veredicto ${veredicto.tipo}`;
    document.getElementById('modal-detalle').innerHTML = html;
    document.getElementById('modal').classList.add('activo');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('activo');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderizarReglas();
    renderizarTransacciones();
});
