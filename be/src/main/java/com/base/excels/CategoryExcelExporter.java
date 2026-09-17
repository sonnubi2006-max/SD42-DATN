package com.base.excels;

import com.base.entity.Category;
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

public class CategoryExcelExporter {
    private XSSFWorkbook workbook;
    private XSSFSheet sheet;
    private List<Category> listCategories;

    public CategoryExcelExporter(List<Category> listCategories) {
        this.listCategories = listCategories;
        workbook = new XSSFWorkbook();
    }

    private void writeHeaderLine() {
        sheet = workbook.createSheet("Users");

        Row row = sheet.createRow(0);

        CellStyle style = workbook.createCellStyle();
        XSSFFont font = workbook.createFont();
        font.setBold(true);
        font.setFontHeight(16);
        style.setFont(font);

        createCell(row, 0, "STT", style);
        createCell(row, 1, "ID", style);
        createCell(row, 2, "Tên", style);
        createCell(row, 3, "Mô tả", style);
        createCell(row, 4, "Trạng thái", style);
        createCell(row, 5, "Thời gian tạo", style);
        createCell(row, 6, "Thời gian cập nhật", style);

    }

    private void createCell(Row row, int columnCount, Object value, CellStyle style) {
        sheet.autoSizeColumn(columnCount);

        Cell cell = row.createCell(columnCount);

        if (value == null) {
            cell.setCellValue("");
        }
        else if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        }
        else if (value instanceof Long) {
            cell.setCellValue((Long) value);
        }
        else if (value instanceof Double) {
            cell.setCellValue((Double) value);
        }
        else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        }
        else {
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

        for (Category category : listCategories) {
            Row row = sheet.createRow(rowCount++);
            int columnCount = 0;

            createCell(row, columnCount++, columnCount + 1, style);
            createCell(row, columnCount++, category.getCategoryId(), style);
            createCell(row, columnCount++, category.getCategoryName(), style);
            createCell(row, columnCount++, category.getCategoryDescription(), style);
            createCell(row, columnCount++, category.getCategoryStatus().toString(), style);
            createCell(row, columnCount++, category.getCreatedAt(), style);
            createCell(row, columnCount++, category.getUpdatedAt(), style);

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
