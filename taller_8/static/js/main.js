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

const NOMBRE_CLASE = { 0: 'Clase A (0)', 1: 'Clase B (1)' };
let escenarios = {};
let modelo = null;

// Geometría del plano cartesiano (0 a 10 en ambos ejes)
const MARGEN = 40;
function escala(canvas) {
    const lado = canvas.width - MARGEN * 2;
    return {
        px: x => MARGEN + (x / 10) * lado,
        py: y => canvas.height - MARGEN - (y / 10) * lado,
        lado
    };
}

// ==========================================
// PARÁMETROS DEL FORMULARIO
// ==========================================
function leerParametros() {
    const form = document.getElementById('form-svm');
    return {
        escenario: form.escenario.value,
        kernel: form.kernel.value,
        C: Number(form.C.value),
        gamma: form.gamma.value.trim() || 'scale'
    };
}

async function cargarEscenarios() {
    escenarios = await api('/api/escenarios');
    document.getElementById('escenario').innerHTML = Object.entries(escenarios)
        .map(([clave, e]) => `<option value="${clave}">${e.nombre}</option>`).join('');
}

// ==========================================
// ENTRENAMIENTO DEL SVM (en Python, vía API)
// ==========================================
async function entrenarModelo() {
    const parametros = leerParametros();
    document.getElementById('descripcion-escenario').textContent = escenarios[parametros.escenario].descripcion;
    try {
        modelo = await api('/api/svm', parametros);
    } catch (error) {
        document.getElementById('resumen-modelo').innerHTML = `<li class="error">${error.message}</li>`;
        return;
    }
    const h = modelo.hiperplano;
    document.getElementById('resumen-modelo').innerHTML = `
        <li><span>Exactitud en entrenamiento:</span> <span>${(modelo.exactitud * 100).toFixed(1)}%</span></li>
        <li><span>Vectores de soporte:</span> <span>${modelo.vectores_soporte.length}</span></li>
        <li><span>Ancho de la calle (margen):</span> <span>${h ? h.margen.toFixed(3) : 'no aplica (rbf)'}</span></li>
        ${modelo.predicciones.map(p =>
            `<li><span>Punto [${p.punto.join(', ')}]:</span> <span>${NOMBRE_CLASE[p.clase]}</span></li>`).join('')}
    `;
    dibujarPlano();
}

// ==========================================
// DIBUJO DEL PLANO, REGIONES Y VECTORES
// ==========================================
function dibujarPlano(puntoConsulta) {
    const canvas = document.getElementById('grafica');
    const ctx = canvas.getContext('2d');
    const { px, py } = escala(canvas);
    const r = modelo.rejilla;
    const celda = (r.paso / 10) * (canvas.width - MARGEN * 2);
    const valor = i => r.paso * i;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Regiones de decisión (cada celda coloreada con la clase predicha)
    for (let iy = 0; iy < r.n; iy++) {
        for (let ix = 0; ix < r.n; ix++) {
            const clase = r.clases[iy * r.n + ix];
            ctx.fillStyle = clase === 1 ? 'rgba(234, 179, 8, 0.13)' : 'rgba(59, 130, 246, 0.13)';
            ctx.fillRect(px(valor(ix)) - celda / 2, py(valor(iy)) - celda / 2, celda, celda);
        }
    }

    // Rejilla y ejes
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.fillStyle = colorCss('--texto-secundario');
    ctx.font = '13px Segoe UI';
    for (let v = 0; v <= 10; v++) {
        ctx.beginPath(); ctx.moveTo(px(v), py(0)); ctx.lineTo(px(v), py(10)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(0), py(v)); ctx.lineTo(px(10), py(v)); ctx.stroke();
        ctx.fillText(v, px(v) - 4, py(0) + 20);
        ctx.fillText(v, px(0) - 24, py(v) + 4);
    }

    // Frontera: segmentos entre celdas vecinas con distinta clase
    ctx.strokeStyle = colorCss('--texto-principal');
    ctx.lineWidth = 2;
    for (let iy = 0; iy < r.n; iy++) {
        for (let ix = 0; ix < r.n; ix++) {
            const c = r.clases[iy * r.n + ix];
            if (ix + 1 < r.n && r.clases[iy * r.n + ix + 1] !== c) {
                const x = px(valor(ix)) + celda / 2;
                ctx.beginPath(); ctx.moveTo(x, py(valor(iy)) - celda / 2); ctx.lineTo(x, py(valor(iy)) + celda / 2); ctx.stroke();
            }
            if (iy + 1 < r.n && r.clases[(iy + 1) * r.n + ix] !== c) {
                const y = py(valor(iy)) - celda / 2;
                ctx.beginPath(); ctx.moveTo(px(valor(ix)) - celda / 2, y); ctx.lineTo(px(valor(ix)) + celda / 2, y); ctx.stroke();
            }
        }
    }

    // Márgenes de la "calle" para el kernel lineal: w·x + b = ±1
    if (modelo.hiperplano) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(px(0), py(10), px(10) - px(0), py(0) - py(10));
        ctx.clip();                                   // las líneas no se salen del plano
        const [w1, w2] = modelo.hiperplano.w;
        const b = modelo.hiperplano.b;
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = colorCss('--texto-secundario');
        [-1, 1].forEach(lado => {
            // y = (lado - b - w1·x) / w2
            if (Math.abs(w2) < 1e-9) return;
            ctx.beginPath();
            ctx.moveTo(px(0), py((lado - b) / w2));
            ctx.lineTo(px(10), py((lado - b - w1 * 10) / w2));
            ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.restore();
    }

    // Puntos de entrenamiento
    modelo.puntos.forEach(p => dibujarPunto(ctx, px(p.x[0]), py(p.x[1]), p.clase));

    // Vectores de soporte: círculo rojo
    ctx.strokeStyle = colorCss('--color-critico');
    ctx.lineWidth = 2.5;
    modelo.vectores_soporte.forEach(([x, y]) => {
        ctx.beginPath(); ctx.arc(px(x), py(y), 15, 0, Math.PI * 2); ctx.stroke();
    });

    // Punto consultado por el usuario
    if (puntoConsulta) {
        ctx.fillStyle = colorCss('--texto-principal');
        ctx.beginPath(); ctx.arc(px(puntoConsulta[0]), py(puntoConsulta[1]), 5, 0, Math.PI * 2); ctx.fill();
    }
}

function dibujarPunto(ctx, x, y, clase) {
    ctx.lineWidth = 3;
    if (clase === 0) {
        ctx.fillStyle = colorCss('--color-boton');
        ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.strokeStyle = colorCss('--color-advertencia');
        ctx.beginPath();
        ctx.moveTo(x - 7, y - 7); ctx.lineTo(x + 7, y + 7);
        ctx.moveTo(x + 7, y - 7); ctx.lineTo(x - 7, y + 7);
        ctx.stroke();
    }
}

// ==========================================
// CLIC EN EL PLANO: PREDICCIÓN DE UN PUNTO NUEVO
// ==========================================
async function clasificarClic(evento) {
    if (!modelo) return;
    const canvas = evento.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const factor = canvas.width / rect.width;
    const { lado } = escala(canvas);
    const x = ((evento.clientX - rect.left) * factor - MARGEN) / lado * 10;
    const y = (canvas.height - MARGEN - (evento.clientY - rect.top) * factor) / lado * 10;
    if (x < 0 || x > 10 || y < 0 || y > 10) return;

    const punto = [Number(x.toFixed(2)), Number(y.toFixed(2))];
    try {
        const r = await api('/api/predecir', { ...leerParametros(), punto });
        dibujarPlano(punto);
        abrirModal(
            'Predicción del SVM',
            `Punto [${punto.join(', ')}] · kernel '${modelo.kernel}'`,
            { tipo: r.clase === 1 ? 'advertencia' : 'info', texto: `El punto pertenece a la ${NOMBRE_CLASE[r.clase]}` },
            `<div class="metricas-detalle">
                modelo_svm.predict([[${punto.join(', ')}]]) = ${r.clase}<br>
                decision_function = ${r.distancia_frontera}
                (${r.distancia_frontera >= 0 ? 'lado de la Clase B' : 'lado de la Clase A'})
            </div>`
        );
    } catch (error) {
        alert(error.message);
    }
}

function verAnalisis() {
    if (!modelo) return;
    const h = modelo.hiperplano;
    abrirModal(
        'Análisis del Modelo SVM',
        `${modelo.nombre} · kernel '${modelo.kernel}' · C = ${modelo.C} · gamma = ${modelo.gamma}`,
        {
            tipo: modelo.exactitud === 1 ? 'estable' : 'critico',
            texto: `Exactitud en entrenamiento: ${(modelo.exactitud * 100).toFixed(1)}%`
        },
        `
        <p class="subtitulo-modal">Los vectores de soporte son</p>
        <div class="consola">${modelo.vectores_soporte.map(v => `[${v.join(', ')}]`).join('\n')}</div>
        ${h ? `<p class="subtitulo-modal">Hiperplano aprendido</p>
               <div class="metricas-detalle">${h.ecuacion}<br>Ancho de la calle = 2 / ‖w‖ = ${h.margen}</div>` : ''}
        <p class="subtitulo-modal">Predicciones</p>
        <div class="metricas-detalle">
            ${modelo.predicciones.map(p => `El punto [${p.punto.join(', ')}] pertenece a la clase: ${p.clase}`).join('<br>')}
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
document.addEventListener('DOMContentLoaded', async () => {
    await cargarEscenarios();
    document.querySelectorAll('#form-svm select').forEach(s => s.addEventListener('change', entrenarModelo));
    document.getElementById('grafica').addEventListener('click', clasificarClic);
    entrenarModelo();
});
