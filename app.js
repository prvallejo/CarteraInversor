let myChart = null;

// Al cargar, inicializamos etiquetas
window.onload = () => {
    actualizarInterfazAPV();
    document.querySelectorAll('input[type="checkbox"]').forEach(updateCheckLabel);
};

function updateCheckLabel(el) {
    const labelId = el.id === 'check_reinversion' ? 'label_reinv' : 'label_' + el.id;
    const label = document.getElementById(labelId);
    if(label) {
        label.innerText = el.checked ? "SI" : "NO";
        label.style.color = el.checked ? "#1e40af" : "#64748b";
    }
}

function toggleBox(id, el) {
    document.getElementById(id).style.display = el.checked ? 'block' : 'none';
}

function actualizarInterfazAPV() {
    const tipo = document.getElementById('apv_tipo').value;
    const box = document.getElementById('box_reinversion');
    // Si es RegA, desaparece completamente
    box.style.display = (tipo === 'B') ? 'flex' : 'none';
}

function limpiarCampos() {
    location.reload(); // La forma más limpia de resetear gráfico y valores
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
            let recurrente = document.getElementById(a.rec).checked;
            if (recurrente || i === 1) otrosAnual += (valor * 12);
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

    document.getElementById('res_total').innerText = `$${Math.round(capital).toLocaleString()}`;
    document.getElementById('res_retiro').innerText = `$${Math.round((capital * 0.04) / 12).toLocaleString()}`;
    document.getElementById('res_tax').innerText = `$${Math.round(totalTax).toLocaleString()}`;
    document.getElementById('res_ahorro_puro').innerText = `$${Math.round(acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('res_ganancia_neta').innerText = `$${Math.round(capital - acumuladoBolsillo).toLocaleString()}`;
    document.getElementById('musk-ratio').innerText = `🚀 Eficiencia: +${((capital - acumuladoBolsillo)/acumuladoBolsillo*100).toFixed(1)}% sobre capital propio.`;
    document.querySelector("#tax-table tbody").innerHTML = tableBody;
    document.getElementById('fecha-reporte').innerText = "Simulación: " + new Date().toLocaleDateString();

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
                label: 'Crecimiento',
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

function exportarPDF() {
    const element = document.getElementById('pdf-content');
    const btn = document.querySelector('.btn-pdf');
    btn.style.visibility = 'hidden';

    // Aumentamos el tiempo de espera a 1 segundo para asegurar el render
    setTimeout(() => {
        const opt = {
            margin: 5,
            filename: 'Reporte_Patrimonial_v7.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save().then(() => {
            btn.style.visibility = 'visible';
        });
    }, 1000);
            }
