package com.example.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.example.api.dto.BookingPassengerDTO;
import com.example.api.dto.BookingPassengerRequestDTO;
import com.example.api.dto.PassengerDetailDTO;
import com.example.api.model.Booking;
import com.example.api.model.BookingPassenger;
import com.example.api.model.Tour;
import com.example.api.model.User;
import com.example.api.repository.BookingPassengerRepository;
import com.example.api.repository.BookingRepository;
import com.example.api.repository.TourRepository;
import com.example.api.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingPassengerService {

    private final BookingPassengerRepository bookingPassengerRepo;
    private final BookingRepository bookingRepo;
    private final UserRepository userRepo;
    private final TourRepository tourRepo;

    public BookingPassengerDTO create(BookingPassengerDTO dto) {
        BookingPassenger passenger = mapToEntity(dto);
        return mapToDTO(bookingPassengerRepo.save(passenger));
    }

    public BookingPassengerDTO update(Integer id, BookingPassengerDTO dto) {
        BookingPassenger existing = bookingPassengerRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Passenger not found"));
        existing.setFullName(dto.getFullName());
        existing.setPhone(dto.getPhone());
        existing.setEmail(dto.getEmail());
        existing.setAddress(dto.getAddress());
        existing.setPassengerType(BookingPassenger.PassengerType.valueOf(dto.getPassengerType()));
        return mapToDTO(bookingPassengerRepo.save(existing));
    }

    public void delete(Integer id) {
        bookingPassengerRepo.deleteById(id);
    }

    public BookingPassengerDTO getById(Integer id) {
        return bookingPassengerRepo.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Passenger not found"));
    }

    public List<BookingPassengerDTO> getByBookingId(Integer bookingId) {
        return bookingPassengerRepo.findByBooking_BookingId(bookingId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<BookingPassengerDTO> createPassengers(BookingPassengerRequestDTO request) {
        validateRequest(request);
        List<BookingPassengerDTO> createdPassengers = new ArrayList<>();

        try {
            Booking booking = bookingRepo.findById(request.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + request.getBookingId()));
            User user = userRepo.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getUserId()));

            BookingPassengerDTO contactPassenger = createContactPassenger(request, booking.getBookingId(), user.getUserid());
            createdPassengers.add(contactPassenger);

            createAdditionalPassengers(request, booking.getBookingId(), user.getUserid(), createdPassengers);

            Tour tour = tourRepo.findById(booking.getTour().getTourId())
                    .orElseThrow(() -> new RuntimeException("Tour not found for booking"));
            BigDecimal basePrice = tour.getPrice();
            int adults = request.getPassengers().getAdult();
            int children = request.getPassengers().getChild();
            int infants = request.getPassengers().getInfant();

            BigDecimal totalPrice = basePrice.multiply(BigDecimal.valueOf(adults))
                .add(basePrice.multiply(BigDecimal.valueOf(0.5)).multiply(BigDecimal.valueOf(children)))
                .add(basePrice.multiply(BigDecimal.valueOf(0.25)).multiply(BigDecimal.valueOf(infants)));

            booking.setTotalPrice(totalPrice);
            bookingRepo.save(booking);

            return createdPassengers;
        } catch (Exception e) {
            log.error("Error creating passengers: ", e);
            throw new RuntimeException("Failed to create passengers: " + e.getMessage());
        }
    }

    private void validateRequest(BookingPassengerRequestDTO request) {
        List<String> errors = new ArrayList<>();
        if (request == null || request.getBookingId() == null || request.getUserId() == null || request.getContactInfo() == null) {
            throw new IllegalArgumentException("Missing required booking, user or contact info");
        }
        if (request.getContactInfo().getFullName() == null || request.getContactInfo().getFullName().trim().isEmpty()) {
            errors.add("Contact name is required");
        }
        if (request.getContactInfo().getEmail() == null || request.getContactInfo().getEmail().trim().isEmpty()) {
            errors.add("Contact email is required");
        }
        if (request.getContactInfo().getPhoneNumber() == null || request.getContactInfo().getPhoneNumber().trim().isEmpty()) {
            errors.add("Contact phone number is required");
        }
        if (request.getPassengers() == null || request.getPassengers().getAdult() < 1) {
            errors.add("At least one adult passenger is required");
        }
        if (!errors.isEmpty()) {
            throw new IllegalArgumentException("Validation failed: " + String.join(", ", errors));
        }
    }

    private BookingPassengerDTO createContactPassenger(BookingPassengerRequestDTO request, Integer bookingId, Long userId) {
        return create(BookingPassengerDTO.builder()
                .bookingId(bookingId)
                .userId(userId)
                .fullName(request.getContactInfo().getFullName())
                .phone(request.getContactInfo().getPhoneNumber())
                .email(request.getContactInfo().getEmail())
                .address(request.getContactInfo().getAddress())
                .passengerType("adult")
                .build());
    }

    private void createAdditionalPassengers(BookingPassengerRequestDTO request, Integer bookingId, Long userId, List<BookingPassengerDTO> passengers) {
        if (request.getPassengerDetails() != null) {
            for (PassengerDetailDTO detail : request.getPassengerDetails()) {
                BookingPassengerDTO passenger = BookingPassengerDTO.builder()
                        .bookingId(bookingId)
                        .userId(userId)
                        .fullName(detail.getFullName())
                        .passengerType(detail.getPassengerType())
                        .gender(detail.getGender())
                        .birthDate(detail.getBirthDate())
                        .build();
                passengers.add(create(passenger));
            }
        }
    }

    private BookingPassenger mapToEntity(BookingPassengerDTO dto) {
        Booking booking = bookingRepo.findById(dto.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        User user = userRepo.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return BookingPassenger.builder()
                .booking(booking)
                .user(user)
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .gender(dto.getGender())
                .birthDate(dto.getBirthDate())
                .passengerType(BookingPassenger.PassengerType.valueOf(dto.getPassengerType().toLowerCase()))
                .build();
    }

    private BookingPassengerDTO mapToDTO(BookingPassenger p) {
        return BookingPassengerDTO.builder()
                .passengerId(p.getPassengerId())
                .bookingId(p.getBooking().getBookingId())
                .userId(p.getUser().getUserid())
                .fullName(p.getFullName())
                .phone(p.getPhone())
                .email(p.getEmail())
                .address(p.getAddress())
                .gender(p.getGender())
                .birthDate(p.getBirthDate())
                .passengerType(p.getPassengerType().name())
                .build();
    }
}
