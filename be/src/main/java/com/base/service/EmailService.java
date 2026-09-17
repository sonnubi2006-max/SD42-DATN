package com.base.service;

import com.base.dto.event.EmailMessage;

public interface EmailService {

    void send(EmailMessage message);
}