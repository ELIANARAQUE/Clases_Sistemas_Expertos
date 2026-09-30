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

const VARIABLES = {
    desempeno_pobre: 'Desempeño pobre',
    desempeno_promedio: 'Desempeño promedio',
    desempeno_excelente: 'Desempeño excelente',
    antiguedad_corta: 'Antigüedad corta',
    antiguedad_larga: 'Antigüedad larga'
};

const BONOS = {
    BAJO: { tipo: 'critico', texto: 'Bono BAJO' },
    MEDIO: { tipo: 'advertencia', texto: 'Bono MEDIO' },
    ALTO: { tipo: 'estable', texto: 'Bono ALTO' }
};

// Valores iniciales del formulario: el ejemplo de la guía
const GRADOS_INICIALES = {
    desempeno_pobre: 0.1, desempeno_promedio: 0.3, desempeno_excelente: 0.85,
    antiguedad_corta: 0.4, antiguedad_larga: 0.6
};

// ==========================================
// FORMULARIO DE GRADOS (rangos 0 a 1)
// ==========================================
function construirFormulario() {
    const form = document.getElementById('form-grados');
    form.innerHTML = Object.entries(VARIABLES).map(([clave, etiqueta]) => `
        <label class="campo">${etiqueta}: <span class="valor-rango" id="valor-${clave}">${GRADOS_INICIALES[clave]}</span>
            <input type="range" id="grado-${clave}" min="0" max="1" step="0.05" value="${GRADOS_INICIALES[clave]}">
        </label>`).join('');

    Object.keys(VARIABLES).forEach(clave => {
        document.getElementById(`grado-${clave}`).addEventListener('input', e => {
            document.getElementById(`valor-${clave}`).textContent = Number(e.target.value).toFixed(2);
        });
    });
}

function leerFormulario() {
    const grados = {};
    Object.keys(VARIABLES).forEach(clave => {
        grados[clave] = Number(document.getElementById(`grado-${clave}`).value);
    });
    return grados;
}

// ==========================================
// RENDERIZADO DE TARJETAS DE EMPLEADOS
// ==========================================
async function renderizarEmpleados() {
    const empleados = await api('/api/empleados');
    const contenedor = document.getElementById('contenedor-empleados');
    const referencia = document.getElementById('tarjeta-personalizada');

    Object.entries(empleados).forEach(([id, emp]) => {
        const tarjeta = document.createElement('section');
        tarjeta.className = 'tarjeta-servidor';
        tarjeta.innerHTML = `
            <p class="id-servidor">ID: ${id}</p>
            <h2>${emp.nombre}</h2>
            <ul class="lista-metricas">
                ${Object.entries(emp.grados).map(([k, v]) =>
                    `<li><span>${VARIABLES[k]}:</span> <span>${v}</span></li>`).join('')}
            </ul>
            <button class="btn-diagnosticar" onclick="evaluarEmpleado('${id}')">Calcular bono</button>
        `;
        contenedor.insertBefore(tarjeta, referencia);
    });
}

// ==========================================
// MOTOR DE INFERENCIA MAMDANI (en Python, vía API)
// ==========================================
async function evaluarEmpleado(id) {
    try {
        mostrarResultado(await api(`/api/bono/${id}`));
    } catch (error) {
        alert(error.message);
    }
}

async function evaluarPersonalizado() {
    try {
        mostrarResultado(await api('/api/bono', leerFormulario()));
    } catch (error) {
        alert(error.message);
    }
}

async function calcularAgregacion() {
    const a = Number(document.getElementById('fuerza-a').value);
    const b = Number(document.getElementById('fuerza-b').value);
    const caja = document.getElementById('resultado-agregacion');
    try {
        const r = await api('/api/agregacion', { fuerzas: [a, b] });
        caja.textContent = `fuerza_final_alto = max(${a}, ${b})\n# Resultado: ${r.resultado}`;
    } catch (error) {
        caja.textContent = `Error: ${error.message}`;
    }
}

// ==========================================
// MANEJO DEL MODAL
// ==========================================
function mostrarResultado(r) {
    const barras = Object.entries(r.activaciones).map(([bono, valor]) => `
        <div class="barra-fila">
            <span>${bono === r.bono_dominante ? '★ ' : ''}Bono ${bono}</span>
            <div class="barra-fondo"><div class="barra-relleno ${BONOS[bono].tipo}" style="width:${valor * 100}%"></div></div>
            <span class="barra-valor">${valor.toFixed(2)}</span>
        </div>`).join('');

    const pasos = r.reglas.map(p => `
        <li>
            <span class="ciclo">${p.id}</span><br>
            ${p.regla}<br>
            <code>${p.calculo} = ${p.resultado}</code>
        </li>`).join('');

    abrirModal(
        'Inferencia Mamdani del Bono',
        `${r.nombre} (${r.id})`,
        {
            tipo: BONOS[r.bono_dominante].tipo,
            texto: `${BONOS[r.bono_dominante].texto} con activación ${r.activaciones[r.bono_dominante].toFixed(2)}`
        },
        `
        <p class="subtitulo-modal">Niveles de activación (diccionario retornado por el motor)</p>
        <div class="barras">${barras}</div>
        <div class="consola">${JSON.stringify(r.activaciones)}</div>
        <p class="subtitulo-modal">Evaluación de cada regla</p>
        <ul class="traza">${pasos}</ul>
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
    construirFormulario();
    renderizarEmpleados();
    calcularAgregacion();
});
