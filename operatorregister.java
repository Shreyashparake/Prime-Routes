import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class OperatorRegistration {
    public static void main(String[] args) {
        // JDBC connection parameters
        String url = "jdbc:mysql://127.0.0.1:3306/prime_routes";
        String user = "root";
        String password = "root";

        // Sample operator data
        String companyName = "Example Travels";
        String ownerName = "Shreyash Parake";
        String email = "shreyash@example.com";
        String phone = "9967064043";
        String operatorPassword = "securepass";
        String address = "123 Main Street, Mumbai";
        String bankAccount = "1234567890";
        String ifscCode = "SBIN0001234";
        int fleetSize = 10;

        // SQL Insert statement
        String sql = "INSERT INTO operators " +
                     "(company_name, owner_name, email, phone, password, address, bank_account, ifsc_code, fleet_size) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            // Set values for placeholders
            pstmt.setString(1, companyName);
            pstmt.setString(2, ownerName);
            pstmt.setString(3, email);
            pstmt.setString(4, phone);
            pstmt.setString(5, operatorPassword);
            pstmt.setString(6, address);
            pstmt.setString(7, bankAccount);
            pstmt.setString(8, ifscCode);
            pstmt.setInt(9, fleetSize);

            // Execute the insert
            int rowsAffected = pstmt.executeUpdate();
            System.out.println("✅ Operator registered successfully! Rows affected: " + rowsAffected);

        } catch (SQLException e) {
            System.out.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
