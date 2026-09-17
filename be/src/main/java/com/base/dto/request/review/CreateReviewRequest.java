package com.base.dto.request.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateReviewRequest {

    @NotNull(message = "Mã sản phẩm đã mua không được để trống")
    private Long orderDetailId;

    @NotNull(message = "Số sao không được để trống")
    @Min(value = 1, message = "Đánh giá từ 1 đến 5 sao")
    @Max(value = 5, message = "Đánh giá từ 1 đến 5 sao")
    private Integer rating;

    @Size(max = 1000, message = "Nội dung đánh giá tối đa 1000 ký tự")
    private String comment;

    private String sizeFeedback;
}