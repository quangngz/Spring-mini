package com.example.mini_project.repositories;

import com.example.mini_project.entities.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends CrudRepository<User, Integer> {
    // Tính tuổi trên ngày sinh chỉ sử dụng được cho H2
    Optional<User> findByUserName(String userName);

    @Query("SELECT u FROM User u WHERE " +
            "(:firstName IS NULL OR u.firstName = :firstName) AND " +
            "(:lastName IS NULL OR u.lastName = :lastName) AND " +
            "(:address IS NULL OR u.address = :address) AND " +
            "(:phoneNum IS NULL OR u.phoneNum = :phoneNum) AND " +
            "((:start IS NULL AND :end IS NULL) OR u.dob BETWEEN :start AND :end) AND " +
            "(:cityName IS NUlL OR u.address LIKE %:cityName%)" )
    List<User> searchByCustom(@Param("firstName") String firstName, @Param("lastName") String lastName,
                              @Param("address") String address, @Param("phoneNum") String phoneNum,
                              @Param("cityName") String cityName,
                              @Param("start") LocalDate start, @Param("end") LocalDate end);
}
