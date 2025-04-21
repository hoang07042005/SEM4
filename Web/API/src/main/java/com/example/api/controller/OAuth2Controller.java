package com.example.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/oauth2")
public class OAuth2Controller {

    @GetMapping("/google")
    public String googleLogin() {
        // This endpoint is just for documentation purposes
        // The actual OAuth2 login flow is handled by Spring Security
        return "Redirecting to Google login...";
    }
}