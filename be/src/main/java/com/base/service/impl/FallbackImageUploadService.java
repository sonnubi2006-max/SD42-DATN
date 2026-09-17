package com.base.service.impl;

import com.base.dto.request.ImageUploadMessage;
import com.base.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class FallbackImageUploadService {

    private final CloudinaryService cloudinaryService;
    private final LocalStorageService localStorageService;

    private final ProductImageRepository imageRepository;
    private final BannerRepository bannerRepository;
    private final MessageRepository messageRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final BrandRepository brandRepository;
    private final ExchangeDeliveryLogImageRepository exchangeDeliveryLogImageRepository;

    public void process(ImageUploadMessage message) {

        log.info("Fallback processing: id={}, action={}, table={}",
                message.getId(),
                message.getAction(),
                message.getTable());

        try {

            switch (message.getAction()) {

                case CREATE_BRAND,
                     CREATE_PRODUCT,
                     CREATE_BANNER,
                     CREATE_REVIEW,
                     CREATE_CONVERSATION,
                     CREATE_CHAT,
                     CREATE_EXCHANGE_DELIVERY_EVIDENCE -> {

                    String cloudUrl =
                            cloudinaryService.uploadFromPath(
                                    message.getTempFilePath()
                            );

                    updateImage(
                            message.getTable(),
                            message.getId(),
                            cloudUrl
                    );

                    localStorageService.deleteTempFile(
                            message.getTempFilePath()
                    );
                }

                case UPDATE_BRAND,
                     UPDATE_PRODUCT,
                     UPDATE_BANNER,
                     UPDATE_REVIEW,
                     UPDATE_CONVERSATION,
                     UPDATE_CHAT -> {

                    if (message.getOldImageUrl() != null) {

                        cloudinaryService.deleteImage(
                                message.getOldImageUrl()
                        );
                    }

                    String cloudUrl =
                            cloudinaryService.uploadFromPath(
                                    message.getTempFilePath()
                            );

                    updateImage(
                            message.getTable(),
                            message.getId(),
                            cloudUrl
                    );

                    localStorageService.deleteTempFile(
                            message.getTempFilePath()
                    );
                }

                case DELETE_BRAND,
                     DELETE_PRODUCT,
                     DELETE_BANNER,
                     DELETE_REVIEW,
                     DELETE_CONVERSATION,
                     DELETE_CHAT -> {

                    if (message.getOldImageUrl() != null) {

                        cloudinaryService.deleteImage(
                                message.getOldImageUrl()
                        );
                    }
                }
            }

        } catch (Exception e) {

            log.error(
                    "Fallback upload failed id={}, error={}",
                    message.getId(),
                    e.getMessage()
            );
        }
    }

    @Transactional
    protected void updateImage(
            String table,
            Long id,
            String cloudUrl
    ) {

        switch (table.toUpperCase()) {

            case "PRODUCT" ->

                    imageRepository.findById(id)
                            .ifPresent(img -> {

                                img.setImageUrl(cloudUrl);
                                imageRepository.save(img);

                            });

            case "BANNER" ->

                    bannerRepository.findById(id)
                            .ifPresent(img -> {

                                img.setImageUrl(cloudUrl);
                                bannerRepository.save(img);

                            });

            case "MESSAGE", "CHAT" ->

                    messageRepository.findById(id)
                            .ifPresentOrElse(img -> {

                                img.setImageUrl(cloudUrl);
                                messageRepository.save(img);

                            }, () -> {
                                throw new IllegalStateException(
                                        "Conversation message not found: " + id
                                );
                            });

            case "REVIEW" ->

                    reviewImageRepository.findById(id)
                            .ifPresent(img -> {

                                img.setImageUrl(cloudUrl);
                                reviewImageRepository.save(img);

                            });

            case "BRAND" ->

                    brandRepository.findById(id)
                            .ifPresent(img -> {

                                img.setBrandLogo(cloudUrl);
                                brandRepository.save(img);

                            });

            case "EXCHANGE_DELIVERY_LOG_IMAGE" ->

                    exchangeDeliveryLogImageRepository.findById(id)
                            .ifPresent(img -> {
                                img.setImageUrl(cloudUrl);
                                exchangeDeliveryLogImageRepository.save(img);
                            });

            default ->
                    throw new RuntimeException(
                            "Unknown image table: " + table
                    );
        }
    }
}
