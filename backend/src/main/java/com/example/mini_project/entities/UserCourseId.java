package com.example.mini_project.entities;

import jakarta.persistence.Embeddable;

import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class UserCourseId implements Serializable {

    @EqualsAndHashCode.Include
    private Long userId;

    @EqualsAndHashCode.Include
    private Long courseId;
}
