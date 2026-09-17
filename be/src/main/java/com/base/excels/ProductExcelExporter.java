package com.base.excels;

import com.base.entity.Product;
import com.base.entity.ProductVariant;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.OutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ProductExcelExporter {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public static void export(List<Product> products,
                              OutputStream outputStream) throws IOException {

        Workbook workbook = new XSSFWorkbook();

        Sheet sheet = workbook.createSheet("Products");

        CellStyle headerStyle = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        headerStyle.setFont(font);

        headerStyle.setAlignment(
                HorizontalAlignment.CENTER
        );

        String[] columns = {

                "ID",
                "Mã sản phẩm",
                "Tên sản phẩm",

                "Danh mục",
                "Thương hiệu",

                "Trạng thái",

                "Mã biến thể",
                "Size",
                "Màu",

                "Giá bán",

                "Tồn kho",
                "Đã giữ",
                "Có thể bán",

                "Đánh giá",

                "Ngày tạo",
                "Ngày cập nhật"
        };

        Row header = sheet.createRow(0);

        for (int i = 0; i < columns.length; i++) {

            Cell cell = header.createCell(i);

            cell.setCellValue(columns[i]);

            cell.setCellStyle(headerStyle);
        }

        int rowIndex = 1;

        for (Product product : products) {

            if(product.getVariants() == null ||
                    product.getVariants().isEmpty()) {

                Row row = sheet.createRow(rowIndex++);

                writeProductInfo(
                        row,
                        product,
                        null
                );

            }
            else {

                for(ProductVariant variant :
                        product.getVariants()) {

                    Row row =
                            sheet.createRow(rowIndex++);

                    writeProductInfo(
                            row,
                            product,
                            variant
                    );
                }
            }
        }

        for(int i = 0; i < columns.length; i++){

            sheet.autoSizeColumn(i);

        }

        workbook.write(outputStream);

        workbook.close();
    }

    private static void writeProductInfo(
            Row row,
            Product p,
            ProductVariant v
    ){

        int col = 0;

        row.createCell(col++)
                .setCellValue(
                        p.getProductId() != null
                                ? p.getProductId()
                                : 0
                );

        row.createCell(col++)
                .setCellValue(
                        safe(p.getProductCode())
                );

        row.createCell(col++)
                .setCellValue(
                        safe(p.getProductName())
                );

        row.createCell(col++)
                .setCellValue(
                        p.getCategory() != null
                                ? p.getCategory()
                                .getCategoryName()
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        p.getBrand() != null
                                ? p.getBrand()
                                .getBrandName()
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        p.getStatus() != null
                                ? p.getStatus().name()
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        v != null
                                ? safe(v.getVariantCode())
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        v != null
                                ? safe(v.getSize())
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        v != null
                                ? safe(v.getColor())
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        v != null &&
                                v.getPrice() != null
                                ? v.getPrice().doubleValue()
                                : 0
                );

        row.createCell(col++)
                .setCellValue(
                        v != null &&
                                v.getStockQuantity() != null
                                ? v.getStockQuantity()
                                : 0
                );

        row.createCell(col++)
                .setCellValue(0);

        row.createCell(col++)
                .setCellValue(
                        v != null
                                ? v.getAvailableStock()
                                : 0
                );

        row.createCell(col++)
                .setCellValue(
                        p.getAverageRating() != null
                                ? p.getAverageRating()
                                .doubleValue()
                                : 0
                );

        row.createCell(col++)
                .setCellValue(
                        p.getCreatedAt() != null
                                ? p.getCreatedAt()
                                .format(FORMATTER)
                                : ""
                );

        row.createCell(col++)
                .setCellValue(
                        p.getUpdatedAt() != null
                                ? p.getUpdatedAt()
                                .format(FORMATTER)
                                : ""
                );

    }

    private static String safe(String value){

        return value == null ? "" : value;

    }

}
