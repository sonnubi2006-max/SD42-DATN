package com.base.queue;

import com.base.dto.event.EmailMessage;
import com.base.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = "${rabbitmq.queue.email}")
    public void handle(EmailMessage message) {
        try {
            emailService.send(message);
            log.info("Đã gửi email: to={}, type={}", message.getTo(), message.getType());
        } catch (Exception e) {

            log.error("Gửi email thất bại: to={}, type={}, error={}",
                    message.getTo(), message.getType(), e.getMessage());
            throw e;
        }
    }
}
