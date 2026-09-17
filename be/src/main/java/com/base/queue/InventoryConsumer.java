package com.base.queue;

import com.base.dto.event.OrderCreatedEvent;
import com.base.dto.event.OrderItemEvent;
import com.base.entity.Product;
import com.base.entity.ProductVariant;
import com.base.exception.BadRequestException;
import com.base.repository.ProductRepository;
import com.base.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Transactional
public class InventoryConsumer {

    private final ProductVariantRepository productVariantRepository;

    @RabbitListener(
            queues = "${rabbitmq.queue.inventory}"
    )
    public void handle(
            OrderCreatedEvent event
    ) {

        for (OrderItemEvent item :
                event.getItems()) {

            ProductVariant product =
                    productVariantRepository.findById(
                            item.getVariantId()
                    ).orElseThrow();

            if (product.getStockQuantity()
                    < item.getQuantity()) {

                throw new BadRequestException(
                        "Insufficient stock"
                );
            }

            productVariantRepository.save(product);
        }
    }
}