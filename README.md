# Tabela de IP e Rede

Este projeto é uma aplicação web para gerenciamento de endereços IP e dispositivos de rede, desenvolvida com **HTML**, **CSS**, **JavaScript** e **Node.js**. Ele permite visualizar, adicionar e gerenciar dispositivos na rede local.

## Funcionalidades

- Adição e visualização de IPs e dispositivos.
- Banco de dados local utilizando **SQLite**.
- Servidor **Node.js** para gerenciar as requisições.

## Tecnologias

- **Node.js**: Servidor backend.
- **SQLite**: Banco de dados local.
- **HTML/CSS/JavaScript**: Frontend da aplicação.

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/carlosfallen/Tabela-de-ip-e-rede.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. **Observação**: O servidor está configurado para rodar na porta 80. Caso deseje mudar a porta, edite o arquivo `servidor.js`.

4. Execute o servidor:
   ```bash
   node servidor.js
   ```

5. Acesse a aplicação no navegador:
   ```
   http://localhost:80
   ```

## Estrutura do Projeto

- **public/**: Contém os arquivos estáticos da aplicação, como **HTML**, **CSS** e **JavaScript**.
  - **/st**: Subpasta que contém scripts essenciais para funcionalidades específicas, incluindo:
    - **mac.js**: Script responsável pela manipulação e validação de endereços MAC, garantindo o correto formato dos dados antes do processamento.

- **servidor.js**: Gerencia as requisições e respostas do servidor utilizando **Node.js**.
- **database.db**: Banco de dados **SQLite** que armazena as informações de IPs e dispositivos.

## Observações Finais

- **Alterações Recentes**: Houve mudanças recentes na forma de armazenamento dos dados. Portanto, pode haver problemas com o funcionamento da seção `st`, que lida com o **mac.js** e informações mais detalhadas dos dispositivos.
- **Dependências**: Algumas bibliotecas necessárias para o funcionamento do projeto não estão disponíveis no **npm**. Certifique-se de verificar e instalar manualmente.
```
