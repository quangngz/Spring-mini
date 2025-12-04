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

    List<User> findByFirstName(String firstName);
    List<User> findByLastName(String lastName);
    List<User> findByFirstNameAndLastName(String firstName, String lastName);

    List<User> findByPhoneNum(String phoneNum);
    List<User> findByFirstNameAndPhoneNum(String firstName, String phoneNum);
    List<User> findByLastNameAndPhoneNum(String lastName, String phoneNum);
    List<User> findByFirstNameAndLastNameAndPhoneNum(String firstName, String lastName, String phoneNum);

    List<User> findByAddress(String address);
    List<User> findByFirstNameAndAddress(String firstName, String address);
    List<User> findByLastNameAndAddress(String lastName, String address);
    List<User> findByFirstNameAndLastNameAndAddress(String firstName, String lastName, String address);
    List<User> findByPhoneNumAndAddress(String phoneNum, String address);
    List<User> findByFirstNameAndPhoneNumAndAddress(String firstName, String phoneNum, String address);
    List<User> findByLastNameAndPhoneNumAndAddress(String lastName, String phoneNum, String address);
    List<User> findByFirstNameAndLastNameAndPhoneNumAndAddress(String firstName, String lastName, String phoneNum, String address);

    List<User> findByDobBetween(LocalDate begin, LocalDate end);
    @Query("SELECT u FROM User u WHERE u.address LIKE %:cityName%")
    List<User> findByCity(@Param("cityName") String cityName);
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
