package com.base.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadReviewMessage implements Serializable {

    private Long reviewImageId;
    private String tempFilePath;
    private String oldImageUrl;
    private ActionType action;

    public enum ActionType {
        CREATE,
        UPDATE,
        DELETE
    }
}
