let myChart = null;

// Control de visibilidad de cajas
function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

// Mostrar/Ocultar check de reinversión según Régimen
function toggleReinversion() {
    const tipo = document.getElementById('apv_tipo').value;
    document.getElementById('box_reinversion').style.display = (tipo === 'B') ? 'flex' : 'none';
}

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apv = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion').checked;
    
    const invCL = parseFloat(document.getElementById('inv_cl').value) || 0;
    const invUS = parseFloat(document.getElementById('inv_us').value) || 0;
    const invMM = parseFloat(document.getElementById('inv_mm').value) || 0;
    const ahorroOtros = invCL + invUS + invMM;

    const horizonte = parseInt(document.getElementById('horizonte').value);
    const fondo = document.getElementById('apv_fondo').value;
    const tipoAPV = document.getElementById('apv_tipo').value;

    const tasas = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rAnual = tasas[fondo];
    
    let capital = inicial;
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    // Alerta de Régimen
    const alerta = document.getElementById('alerta-regimen');
    const convieneB = (sueldo > 4000000);
    if ((convieneB && tipoAPV === 'B') || (!convieneB && tipoAPV === 'A')) {
        alerta.innerHTML = `<strong>✅ ¡Excelente elección!</strong> Régimen ${tipoAPV} optimizado.`;
        alerta.className = "alerta-box alerta-success";
    } else {
        alerta.innerHTML = `<strong>⚠️ Sugerencia:</strong> Régimen ${convieneB ? 'B' : 'A'} sería más eficiente para su renta.`;
        alerta.className = "alerta-box alerta-warning";
    }
    alerta.style.display = 'block';

    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * rAnual;
        let impuesto = (rentaAnual * 0.15); 
        totalTax += impuesto;
        
        let aportesAnuales = (apv + ahorroOtros) * 12;
        
        if (document.getElementById('check_apv').checked) {
            if (tipoAPV === 'A') {
                aportesAnuales += (apv * 12 * 0.15); 
            } else if (tipoAPV === 'B' && reinvierteB) {
                // Reinversión tributaria estimada del 25% del ahorro anual
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
                tension: 0.4
            }]
        },
        options: { 
            animation: false, // Vital para el PDF
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    btn.style.visibility = 'hidden'; 

    const opt = {
        margin: [10, 5],
        filename: 'InvestPro_Reporte.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
        btn.style.visibility = 'visible';
    });
                                                                     }
