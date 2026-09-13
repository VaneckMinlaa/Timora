package com.iusjc.timora.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Note: Cette entité représente la configuration du service email
 */
@Entity
@Table(name = "email_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailServiceEntity {

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

