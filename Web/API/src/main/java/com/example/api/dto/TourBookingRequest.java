package com.example.api.dto;

import lombok.Data;

@Data
public class TourBookingRequest {
    private Long userId;
    private Integer tourId;
    private String discountCode;
}