package com.base.controller;

import com.base.dto.response.ApiResponse;
import com.base.dto.response.address.AddressResponse;
import com.base.service.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/addresses")
@RequiredArgsConstructor
@Validated
public class AddressAdminController {
    private final AddressService addressService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddressListByUserId(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        addressService.getAddressesByUser(
                                userId
                        )
                )
        );
    }

    @GetMapping("/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressByUserId(
            @PathVariable Long addressId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        addressService.getAddressByIdForAdmin(
                                addressId
                        )
                )
        );
    }
}
