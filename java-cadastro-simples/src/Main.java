import java.util.ArrayList;
import java.util.Scanner;

/**
 * Programa de console, bem simples, que simula um pedacinho do sistema de
 * assistência técnica: cadastrar clientes, cadastrar equipamentos e abrir
 * ordens de serviço.
 *
 * IMPORTANTE: este programa é independente do sistema principal (Python +
 * React + PostgreSQL). Ele guarda os dados só na MEMÓRIA, então quando você
 * fecha o programa, os dados somem. Isso é de propósito: o objetivo aqui é
 * praticar POO (classes, objetos, encapsulamento) sem precisar aprender
 * banco de dados em Java ao mesmo tempo.
 */
public class Main {

    // As três "listas" que guardam os dados enquanto o programa está aberto.
    private static ArrayList<Cliente> clientes = new ArrayList<>();
    private static ArrayList<Equipamento> equipamentos = new ArrayList<>();
    private static ArrayList<OrdemServico> ordens = new ArrayList<>();
    private static int proximoNumeroOS = 1;

    public static void main(String[] args) {
        Scanner teclado = new Scanner(System.in);
        boolean continuar = true;

        while (continuar) {
            mostrarMenu();
            String opcao = teclado.nextLine().trim();

            switch (opcao) {
                case "1":
                    cadastrarCliente(teclado);
                    break;
                case "2":
                    listarClientes();
                    break;
                case "3":
                    cadastrarEquipamento(teclado);
                    break;
                case "4":
                    listarEquipamentos();
                    break;
                case "5":
                    abrirOrdemServico(teclado);
                    break;
                case "6":
                    listarOrdensServico();
                    break;
                case "7":
                    alterarStatusOrdem(teclado);
                    break;
                case "0":
                    continuar = false;
                    break;
                default:
                    System.out.println("Opção inválida, tente novamente.");
            }
        }

        System.out.println("Encerrando. Até mais!");
        teclado.close();
    }

    private static void mostrarMenu() {
        System.out.println();
        System.out.println("===== Assistência Técnica (versão simples em Java) =====");
        System.out.println("1 - Cadastrar cliente");
        System.out.println("2 - Listar clientes");
        System.out.println("3 - Cadastrar equipamento");
        System.out.println("4 - Listar equipamentos");
        System.out.println("5 - Abrir ordem de serviço");
        System.out.println("6 - Listar ordens de serviço");
        System.out.println("7 - Alterar status de uma ordem de serviço");
        System.out.println("0 - Sair");
        System.out.print("Escolha uma opção: ");
    }

    // ---------- Clientes ----------

    private static void cadastrarCliente(Scanner teclado) {
        System.out.print("Nome do cliente: ");
        String nome = teclado.nextLine();
        System.out.print("Telefone: ");
        String telefone = teclado.nextLine();
        System.out.print("E-mail: ");
        String email = teclado.nextLine();

        Cliente cliente = new Cliente(nome, telefone, email);
        clientes.add(cliente);
        System.out.println("Cliente cadastrado com sucesso!");
    }

    private static void listarClientes() {
        if (clientes.isEmpty()) {
            System.out.println("Nenhum cliente cadastrado ainda.");
            return;
        }
        System.out.println("--- Clientes cadastrados ---");
        for (int i = 0; i < clientes.size(); i++) {
            System.out.println((i + 1) + ") " + clientes.get(i));
        }
    }

    // ---------- Equipamentos ----------

    private static void cadastrarEquipamento(Scanner teclado) {
        if (clientes.isEmpty()) {
            System.out.println("Cadastre um cliente primeiro (opção 1).");
            return;
        }
        listarClientes();
        System.out.print("Digite o número do cliente dono do equipamento: ");
        int indiceCliente = lerNumeroInteiro(teclado) - 1;
        if (indiceCliente < 0 || indiceCliente >= clientes.size()) {
            System.out.println("Cliente inválido.");
            return;
        }

        System.out.print("Tipo (Notebook/Computador): ");
        String tipo = teclado.nextLine();
        System.out.print("Marca: ");
        String marca = teclado.nextLine();
        System.out.print("Modelo: ");
        String modelo = teclado.nextLine();

        Cliente dono = clientes.get(indiceCliente);
        Equipamento equipamento = new Equipamento(tipo, marca, modelo, dono);
        equipamentos.add(equipamento);
        System.out.println("Equipamento cadastrado com sucesso!");
    }

    private static void listarEquipamentos() {
        if (equipamentos.isEmpty()) {
            System.out.println("Nenhum equipamento cadastrado ainda.");
            return;
        }
        System.out.println("--- Equipamentos cadastrados ---");
        for (int i = 0; i < equipamentos.size(); i++) {
            System.out.println((i + 1) + ") " + equipamentos.get(i));
        }
    }

    // ---------- Ordens de serviço ----------

    private static void abrirOrdemServico(Scanner teclado) {
        if (equipamentos.isEmpty()) {
            System.out.println("Cadastre um equipamento primeiro (opção 3).");
            return;
        }
        listarEquipamentos();
        System.out.print("Digite o número do equipamento: ");
        int indiceEquipamento = lerNumeroInteiro(teclado) - 1;
        if (indiceEquipamento < 0 || indiceEquipamento >= equipamentos.size()) {
            System.out.println("Equipamento inválido.");
            return;
        }

        System.out.print("Descreva o problema relatado: ");
        String problema = teclado.nextLine();

        Equipamento equipamento = equipamentos.get(indiceEquipamento);
        OrdemServico ordem = new OrdemServico(proximoNumeroOS, equipamento, problema);
        ordens.add(ordem);
        proximoNumeroOS++;
        System.out.println("Ordem de serviço aberta com sucesso! Número: " + ordem.getNumero());
    }

    private static void listarOrdensServico() {
        if (ordens.isEmpty()) {
            System.out.println("Nenhuma ordem de serviço cadastrada ainda.");
            return;
        }
        System.out.println("--- Ordens de serviço ---");
        for (OrdemServico ordem : ordens) {
            System.out.println(ordem);
        }
    }

    private static void alterarStatusOrdem(Scanner teclado) {
        if (ordens.isEmpty()) {
            System.out.println("Nenhuma ordem de serviço cadastrada ainda.");
            return;
        }
        listarOrdensServico();
        System.out.print("Digite o número da OS que deseja alterar: ");
        int numeroDigitado = lerNumeroInteiro(teclado);

        OrdemServico ordemEncontrada = null;
        for (OrdemServico ordem : ordens) {
            if (ordem.getNumero() == numeroDigitado) {
                ordemEncontrada = ordem;
                break;
            }
        }

        if (ordemEncontrada == null) {
            System.out.println("Nenhuma OS encontrada com esse número.");
            return;
        }

        System.out.println("Novo status (Aberta / Em andamento / Concluída): ");
        String novoStatus = teclado.nextLine();
        ordemEncontrada.setStatus(novoStatus);
        System.out.println("Status atualizado!");
    }

    // ---------- Auxiliar ----------

    // Lê um número digitado pelo usuário. Se a pessoa digitar algo que não é
    // número, devolve -1 para não travar o programa.
    private static int lerNumeroInteiro(Scanner teclado) {
        String texto = teclado.nextLine();
        try {
            return Integer.parseInt(texto.trim());
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}
