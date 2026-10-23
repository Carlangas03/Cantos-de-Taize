// motor.js - Lógica general para renderizar partituras y reproducir audio

function actualizarMotor() {
    const activas = {
        S: document.getElementById('chk-S').checked,
        A: document.getElementById('chk-A').checked,
        T: document.getElementById('chk-T').checked,
        B: document.getElementById('chk-B').checked
    };

    let lineas = MI_PARTITURA.trim().split('\n');
    let partituraProcesada = [];
    let vozActual = "";

    for (let linea of lineas) {
        let lineaLimpia = linea.trim();

        if (lineaLimpia.startsWith("V:")) {
            vozActual = lineaLimpia.charAt(2);
        }

        if (lineaLimpia.startsWith("[V:")) {
            vozActual = lineaLimpia.charAt(3);
        }

        if (vozActual && activas[vozActual] === false) {
            if (lineaLimpia.includes("[V:") || (!lineaLimpia.startsWith("X:") && !lineaLimpia.startsWith("T:") && !lineaLimpia.startsWith("M:") && !lineaLimpia.startsWith("L:") && !lineaLimpia.startsWith("K:") && !lineaLimpia.startsWith("%%score") && !lineaLimpia.startsWith("V:"))) {
                
                if (lineaLimpia.startsWith("[V:")) {
                    let etiquetaVoz = linea.substring(0, linea.indexOf("]") + 1);
                    linea = etiquetaVoz + " z4 |]"; 
                } else {
                    linea = " z4 |]";
                }
            }
        }

        partituraProcesada.push(linea);
    }

    const abcFinal = partituraProcesada.join('\n');

    document.getElementById("paper").innerHTML = "";
    document.getElementById("audio").innerHTML = "";

    const visualObj = ABCJS.renderAbc("paper", abcFinal, {
        responsive: "resize",
        scale: 0.8,
        add_classes: true
    });

    if (ABCJS.synth.supportsAudio()) {
        const synthControl = new ABCJS.synth.SynthController();
        synthControl.load("#audio", null, {
            displayPlay: true, displayLoop: true, displayRestart: true, displayProgress: true
        });

        const createSynth = new ABCJS.synth.CreateSynth();
        createSynth.init({
            visualObj: visualObj[0]
        }).then(() => {
            synthControl.setTune(visualObj[0], false);
        });
    }
}

window.onload = actualizarMotor;