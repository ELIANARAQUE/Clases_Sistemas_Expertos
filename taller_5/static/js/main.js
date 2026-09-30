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

function colorCss(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

let ultimoFrenado = null;

// ==========================================
// VALIDACIÓN: DESCUENTO COMERCIAL (dominio discreto)
// ==========================================
async function cargarValidacion() {
    const datos = await api('/api/validacion');
    document.getElementById('tabla-validacion').innerHTML = datos.x.map((x, i) => `
        <tr>
            <td><input type="number" class="valor-x" value="${x}" step="1"></td>
            <td><input type="number" class="valor-mu" value="${datos.mu[i]}" min="0" max="1" step="0.1"></td>
        </tr>`).join('');
}

async function calcularValidacion() {
    const x = [...document.querySelectorAll('.valor-x')].map(e => Number(e.value));
    const mu = [...document.querySelectorAll('.valor-mu')].map(e => Number(e.value));
    try {
        const r = await api('/api/centroide', { x, mu });
        const filas = r.x.map((xi, i) => `
            <tr><td>${xi}</td><td>${r.mu[i]}</td><td>${r.productos[i].toFixed(2)}</td></tr>`).join('');

        abrirModal(
            'Centroide del Descuento',
            'COG = Σ(x·μ) / Σ(μ) calculado con NumPy',
            { tipo: 'estable', texto: `Descuento recomendado: ${r.resultado.toFixed(2)}%` },
            `
            <div class="tabla-contenedor">
                <table class="tabla">
                    <thead><tr><th>x</th><th>μ(x)</th><th>x · μ(x)</th></tr></thead>
                    <tbody>${filas}</tbody>
                </table>
            </div>
            <div class="metricas-detalle">
                1. Numerador   Σ(x·μ) = ${r.numerador.toFixed(2)}<br>
                2. Denominador Σ(μ)   = ${r.denominador.toFixed(2)}<br>
                3. COG = ${r.numerador.toFixed(2)} / ${r.denominador.toFixed(2)} = ${r.resultado.toFixed(4)}
            </div>
            `
        );
    } catch (error) {
        alert(error.message);
    }
}

// ==========================================
// FRENADO AUTOMÁTICO (campana de Gauss)
// ==========================================
function leerParametros() {
    const centro = Number(document.getElementById('centro').value);
    const sigma = Number(document.getElementById('sigma').value);
    const altura = Number(document.getElementById('altura').value);
    document.getElementById('valor-centro').textContent = centro;
    document.getElementById('valor-sigma').textContent = sigma;
    document.getElementById('valor-altura').textContent = altura.toFixed(2);
    return { centro, sigma, altura };
}

async function actualizarFrenado() {
    try {
        ultimoFrenado = await api('/api/frenado', leerParametros());
    } catch (error) {
        document.getElementById('resumen-frenado').innerHTML = `<li class="error">${error.message}</li>`;
        return;
    }
    const r = ultimoFrenado;
    document.getElementById('resumen-frenado').innerHTML = `
        <li><span>Elementos en x:</span> <span>${r.x.length}</span></li>
        <li><span>Fuerza exacta (centroide NumPy):</span> <span>${r.fuerza.toFixed(4)} N</span></li>
        <li><span>Comprobación skfuzzy.defuzz:</span>
            <span>${r.fuerza_skfuzzy === null ? 'no instalado' : r.fuerza_skfuzzy.toFixed(4) + ' N'}</span></li>
    `;
    dibujarCurva(r);
}

function dibujarCurva(r) {
    const canvas = document.getElementById('grafica');
    const ctx = canvas.getContext('2d');
    const m = { izq: 50, der: 20, arr: 20, aba: 40 };
    const ancho = canvas.width - m.izq - m.der;
    const alto = canvas.height - m.arr - m.aba;
    const px = x => m.izq + (x / 100) * ancho;
    const py = y => m.arr + (1 - y) * alto;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px Segoe UI';

    // Rejilla
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.fillStyle = colorCss('--texto-secundario');
    for (let x = 0; x <= 100; x += 10) {
        ctx.beginPath(); ctx.moveTo(px(x), py(0)); ctx.lineTo(px(x), py(1)); ctx.stroke();
        ctx.fillText(x, px(x) - 8, py(0) + 20);
    }
    for (let y = 0; y <= 1; y += 0.25) {
        ctx.beginPath(); ctx.moveTo(px(0), py(y)); ctx.lineTo(px(100), py(y)); ctx.stroke();
        ctx.fillText(y.toFixed(2), 8, py(y) + 4);
    }
    ctx.fillText('Fuerza de frenado (N)', px(100) - 140, py(0) + 36);

    // Área bajo la curva y contorno
    const azul = colorCss('--color-boton');
    ctx.beginPath();
    ctx.moveTo(px(r.x[0]), py(0));
    r.x.forEach((x, i) => ctx.lineTo(px(x), py(r.curva[i])));
    ctx.lineTo(px(r.x[r.x.length - 1]), py(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.fill();
    ctx.strokeStyle = azul;
    ctx.lineWidth = 3;
    ctx.beginPath();
    r.x.forEach((x, i) => (i === 0 ? ctx.moveTo(px(x), py(r.curva[i])) : ctx.lineTo(px(x), py(r.curva[i]))));
    ctx.stroke();

    // Línea del centroide
    const amarillo = colorCss('--color-advertencia');
    ctx.strokeStyle = amarillo;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(px(r.fuerza), py(0)); ctx.lineTo(px(r.fuerza), py(1)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = amarillo;
    ctx.fillText(`COG = ${r.fuerza.toFixed(2)} N`, px(r.fuerza) + 8, py(0.95));
}

function verDetalleFrenado() {
    if (!ultimoFrenado) return;
    const r = ultimoFrenado;
    abrirModal(
        'Sistema de Frenado Automático',
        `Campana de Gauss: centro ${r.centro} N, sigma ${r.sigma}, truncada a ${r.altura.toFixed(2)}`,
        { tipo: 'estable', texto: `Fuerza de frenado exacta: ${r.fuerza.toFixed(4)} N` },
        `
        <div class="metricas-detalle">
            x = np.linspace(0, 100, ${r.x.length})<br>
            curva = np.exp(-((x - ${r.centro})**2) / (2 * ${r.sigma}**2))<br>
            curva = np.fmin(curva, ${r.altura.toFixed(2)})<br>
            fuerza = np.sum(x * curva) / np.sum(curva) = ${r.fuerza.toFixed(4)} N<br>
            ${r.fuerza_skfuzzy === null ? '' : `skfuzzy.defuzz(x, curva, 'centroid') = ${r.fuerza_skfuzzy.toFixed(4)} N`}
        </div>
        `
    );
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
    cargarValidacion();
    ['centro', 'sigma', 'altura'].forEach(id =>
        document.getElementById(id).addEventListener('input', actualizarFrenado));
    actualizarFrenado();
});
