	using (true)
	with check (true);
# Controle Financeiro da Clínica

npm run electron-build

Aplicativo local para controlar entradas e saídas mensais da clínica, incluindo parcelamentos automáticos, relatórios e backup em JSON.

## Como usar

1. Execute `npm install` uma vez.
2. Abra o aplicativo com `npm start`.
3. Escolha o mês no topo da tela.
4. Cadastre uma entrada ou saída.
5. Selecione uma ou mais categorias para cada movimento. O valor continua sendo contabilizado uma única vez, mesmo quando o lançamento tem várias categorias.
6. Para uma movimentação parcelada, marque "Parcelado" e informe o número de parcelas. O valor total será contabilizado no mês da venda, sem adicionar valores aos meses seguintes. Para reunir parcelas de um parcelamento antigo, edite uma delas, marque "Adiantamento" e salve; o sistema reúne os valores e remove as demais parcelas do grupo.
7. Para um item mensal de valor fixo, marque "Recorrente" e informe por quantos meses ele deve ser lançado (12 meses por padrão).

Os lançamentos e as categorias personalizadas são salvos automaticamente no armazenamento local da instalação do aplicativo. Eles continuam disponíveis quando o aplicativo é fechado e aberto novamente.

## Android

O aplicativo Android é gerado a partir da mesma interface web usando Capacitor. Para preparar o projeto nativo uma vez, com o Android Studio, o Android SDK e o JDK 21 instalados, execute:

```bash
npm install
npm run android:setup
```

Para gerar um APK de depuração instalável:

```bash
npm run android:build
```

O arquivo será criado em `android/app/build/outputs/apk/debug/app-debug.apk`. Para atualizar o APK após mudanças na interface, execute novamente `npm run android:build`. No Android, a opção "Exportar dados" abre o compartilhamento do sistema para salvar ou enviar o arquivo de backup.

## Backup

Use "Exportar dados" para gerar um arquivo JSON e guarde-o em um local seguro. Para restaurar dados, use "Importar dados" e selecione um backup gerado pelo sistema. Backups antigos com uma única categoria por movimento continuam compatíveis.

## Pagamentos e relatórios

Nos lançamentos, informe a forma de pagamento. Para entradas no cartão de crédito ou débito, informe a taxa percentual cobrada pela operadora; os relatórios e o saldo consideram o valor líquido e também mostram o total das taxas. O relatório detalhado pode ser filtrado por categoria, status e tipo de movimento (entradas, saídas ou ambos).

Para lançar uma saída por boleto, selecione "Boleto", informe o valor original e o vencimento. Se a data do lançamento for posterior ao vencimento, informe também o "Valor atualizado após vencimento". O sistema calcula automaticamente os juros/multas pela diferença entre os valores e os discrimina nos relatórios do mês do pagamento, além do resumo anual.

É possível anexar imagens ou arquivos PDF de até 12 MB como comprovante. As imagens são compactadas e os arquivos são armazenados localmente no banco do aplicativo; os backups exportados incluem os comprovantes e os restauram durante a importação.

O relatório detalhado oferece opções diária e semanal. Selecione uma data de referência; o período semanal considera de segunda-feira a domingo.
