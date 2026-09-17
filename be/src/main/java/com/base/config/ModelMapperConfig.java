package com.base.config;

import com.base.dto.request.address.AddressRequest;
import com.base.dto.response.address.AddressResponse;
import com.base.dto.response.coupon.CouponResponse;
import com.base.entity.Coupon;
import com.base.dto.response.order.OrderDetailResponse;
import com.base.dto.response.order.OrderResponse;
import com.base.dto.response.order.OrderSummaryResponse;
import com.base.dto.response.product.ProductResponse;
import com.base.entity.Address;
import com.base.entity.Order;
import com.base.entity.OrderDetail;
import com.base.entity.Product;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();
        mapper.getConfiguration()
                .setMatchingStrategy(MatchingStrategies.STRICT)
                .setSkipNullEnabled(true)
                .setPropertyCondition(context -> {
                    Object source = context.getSource();
                    if (source instanceof org.hibernate.collection.spi.PersistentCollection) {
                        return ((org.hibernate.collection.spi.PersistentCollection) source).wasInitialized();
                    }
                    return true;
                });

        mapper.typeMap(Order.class, OrderResponse.class).addMappings(m -> {
            m.skip(OrderResponse::setStaffId);
            m.skip(OrderResponse::setStaffName);
            m.skip(OrderResponse::setCouponCode);
            m.skip(OrderResponse::setOrderDetails);
        });

        mapper.typeMap(Order.class, OrderSummaryResponse.class).addMappings(m -> {
            m.skip(OrderSummaryResponse::setTotalItems);
        });

        mapper.typeMap(OrderDetail.class, OrderDetailResponse.class).addMappings(m -> {
            m.skip(OrderDetailResponse::setVariantId);
        });

        mapper.typeMap(Address.class, AddressResponse.class).addMappings(m -> {
            m.map(Address::getReceiverName, AddressResponse::setConsigneeName);
            m.map(Address::getReceiverPhone, AddressResponse::setPhone);
        });

        mapper.typeMap(AddressRequest.class, Address.class).addMappings(m -> {
            m.map(AddressRequest::getConsigneeName, Address::setReceiverName);
            m.map(AddressRequest::getPhone, Address::setReceiverPhone);
        });

        mapper.typeMap(Coupon.class, CouponResponse.class).addMappings(m ->
                m.skip(CouponResponse::setTargetedCustomers));

        return mapper;
    }
}