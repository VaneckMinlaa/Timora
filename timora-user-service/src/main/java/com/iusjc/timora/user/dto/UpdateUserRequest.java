package com.iusjc.timora.user.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO pour la mise à jour d'un utilisateur
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(min = 2, max = 50, message = "Le prénom doit contenir entre 2 et 50 caractères")
    private String firstName;

    @Size(min = 2, max = 50, message = "Le nom doit contenir entre 2 et 50 caractères")
    private String lastName;

    private String phone;

    private String department;

    @Size(max = 15728640, message = "La photo de profil ne doit pas dépasser 10 Mo")  
    private String profilePicture;  

    private List<String> schools;
}

