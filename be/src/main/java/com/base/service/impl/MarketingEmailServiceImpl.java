package com.base.service.impl;

import com.base.dto.event.EmailMessage;
import com.base.dto.request.marketing.PromotionEmailRequest;
import com.base.entity.Customer;
import com.base.enums.EmailType;
import com.base.queue.EmailProducer;
import com.base.repository.CustomerRepository;
import com.base.service.MarketingEmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MarketingEmailServiceImpl implements MarketingEmailService {

    private final CustomerRepository customerRepository;
    private final EmailProducer emailProducer;

    @Override
    public int sendPromotionToSubscribers(PromotionEmailRequest request) {

        List<Customer> recipients = customerRepository
                .findByEmailSubscribedTrueAndStatus(Customer.CustomerStatus.ACTIVE);

        int queued = 0;
        for (Customer customer : recipients) {
            if (customer.getEmail() == null || customer.getEmail().isBlank()) {
                continue;
            }

            emailProducer.send(EmailMessage.builder()
                    .to(customer.getEmail())
                    .recipientName(customer.getFullName() != null
                            ? customer.getFullName() : customer.getEmail())
                    .type(EmailType.PROMOTION)
                    .data(Map.of(
                            "title", request.getTitle(),
                            "content", request.getContent()
                    ))
                    .build());
            queued++;
        }

        log.info("Đã đẩy {} email ưu đãi vào hàng đợi", queued);
        return queued;
    }
}
