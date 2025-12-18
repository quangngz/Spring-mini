package com.example.mini_project.entities.usercourse;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.io.Serializable;

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
    @Column(name = "user_id")
    private Long userId;

    @EqualsAndHashCode.Include
    @Column(name = "course_id")
    private Long courseId;
}
