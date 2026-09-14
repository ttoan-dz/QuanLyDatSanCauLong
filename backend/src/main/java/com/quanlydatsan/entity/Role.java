package com.quanlydatsan.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "Role")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaRole")
    private Integer maRole;

    @Column(name = "TenRole", nullable = false, unique = true, length = 50)
    private String tenRole;
}

