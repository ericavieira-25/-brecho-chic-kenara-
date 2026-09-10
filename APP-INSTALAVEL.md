# App instalável Chic Kenara

O mesmo site pode ser instalado pelo navegador, sem cadastro em loja de aplicativos. Abra https://brecho-chic-kenara.vercel.app e use “Instalar app Chic Kenara” no rodapé.

- Android: Chrome, menu “Instalar app” ou “Adicionar à tela inicial”.
- iPhone/iPad: Safari, Compartilhar, “Adicionar à Tela de Início”.
- Computador: opção de instalação do Chrome ou Edge.

A disponibilidade e o texto da opção dependem do navegador. A confirmação de instalação é feita pela pessoa no dispositivo.

O app usa o mesmo banco e as mesmas contas. Catálogo, preços, pedidos e pagamentos exigem internet. O service worker armazena somente uma página genérica de aviso offline, sem guardar respostas da API, dados de clientes ou páginas de pedidos. Pedidos não são enfileirados offline.

O ícone CK é um monograma em fundo vinho, com versões PNG de 180, 192 e 512 pixels. O manifest usa modo standalone. A instalação não adiciona notificações push nem publica o app na Google Play ou App Store.

Referência de instalação: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
