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
        ? '<span class="chip estable">1 · Clic</span>'
        : '<span class="chip critico">0 · Ignora</span>';
}

// ==========================================
// RENDERIZADO: DATASET Y REGLAS APRENDIDAS
// ==========================================
async function renderizarDataset() {
    const datos = await api('/api/dataset');
    document.getElementById('tabla-dataset').innerHTML = datos.filas.map((f, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${f.x[0]}</td><td>${f.x[1]}</td><td>${f.x[2]}</td>
            <td>${chipClase(f.y)}</td>
        </tr>`).join('');
}

async function renderizarReglas() {
    const datos = await api('/api/reglas');
    document.getElementById('resumen-modelo').innerHTML = `
        <li><span>Modelo:</span> <span>DecisionTreeClassifier</span></li>
        <li><span>Profundidad del árbol:</span> <span>${datos.profundidad}</span></li>
        <li><span>Exactitud en entrenamiento:</span> <span>${(datos.exactitud * 100).toFixed(1)}%</span></li>
        <li><span>Reglas (hojas):</span> <span>${datos.reglas.length}</span></li>
    `;
    document.getElementById('export-text').textContent = datos.export_text;
    document.getElementById('lista-reglas').innerHTML = datos.reglas.map(r => `
        <li>
            <span class="ciclo">${r.id} · ${r.muestras} clientes</span><br>
            <strong>SI</strong> ${r.condiciones.join(' <strong>Y</strong> ')}<br>
            <strong>ENTONCES</strong> ${chipClase(r.clase)} ${r.conclusion}
        </li>`).join('');
}

// ==========================================
// CONSULTA AL ÁRBOL ENTRENADO
// ==========================================
async function consultarCliente() {
    const form = document.getElementById('form-cliente');
    if (!form.reportValidity()) return;
    const datos = {
        edad: Number(form.edad.value),
        horas_online: Number(form.horas_online.value),
        compras_previas: Number(form.compras_previas.value)
    };
    try {
        const r = await api('/api/predecir', datos);
        abrirModal(
            'Decisión del Experto Automático',
            `Cliente: Edad ${r.cliente[0]} · ${r.cliente[1]} h online · ${r.cliente[2]} compras previas`,
            { tipo: r.clase === 1 ? 'estable' : 'critico', texto: `El cliente ${r.conclusion}` },
            `
            <p class="subtitulo-modal">Camino recorrido en el árbol</p>
            <ul class="traza">
                ${r.camino.map((paso, i) => `<li><span class="ciclo">Nodo ${i + 1}</span><br>${paso}</li>`).join('')}
            </ul>
            <div class="metricas-detalle">
                Probabilidad de clic en la hoja: ${(r.probabilidad_clic * 100).toFixed(0)}%<br>
                Predicción (Y): ${r.clase}
            </div>
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
    renderizarReglas();
});
