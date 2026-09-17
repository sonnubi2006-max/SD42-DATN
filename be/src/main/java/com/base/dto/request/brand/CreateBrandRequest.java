package com.base.dto.request.brand;

import com.base.enums.BrandStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CreateBrandRequest {
    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(
            min = 2,
            max = 100,
            message = "Tên thương hiệu phải từ 2 đến 100 ký tự"
    )
    private String brandName;

    private BrandStatus brandStatus;

    @NotNull(message = "Ảnh không được để trống")
    private MultipartFile file;
}