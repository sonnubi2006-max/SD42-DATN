package com.base.queue;

import com.base.dto.event.EmailMessage;
import com.base.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpConnectException;
import org.springframework.amqp.AmqpIOException;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Component
@RequiredArgsConstructor
@Slf4j
public class EmailProducer {

    private final AmqpTemplate amqpTemplate;
    private final EmailService emailService;

    @Value("${rabbitmq.exchange.email}")
    private String emailExchange;

    @Value("${rabbitmq.routing-key.email}")
    private String emailRoutingKey;

    public void sendAfterCommit(EmailMessage message) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            send(message);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    send(message);
                } catch (RuntimeException ex) {

                    log.error("Không thể gửi email sau commit: to={}, type={}, error={}",
                            message.getTo(), message.getType(), ex.getMessage(), ex);
                }
            }
        });
    }

    public void send(EmailMessage message) {
        try {
            amqpTemplate.convertAndSend(emailExchange, emailRoutingKey, message);
            log.info("Queued email message: to={}, type={}",
                    message.getTo(), message.getType());

        } catch (AmqpConnectException | AmqpIOException e) {
            log.warn("RabbitMQ unavailable, gửi email đồng bộ. Reason: {}",
                    e.getMessage());
            try {
                emailService.send(message);
            } catch (Exception ex) {
                log.error("Gửi email đồng bộ thất bại: to={}, type={}, error={}",
                        message.getTo(), message.getType(), ex.getMessage());
            }
        }
    }
}
