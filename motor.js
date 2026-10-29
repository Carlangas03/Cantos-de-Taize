// motor.js - Lógica general (Ocultación dinámica y Transporte)

// 1. Variable global para recordar en qué tono estamos
let semitonosTransporte = 0;

// 2. Funciones llamadas por los botones
window.cambiarTono = function(delta) {
    semitonosTransporte += delta;
    actualizarMotor();
};

window.resetTono = function() {
    semitonosTransporte = 0;
    actualizarMotor();
};

function actualizarMotor() {
    // --- INYECCIÓN AUTOMÁTICA DEL PANEL DE TRANSPORTE ---
    // Si el panel no existe aún en el HTML, el motor lo crea e inserta
    let panelTransporte = document.getElementById('panel-transporte');
    if (!panelTransporte) {
        panelTransporte = document.createElement('div');
        panelTransporte.id = 'panel-transporte';
        panelTransporte.style.cssText = 'background: #f0faff; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; flex-wrap: wrap; gap: 15px;';
        
        // Lo insertamos justo encima del contenedor del pentagrama ("paper")
        const paper = document.getElementById('paper');
        paper.parentNode.insertBefore(panelTransporte, paper);
    }

    // Actualizamos los textos del panel (qué número de semitonos llevamos)
    let signo = semitonosTransporte > 0 ? '+' : '';
    let textoTono = semitonosTransporte === 0 ? 'Tono Original' : `${signo}${semitonosTransporte} semitonos`;

    panelTransporte.innerHTML = `
        <span style="font-weight: bold; color: #1e293b;">Transporte:</span>
        <button onclick="cambiarTono(-1)" style="cursor: pointer; padding: 6px 15px; font-weight: bold; border-radius: 6px; border: 1px solid #ccc; background: white; color: #1e293b;">- 1</button>
        <span style="min-width: 130px; text-align: center; font-weight: bold; color: #ff5e00;">${textoTono}</span>
        <button onclick="cambiarTono(1)" style="cursor: pointer; padding: 6px 15px; font-weight: bold; border-radius: 6px; border: 1px solid #ccc; background: white; color: #1e293b;">+ 1</button>
        <button onclick="resetTono()" style="cursor: pointer; padding: 6px 15px; font-weight: bold; border-radius: 6px; border: 1px solid #ccc; background: #e2e8f0; color: #1e293b; margin-left: auto;">Original</button>
    `;

    // --- LÓGICA DE VOCES ACTIVAS (Sin cambios) ---
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

    // --- RENDERIZADO VISUAL Y SONORO ---
    document.getElementById("paper").innerHTML = "";
    document.getElementById("audio").innerHTML = "";

    // 1. Dibuja la partitura transportando visualmente notas y acordes
    const visualObj = ABCJS.renderAbc("paper", abcFinal, {
        responsive: "resize",
        scale: 0.8,
        add_classes: true,
        visualTranspose: semitonosTransporte // ¡Esta es la clave de todo!
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
                midiTranspose: semitonosTransporte
            });
        });
    }
}

// Arrancar al inicio
window.onload = actualizarMotor;