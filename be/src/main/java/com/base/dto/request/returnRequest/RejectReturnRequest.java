package com.base.dto.request.returnRequest;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectReturnRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String rejectReason;
}
