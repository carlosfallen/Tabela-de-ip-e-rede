document.addEventListener('DOMContentLoaded', async function () {
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');
    const filterSector = document.getElementById('filterSector');
    const filterStatus = document.getElementById('filterStatus');
    const ipTable = document.getElementById('ipTable');
    const saveButton = document.getElementById('saveButton'); // Botão de salvar

    // Função para filtrar a tabela
    function filterTable() {
        const searchText = searchInput.value.toLowerCase();
        const selectedType = filterType.value;
        const selectedSector = filterSector.value;
        const selectedStatus = filterStatus.value;
        const rows = ipTable.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            const ip = cells[0].textContent.toLowerCase();
            const name = cells[1].textContent.toLowerCase();
            const type = cells[2].textContent;
            const sector = cells[3].textContent;
            const status = cells[4].textContent;

            let matchesSearch = ip.includes(searchText) || name.includes(searchText);
            let matchesType = selectedType === "" || type === selectedType;
            let matchesSector = selectedSector === "" || sector === selectedSector;
            let matchesStatus = selectedStatus === "" || status === selectedStatus;

            if (matchesSearch && matchesType && matchesSector && matchesStatus) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }

    searchInput.addEventListener('input', filterTable);
    filterType.addEventListener('change', filterTable);
    filterSector.addEventListener('change', filterTable);
    filterStatus.addEventListener('change', filterTable);

    async function loadCSVData() {
        const loadingScreen = document.getElementById('loadingScreen');
        const table = document.querySelector('table');
        const all = document.getElementById('all');
        loadingScreen.style.display = 'flex';

        try {
            const response = await fetch('/data');
            const data = await response.json();

            const tableBody = document.getElementById('ipTable');
            tableBody.innerHTML = '';

            data.forEach(item => {
                const row = document.createElement('tr');

                let typeClass = '';
                if (item.Tipo === 'Computador') {
                    typeClass = 'computador';
                } else if (item.Tipo === 'Impressora') {
                    typeClass = 'impressora';
                } else if (item.Tipo === 'Roteador') {
                    typeClass = 'roteador';
                }else if (item.Tipo === 'Busca Preço') {
                    typeClass = 'Busca Preço';
                }else if (item.Tipo === 'Balança') {
                    typeClass = 'Balança';
                }
                

                row.className = typeClass;

                const statusClass = item.Status === 'Sim' ? 'sim' : 'nao';

                row.innerHTML = `
                    <td><a href="http://${item.IP}">${item.IP}</a></td>
                    <td contenteditable="true">${item.Nome || ''}</td>
                    <td contenteditable="true">${item.Tipo || ''}</td>
                    <td contenteditable="true">${item.Setor || ''}</td>
                    <td class="${statusClass}">${item.Status || ''}</td>
                `;
                tableBody.appendChild(row);
            });

            setTimeout(() => {
                table.classList.add('table-show');
                loadingScreen.style.display = 'none';
                loadingScreen.classList.add('hide');
                table.style.opacity = 1;
                table.style.display = 'table';
                all.style.opacity = 1;
                all.style.display = 'all'; 
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1000);
            }, 1000);

            filterTable();
        } catch (error) {
            console.error('Error loading CSV data:', error);
        }
    }

    async function updateStatus() {
        try {
            while (true) {
                const response = await fetch('/status');
                const data = await response.json();

                const tableBody = document.getElementById('ipTable');
                const rows = tableBody.querySelectorAll('tr');

                data.forEach(updatedItem => {
                    const row = Array.from(rows).find(row => row.cells[0].textContent === updatedItem.IP);
                    if (row) {
                        const statusCell = row.cells[4];
                        const statusClass = updatedItem.Status === 'Sim' ? 'sim' : 'nao';
                        statusCell.textContent = updatedItem.Status;
                        statusCell.className = statusClass;
                    }
                });

                // Atualizar a cada 1 segundos
                await new Promise(resolve => setTimeout(resolve, 6000000));
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    async function saveChanges() {
        const table = document.getElementById('ipTable');
        const rows = table.querySelectorAll('tr');
        const data = Array.from(rows).map(row => ({
            IP: row.cells[0].textContent,
            Nome: row.cells[1].textContent,
            Tipo: row.cells[2].textContent,
            Setor: row.cells[3].textContent,
            Status: row.cells[4].textContent,
        }));
    
        try {
            const response = await fetch('/update-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data })
            });
    
            const result = await response.json();
            if (result.success) {
                alert('Alterações salvas com sucesso!');
            } else {
                alert('Erro ao salvar as alterações.');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
        }
    }    

    saveButton.addEventListener('click', saveChanges);

    // Carregar os dados do CSV e iniciar a atualização do status
    window.onload = async () => {
        document.getElementById('loadingScreen').style.display = 'flex';
        await loadCSVData();
        updateStatus();
    };
});
