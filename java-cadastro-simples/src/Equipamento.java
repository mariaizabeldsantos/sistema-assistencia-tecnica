/**
 * Representa um equipamento (notebook ou computador) trazido por um cliente.
 *
 * Repare que esta classe GUARDA um objeto Cliente dentro dela (atributo
 * "dono"). Isso é chamado de COMPOSIÇÃO: um Equipamento "tem um" Cliente.
 * É a forma mais simples de duas classes trabalharem juntas em POO.
 */
public class Equipamento {

    private String tipo;    // "Notebook" ou "Computador"
    private String marca;
    private String modelo;
    private Cliente dono;

    public Equipamento(String tipo, String marca, String modelo, Cliente dono) {
        this.tipo = tipo;
        this.marca = marca;
        this.modelo = modelo;
        this.dono = dono;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public Cliente getDono() {
        return dono;
    }

    public void setDono(Cliente dono) {
        this.dono = dono;
    }

    @Override
    public String toString() {
        return tipo + " " + marca + " " + modelo + " (dono: " + dono.getNome() + ")";
    }
}
