package com.base.utils;

import com.base.exception.BadRequestException;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class QrCodeGenerator {

    private static final int DEFAULT_SIZE = 512;

    public byte[] generatePng(String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Nội dung QR không được để trống");
        }

        try {
            BitMatrix matrix = new QRCodeWriter().encode(
                    content.trim(),
                    BarcodeFormat.QR_CODE,
                    DEFAULT_SIZE,
                    DEFAULT_SIZE,
                    Map.of(
                            EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8.name(),
                            EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M,
                            EncodeHintType.MARGIN, 2
                    )
            );

            BufferedImage image = new BufferedImage(
                    matrix.getWidth(),
                    matrix.getHeight(),
                    BufferedImage.TYPE_INT_RGB
            );
            for (int y = 0; y < matrix.getHeight(); y++) {
                for (int x = 0; x < matrix.getWidth(); x++) {
                    image.setRGB(x, y, matrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
                }
            }

            try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                if (!ImageIO.write(image, "PNG", output)) {
                    throw new BadRequestException("Không thể mã hóa ảnh QR định dạng PNG");
                }
                return output.toByteArray();
            }
        } catch (WriterException | IOException e) {
            throw new BadRequestException("Không thể sinh mã QR cho biến thể");
        }
    }
}
