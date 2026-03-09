let myChart = null;

// Control de visibilidad de secciones
function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

// Control del check de reinversión (Solo visible en Régimen B)
function toggleReinversion() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    if(box) box.style.display = (tipo === 'B') ? 'flex' : 'none';
}

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apv = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion') ? document.getElementById('check_reinversion').checked : false;
    
    // Suma de otros activos
    const ahorroOtros = (parseFloat(document.getElementById('inv_cl').value) || 0) + 
                        (parseFloat(document.getElementById('inv_us').value) || 0) + 
                        (parseFloat(document.getElementById('inv_mm').value) || 0);

    const horizonte = parseInt(document.getElementById('horizonte').value);
    const tasas = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rAnual = tasas[document.getElementById('apv_fondo').value] || 0.05;
    const tipoAPV = document.getElementById('apv_tipo').value;

    let capital = inicial;
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    // Lógica de Alerta Inteligente
    const alerta = document.getElementById('alerta-regimen');
    const convieneB = (sueldo > 4000000);
    if (alerta) {
        if ((convieneB && tipoAPV === 'B') || (!convieneB && tipoAPV === 'A')) {
            alerta.innerHTML = `<strong>✅ ¡Excelente elección!</strong> El Régimen ${tipoAPV} es el óptimo para su renta de $${sueldo.toLocaleString()}.`;
            alerta.style.cssText = "display:block; background:#dbeafe; color:#1e40af; padding:15px; border-radius:10px; border-left:5px solid #3b82f6;";
        } else {
            const sugerido = convieneB ? 'B' : 'A';
            alerta.innerHTML = `<strong>⚠️ Sugerencia:</strong> El Régimen ${sugerido} otorgaría mejores beneficios fiscales para su renta actual.`;
            alerta.style.cssText = "display:block; background:#fff7ed; color:#9a3412; padding:15px; border-radius:10px; border-left:5px solid #f97316;";
        }
    }

    document.getElementById('fecha-reporte').innerText = "Simulación: " + new Date().toLocaleDateString();

    // Simulación año tras año
    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * rAnual;
        let impuesto = (rentaAnual * 0.15); // Estimación Global Complementario
        totalTax += impuesto;
        
        let aportesAnuales = (apv + ahorroOtros) * 12;
        
        // Beneficios APV
        if (document.getElementById('check_apv').checked) {
            if (tipoAPV === 'A') {
                aportesAnuales += (apv * 12 * 0.15); // Bono Fiscal 15%
            } else if (tipoAPV === 'B' && reinvierteB) {
                // Reinversión de devolución (estimado 25% según tramos altos)
                aportesAnuales += (apv * 12 * 0.25); 
            }
        }
        
        capital += aportesAnuales + rentaAnual - impuesto;
        labels.push("Año " + i);
        data.push(Math.round(capital));

        if (i === 1 || i % 5 === 0 || i === horizonte) {
            tableBody += `<tr><td>Año ${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(rentaAnual).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    // Actualizar números en pantalla
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.querySelector("#tax-table tbody").innerHTML = tableBody;

    renderChart(labels, data);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                fill: true,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: { 
            animation: false, // Desactivado para evitar errores de captura
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// LA SOLUCIÓN DEFINITIVA PARA EL PDF VACÍO
function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    
    // 1. Ocultar el botón para que no salga en el PDF
    btn.style.display = 'none';

    // 2. Parámetros de alta fidelidad
    const opt = {
        margin: [10, 5, 10, 5],
        filename: 'Reporte_InvestPro_Final.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 3. Generación directa
    html2pdf().set(opt).from(element).save().then(() => {
        btn.style.display = 'block'; // Mostrar botón de nuevo
    }).catch(err => {
        console.error("Error generando PDF:", err);
        btn.style.display = 'block';
    });
}
