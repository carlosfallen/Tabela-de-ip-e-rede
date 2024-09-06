document.addEventListener('DOMContentLoaded', () => {
    // Função para carregar dados e atualizar a tabela
    const loadTableData = async (url, tableId) => {
        try {
            const response = await fetch(url);
            const data = await response.json();

            const tableBody = document.querySelector(`#${tableId} tbody`);
            tableBody.innerHTML = '';

            data.forEach(item => {
                const row = document.createElement('tr');
                Object.values(item).forEach(value => {
                    const cell = document.createElement('td');
                    cell.textContent = value;
                    row.appendChild(cell);
                });
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading table data:', error);
        }
    };

    // Carregar dados para cada tabela
    loadTableData('/api/wifi-senha', 'wifiSenhaTable');
    loadTableData('/api/login-senha', 'loginSenhaTable');
    loadTableData('/api/fabricante-mac', 'fabricanteMacTable');
});
