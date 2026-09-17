package com.base.queue;

import com.base.dto.request.*;
import com.base.service.impl.FallbackImageUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpConnectException;
import org.springframework.amqp.AmqpIOException;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ImageUploadProducer {

    private final AmqpTemplate amqpTemplate;
    private final FallbackImageUploadService fallbackService;

    @Value("${rabbitmq.exchange.image}")
    private String imageExchange;

    @Value("${rabbitmq.routing-key.image-upload}")
    private String imageRoutingKey;

    public void sendUploadMessage(ImageUploadMessage message) {

        try {

            amqpTemplate.convertAndSend(
                    imageExchange,
                    imageRoutingKey,
                    message
            );

            log.info(
                    "Queued image: id={}, action={}, table={}",
                    message.getId(),
                    message.getAction(),
                    message.getTable()
            );

        } catch (AmqpConnectException | AmqpIOException e) {

            log.warn(
                    "RabbitMQ unavailable -> fallback"
            );

            fallbackService.process(message);
        }
    }
}