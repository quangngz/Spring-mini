package com.example.mini_project.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class UploadPdfService {

    private final S3Service s3Service;

    public UploadPdfService(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @Cacheable(value = "file_pdf", key = "#s3Key")
    public byte[] loadPdfBytes(String s3Key) {
        // This log only appears on CACHE MISS (actual S3 fetch)
        log.info("CACHE MISS - Fetching PDF from S3: {}", s3Key);
        try (InputStream is = s3Service.downloadFile(s3Key)) {
            return is.readAllBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to load PDF", e);
        }
    }

    @CacheEvict(
            value = "file_pdf",
            key = "#s3Key"
    )
    public void deleteFile(String s3Key) {
        log.info("CACHE EVICT - Removing cached PDF: {}", s3Key);
        s3Service.deleteObject(s3Key);
    }
}
