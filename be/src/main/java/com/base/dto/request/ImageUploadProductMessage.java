package com.base.dto.request;

import lombok.*;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadProductMessage implements Serializable {

    private Long imageId;
    private Long variantId;
    private String tempFilePath;
    private String oldImageUrl;
    private ActionType action;

    public enum ActionType {
        CREATE,
        UPDATE,
        DELETE
    }
}
