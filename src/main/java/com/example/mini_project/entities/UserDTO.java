package com.example.mini_project.entities;

public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String userName;
    private String phoneNum;
    private String address;
    private String role;

    public UserDTO(Long id, String firstName, String lastName, String userName,
                   String phoneNum, String address, String role) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.userName = userName;
        this.phoneNum = phoneNum;
        this.address = address;
        this.role = role;
    }

    // getters only (no setters needed unless you want mutability)
    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getUserName() { return userName; }
    public String getPhoneNum() { return phoneNum; }
    public String getAddress() { return address; }
    public String getRole() { return role; }
}