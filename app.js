let myChart = null;

window.onload = () => {
    actualizarInterfazAPV();
    document.querySelectorAll('input[type="checkbox"]').forEach(updateCheckLabel);
};

function updateCheckLabel(el) {
    const label = document.getElementById('label_' + el.id) || document.getElementById('label_reinv');
    if (!label) return;

    if (el.id === 'check_reinversion') {
        label.innerText = el.checked ? "SI - Reinviertes ahorro en impuesto" : "NO - Ahorrado libre disposición 🤣👌";
    } else {
        label.innerText = el.checked ? "SI - Recurrente" : "NO - Única vez";
    }
    label.style.color = el.checked ? "#1e40af" : "#64748b";
}

function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

function actualizarInterfazAPV() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    if (box) box.style.display = (tipo === 'B') ? 'block' : 'none';
}

function limpiarCampos() {
    location.reload(); 
}

function ejecutarSimulacion() {
    const sueldo = parseFloat(document.getElementById('sueldo').value) || 0;
    const apvMensual = document.getElementById('check_apv').checked ? (parseFloat(document.getElementById('apv_monto').value) || 0) : 0;
    const tipoAPV = document.getElementById('apv_tipo').value;
    const reinvierteB = document.getElementById('check_reinversion').checked;
    const horizonte = parseInt(document.getElementById('horizonte').value);
    const inicial = document.getElementById('check_monto').checked ? (parseFloat(document.getElementById('monto_inicial').value) || 0) : 0;
    
    let capital = inicial;
    let totalTax = 0;
    let labels = [];
    let data = [];
    let tableBody = "";

    for (let i = 1; i <= horizonte; i++) {
        let rentaAnual = capital * 0.05; 
        let impuesto = rentaAnual * 0.15;
        totalTax += impuesto;

        let otrosAnual = 0;
        ['cl', 'us', 'mm'].forEach(key => {
            let val = parseFloat(document.getElementById('inv_'+key).value) || 0;
            let esRec = document.getElementById('rec_'+key).checked;
            if (esRec || i === 1) otrosAnual += (val * 12);
        });

        let inyeccion = (apvMensual * 12) + otrosAnual;
        if (tipoAPV === 'A') inyeccion += (apvMensual * 12 * 0.15);
        if (tipoAPV === 'B' && reinvierteB) inyeccion += (apvMensual * 12 * 0.30); // Estimación ahorro tax

        capital += inyeccion + rentaAnual - impuesto;
        labels.push("Año " + i);
        data.push(Math.round(capital));

        if (i === 1 || i % 5 === 0 || i === horizonte) {
            tableBody += `<tr><td>Año ${i}</td><td>$${Math.round(capital).toLocaleString()}</td><td>$${Math.round(rentaAnual).toLocaleString()}</td><td>$${Math.round(impuesto).toLocaleString()}</td></tr>`;
        }
    }

    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04)/12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.querySelector("#tax-table tbody").innerHTML = tableBody;

    // Alerta de Régimen (Error E anterior solucionado)
    const alerta = document.getElementById('alerta-regimen');
    alerta.style.display = 'block';
    const convieneB = sueldo > 4000000;
    if ((convieneB && tipoAPV === 'B') || (!convieneB && tipoAPV === 'A')) {
        alerta.className = "alerta-box alerta-success";
        alerta.innerHTML = `✅ <strong>¡Correcto!</strong> El Régimen ${tipoAPV} es el más adecuado para su renta de $${sueldo.toLocaleString()}.`;
    } else {
        alerta.className = "alerta-box alerta-warning";
        alerta.innerHTML = `⚠️ <strong>Sugerencia:</strong> El Régimen ${convieneB ? 'B' : 'A'} es el más adecuado para su renta de $${sueldo.toLocaleString()}.`;
    }

    renderChart(labels, data);
}

function renderChart(labels, data) {
    const ctx = document.getElementById('projectionChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{ data: data, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 }]
        },
        options: { animation: false, responsive: true, maintainAspectRatio: false }
    });
}

function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    btn.style.visibility = 'hidden';

    // Aumentamos el delay para asegurar que el PDF capture la alerta y el gráfico
    setTimeout(() => {
        html2pdf().set({
            margin: 5,
            filename: 'InvestPro_Final_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save().then(() => {
            btn.style.visibility = 'visible';
        });
    }, 1000);
                         }
