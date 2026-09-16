/**
 * Representa uma ordem de serviço bem simplificada: número, o equipamento
 * relacionado, o problema relatado e um status em texto.
 *
 * Assim como Equipamento "tem um" Cliente, esta classe "tem um" Equipamento.
 */
public class OrdemServico {

    private int numero;
    private Equipamento equipamento;
    private String problema;
    private String status; // "Aberta", "Em andamento" ou "Concluída"

    public OrdemServico(int numero, Equipamento equipamento, String problema) {
        this.numero = numero;
        this.equipamento = equipamento;
        this.problema = problema;
        this.status = "Aberta"; // toda OS nova começa como "Aberta"
    }

    public int getNumero() {
        return numero;
    }

    public Equipamento getEquipamento() {
        return equipamento;
    }

    public String getProblema() {
        return problema;
    }

    public void setProblema(String problema) {
        this.problema = problema;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "OS #" + numero
                + " | Cliente: " + equipamento.getDono().getNome()
                + " | Equipamento: " + equipamento.getMarca() + " " + equipamento.getModelo()
                + " | Problema: " + problema
                + " | Status: " + status;
    }
}
