let myChart = null;

// Inicialización
window.onload = () => {
    actualizarInterfazAPV();
    // Forzamos actualización de etiquetas de texto al inicio
    const checks = ['check_reinversion', 'rec_cl', 'rec_us', 'rec_mm'];
    checks.forEach(id => {
        const el = document.getElementById(id);
        if(el) updateCheckLabel(el);
    });
};

function updateCheckLabel(el) {
    const labelId = el.id === 'check_reinversion' ? 'label_reinv' : 'label_' + el.id;
    const label = document.getElementById(labelId);
    if(label) {
        const baseText = el.id === 'check_reinversion' ? " (¿Reinvierte lo ahorrado en impuesto?)" : " (Recurrente)";
        label.innerText = el.checked ? "SI" + baseText : "NO" + baseText;
        label.style.color = el.checked ? "#1e40af" : "#64748b";
    }
}

function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

function actualizarInterfazAPV() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    // Error A corregido: Desaparece en RegA, aparece en RegB
    box.style.display = (tipo === 'B') ? 'block' : 'none';
}

function limpiarCampos() {
    // Error B corregido: Reload garantiza que todo vuelve al estado inicial perfecto
    location.reload(); 
}

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    const apvMensual = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const reinvierteB = document.getElementById('check_reinversion').checked;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const rAnual = { 'A': 0.07, 'C': 0.05, 'E': 0.03 }[document.getElementById('apv_fondo').value] || 0.05;
    const tipoAPV = document.getElementById('apv_tipo').value;

    let capital = inicial;
    let acumuladoBolsillo = inicial;
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * rAnual;
        let impuesto = (rentaAnual * 0.15);
        totalTax += impuesto;

        let otrosAnual = 0;
        const activos = [
            { id: 'inv_cl', rec: 'rec_cl' },
            { id: 'inv_us', rec: 'rec_us' },
            { id: 'inv_mm', rec: 'rec_mm' }
        ];

        activos.forEach(a => {
            let valor = parseFloat(document.getElementById(a.id).value) || 0;
            let esRecurrente = document.getElementById(a.rec).checked;
            if (esRecurrente || i === 1) otrosAnual += (valor * 12);
        });

        let aporteBolsillo = (apvMensual * 12) + otrosAnual;
        acumuladoBolsillo += aporteBolsillo;

        let inyeccionTotal = aporteBolsillo;
        if (document.getElementById('check_apv').checked) {
            if (tipoAPV === 'A') inyeccionTotal += (apvMensual * 12 * 0.15);
            if (tipoAPV === 'B' && reinvierteB) inyeccionTotal += (apvMensual * 12 * 0.25);
        }

        capital += inyeccionTotal + rentaAnual - impuesto;
        labels.push("Año " + i);
        data.push(Math.round(capital));
        
        if (i === 1 || i % 5 === 0 || i === horizonte) {
            tableBody += `<tr><td>Año ${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(rentaAnual).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    // Error F Corregido: Actualizar todos los campos
    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.getElementById('res_ahorro_puro').innerText = `$${Math.round(acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('res_ganancia_neta').innerText = `$${Math.round(capital - acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('musk-ratio').innerText = `🚀 Eficiencia: +${((capital - acumuladoBolsillo)/acumuladoBolsillo*100).toFixed(1)}% sobre capital propio.`;
    document.querySelector("#tax-table tbody").innerHTML = tableBody;
    document.getElementById('fecha-reporte').innerText = "Simulación: " + new Date().toLocaleDateString();

    // Error E: Gestionar Alerta de Régimen
    gestionarAlerta(sueldo, tipoAPV);
    
    // Error C: Renderizar gráfico
    renderChart(labels, data);
}

function gestionarAlerta(sueldo, tipo) {
    const alerta = document.getElementById('alerta-regimen');
    alerta.style.display = 'block';
    const convieneB = (sueldo > 4000000);
    
    if ((convieneB && tipo === 'B') || (!convieneB && tipo === 'A')) {
        alerta.className = "alerta-box alerta-success";
        alerta.innerHTML = `✅ <strong>¡Excelente elección!</strong> El Régimen ${tipo} es el óptimo para su renta de $${sueldo.toLocaleString()}.`;
    } else {
        alerta.className = "alerta-box alerta-warning";
        const sugerido = convieneB ? 'B' : 'A';
        alerta.innerHTML = `⚠️ <strong>Sugerencia:</strong> El Régimen ${sugerido} sería más eficiente para su nivel de renta.`;
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
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { 
            animation: false, 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// Error D Corregido: PDF con retardo de seguridad
function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    btn.style.visibility = 'hidden';

    setTimeout(() => {
        html2pdf().set({
            margin: 5,
            filename: 'Reporte_InvestPro_v7.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save().then(() => {
            btn.style.visibility = 'visible';
        });
    }, 1200); // 1.2 segundos para asegurar renderizado total
}
