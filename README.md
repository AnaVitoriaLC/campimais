# Campi+

Frontend demonstrativo do Campi+, feito com HTML, CSS e JavaScript sem bibliotecas externas.

## Como abrir

Extraia o ZIP e abra `index.html` no navegador. Para desenvolvimento, também pode iniciar um servidor local na pasta: `python -m http.server 8000`.

## Páginas

- Início e pesquisa do catálogo.
- Locais, equipamentos e serviços, com páginas de detalhe.
- Ocorrências, formulário de sinalização, confirmação e acompanhamento.
- Entrar, criar conta e visualizar perfil.

## Conta demonstrativa

O cadastro e o login simulam o fluxo no próprio navegador. Para testar, crie uma conta com nome, e-mail e senha (mínimo de seis caracteres) e depois saia para testar o login. Os dados ficam no `localStorage` deste navegador. Não há envio de dados a um servidor; por isso, não use senhas reais.

## Limites do protótipo

Não há backend, banco de dados compartilhado, autenticação real, recuperação de senha ou integração institucional. As ocorrências e a conta de demonstração ficam salvas localmente no navegador.
