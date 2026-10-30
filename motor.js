/*****************************************************************************/
/* LÓGICA PARA TRANSPORTAR LA TONALIDAD DE LA PARTITURA                      */
/*****************************************************************************/
// 1. Variable global para recordar en qué tono estamos
let transporteActual = 0;

// 2. Funciones llamadas por los botones
window.cambiarTono = function(delta) {
    transporteActual += delta;
    actualizarMotor();
};

window.resetTono = function() {
    transporteActual = 0;
    actualizarMotor();
};


/*****************************************************************************/
/* FUNCIÓN PARA ACTUALIZAR LA PARTITURA                                      */
/*****************************************************************************/
function actualizarMotor() {
    // --- INYECCIÓN AUTOMÁTICA DEL PANEL DE TRANSPORTE ---
    // Si el panel no existe aún en el HTML, el motor lo crea e inserta
    let panelTransporte = document.getElementById('panel-transporte');
    if (!panelTransporte) {
        panelTransporte = document.createElement('div');
        panelTransporte.id = 'panel-transporte';
        panelTransporte.className = 'transporte-container'; // Usamos una clase CSS        
        // Lo insertamos justo encima del contenedor del pentagrama ("paper")
        const paper = document.getElementById('paper');
        paper.parentNode.insertBefore(panelTransporte, paper);
    }

    // Actualizamos los textos del panel (qué número de semitonos llevamos)
    let signo = transporteActual > 0 ? '+' : '';
    let textoTono = transporteActual === 0 ? 'Original' : `${signo}${transporteActual} semitonos`;

    panelTransporte.innerHTML = `
        <span class="letrero-voces-transporte">Transporte:</span>
        <button onclick="cambiarTono(-1)" class="transporte-btn">- 1</button>
        <span class="transporte-texto">${textoTono}</span>
        <button onclick="cambiarTono(1)" class="transporte-btn">+ 1</button>
        <button onclick="resetTono()" class="transporte-btn-reset">Tono original</button>
    `;


    /*************************************************************************/
    /* LÓGICA PARA LA SELECCIÓN DE LAS VOCES QUE SE VAN A REPRODUCIR         */
    /*************************************************************************/
        const comprobarVoz = (id) => {
        const checkbox = document.getElementById(id);
        return checkbox ? checkbox.checked : true;
    };

    const activas = {
        S: comprobarVoz('chk-S'),
        A: comprobarVoz('chk-A'),
        T: comprobarVoz('chk-T'),
        B: comprobarVoz('chk-B')
    };

    let lineas = MI_PARTITURA.trim().split('\n');
    let partituraProcesada = [];
    let vozActual = "";

    for (let linea of lineas) {
        let lineaLimpia = linea.trim();

        if (lineaLimpia.startsWith("%%score")) {
            if (!activas.S) linea = linea.replace(/S/g, '');
            if (!activas.A) linea = linea.replace(/A/g, '');
            if (!activas.T) linea = linea.replace(/T/g, '');
            if (!activas.B) linea = linea.replace(/B/g, '');
            linea = linea.replace(/\[\s*\]/g, '').replace(/\(\s*\)/g, '');
        }

        if (lineaLimpia.startsWith("V:")) {
            vozActual = lineaLimpia.charAt(2);
        } else if (lineaLimpia.startsWith("[V:")) {
            vozActual = lineaLimpia.charAt(3);
        }

        if (vozActual && activas[vozActual] === false) {
            continue; 
        }

        partituraProcesada.push(linea);
    }

    const abcFinal = partituraProcesada.join('\n');

    /*****************************************************************************/
    /* LÓGICA DEL RENDERIZADO DEL AUDIO Y DE LA IMAGEN (PARTITURA)               */
    /*****************************************************************************/

    document.getElementById("paper").innerHTML = "";
    document.getElementById("audio").innerHTML = "";

    // 1. Dibuja la partitura transportando visualmente notas y acordes
    const visualObj = ABCJS.renderAbc("paper", abcFinal, {
        responsive: "resize",
        scale: 0.8,
        add_classes: true,
        visualTranspose: transporteActual // ¡Esta es la clave de todo!
    });

    // 2. Prepara el audio
    if (ABCJS.synth.supportsAudio()) {
        const synthControl = new ABCJS.synth.SynthController();
        synthControl.load("#audio", null, {
            displayPlay: true, displayLoop: true, displayRestart: true, displayProgress: true
        });

        const createSynth = new ABCJS.synth.CreateSynth();
        createSynth.init({
            visualObj: visualObj[0],
            options: {
                chordsOff: true,
            }
        }).then(() => {
            // Pasamos midiTranspose para asegurar que el audio también se transporta
            synthControl.setTune(visualObj[0], false, { 
                chordsOff: true,
                midiTranspose: transporteActual
            });
        });
    }
}
// FIN DE LA FUNCIÓN ACTUALIZARMOTOR()

// Arrancar al inicio
window.onload = actualizarMotor;

/*****************************************************************************/
/* FUNCIÓN PARA ESTABLECER LA DISTANCIA ENTRE MENÚ E INICIO                  */
/*****************************************************************************/
const nav = document.querySelector('.site-nav');

// Función que calcula y ajusta el espacio superior del body automáticamente

function ajustarEspacioInicio() {
    if (!nav) return; // Evita fallos si la página actual no tiene menú

    // 1. Altura del menú
    const alturaMenu = nav.offsetHeight;

    // 2 Top del menú (en principio, debería ser igual al margin de los containers)
    const estilosNav = window.getComputedStyle(nav);
    const espacioMenuArriba = parseInt(estilosNav.top);

    // 3. Hueco que debe haber entre el menú y el primer container => margin top del container
    const primerContainer = document.querySelector('.container'); // DESCOMENTADO
    //const estilos = window.getComputedStyle(primerContainer);
    //const MarginTopContainers = parseInt(estilos.marginTop);
    //const espacioMenuAbajo = primerContainer ? parseInt(window.getComputedStyle(primerContainer).marginTop) : 30;
    const espacioMenuAbajo = 0; // Por ahora no añadimos espacio, para que no se sume al margin-top del container

    const paddingTotalBody = espacioMenuArriba + alturaMenu + espacioMenuAbajo;

    document.body.style.paddingTop = paddingTotalBody + 'px'; // CORREGIDO el nombre de la variable
}

// 1. Ajustar al cargar la página
window.addEventListener('load', ajustarEspacioInicio);
// 2. Ajustar AUTOMÁTICAMENTE si el usuario redimensiona la ventana de Chrome
window.addEventListener('resize', ajustarEspacioInicio);

/*****************************************************************************/
/* LÓGICA DE OCULTAR / MOSTRAR AL HACER SCROLL                               */
/*****************************************************************************/
let ultimoScroll = 0;

window.addEventListener('scroll', () => {
    if (!nav) return; // Evita fallos si la página actual no tiene menú
    const scrollActual = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollActual > ultimoScroll && scrollActual > 50) {
        nav.classList.add('nav-oculto'); // Si bajas, se esconde
    } else {
        nav.classList.remove('nav-oculto'); // Si subes, aparece
    }

    ultimoScroll = scrollActual <= 0 ? 0 : scrollActual;
});


/*****************************************************************************/
/* LÓGICA DE INCLUIR ARCHIVOS HTML                                           */
/*****************************************************************************/
document.querySelectorAll("[data-include]").forEach(async (el) => {
    const archivo = el.getAttribute("data-include");
        try {
            const respuesta = await fetch(archivo);
            if (respuesta.ok) {
                const html = await respuesta.text();
                el.outerHTML = html; // Reemplaza el div por el contenido real del archivo
            } else {
                el.innerHTML = `<p style="color:red;">No se pudo cargar ${archivo}</p>`;
            }
        } catch (error) {
            console.error("Error al incluir el archivo:", error);
        }
});