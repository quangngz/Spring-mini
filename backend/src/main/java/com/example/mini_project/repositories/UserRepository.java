package com.example.mini_project.repositories;

import com.example.mini_project.entities.user.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends CrudRepository<User, Integer> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Optional<User> findById(Long id);
    @Query("SELECT u FROM User u WHERE " +
            "(:firstname IS NULL OR u.firstname = :firstname) AND " +
            "(:lastname IS NULL OR u.lastname = :lastname) AND " +
            "(:address IS NULL OR u.address = :address) AND " +
            "(:phoneNum IS NULL OR u.phoneNum = :phoneNum) AND " +
            "((:start IS NULL AND :end IS NULL) OR u.dob BETWEEN :start AND :end) AND " +
            "(:cityname IS NUlL OR u.address LIKE %:cityname%)" )
    List<User> searchByCustom(
            @Param("firstname") String firstname, @Param("lastname") String lastname,
                              @Param("address") String address, @Param("phoneNum") String phoneNum,
                              @Param("cityname") String cityname,
                              @Param("start") LocalDate start, @Param("end") LocalDate end);
}
