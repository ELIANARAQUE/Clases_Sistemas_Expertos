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

function chipClase(clase) {
    return clase === 1
        ? '<span class="chip estable">COMPRA</span>'
        : '<span class="chip critico">NO COMPRA</span>';
}

function tipoClase(clase) {
    return clase === 1 ? 'estable' : 'critico';
}

// ==========================================
// RENDERIZADO: DATASET Y DIMENSIONALIDAD
// ==========================================
async function renderizarDataset() {
    const datos = await api('/api/dataset');
    document.getElementById('texto-original').innerHTML =
        `Código original de la guía (2D, puntos A, B y C, K = 3) para el punto (30, 40): ` +
        `<strong>${datos.prediccion_original}</strong>. Abajo, el dataset ampliado con la columna "Hijos".`;
    document.getElementById('tabla-dataset').innerHTML = datos.filas.map((f, i) => `
        <tr>
            <td>${i + 1}${i === 12 ? ' *' : ''}</td>
            <td>${f.x[0]}</td><td>${f.x[1]}</td><td>${f.x[2]}</td>
            <td>${chipClase(f.y)}</td>
        </tr>`).join('') +
        '<tr><td colspan="5">* Cliente atípico: perfil de comprador, pero no compró.</td></tr>';
}

async function renderizarDimensionalidad() {
    const filas = await api('/api/dimensionalidad');
    const maximo = Math.max(...filas.map(f => f.contraste));
    document.getElementById('tabla-dimensionalidad').innerHTML = filas.map(f => `
        <tr>
            <td>${f.dimensiones}</td>
            <td>${f.distancia_min.toFixed(4)}</td>
            <td>${f.distancia_max.toFixed(4)}</td>
            <td>${f.contraste.toFixed(4)}</td>
            <td style="width:35%">
                <div class="barra-fondo">
                    <div class="barra-relleno ${f.contraste < 0.5 ? 'critico' : 'info'}"
                         style="width:${Math.max((f.contraste / maximo) * 100, 1)}%"></div>
                </div>
            </td>
        </tr>`).join('');
}

// ==========================================
// CLASIFICACIÓN KNN (en Python, vía API)
// ==========================================
function leerPunto() {
    const form = document.getElementById('form-cliente');
    if (!form.reportValidity()) return null;
    return {
        punto: [Number(form.edad.value), Number(form.salario.value), Number(form.hijos.value)],
        k: Number(form.k.value)
    };
}

function tablaVecinos(r) {
    return `
        <div class="tabla-contenedor">
            <table class="tabla">
                <thead><tr><th>Fila</th><th>Punto</th><th>Distancia euclidiana</th><th>Clase</th></tr></thead>
                <tbody>
                    ${r.vecinos.map(v => `
                        <tr><td>${v.fila}</td><td>[${v.punto.join(', ')}]</td>
                            <td>${v.distancia.toFixed(4)}</td><td>${chipClase(v.clase)}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div class="metricas-detalle">
            Votos → ${Object.entries(r.votos).map(([etiqueta, n]) => `${etiqueta}: ${n}`).join(' · ')}
        </div>`;
}

async function clasificarCliente() {
    const datos = leerPunto();
    if (!datos) return;
    try {
        const r = await api('/api/clasificar', datos);
        abrirModal(
            'Votación de los K Vecinos',
            `Cliente [${r.punto.join(', ')}] · n_neighbors = ${r.k}`,
            { tipo: tipoClase(r.clase), texto: `Clase predicha: ${r.clase} (${r.etiqueta})` },
            `<p class="subtitulo-modal">Los ${r.k} vecinos más cercanos</p>${tablaVecinos(r)}`
        );
    } catch (error) {
        alert(error.message);
    }
}

async function compararK() {
    const datos = leerPunto();
    if (!datos) return;
    try {
        const r = await api('/api/comparar', { punto: datos.punto });
        const cambio = r.k1.clase !== r.k5.clase;
        abrirModal(
            'Experimento: K = 1 vs K = 5',
            `Cliente [${r.k1.punto.join(', ')}]`,
            {
                tipo: cambio ? 'advertencia' : 'estable',
                texto: cambio
                    ? `¡La decisión cambió! K=1 → ${r.k1.etiqueta} · K=5 → ${r.k5.etiqueta}`
                    : `Misma decisión con ambos K: ${r.k1.etiqueta}`
            },
            `
            <p class="subtitulo-modal">n_neighbors = 1</p>${tablaVecinos(r.k1)}
            <p class="subtitulo-modal">n_neighbors = 5</p>${tablaVecinos(r.k5)}
            ${cambio ? '<p class="descripcion">Con K = 1 decide un solo vecino (aquí el cliente atípico); ' +
                'con K = 5 la mayoría suaviza el ruido.</p>' : ''}
            `
        );
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// MANEJO DEL MODAL
// ==========================================
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
    renderizarDataset();
    renderizarDimensionalidad();
});
