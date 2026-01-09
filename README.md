# Spring-mini

## How to deploy on docker


## Fix list: 


Thêm 1 mục db là content trong nộp bài để chú thích thêm

Hiển thị tổng điểm đã đạt được trong 1 course của user 

## Deploy (trước)


## Thêm feature (sau): 

Ảnh người dùng
- Add trong JPA entity thêm một image data type

Ảnh nền course
- Add trong JPA entity thêm 1 image data type

Admin monitor GUI: 
- Số user truy cập, course truy cập nhiều nhất, số file upload, số query chạy - của từng API. 

Tạo thêm phần course content: 
- Cho phép upload file lecture, video hướng dẫn? 

Authentication
- Cho phép người dùng link email / gmail, facebook, ... vào và có thể điền nhanh thông tin (username ấy từ email, tuổi, ảnh đại diện, ...)


Phần tạo các câu hỏi trắc nghiệm ngắn và trả lời
- tạo thêm entity câu trắc nghiệm 
    - Tương tự assignment. 
- hiển thị form tạo câu hỏi trắc nghiệm 
- hiển thị các câu hỏi trắc nghiệm, sau khi điền hết hiển thị trang thống kê điểm

Mục thảo luận
- Tạo thêm entity message board
    - Message board bao gồm: 


# Cách dùng dev environment: 

DB là trên docker, src ở trên localhost
```
./dev.sh infra
./dev.sh local:backend 
./dev.sh local:frontend
```

Dùng tất cả docker
```
./dev.sh full
```

Backend trên docker, frontend trên localhost
```
./dev.sh backend
./dev.sh local:frontend
```