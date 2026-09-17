package com.base.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.RepublishMessageRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.retry.interceptor.RetryOperationsInterceptor;

@Configuration
public class RabbitMQConfig {
    @Value("${rabbitmq.exchange.order}")
    private String orderExchange;

    @Value("${rabbitmq.queue.image-upload}")
    private String imageQueue;

    @Value("${rabbitmq.exchange.image}")
    private String imageExchange;

    @Value("${rabbitmq.exchange.email}")
    private String emailExchange;

    @Value("${rabbitmq.routing-key.email}")
    private String emailRoutingKey;

    @Value("${rabbitmq.queue.email}")
    private String emailQueue;

    @Value("${rabbitmq.queue.inventory}")
    private String inventoryQueue;

    @Value("${rabbitmq.routing-key.image-upload}")
    private String imageRoutingKey;

    @Value("${rabbitmq.queue.image-upload-failed}")
    private String imageFailedQueue;

    @Value("${rabbitmq.exchange.image-failed}")
    private String imageFailedExchange;

    @Value("${rabbitmq.routing-key.image-upload-failed}")
    private String imageFailedRoutingKey;

    @Value("${rabbitmq.listener.image.concurrent-consumers:2}")
    private int imageConcurrentConsumers;

    @Value("${rabbitmq.listener.image.max-concurrent-consumers:4}")
    private int imageMaxConcurrentConsumers;

    @Value("${rabbitmq.listener.image.prefetch:2}")
    private int imagePrefetch;

    @Value("${spring.rabbitmq.listener.simple.retry.max-attempts:3}")
    private int imageRetryMaxAttempts;

    @Value("${spring.rabbitmq.listener.simple.retry.initial-interval:3000}")
    private long imageRetryInitialInterval;

    @Value("${spring.rabbitmq.listener.simple.retry.multiplier:2}")
    private double imageRetryMultiplier;

    @Value("${spring.rabbitmq.listener.simple.retry.max-interval:10000}")
    private long imageRetryMaxInterval;

    @Bean
    public Queue imageUploadQueue() {
        return QueueBuilder.durable(imageQueue).build();
    }

    @Bean
    public Queue imageUploadFailedQueue() {
        return QueueBuilder.durable(imageFailedQueue).build();
    }

    @Bean
    public Binding imageUploadBinding() {
        return BindingBuilder
                .bind(imageUploadQueue())
                .to(imageExchange())
                .with(imageRoutingKey);
    }

    @Bean
    public Binding imageUploadFailedBinding() {
        return BindingBuilder
                .bind(imageUploadFailedQueue())
                .to(imageFailedExchange())
                .with(imageFailedRoutingKey);
    }

    @Bean
    public Queue emailQueue() {
        return QueueBuilder.durable(emailQueue).build();
    }

    @Bean
    public Queue inventoryQueue() {
        return QueueBuilder.durable(inventoryQueue).build();
    }

    @Bean
    public Binding emailBinding() {
        return BindingBuilder
                .bind(emailQueue())
                .to(emailExchange())
                .with(emailRoutingKey);
    }

    @Bean
    public Binding inventoryBinding() {
        return BindingBuilder
                .bind(inventoryQueue())
                .to(orderExchange());
    }

    @Bean
    public FanoutExchange orderExchange() {
        return new FanoutExchange(orderExchange);
    }

    @Bean
    public DirectExchange imageExchange() {
        return new DirectExchange(imageExchange);
    }

    @Bean
    public DirectExchange imageFailedExchange() {
        return new DirectExchange(imageFailedExchange);
    }

    @Bean
    public DirectExchange emailExchange() {
        return new DirectExchange(emailExchange);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());

        rabbitTemplate.setChannelTransacted(false);
        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {

        SimpleRabbitListenerContainerFactory factory =
                new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        factory.setMissingQueuesFatal(false);
        return factory;
    }

    @Bean
    public RetryOperationsInterceptor imageUploadRetryInterceptor(
            RabbitTemplate rabbitTemplate) {
        RepublishMessageRecoverer recoverer = new RepublishMessageRecoverer(
                rabbitTemplate,
                imageFailedExchange,
                imageFailedRoutingKey
        );

        return RetryInterceptorBuilder.stateless()
                .maxAttempts(imageRetryMaxAttempts)
                .backOffOptions(
                        imageRetryInitialInterval,
                        imageRetryMultiplier,
                        imageRetryMaxInterval
                )
                .recoverer(recoverer)
                .build();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory imageRabbitListenerContainerFactory(
            SimpleRabbitListenerContainerFactoryConfigurer configurer,
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter,
            RetryOperationsInterceptor imageUploadRetryInterceptor) {

        SimpleRabbitListenerContainerFactory factory =
                new SimpleRabbitListenerContainerFactory();
        configurer.configure(factory, connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        factory.setMissingQueuesFatal(false);
        factory.setConcurrentConsumers(imageConcurrentConsumers);
        factory.setMaxConcurrentConsumers(imageMaxConcurrentConsumers);
        factory.setPrefetchCount(imagePrefetch);
        factory.setDefaultRequeueRejected(false);
        factory.setAdviceChain(imageUploadRetryInterceptor);
        return factory;
    }

}
