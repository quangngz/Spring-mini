package com.example.mini_project.entities;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name="USER_NAME", unique = true)
    private String username;

    @NotNull
    @Column(name="FIRST_NAME")
    private String firstname;

    @NotNull
    @Column(name="LAST_NAME")
    private String lastname;

    @NotNull
    @Size(min=10, max=10)
    @Column(name="PHONE_NUM")
    private String phoneNum;

    @NotNull
    @Column(name="ADDRESS")
    private String address;


    @DateTimeFormat
    @Column(name="DOB")
    private LocalDate dob;

    @Column(name="ROLE")
    private Set<String> role = new HashSet<>();

    @NotNull
    @Column(name="PASSWORD")
    private String password;

    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (role == null || role.isEmpty()) {
            role = new HashSet<>();
            role.add("ROLE_USER"); // your default
        }
        return role.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    /**
     * Nếu muôn add Role từ get thì phải map từ GrantedAuthority qua String
     * @param insertRole
     */
    public void addRole(String insertRole) {
        if (insertRole == null || insertRole.isBlank()) return;
        if (role == null) role = new HashSet<>();
        if (!insertRole.startsWith("ROLE_")) {
            insertRole = "ROLE_" + insertRole.toUpperCase();
        }
        role.add(insertRole);
    }

}
