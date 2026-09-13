package com.iusjc.timora.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entité EmailService 
 * Note: Cette entité représente la configuration du service email
 */
@Entity
@Table(name = "email_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailService {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String serveurSMTP;  

    @Column(nullable = false)
    private Integer port;  

    @Column(nullable = false)
    private String destinataire;  

}

