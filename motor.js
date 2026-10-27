// motor.js - Lógica general para renderizar partituras y reproducir audio

// motor.js - Lógica general robusta (Ocultación dinámica de pentagramas y acordes mudos)

function actualizarMotor() {
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

        // 1. Si encontramos la configuración general (%%score), borramos las voces inactivas
        // para que abcjs ni siquiera reserve el espacio del pentagrama.
        if (lineaLimpia.startsWith("%%score")) {
            if (!activas.S) linea = linea.replace(/S/g, '');
            if (!activas.A) linea = linea.replace(/A/g, '');
            if (!activas.T) linea = linea.replace(/T/g, '');
            if (!activas.B) linea = linea.replace(/B/g, '');
            // Limpieza estética de corchetes vacíos (ej: si se quedan [] o () sueltos)
            linea = linea.replace(/\[\s*\]/g, '').replace(/\(\s*\)/g, '');
        }

        // 2. Detectar qué voz estamos leyendo en este momento
        if (lineaLimpia.startsWith("V:")) {
            vozActual = lineaLimpia.charAt(2);
        } else if (lineaLimpia.startsWith("[V:")) {
            vozActual = lineaLimpia.charAt(3);
        }

        // 3. LA MAGIA: Si la voz actual está desactivada, directamente IGNORAMOS todas sus líneas
        // (tanto sus notas como su letra 'w:'). La línea no se guarda y el pentagrama desaparece.
        if (vozActual && activas[vozActual] === false) {
            continue; 
        }

        partituraProcesada.push(linea);
    }

    const abcFinal = partituraProcesada.join('\n');

    // 4. Renderizar la partitura visual (compactada y limpia)
    document.getElementById("paper").innerHTML = "";
    document.getElementById("audio").innerHTML = "";

    const visualObj = ABCJS.renderAbc("paper", abcFinal, {
        responsive: "resize",
        scale: 0.8,
        add_classes: true
    });

    // 5. Preparar el audio (con chordsOff para silenciar los acordes del piano)
    if (ABCJS.synth.supportsAudio()) {
        const synthControl = new ABCJS.synth.SynthController();
        synthControl.load("#audio", null, {
            displayPlay: true, displayLoop: true, displayRestart: true, displayProgress: true
        });

        const createSynth = new ABCJS.synth.CreateSynth();
        createSynth.init({
            visualObj: visualObj[0],
            options: {
                chordsOff: true
            }
        }).then(() => {
            synthControl.setTune(visualObj[0], false, { chordsOff: true });
        });
    }
}

window.onload = actualizarMotor;