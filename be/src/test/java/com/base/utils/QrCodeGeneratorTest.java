package com.base.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class QrCodeGeneratorTest {

    private final QrCodeGenerator generator = new QrCodeGenerator();

    @Test
    void generatePng_shouldReturnValidPngBytes() {
        byte[] png = generator.generatePng("2000000000205");

        assertTrue(png.length > 1_000);
        assertEquals(0x89, png[0] & 0xFF);
        assertEquals(0x50, png[1] & 0xFF);
        assertEquals(0x4E, png[2] & 0xFF);
        assertEquals(0x47, png[3] & 0xFF);
    }
}
