# Revisão funcional — 09/09/2026

Revisão local com contas fictícias e backend isolado. Os pedidos reais não foram alterados pelos testes. As alterações não foram publicadas.

## Cobertura confirmada no navegador

- Busca com Ctrl/Cmd+K, foco, navegação com Tab e fechamento com Escape; busca dentro do catálogo atualiza a URL e os resultados.
- Categoria, detalhes da peça, favoritos (adicionar/remover), carrinho, retorno ao carrinho após login e validação de login vazio.
- Checkout com peça única, PIX copia e cola, aviso de pagamento e edição de perfil.
- Administração: confirmação de recebimento e cancelamento de pedido por diálogo na página; totais atualizados.
- Produtos: editar, salvar com campos opcionais vazios, persistir após recarregar, cancelar edição, cancelar exclusão e confirmar exclusão. Navegação para cadastro e painel corrigida.
- Repasses: marcar pago, voltar a pendente, repasse por fornecedora e reversão individual nos detalhes.
- Conta de fornecedora: login, perfil e atalho para painel; produtos e vendas vinculados à fornecedora apareceram corretamente, sem informações privadas de clientes.
- Celular: menu abre e fecha com Escape; produtos, repasses e detalhes da fornecedora sem transbordamento horizontal da página. Tabela de repasses rola internamente.

## Correções desta retomada

- Edição falhava ao chamar trim em marca/descrição nulas. Campos opcionais agora são normalizados.
- Tags do formulário agora persistem no PostgreSQL.
- Inputs sem ID agora recebem associação automática entre rótulo e campo.
- Produtos vendidos/reservados têm status explícito; edição bloqueada na interface e na API.
- Tabela financeira do painel agora inclui somente pedidos pagos.
- Repasse exibia NaN no valor da venda e data com um dia a menos. Ambos corrigidos.
- Estilos ausentes dos repasses foram implementados, incluindo adaptação ao celular.
- Diálogos receberam nomes acessíveis correspondentes ao título.

## Verificação automática

- `npm test`: 15 testes passaram.
- `npm run build`: passou após as últimas alterações.
- Integração PostgreSQL: cadastro, sessão, permissões, criação/edição de produto, tags, checkout, reserva, confirmação PIX e exclusão passaram. Edição de peça reservada/vendida é rejeitada. Transação revertida ao terminar.
- Lint sem erros; ainda há avisos de organização de componentes e efeitos React.

## Limites e verificações ainda necessárias

- Não é uma certificação de todos os botões em todos os estados. Os cenários pendentes de foto e filtros foram executados em 10/09, conforme abaixo; não houve teste exaustivo de todas as combinações possíveis.
- WhatsApp/Instagram: destinos inspecionados; nenhuma mensagem enviada.
- PIX depende de conferência manual pela administradora; não há conciliação bancária automática.
- Repasses são registros locais do navegador; não fazem transferência bancária nem sincronizam entre dispositivos.
- Cadastro de fornecedoras ainda vem de uma lista estática com contatos de exemplo; revisar os contatos antes de uso operacional.
- Mudanças de backend exigem reiniciar a API local ou publicar a nova versão para entrar em vigor fora do ambiente isolado.

## Complemento — 10/09/2026

- Corrigido seletor de foto oculto pelo CSS. Arquivo de texto rejeitado, imagem acima de 2 MB rejeitada e imagem SVG válida carregada na prévia.
- Cadastro com imagem concluído; imagem persistiu após recarregar o catálogo e apareceu corretamente nos detalhes da peça.
- Busca por tag combinada com categoria, tamanho e conservação retornou a peça esperada. Combinação incompatível mostrou zero produtos; limpar filtros restaurou a lista e limpou a URL.
- Ordenações menor preço, maior preço, maior desconto e mais recentes verificadas com produtos fictícios de preços distintos.
- Corrigida ausência dos tamanhos 34, 42 e 44 no filtro. Catálogo agora utiliza a mesma lista de tamanhos do cadastro.
- Após as alterações, 15 testes automatizados e compilação passaram. Dados de teste mantidos exclusivamente na transação isolada, encerrada ao finalizar.
