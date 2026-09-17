package com.base.excels;

import com.base.entity.Brand;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.util.List;

public class BrandExcelExporter {
    private XSSFWorkbook workbook;
    private XSSFSheet sheet;
    private List<Brand> listBrands;

    public BrandExcelExporter(List<Brand> listBrands) {
        this.listBrands = listBrands;
        workbook = new XSSFWorkbook();
    }

    private void writeHeaderLine() {
        sheet = workbook.createSheet("Brands");

        Row row = sheet.createRow(0);

        CellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeight(16);
        style.setFont(font);

        createCell(row, 0, "STT", style);
        createCell(row, 1, "ID", style);
        createCell(row, 2, "Tên thương hiệu", style);
        createCell(row, 3, "Trạng thái", style);
        createCell(row, 4, "Thời gian tạo", style);
        createCell(row, 5, "Thời gian cập nhật", style);
    }

    private void createCell(Row row, int columnCount, Object value, CellStyle style) {
        sheet.autoSizeColumn(columnCount);
        Cell cell = row.createCell(columnCount);

        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value instanceof Long) {
            cell.setCellValue((Long) value);
        } else if (value instanceof Double) {
            cell.setCellValue((Double) value);
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else {
            cell.setCellValue(value.toString());
        }

        cell.setCellStyle(style);
    }

    private void writeDataLines() {
        int rowCount = 1;

        CellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setFontHeight(14);
        style.setFont(font);

        for (Brand brand : listBrands) {
            Row row = sheet.createRow(rowCount++);
            int columnCount = 0;

            createCell(row, columnCount++, rowCount - 1, style);
            createCell(row, columnCount++, brand.getBrandId(), style);
            createCell(row, columnCount++, brand.getBrandName(), style);
            createCell(row, columnCount++, brand.getBrandStatus().toString(), style);
            createCell(row, columnCount++, brand.getCreatedAt() != null ? brand.getCreatedAt().toString() : "", style);
            createCell(row, columnCount++, brand.getUpdatedAt() != null ? brand.getUpdatedAt().toString() : "", style);
        }
    }

    public void export(HttpServletResponse response) throws IOException {
        writeHeaderLine();
        writeDataLines();

        ServletOutputStream outputStream = response.getOutputStream();
        workbook.write(outputStream);
        workbook.close();
        outputStream.close();
    }
}
