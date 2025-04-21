package com.example.api.controller;

import com.example.api.dto.RegisterRequest;
import com.example.api.dto.LoginRequest;
import com.example.api.model.User;
import com.example.api.service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import com.example.api.service.EmailService;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;
    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            User user = userService.registerUser(
                    registerRequest.getFullName(),
                    registerRequest.getEmail(),
                    registerRequest.getPassword(),
                    registerRequest.getPhone(),
                    registerRequest.getAddress());

            user.setIsActive(false);
            userService.saveUser(user);

            emailService.sendActivationEmail(user.getEmail(), user.getUserid());

            return ResponseEntity.ok("Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/activate")
    public ResponseEntity<String> activateAccount(@RequestParam Long userId) {
        try {
            userService.activateUser(userId);
            return ResponseEntity.ok("Tài khoản đã được kích hoạt thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            Map<String, Object> response = userService.loginUserWithRole(
                    loginRequest.getEmail(),
                    loginRequest.getPassword());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestParam String email) {
        try {
            userService.sendPasswordResetEmail(email);
            return ResponseEntity.ok("Email đặt lại mật khẩu đã được gửi.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            Long userId = Long.parseLong(request.get("userId"));
            String newPassword = request.get("newPassword");
            userService.resetPassword(userId, newPassword);
            return ResponseEntity.ok("Mật khẩu đã được đặt lại thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            userService.changePassword(email, currentPassword, newPassword);
            return ResponseEntity.ok("Mật khẩu đã được thay đổi thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }


    @GetMapping("/check-auth")
    public ResponseEntity<?> checkAuthentication() {
        // Get the current authenticated user
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        if (principal != null && !principal.equals("anonymousUser")) {
            return ResponseEntity.ok(Map.of("authenticated", true, "user", principal));
        } else {
            return ResponseEntity.ok(Map.of("authenticated", false));
        }
    }




    @GetMapping("/user-info")
    public ResponseEntity<?> getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        User user = userService.findUserByEmail(email);
        if (user == null) {
            return ResponseEntity.badRequest().body("User not found");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("email", user.getEmail());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRoles().stream()
                .map(role -> role.getRoleName())
                .collect(Collectors.joining(",")));
        
        return ResponseEntity.ok(response);
    }



}
