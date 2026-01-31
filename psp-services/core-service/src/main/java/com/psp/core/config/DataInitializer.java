package com.psp.core.config;

import com.psp.core.model.User;
import com.psp.core.model.User.Role;
import com.psp.core.repository.MerchantRepository;
import com.psp.core.repository.UserRepository;
import com.psp.core.security.PasswordHasher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Data initializer for core service
 * Creates default Super Admin account on startup
 * PCI DSS 8.1 - Default admin account creation
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private MerchantRepository merchantRepository;

    @Autowired
    private UserRepository userRepository;

    @Value("${admin.default.username:superadmin}")
    private String defaultAdminUsername;

    @Value("${admin.default.email:admin@psp.local}")
    private String defaultAdminEmail;

    @Value("${admin.default.password:Admin@123456}")
    private String defaultAdminPassword;

    private final PasswordHasher passwordHasher = new PasswordHasher();

    @Override
    public void run(String... args) throws Exception {
        initializeSuperAdmin();
        
        System.out.println("--------------------------------------------");
        System.out.println("✅ PSP Core Service Started");
        System.out.println("📝 Register merchants at: POST /merchants/register");
        System.out.println("🔐 Auth endpoints at: POST /auth/login, /auth/register");
        System.out.println("👤 Default Super Admin: " + defaultAdminUsername);
        System.out.println("--------------------------------------------");
    }

    /**
     * Initialize default Super Admin account if not exists
     */
    private void initializeSuperAdmin() {
        if (!userRepository.existsByUsername(defaultAdminUsername)) {
            User superAdmin = new User();
            superAdmin.setUsername(defaultAdminUsername);
            superAdmin.setEmail(defaultAdminEmail);
            superAdmin.setPassword(passwordHasher.hash(defaultAdminPassword));
            superAdmin.setRole(Role.SUPER_ADMIN);
            superAdmin.setFirstName("Super");
            superAdmin.setLastName("Admin");
            superAdmin.setIsActive(true);
            superAdmin.setFailedLoginAttempts(0);
            
            userRepository.save(superAdmin);
            System.out.println("✅ Default Super Admin account created");
            System.out.println("   Username: " + defaultAdminUsername);
            System.out.println("   Email: " + defaultAdminEmail);
            System.out.println("   ⚠️ CHANGE PASSWORD IN PRODUCTION!");
        } else {
            System.out.println("✅ Super Admin account already exists");
        }
    }
}