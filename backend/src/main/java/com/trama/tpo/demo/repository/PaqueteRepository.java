package com.trama.tpo.demo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trama.tpo.demo.entity.plan.Paquete;

@Repository
public interface PaqueteRepository extends JpaRepository<Paquete, UUID> {

    /** Del más chico al más grande: el «paquete siguiente» de la 9.3 es el que sigue en precio. */
    List<Paquete> findAllByOrderByPrecioAsc();
}
