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

// Estilo visual de cada conjunto difuso (clases CSS del taller 1)
const CATEGORIAS = {
    novato: { etiqueta: 'Novato', tipo: 'advertencia', variable: '--color-advertencia' },
    intermedio: { etiqueta: 'Intermedio', tipo: 'info', variable: '--color-boton' },
    experto: { etiqueta: 'Experto', tipo: 'estable', variable: '--color-estable' }
};

let datosConjuntos = null;

function colorCss(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// ==========================================
// GRÁFICA DE FUNCIONES DE MEMBRESÍA (Canvas)
// ==========================================
function dibujarGrafica(xEvaluado, grados) {
    const canvas = document.getElementById('grafica');
    const ctx = canvas.getContext('2d');
    const m = { izq: 50, der: 20, arr: 20, aba: 40 };
    const ancho = canvas.width - m.izq - m.der;
    const alto = canvas.height - m.arr - m.aba;
    const xMax = 20;
    const px = x => m.izq + (x / xMax) * ancho;
    const py = y => m.arr + (1 - y) * alto;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px Segoe UI';

    // Rejilla y ejes
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.fillStyle = colorCss('--texto-secundario');
    for (let x = 0; x <= xMax; x += 2) {
        ctx.beginPath(); ctx.moveTo(px(x), py(0)); ctx.lineTo(px(x), py(1)); ctx.stroke();
        ctx.fillText(x, px(x) - 5, py(0) + 20);
    }
    for (let y = 0; y <= 1; y += 0.25) {
        ctx.beginPath(); ctx.moveTo(px(0), py(y)); ctx.lineTo(px(xMax), py(y)); ctx.stroke();
        ctx.fillText(y.toFixed(2), 8, py(y) + 4);
    }
    ctx.fillText('Años de experiencia', px(xMax) - 120, py(0) + 36);

    // Curvas de cada conjunto
    Object.entries(datosConjuntos.curvas).forEach(([nombre, valores]) => {
        ctx.strokeStyle = colorCss(CATEGORIAS[nombre].variable);
        ctx.lineWidth = 3;
        ctx.beginPath();
        datosConjuntos.universo.forEach((x, i) => {
            i === 0 ? ctx.moveTo(px(x), py(valores[i])) : ctx.lineTo(px(x), py(valores[i]));
        });
        ctx.stroke();
    });

    // Línea vertical del conductor evaluado y cortes con cada conjunto
    ctx.strokeStyle = colorCss('--texto-principal');
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px(xEvaluado), py(0)); ctx.lineTo(px(xEvaluado), py(1)); ctx.stroke();
    ctx.setLineDash([]);
    Object.entries(grados).forEach(([nombre, grado]) => {
        if (grado <= 0) return;
        ctx.fillStyle = colorCss(CATEGORIAS[nombre].variable);
        ctx.beginPath(); ctx.arc(px(xEvaluado), py(grado), 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colorCss('--texto-principal');
        ctx.fillText(grado.toFixed(2), px(xEvaluado) + 10, py(grado) - 6);
    });
}

function htmlBarras(grados, ganadora) {
    return Object.entries(grados).map(([nombre, grado]) => `
        <div class="barra-fila">
            <span>${nombre === ganadora ? '★ ' : ''}${CATEGORIAS[nombre].etiqueta}</span>
            <div class="barra-fondo">
                <div class="barra-relleno ${CATEGORIAS[nombre].tipo}" style="width:${grado * 100}%"></div>
            </div>
            <span class="barra-valor">${grado.toFixed(2)}</span>
        </div>`).join('');
}

// ==========================================
// EVALUADOR EN VIVO (rango de años)
// ==========================================
async function actualizarEnVivo() {
    const anios = Number(document.getElementById('rango-anios').value);
    document.getElementById('valor-anios').textContent = anios;
    const r = await api('/api/evaluar', { anios });
    document.getElementById('barras-vivo').innerHTML = htmlBarras(r.grados, r.categoria);
    dibujarGrafica(anios, r.grados);
}

async function evaluarPersonalizado() {
    const anios = Number(document.getElementById('rango-anios').value);
    try {
        mostrarResultado(await api('/api/evaluar', { anios }), 'Conductor personalizado');
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// RENDERIZADO DE TARJETAS (conductores del taller: 3, 6 y 12 años)
// ==========================================
async function renderizarConductores() {
    const resultados = await api('/api/conductores');
    const contenedor = document.getElementById('contenedor-conductores');

    resultados.forEach((r, i) => {
        const cat = CATEGORIAS[r.categoria];
        const tarjeta = document.createElement('section');
        tarjeta.className = `tarjeta-servidor ${cat ? cat.tipo : ''}`;
        tarjeta.innerHTML = `
            <p class="id-servidor">CONDUCTOR ${i + 1}</p>
            <h2>${r.anios} años de experiencia</h2>
            <ul class="lista-metricas">
                <li><span>μ Novato:</span> <span>${r.grados.novato.toFixed(4)}</span></li>
                <li><span>μ Intermedio:</span> <span>${r.grados.intermedio.toFixed(4)}</span></li>
                <li><span>μ Experto:</span> <span>${r.grados.experto.toFixed(4)}</span></li>
                <li><span>Categoría (max):</span> <span>${cat ? cat.etiqueta : r.categoria}</span></li>
            </ul>
            <button class="btn-diagnosticar" onclick='mostrarResultado(${JSON.stringify(r)}, "Conductor ${i + 1}")'>Ver análisis</button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// MANEJO DEL MODAL
// ==========================================
function mostrarResultado(r, nombre) {
    const cat = CATEGORIAS[r.categoria];
    const formulas = Object.entries(datosConjuntos.vertices).map(([nombre, [a, b, c]]) =>
        `${CATEGORIAS[nombre].etiqueta.padEnd(10, ' ')} (${a}, ${b}, ${c}) → μ(${r.anios}) = ${r.grados[nombre].toFixed(4)}`
    ).join('<br>');

    abrirModal(
        'Fuzzificación del Conductor',
        `${nombre} · ${r.anios} años trabajados`,
        cat
            ? { tipo: cat.tipo, texto: `Categoría: ${cat.etiqueta.toUpperCase()} (grado de verdad ${r.grados[r.categoria].toFixed(2)})` }
            : { tipo: 'critico', texto: 'Fuera del universo de los conjuntos definidos' },
        `
        <p class="subtitulo-modal">Grados de membresía</p>
        <div class="barras">${htmlBarras(r.grados, r.categoria)}</div>
        <p class="subtitulo-modal">Cálculo por conjunto</p>
        <div class="metricas-detalle">${formulas}</div>
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
document.addEventListener('DOMContentLoaded', async () => {
    datosConjuntos = await api('/api/conjuntos');
    document.getElementById('rango-anios').addEventListener('input', actualizarEnVivo);
    await actualizarEnVivo();
    renderizarConductores();
});
