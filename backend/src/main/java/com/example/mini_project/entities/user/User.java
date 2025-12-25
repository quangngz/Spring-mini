package com.example.mini_project.entities.user;
import com.example.mini_project.entities.usercourse.UserCourse;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name="users")
@EqualsAndHashCode
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name="USERNAME", unique = true)
    private String username;

    @NotNull
    @Column(name="PASSWORD")
    private String password;

    @Column(name="FIRST_NAME")
    private String firstname;

    @Column(name="LAST_NAME")
    private String lastname;

    @Column(name="PHONE_NUM")
    private String phoneNum;

    @Column(name="ADDRESS")
    private String address;


    @DateTimeFormat
    @Column(name="DOB")
    private LocalDate dob;

    // Map roles properly as a collection of strings
    // EAGER is preferred here because roles are needed when building authorities
    // during authentication, which often happens outside of an open JPA session.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<String> role = new HashSet<>();


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<UserCourse> courses = new HashSet<>();

    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<String> effectiveRoles = (role == null || role.isEmpty())
                ? Set.of("ROLE_USER")
                : role.stream()
                      .map(this::normalizeRole)
                      .collect(Collectors.toSet());
        return effectiveRoles.stream()
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
        role.add(normalizeRole(insertRole));
    }

    /**
     * Helper function giúp quản lí role về 1 format
     * @param rawRole
     * @return
     */
    private String normalizeRole(String rawRole) {
        String trimmed = rawRole == null ? "" : rawRole.trim().toUpperCase();
        return trimmed.startsWith("ROLE_") ? trimmed : "ROLE_" + trimmed;
    }
}

