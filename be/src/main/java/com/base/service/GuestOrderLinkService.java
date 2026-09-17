package com.base.service;

import com.base.entity.Customer;

public interface GuestOrderLinkService {

    int linkUnassignedOrders(Customer customer);
}
