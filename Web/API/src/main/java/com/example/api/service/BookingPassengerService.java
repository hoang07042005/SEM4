package com.example.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import com.example.api.dto.BookingPassengerDTO;
import com.example.api.dto.BookingPassengerRequestDTO;
import com.example.api.dto.PassengerDetailDTO;
import com.example.api.model.Booking;
import com.example.api.model.BookingPassenger;

import com.example.api.model.User;
import com.example.api.repository.BookingPassengerRepository;
import com.example.api.repository.BookingRepository;
import com.example.api.repository.UserRepository;

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

            // Create main contact passenger
            BookingPassengerDTO contactPassenger = createContactPassenger(request, booking.getBookingId(),
                    user.getUserid());
            createdPassengers.add(contactPassenger);

            // Create additional passengers
            createAdditionalPassengers(request, booking.getBookingId(), user.getUserid(), createdPassengers);

            return createdPassengers;
        } catch (Exception e) {
            log.error("Error creating passengers: ", e);
            throw new RuntimeException("Failed to create passengers: " + e.getMessage());
        }
    }

    private void validateRequest(BookingPassengerRequestDTO request) {
        List<String> errors = new ArrayList<>();

        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }

        if (request.getBookingId() == null) {
            errors.add("Booking ID is required");
        }

        if (request.getUserId() == null) {
            errors.add("User ID is required");
        }

        if (request.getContactInfo() == null) {
            errors.add("Contact information is required");
        } else {
            if (request.getContactInfo().getFullName() == null
                    || request.getContactInfo().getFullName().trim().isEmpty()) {
                errors.add("Contact name is required");
            }
            if (request.getContactInfo().getEmail() == null || request.getContactInfo().getEmail().trim().isEmpty()) {
                errors.add("Contact email is required");
            }
            if (request.getContactInfo().getPhoneNumber() == null
                    || request.getContactInfo().getPhoneNumber().trim().isEmpty()) {
                errors.add("Contact phone number is required");
            }
        }

        if (request.getPassengers() == null) {
            errors.add("Passenger counts are required");
        } else if (request.getPassengers().getAdult() < 1) {
            errors.add("At least one adult passenger is required");
        }

        if (!errors.isEmpty()) {
            log.error("Validation errors: {}", errors);
            throw new IllegalArgumentException("Validation failed: " + String.join(", ", errors));
        }
    }

    private BookingPassengerDTO createContactPassenger(BookingPassengerRequestDTO request, Integer bookingId,
            Long userId) {
        try {
            return create(BookingPassengerDTO.builder()
                    .bookingId(bookingId)
                    .userId(userId)
                    .fullName(request.getContactInfo().getFullName())
                    .phone(request.getContactInfo().getPhoneNumber())
                    .email(request.getContactInfo().getEmail())
                    .address(request.getContactInfo().getAddress() != null ? request.getContactInfo().getAddress() : "")
                    .passengerType("adult") // Changed from ADULT to adult to match enum
                    .build());
        } catch (Exception e) {
            log.error("Error creating contact passenger: ", e);
            throw new RuntimeException("Failed to create contact passenger: " + e.getMessage());
        }
    }

    private void createAdditionalPassengers(BookingPassengerRequestDTO request, Integer bookingId, Long userId,
            List<BookingPassengerDTO> passengers) {
        try {
            var passengerDetails = request.getPassengerDetails();
            if (passengerDetails == null || passengerDetails.isEmpty()) {
                throw new RuntimeException("Passenger details are required");
            }

            for (PassengerDetailDTO detail : passengerDetails) {
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
        } catch (Exception e) {
            log.error("Error creating additional passengers: ", e);
            throw new RuntimeException("Failed to create additional passengers: " + e.getMessage());
        }
    }

    private BookingPassenger mapToEntity(BookingPassengerDTO dto) {
        try {
            Booking booking = bookingRepo.findById(dto.getBookingId())
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            User user = userRepo.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return BookingPassenger.builder()
                    .booking(booking)
                    .user(user)
                    .fullName(dto.getFullName() != null ? dto.getFullName() : "Unnamed Passenger")
                    .phone(dto.getPhone())
                    .email(dto.getEmail())
                    .address(dto.getAddress())
                    .gender(dto.getGender())
                    .birthDate(dto.getBirthDate())
                    .passengerType(BookingPassenger.PassengerType.valueOf(dto.getPassengerType().toLowerCase()))
                    .build();
        } catch (Exception e) {
            log.error("Error mapping DTO to entity: ", e);
            throw new RuntimeException("Failed to map passenger data: " + e.getMessage());
        }
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