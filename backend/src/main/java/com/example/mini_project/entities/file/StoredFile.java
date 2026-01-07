package com.example.mini_project.entities.file;

import java.time.LocalDateTime;

public interface StoredFile {
    void setS3Key(String s3Key);
    void setOriginalFilename(String filename);
    void setContentType(String contentType);
    void setFileSize(Long size);
    void setUploadedAt(LocalDateTime time);
}
