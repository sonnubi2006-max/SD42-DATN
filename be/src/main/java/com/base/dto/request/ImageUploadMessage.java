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
public class ImageUploadMessage implements Serializable {

    private Long id;
    private String table;
    private String tempFilePath;
    private String oldImageUrl;
    private ActionType action;

    public enum ActionType {
        CREATE_BRAND,
        UPDATE_BRAND,
        DELETE_BRAND,
        CREATE_REVIEW,
        UPDATE_REVIEW,
        DELETE_REVIEW,
        CREATE_CONVERSATION,
        UPDATE_CONVERSATION,
        DELETE_CONVERSATION,

        CREATE_CHAT,
        UPDATE_CHAT,
        DELETE_CHAT,
        CREATE_BANNER,
        UPDATE_BANNER,
        DELETE_BANNER,
        CREATE_PRODUCT,
        UPDATE_PRODUCT,
        DELETE_PRODUCT,
        CREATE_USER,
        UPDATE_USER,
        DELETE_USER,
        CREATE_CUSTOMER,
        UPDATE_CUSTOMER,
        DELETE_CUSTOMER,
        CREATE_EXCHANGE_DELIVERY_EVIDENCE,
        DELETE
    }
}
