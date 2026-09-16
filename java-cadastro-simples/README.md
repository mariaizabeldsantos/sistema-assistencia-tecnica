# Módulo Java - Cadastro simples (versão básica)

Programa de **console em Java**, bem simples, que simula um pedacinho do
sistema de assistência técnica: cadastrar clientes, cadastrar equipamentos
e abrir ordens de serviço.

Este módulo é **independente** do sistema principal (Python + React +
PostgreSQL) - ele guarda os dados só na **memória** enquanto o programa
está rodando. Quando você fecha o programa, os dados somem. Isso é de
propósito: aqui o objetivo é praticar classes e objetos, sem misturar
com banco de dados.

## Pré-requisitos

Só o **JDK** instalado (não precisa de Maven, nem de nada mais). Confirme com:

```bash
java -version
javac -version
```

## Como rodar

```bash
cd java-cadastro-simples/src
javac *.java
java Main
```

O primeiro comando (`javac`) **compila** os arquivos `.java` (transforma
o código-fonte em algo que o computador entende). O segundo (`java Main`)
**executa** o programa, começando pela classe `Main`.

Você verá um menu no terminal:

```
===== Assistência Técnica (versão simples em Java) =====
1 - Cadastrar cliente
2 - Listar clientes
3 - Cadastrar equipamento
4 - Listar equipamentos
5 - Abrir ordem de serviço
6 - Listar ordens de serviço
7 - Alterar status de uma ordem de serviço
0 - Sair
```

## Estrutura do código

```
src/
├── Main.java            → menu de console (ponto de entrada do programa)
├── Cliente.java          → classe simples (nome, telefone, email)
├── Equipamento.java       → classe simples que "tem um" Cliente
└── OrdemServico.java      → classe simples que "tem um" Equipamento
```

Não tem pacotes (`package`), não tem pastas dentro de `src/` - os 4
arquivos ficam soltos, lado a lado, porque é o jeito mais simples de
organizar um programa pequeno em Java.

## O que estudar para apresentar

### Conceitos de POO usados

1. **Classe e objeto** - `Cliente`, `Equipamento` e `OrdemServico` são
   classes; quando o programa executa `new Cliente(...)`, cria-se um
   **objeto** (uma instância) daquela classe.

2. **Encapsulamento** - os atributos de cada classe são `private`
   (ex.: `private String nome;` em `Cliente`). Ninguém de fora da classe
   consegue mexer neles diretamente - só através dos métodos `getNome()`
   e `setNome(...)`. Isso protege os dados de alterações indevidas.

3. **Construtor** - o método especial com o mesmo nome da classe (ex.:
   `public Cliente(String nome, String telefone, String email)`), que
   roda automaticamente toda vez que um objeto novo é criado com `new`.

4. **Composição** ("tem um") - `Equipamento` guarda um `Cliente` dentro
   dele (`private Cliente dono;`), e `OrdemServico` guarda um
   `Equipamento`. Isso é diferente de herança ("é um"): aqui uma classe
   simplesmente contém outra como um dos seus atributos.

5. **`toString()`** - cada classe sobrescreve esse método (`@Override`)
   para dizer como ela deve aparecer quando for impressa com
   `System.out.println(objeto)`.

### O que NÃO tem neste código (de propósito)

Nada de herança, classes abstratas, interfaces ou polimorfismo - isso é
assunto mais avançado de POO, que costuma vir depois do que já foi visto
até agora. Também não tem conexão com banco de dados (isso é assunto de
Lab de Banco de Dados, tratado no sistema principal em Python).

### Perguntas que o professor pode fazer

- Por que os atributos das classes são `private`?
- O que acontece quando eu chamo `new Cliente(...)`?
- Qual a diferença entre o atributo `dono` (dentro de `Equipamento`) e uma
  herança?
- Por que os dados somem quando o programa fecha?
- O que faz o `ArrayList`? Por que não usar um vetor comum (`Cliente[]`)?
  *(Resposta simples: `ArrayList` cresce sozinho conforme você adiciona
  itens; um vetor comum tem tamanho fixo, definido na criação.)*
