package com.example.api.service;

import com.example.api.model.Role;
import com.example.api.model.User;
import com.example.api.repository.RoleRepository;
import com.example.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class OAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        // Extract user info from Google account
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        
        // Check if user exists
        User user = userRepository.findByEmail(email);
        
        // If user doesn't exist, create a new user
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFullName(name);
            user.setIsActive(true); // Auto-activate Google users
            
            // Set default role
            Set<Role> roles = new HashSet<>();
            Role userRole = roleRepository.findByRoleName("USER");
            if (userRole == null) {
                userRole = new Role();
                userRole.setRoleName("USER");
                roleRepository.save(userRole);
            }
            roles.add(userRole);
            user.setRoles(roles);
            
            userRepository.save(user);
        }
        
        return oAuth2User;
    }
}
