package com.example.api.service;

import com.example.api.dto.TourBookingRequest;
import com.example.api.model.*;
import com.example.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final UserRepository userRepository;
    private final TourRepository tourRepository;
    private final DiscountRepository discountRepository;
    private final UserDiscountRepository userDiscountRepository;
    private final BookingRepository bookingRepository;
    private final BookingStatusRepository bookingStatusRepository;

    public Booking createBooking(TourBookingRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Tour tour = tourRepository.findById(request.getTourId())
                .orElseThrow(() -> new RuntimeException("Tour not found"));

        BigDecimal price = tour.getPrice();

        Discount discount = null;
        if (request.getDiscountCode() != null && !request.getDiscountCode().isBlank()) {
            discount = discountRepository.findByCode(request.getDiscountCode())
                    .orElseThrow(() -> new RuntimeException("Discount code invalid"));

            if (LocalDateTime.now().isBefore(discount.getStartDate()) ||
                    LocalDateTime.now().isAfter(discount.getEndDate())) {
                throw new RuntimeException("Discount code expired");
            }

            boolean used = userDiscountRepository.existsByUseridAndDiscountIdAndTourIdAndUsedTrue(
                    user.getUserid(), discount.getDiscountId(), tour.getTourId());
            if (used) {
                throw new RuntimeException("You already used this discount code for this tour");
            }

            BigDecimal discountAmount = price.multiply(BigDecimal.valueOf(discount.getDiscountPercent()))
                    .divide(BigDecimal.valueOf(100));
            price = price.subtract(discountAmount);
        }

        BookingStatus pendingStatus = bookingStatusRepository.findByStatusName("PENDING")
                .orElseThrow(() -> new RuntimeException("Booking status PENDING not found"));

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setTour(tour);
        booking.setTotalPrice(price);
        booking.setBookingDate(LocalDateTime.now());
        booking.setStatus(pendingStatus);

        booking = bookingRepository.save(booking);

        if (discount != null) {
            UserDiscount ud = new UserDiscount();
            ud.setUserid(user.getUserid()); // Changed from setUserId to setUserid
            ud.setTourId(tour.getTourId());
            ud.setDiscountId(discount.getDiscountId());
            ud.setUsed(true);
            userDiscountRepository.save(ud);
        }

        return booking;
    }
}