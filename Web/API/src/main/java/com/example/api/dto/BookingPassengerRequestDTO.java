    package com.example.api.dto;

    import lombok.Data;
    import lombok.NoArgsConstructor;
    import lombok.AllArgsConstructor;
    import java.util.List;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public class BookingPassengerRequestDTO {
        private Integer bookingId;
        private Long userId;
        private ContactInfo contactInfo;
        private PassengerCounts passengers;
        private List<PassengerDetailDTO> passengerDetails;



        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class ContactInfo {
            private String fullName;
            private String phoneNumber;
            private String email;
            private String address;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class PassengerCounts {
            private int adult;
            private int child;
            private int infant;
        }
    }
