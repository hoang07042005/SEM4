package com.example.api.service;

import com.example.api.dto.TourDTO;
import com.example.api.model.Tour;
import com.example.api.repository.DestinationRepository;
import com.example.api.repository.EventRepository;
import com.example.api.repository.TourRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TourService {

    private final TourRepository tourRepo;
    private final DestinationRepository destRepo;
    private final EventRepository eventRepo;

    public Tour createTour(TourDTO dto) {
        Tour tour = new Tour();
        BeanUtils.copyProperties(dto, tour);
        tour.setDestinations(destRepo.findAllById(dto.getDestinationIds()));
        tour.setEvents(eventRepo.findAllById(dto.getEventIds()));
        return tourRepo.save(tour);
    }

    public Tour updateTour(Integer id, TourDTO dto) {
        Tour tour = tourRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
        BeanUtils.copyProperties(dto, tour, "tourId");
        tour.setDestinations(destRepo.findAllById(dto.getDestinationIds()));
        tour.setEvents(eventRepo.findAllById(dto.getEventIds()));
        return tourRepo.save(tour);
    }

    public void deleteTour(Integer id) {
        tourRepo.deleteById(id);
    }

    public Tour getTourDetail(Integer id) {
        return tourRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Tour not found"));
    }

    public List<Tour> getAllTours() {
        return tourRepo.findAll();
    }
}
