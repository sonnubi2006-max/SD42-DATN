package com.base.service.impl;

import com.base.exception.BadRequestException;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder}")
    private String folder;

    public String uploadImage(MultipartFile file) {
        return uploadImageWithMetadata(file).url();
    }

    public UploadedImage uploadImageWithMetadata(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            "use_filename", true,
                            "unique_filename", true
                    )
            );
            String url = result.get("secure_url").toString();
            String publicId = result.get("public_id").toString();
            log.info("Uploaded image to Cloudinary: {}", url);
            return new UploadedImage(url, publicId);
        } catch (IOException e) {
            log.error("Upload image failed: {}", e.getMessage());
            throw new BadRequestException("Không thể tải ảnh lên hệ thống lưu trữ");
        }
    }

    public String uploadFromPath(String filePath) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                throw new BadRequestException("Không tìm thấy tệp tạm để tải lên");
            }

            Map<?, ?> result = cloudinary.uploader().upload(
                    file,
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image",
                            "use_filename", true,
                            "unique_filename", true
                    )
            );
            String url = result.get("secure_url").toString();
            log.info("Uploaded from path to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Upload from path failed: {}", e.getMessage());
            throw new BadRequestException("Không thể tải tệp lên hệ thống lưu trữ");
        }
    }

    public String updateImage(MultipartFile file, String oldImageUrl) {
        deleteImage(oldImageUrl);
        return uploadImage(file);
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;

        if (!imageUrl.contains("cloudinary.com")) {
            log.debug("Skipping delete for non-Cloudinary URL: {}", imageUrl);
            return;
        }

        try {
            String publicId = extractPublicId(imageUrl);
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted image from Cloudinary: publicId={}, result={}", publicId, result.get("result"));
        } catch (IOException e) {
            log.error("Delete image failed for url={}: {}", imageUrl, e.getMessage());
        }
    }

    public void deleteByPublicId(String publicId) {
        if (publicId == null || publicId.isBlank()) return;
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted image from Cloudinary: publicId={}, result={}", publicId, result.get("result"));
        } catch (IOException e) {
            log.error("Delete image failed for publicId={}: {}", publicId, e.getMessage());
        }
    }

    private String extractPublicId(String imageUrl) {
        try {
            String marker = "/upload/";
            int uploadIndex = imageUrl.indexOf(marker);
            if (uploadIndex == -1) {
                throw new IllegalArgumentException("Đường dẫn ảnh Cloudinary không hợp lệ");
            }

            String afterUpload = imageUrl.substring(uploadIndex + marker.length());

            if (afterUpload.matches("v\\d+/.*")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
            }

            int dotIndex = afterUpload.lastIndexOf('.');
            if (dotIndex != -1) {
                afterUpload = afterUpload.substring(0, dotIndex);
            }

            return afterUpload;

        } catch (Exception e) {
            log.error("Cannot extract public_id from URL: {}", imageUrl);
            throw new BadRequestException("Đường dẫn ảnh không đúng định dạng");
        }
    }

    public record UploadedImage(String url, String publicId) {
    }
}
