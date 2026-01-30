package com.tripmate.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trip_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private Integer dayNumber;

    @Column(nullable = false)
    private String time;

    @Column(nullable = false)
    private String placeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlaceType placeType;

    @Column(length = 1000)
    private String description;

    private Double lat;

    private Double lng;

    public enum PlaceType {
        ACCOMMODATION, RESTAURANT, ATTRACTION, TRANSPORT, ACTIVITY
    }
}
