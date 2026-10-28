/**
 * Representa um cliente da assistência técnica.
 *
 * Ideia de POO usada aqui: ENCAPSULAMENTO.
 * Os atributos (nome, telefone, email) são "private" — ninguém de fora
 * desta classe pode mexer neles diretamente. Para ler ou alterar, é
 * preciso usar os métodos "getX()" e "setX()".
 */
public class Cliente {

    private String nome;
    private String telefone;
    private String email;

    public Cliente(String nome, String telefone, String email) {
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    // Diz para o Java "quando alguém imprimir este objeto (System.out.println),
    // mostre este texto em vez de algo tipo Cliente@1a2b3c".
    @Override
    public String toString() {
        return "Nome: " + nome + " | Telefone: " + telefone + " | E-mail: " + email;
    }
}