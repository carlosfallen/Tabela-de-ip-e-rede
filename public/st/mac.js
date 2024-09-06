const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const WebSocket = require('ws');
const xml2js = require('xml2js');  // Adicionando xml2js para análise de XML

const app = express();
const port = 444;

let lastScanTime = 0;
const scanInterval = 300000; // 5 minutos em milissegundos
let cachedDevices = null;

// Função para executar o Nmap e obter os dados dos dispositivos
function scanNetwork() {
    return new Promise((resolve, reject) => {
        exec('nmap -T4 -sn 10.0.11.0/24 -oX -', (error, stdout, stderr) => {
            if (error) {
                console.error(`Exec error: ${error}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                reject(stderr);
                return;
            }
            resolve(stdout);
        });
    });
}

// Função para executar o NBTSTAT e obter os nomes dos hosts
function getHostNames() {
    const ips = Array.from({ length: 256 }, (_, i) => `10.0.11.${i}`);
    const promises = ips.map(ip => 
        new Promise((resolve, reject) => {
            exec(`nbtstat -A ${ip}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Exec error for IP ${ip}: ${error}`);
                    resolve({ ip, name: 'Desconhecido' });  // Resolve com valor padrão em caso de erro
                    return;
                }
                if (stderr) {
                    console.error(`stderr for IP ${ip}: ${stderr}`);
                }

                // Processar a saída para obter os nomes dos hosts
                const lines = stdout.split('\n');
                let name = 'Desconhecido';  // Valor padrão para IPs sem resposta

                for (const line of lines) {
                    if (line.includes('EXCLUSIVO')) {
                        // Extrai o nome da linha
                        const parts = line.trim().split(/\s+/);
                        name = parts[0];  // O nome do host está na primeira coluna
                        break;  // Para garantir que pegamos apenas o primeiro nome válido
                    }
                }

                resolve({ ip, name });
            });
        })
    );

    return Promise.all(promises).then(results => {
        // Inclui todos os IPs, mesmo aqueles sem dados
        const hostnames = {};
        for (const ip of ips) {
            hostnames[ip] = 'Desconhecido';
        }

        results.forEach(({ ip, name }) => {
            hostnames[ip] = name;
        });

        return hostnames;
    });
}

// Função para converter XML do Nmap para JSON e integrar com nomes do NBTSTAT
async function parseNmapOutput(output) {
    const parser = new xml2js.Parser();
    const hostnames = await getHostNames();  // Obter nomes dos hosts

    return new Promise((resolve, reject) => {
        parser.parseString(output, (err, result) => {
            if (err) {
                reject(err);
                return;
            }

            const hosts = result.nmaprun && result.nmaprun.host ? result.nmaprun.host : [];
            const devices = Array.from({ length: 256 }, (_, i) => {
                const ip = `10.0.11.${i}`;
                const host = hosts.find(host => {
                    return host.address && host.address.some(addr => addr.$.addr === ip);
                });
                const mac = host && host.address ? 
                    host.address.find(addr => addr.$.addrtype === 'mac')?.$.addr : 'Desconhecido';
                const vendor = host && host.address ? 
                    host.address.find(addr => addr.$.addrtype === 'mac')?.$.vendor : 'Desconhecido';
                const hostname = hostnames[ip] || 'Desconhecido';

                return {
                    IP: ip,
                    Nome: hostname,
                    MAC: mac,
                    Fabricante: vendor,
                    Ligado: host ? 'Sim' : 'Não'
                };
            });

            resolve(devices);
        });
    });
}

// Rota para obter os dados dos dispositivos
app.get('/data', async (req, res) => {
    try {
        const currentTime = new Date().getTime();
        if (cachedDevices && (currentTime - lastScanTime) < scanInterval) {
            // Retorna dados em cache se o intervalo for menor que o intervalo de varredura
            res.json(cachedDevices);
        } else {
            const nmapOutput = await scanNetwork();
            const devices = await parseNmapOutput(nmapOutput);
            cachedDevices = devices;  // Atualiza o cache
            lastScanTime = currentTime;  // Atualiza o tempo do último escaneamento
            res.json(devices);
        }
    } catch (error) {
        console.error(`Erro ao obter dados dos dispositivos: ${error}`);
        res.status(500).send('Erro ao obter dados dos dispositivos');
    }
});

// Servir arquivos estáticos da pasta 'public'
app.use(express.static('public'));

// Rota para servir a página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Configurar WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('Cliente conectado');

    const sendDevices = async () => {
        try {
            const currentTime = new Date().getTime();
            if (cachedDevices && (currentTime - lastScanTime) < scanInterval) {
                // Retorna dados em cache se o intervalo for menor que o intervalo de varredura
                ws.send(JSON.stringify(cachedDevices));
            } else {
                const nmapOutput = await scanNetwork();
                const devices = await parseNmapOutput(nmapOutput);
                cachedDevices = devices;  // Atualiza o cache
                lastScanTime = currentTime;  // Atualiza o tempo do último escaneamento
                ws.send(JSON.stringify(devices));
            }
        } catch (error) {
            console.error(`Erro ao obter dados dos dispositivos: ${error}`);
        }
    };

    sendDevices();
    setInterval(sendDevices, scanInterval);  // Atualiza a cada 5 minutos
});
