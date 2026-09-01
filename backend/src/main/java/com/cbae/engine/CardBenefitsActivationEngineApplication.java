package com.cbae.engine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CardBenefitsActivationEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(CardBenefitsActivationEngineApplication.class, args);
    }
}
