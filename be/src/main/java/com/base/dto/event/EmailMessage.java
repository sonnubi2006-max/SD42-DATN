package com.base.dto.event;

import com.base.enums.EmailType;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailMessage {

    private String to;

    private String recipientName;

    private EmailType type;

    private Map<String, Object> data;
}
