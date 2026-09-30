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

let ultimaTabla = null;

// ==========================================
// TABLA DE VERDAD
// ==========================================
function filasTabla(tabla) {
    return tabla.filas.map(f => `
        <tr>
            <td>${f.entrada[0]}</td><td>${f.entrada[1]}</td>
            <td>${f.z.toFixed(2)}</td><td>${f.salida}</td><td>${f.esperado}</td>
            <td>${f.correcto ? '<span class="chip estable">OK</span>' : '<span class="chip critico">FALLA</span>'}</td>
        </tr>`).join('');
}

function htmlTabla(tabla) {
    return `
        <div class="tabla-contenedor">
            <table class="tabla">
                <thead><tr><th>X1</th><th>X2</th><th>Z</th><th>Salida</th><th>Esperado</th><th></th></tr></thead>
                <tbody>${filasTabla(tabla)}</tbody>
            </table>
        </div>`;
}

// ==========================================
// TARJETAS: AND DE LA GUÍA Y SOLUCIÓN OR
// ==========================================
async function renderizarCompuertas() {
    const compuertas = await api('/api/compuertas');
    const contenedor = document.getElementById('contenedor-compuertas');
    const textos = {
        AND: 'Pesos y sesgo del código de la guía (punto 2: verificación).',
        OR: 'Solución encontrada a mano para el reto (punto 5).'
    };

    Object.entries(compuertas).forEach(([nombre, tabla]) => {
        const tarjeta = document.createElement('section');
        tarjeta.className = `tarjeta-servidor ${tabla.resuelve ? 'estable' : 'critico'}`;
        tarjeta.innerHTML = `
            <p class="id-servidor">COMPUERTA ${nombre}</p>
            <h2>W = [${tabla.pesos.join(', ')}] · b = ${tabla.sesgo}</h2>
            <p class="descripcion">${textos[nombre]}</p>
            ${htmlTabla(tabla)}
            <button class="btn-diagnosticar" onclick="cargarEnLaboratorio('${nombre}', ${tabla.pesos[0]}, ${tabla.pesos[1]}, ${tabla.sesgo})">
                Cargar en el laboratorio
            </button>
        `;
        contenedor.appendChild(tarjeta);
    });
}

function cargarEnLaboratorio(compuerta, w1, w2, b) {
    const form = document.getElementById('form-pesos');
    form.compuerta.value = compuerta;
    form.w1.value = w1;
    form.w2.value = w2;
    form.b.value = b;
    actualizarLaboratorio();
    form.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// LABORATORIO EN VIVO (el perceptrón corre en Python)
// ==========================================
function leerPesos() {
    const form = document.getElementById('form-pesos');
    const datos = {
        compuerta: form.compuerta.value,
        w1: Number(form.w1.value),
        w2: Number(form.w2.value),
        b: Number(form.b.value)
    };
    document.getElementById('valor-w1').textContent = datos.w1.toFixed(2);
    document.getElementById('valor-w2').textContent = datos.w2.toFixed(2);
    document.getElementById('valor-b').textContent = datos.b.toFixed(2);
    return datos;
}

async function actualizarLaboratorio() {
    const datos = leerPesos();
    try {
        ultimaTabla = await api('/api/evaluar', datos);
    } catch (error) {
        alert(error.message);
        return;
    }
    document.getElementById('tabla-vivo').innerHTML = filasTabla(ultimaTabla);
    const estado = document.getElementById('estado-reto');
    const aciertos = ultimaTabla.filas.filter(f => f.correcto).length;
    estado.className = `veredicto ${ultimaTabla.resuelve ? 'estable' : 'advertencia'}`;
    estado.textContent = ultimaTabla.resuelve
        ? `¡La neurona resuelve la compuerta ${ultimaTabla.compuerta}!`
        : `Aún no: ${aciertos} de 4 salidas correctas para ${ultimaTabla.compuerta}`;
    dibujarFrontera(ultimaTabla);
}

// ==========================================
// GRÁFICA: FRONTERA DE DECISIÓN W1·X1 + W2·X2 + b = 0
// ==========================================
function dibujarFrontera(tabla) {
    const canvas = document.getElementById('grafica');
    const ctx = canvas.getContext('2d');
    const min = -0.5, max = 1.5, margen = 36;
    const lado = canvas.width - margen * 2;
    const px = x => margen + ((x - min) / (max - min)) * lado;
    const py = y => canvas.height - margen - ((y - min) / (max - min)) * lado;
    const [w1, w2] = tabla.pesos;
    const b = tabla.sesgo;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Región donde Z >= 0 (la neurona dispara 1)
    const paso = 0.025;
    const celda = (paso / (max - min)) * lado;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.22)';
    for (let x = min; x < max; x += paso) {
        for (let y = min; y < max; y += paso) {
            const cx = x + paso / 2, cy = y + paso / 2;
            if (w1 * cx + w2 * cy + b >= 0) ctx.fillRect(px(x), py(y) - celda, celda + 0.5, celda + 0.5);
        }
    }

    // Ejes y rejilla
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.fillStyle = colorCss('--texto-secundario');
    ctx.font = '13px Segoe UI';
    [-0.5, 0, 0.5, 1, 1.5].forEach(v => {
        ctx.beginPath(); ctx.moveTo(px(v), py(min)); ctx.lineTo(px(v), py(max)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(min), py(v)); ctx.lineTo(px(max), py(v)); ctx.stroke();
        ctx.fillText(v, px(v) - 8, py(min) + 18);
        ctx.fillText(v, px(min) - 32, py(v) + 4);
    });
    ctx.fillText('X1', px(max) - 16, py(min) + 32);
    ctx.fillText('X2', px(min) - 30, py(max) - 8);

    // Frontera Z = 0
    ctx.save();
    ctx.beginPath(); ctx.rect(px(min), py(max), lado, lado); ctx.clip();
    ctx.strokeStyle = colorCss('--texto-principal');
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (Math.abs(w2) > 1e-9) {
        ctx.moveTo(px(min), py((-b - w1 * min) / w2));
        ctx.lineTo(px(max), py((-b - w1 * max) / w2));
    } else if (Math.abs(w1) > 1e-9) {
        ctx.moveTo(px(-b / w1), py(min));
        ctx.lineTo(px(-b / w1), py(max));
    }
    ctx.stroke();
    ctx.restore();

    // Las 4 entradas coloreadas según la salida esperada
    tabla.filas.forEach(f => {
        ctx.fillStyle = colorCss(f.esperado === 1 ? '--color-estable' : '--color-critico');
        ctx.beginPath(); ctx.arc(px(f.entrada[0]), py(f.entrada[1]), 9, 0, Math.PI * 2); ctx.fill();
        if (!f.correcto) {
            ctx.strokeStyle = colorCss('--color-advertencia');
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(px(f.entrada[0]), py(f.entrada[1]), 15, 0, Math.PI * 2); ctx.stroke();
        }
    });
}

function verificarPesos() {
    if (!ultimaTabla) return;
    const t = ultimaTabla;
    abrirModal(
        `Compuerta ${t.compuerta}`,
        `W = [${t.pesos.map(w => w.toFixed(2)).join(', ')}] · b = ${t.sesgo.toFixed(2)}`,
        t.resuelve
            ? { tipo: 'estable', texto: '¡Pesos correctos! Anote esta combinación.' }
            : { tipo: 'critico', texto: 'Estos pesos no resuelven la compuerta.' },
        `
        ${htmlTabla(t)}
        <div class="metricas-detalle">
            ${t.filas.map(f =>
                `Z = (${f.entrada[0]}·${t.pesos[0]}) + (${f.entrada[1]}·${t.pesos[1]}) + (${t.sesgo}) = ${f.z.toFixed(2)} → ${f.salida}`
            ).join('<br>')}
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
    document.querySelectorAll('#form-pesos input, #form-pesos select')
        .forEach(control => control.addEventListener('input', actualizarLaboratorio));
    actualizarLaboratorio();
    renderizarCompuertas();
});
