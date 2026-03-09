let myChart = null;

function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

function toggleReinversion() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    if(box) box.style.display = (tipo === 'B') ? 'flex' : 'none';
}

function ejecutarSimulacion() {
    // 1. CAPTURA DE INPUTS
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apvMensual = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion') ? document.getElementById('check_reinversion').checked : false;
    
    const ahorroOtros = (parseFloat(document.getElementById('inv_cl').value) || 0) + 
                        (parseFloat(document.getElementById('inv_us').value) || 0) + 
                        (parseFloat(document.getElementById('inv_mm').value) || 0);

    const horizonte = parseInt(document.getElementById('horizonte').value);
    const tasas = { 'A': 0.07, 'C': 0.05, 'E': 0.03 };
    const rAnual = tasas[document.getElementById('apv_fondo').value] || 0.05;
    const tipoAPV = document.getElementById('apv_tipo').value;

    // 2. VARIABLES DE SEGUIMIENTO
    let capital = inicial;
    let ahorroAcumuladoPuro = inicial; // DINERO REAL QUE SALE DE TU BOLSILLO
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    // 3. BUCLE DE SIMULACIÓN (AÑO A AÑO)
    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * rAnual;
        let impuesto = (rentaAnual * 0.15); 
        totalTax += impuesto;
        
        // Lo que tú efectivamente pones cada mes
        let aporteBolsilloAnual = (apvMensual + ahorroOtros) * 12;
        ahorroAcumuladoPuro += aporteBolsilloAnual;

        let inyeccionTotal = aporteBolsilloAnual;
        
        // Beneficios estatales (Dinero "Gratis")
        if (document.getElementById('check_apv').checked) {
            if (tipoAPV === 'A') {
                inyeccionTotal += (apvMensual * 12 * 0.15); 
            } else if (tipoAPV === 'B' && reinvierteB) {
                inyeccionTotal += (apvMensual * 12 * 0.25); // Estimación de devolución
            }
        }
        
        capital += inyeccionTotal + rentaAnual - impuesto;
        
        labels.push("Año " + i);
        data.push(Math.round(capital));

        if (i === 1 || i % 5 === 0 || i === horizonte) {
            tableBody += `<tr><td>Año ${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(rentaAnual).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    // 4. CÁLCULO DE EFICIENCIA (EL CORAZÓN DEL REPORTE)
    const gananciaTotal = capital - ahorroAcumuladoPuro;
    const ratioEficiencia = (ahorroAcumuladoPuro > 0) ? (gananciaTotal / ahorroAcumuladoPuro) * 100 : 0;

    // 5. ACTUALIZACIÓN DE LA INTERFAZ
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    
    // Aquí es donde corregimos el $0
    document.getElementById('res_ahorro_puro').innerText = `$${Math.round(ahorroAcumuladoPuro).toLocaleString()}`;
    document.getElementById('res_ganancia_neta').innerText = `$${Math.round(gananciaTotal).toLocaleString()}`;
    document.getElementById('musk-ratio').innerText = `🚀 Ratio de Ganancia: +${ratioEficiencia.toFixed(1)}% sobre tu capital invertido.`;

    document.querySelector("#tax-table tbody").innerHTML = tableBody;
    document.getElementById('fecha-reporte').innerText = "Simulación: " + new Date().toLocaleDateString();

    renderChart(labels, data);
    gestionarAlerta(sueldo, tipoAPV);
}

function gestionarAlerta(sueldo, tipoAPV) {
    const alerta = document.getElementById('alerta-regimen');
    if (!alerta) return;
    
    const convieneB = (sueldo > 4000000);
    alerta.style.display = 'block';
    
    if ((convieneB && tipoAPV === 'B') || (!convieneB && tipoAPV === 'A')) {
        alerta.innerHTML = `<strong>✅ ¡Excelente elección!</strong> El Régimen ${tipoAPV} es el óptimo para su renta de $${sueldo.toLocaleString()}.`;
        alerta.style.background = "#dbeafe";
        alerta.style.color = "#1e40af";
    } else {
        const sugerido = convieneB ? 'B' : 'A';
        alerta.innerHTML = `<strong>⚠️ Sugerencia:</strong> El Régimen ${sugerido} le otorgaría mejores beneficios fiscales.`;
        alerta.style.background = "#fff7ed";
        alerta.style.color = "#9a3412";
    }
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
            animation: false, 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '$' + v.toLocaleString() } } }
        }
    });
}

function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const chartBox = document.querySelector('.chart-box');
    const btn = document.querySelector('.btn-pdf');
    
    btn.style.display = 'none';
    chartBox.style.height = '380px'; 

    const opt = {
        margin: [10, 5],
        filename: 'Reporte_InvestPro_Final.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        chartBox.style.height = '250px';
        btn.style.display = 'block';
    });
        }
