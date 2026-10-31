# Regras de Negócio - MVP Otis

## RN01 - Registro de ocorrências

O sistema vai permitir cadastrar problemas que acontecem nos elevadores, facilitando o acompanhamento de cada ocorrência.

Cada registro precisa ter as seguintes informações:

- ID da ocorrência
- ID do elevador
- Tipo de problema
- Descrição do que aconteceu
- Gravidade do problema
- Data e horário
- Status da ocorrência

## RN02 - Problemas que podem ocorrer

Vamos ter uma base de dados com os principais problemas que podem acontecer nos elevadores, separados por categorias para facilitar a identificação.

### Problemas mecânicos
- Vibração excessiva
- Barulhos fora do normal
- Elevador parando desnivelado
- Defeito no mecanismo das portas

### Problemas elétricos
- Falta de energia
- Curto-circuito
- Defeito no painel de controle
- Problemas nos sensores

### Problemas de funcionamento
- Elevador parado entre andares
- Portas que não abrem
- Portas que não fecham
- Botões que não funcionam
- Elevador que não responde às chamadas

### Problemas de segurança
- Pessoas presas no elevador
- Problemas na comunicação de emergência
- Alarme que não funciona
- Falha nos sensores de obstáculos das portas

## RN03 - Gravidade dos problemas

Os problemas vão ser classificados de acordo com a gravidade:

- **Baixa:** problemas pequenos que não atrapalham muito o funcionamento.
- **Média:** problemas que dificultam o uso normal do elevador.
- **Alta:** problemas mais sérios que precisam de atenção rápida da manutenção.
- **Crítica:** situações que podem colocar a segurança das pessoas em risco.

## RN04 - Status das ocorrências

Para acompanhar o andamento de cada problema, vamos utilizar quatro status:

- **Aberta:** o problema foi registrado, mas ainda não foi analisado.
- **Em análise:** o problema está sendo verificado.
- **Em manutenção:** a equipe responsável está trabalhando para resolver o problema.
- **Resolvida:** o problema foi solucionado.

## RN05 - Histórico de problemas

O sistema vai guardar as ocorrências anteriores de cada elevador. Assim, será possível consultar quais problemas já aconteceram e verificar se algum defeito está se repetindo.

## RN06 - Banco de dados

Vamos utilizar um banco de dados para guardar as informações necessárias para o funcionamento do sistema, como:

- Elevadores cadastrados
- Tipos de problemas
- Ocorrências registradas
- Status de cada ocorrência
- Histórico das atualizações

## RN07 - Segurança

Problemas que possam colocar passageiros em risco terão prioridade no sistema e deverão ser encaminhados para a equipe responsável.

Em situações mais graves, como pessoas presas ou falhas que comprometam a segurança, a ocorrência será classificada como crítica.

Qualquer manutenção ou intervenção no elevador deverá ser realizada por profissionais autorizados.