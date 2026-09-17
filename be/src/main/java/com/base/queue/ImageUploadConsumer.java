package com.base.queue;

import com.base.dto.request.*;
import com.base.exception.BadRequestException;
import com.base.repository.*;
import com.base.service.impl.CloudinaryService;
import com.base.service.impl.LocalStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ImageUploadConsumer {

    private final CloudinaryService cloudinaryService;
    private final LocalStorageService localStorageService;
    private final ProductImageRepository imageRepository;
    private final BannerRepository bannerRepository;
    private final MessageRepository messageRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final BrandRepository brandRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ExchangeDeliveryLogImageRepository exchangeDeliveryLogImageRepository;

    @RabbitListener(
            queues = "${rabbitmq.queue.image-upload}",
            containerFactory = "imageRabbitListenerContainerFactory"
    )
    public void handleImageUpload(ImageUploadMessage message) {

        log.info("Processing: id={}, action={}, table={}",
                message.getId(),
                message.getAction(),
                message.getTable());

        try {
            if (message.getAction() == null) {
                return;
            }

            switch (message.getAction().name()) {

                case "CREATE_BRAND",
                     "CREATE_PRODUCT",
                     "CREATE_BANNER",
                     "CREATE_REVIEW",
                     "CREATE_CONVERSATION",
                     "CREATE_CHAT",
                     "CREATE_USER",
                     "CREATE_CUSTOMER",
                     "CREATE_EXCHANGE_DELIVERY_EVIDENCE" -> {

                    String cloudUrl = cloudinaryService.uploadFromPath(
                            message.getTempFilePath()
                    );

                    updateImageUrl(
                            message.getTable(),
                            message.getId(),
                            cloudUrl
                    );

                    localStorageService.deleteTempFile(
                            message.getTempFilePath()
                    );
                }

                case "UPDATE_BRAND",
                     "UPDATE_PRODUCT",
                     "UPDATE_BANNER",
                     "UPDATE_REVIEW",
                     "UPDATE_CONVERSATION",
                     "UPDATE_CHAT",
                     "UPDATE_USER",
                     "UPDATE_CUSTOMER" -> {

                    if (message.getOldImageUrl() != null) {
                        cloudinaryService.deleteImage(
                                message.getOldImageUrl()
                        );
                    }

                    String cloudUrl = cloudinaryService.uploadFromPath(
                            message.getTempFilePath()
                    );

                    updateImageUrl(
                            message.getTable(),
                            message.getId(),
                            cloudUrl
                    );

                    localStorageService.deleteTempFile(
                            message.getTempFilePath()
                    );
                }

                case "DELETE_BRAND",
                     "DELETE_PRODUCT",
                     "DELETE_BANNER",
                     "DELETE_REVIEW",
                     "DELETE_CONVERSATION",
                     "DELETE_CHAT",
                     "DELETE_USER",
                     "DELETE_CUSTOMER" -> {

                    if (message.getOldImageUrl() != null) {
                        cloudinaryService.deleteImage(
                                message.getOldImageUrl()
                        );
                    }
                }
            }

        } catch (Exception e) {
            log.error(
                    "Upload image failed: id={}, action={}, table={}, tempFilePath={}",
                    message.getId(),
                    message.getAction(),
                    message.getTable(),
                    message.getTempFilePath(),
                    e
            );

            throw new IllegalStateException(
                    "Image upload failed; message will be retried",
                    e
            );
        }
    }

    private void updateImageUrl(String table, Long id, String url) {

        switch (table.toUpperCase()) {

            case "BRAND" ->
                    brandRepository.findById(id)
                            .ifPresent(x -> {
                                x.setBrandLogo(url);
                                brandRepository.save(x);
                            });

            case "PRODUCT" ->
                    imageRepository.findById(id)
                            .ifPresent(x -> {
                                x.setImageUrl(url);
                                imageRepository.save(x);
                            });

            case "BANNER" ->
                    bannerRepository.findById(id)
                            .ifPresent(x -> {
                                x.setImageUrl(url);
                                bannerRepository.save(x);
                            });

            case "REVIEW" ->
                    reviewImageRepository.findById(id)
                            .ifPresent(x -> {
                                x.setImageUrl(url);
                                reviewImageRepository.save(x);
                            });

            case "MESSAGE", "CHAT" ->
                    messageRepository.findById(id)
                            .ifPresentOrElse(x -> {
                                x.setImageUrl(url);
                                messageRepository.save(x);
                            }, () -> {
                                throw new BadRequestException(
                                        "Conversation message not found: " + id
                                );
                            });

            case "USER" ->
                    userRepository.findById(id)
                            .ifPresent(x -> {
                                x.setAvatar(url);
                                userRepository.save(x);
                            });

            case "CUSTOMER" ->
                    customerRepository.findById(id)
                            .ifPresent(x -> {
                                x.setAvatar(url);
                                customerRepository.save(x);
                            });

            case "EXCHANGE_DELIVERY_LOG_IMAGE" ->
                    exchangeDeliveryLogImageRepository.findById(id)
                            .ifPresent(x -> {
                                x.setImageUrl(url);
                                exchangeDeliveryLogImageRepository.save(x);
                            });

            default ->
                    throw new BadRequestException(
                            "Unknown image table: " + table
                    );
        }
    }
}
