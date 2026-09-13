package com.iusjc.timora.user.util;

import com.iusjc.timora.user.entity.Etudiant;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class ExcelHelper {
    public static String TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static boolean hasExcelFormat(MultipartFile file) {
        return TYPE.equals(file.getContentType());
    }

    public static List<Etudiant> excelToEtudiants(InputStream is) {
        try {
            Workbook workbook = new XSSFWorkbook(is);
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            List<Etudiant> etudiants = new ArrayList<>();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();

                // Skip header
                if (rowNumber == 0) {
                    rowNumber++;
                    continue;
                }

                Iterator<Cell> cellsInRow = currentRow.iterator();
                Etudiant etudiant = new Etudiant();

                int cellIdx = 0;
                while (cellsInRow.hasNext()) {
                    Cell currentCell = cellsInRow.next();

                    switch (cellIdx) {
                        case 0:
                            etudiant.setNom(getCellValueAsString(currentCell));
                            break;
                        case 1:
                            etudiant.setPrenom(getCellValueAsString(currentCell));
                            break;
                        case 2:
                            etudiant.setEmail(getCellValueAsString(currentCell));
                            break;
                        case 3:
                            etudiant.setTelephone(getCellValueAsString(currentCell));
                            break;
                        case 4:
                            etudiant.setFiliereId(getCellValueAsString(currentCell));
                            break;
                        case 5:
                            etudiant.setNiveau(getCellValueAsString(currentCell));
                            break;
                        case 6:
                            etudiant.setEcoleId(getCellValueAsString(currentCell));
                            break;
                        case 7:
                            etudiant.setClasseId(getCellValueAsString(currentCell));
                            break;
                        default:
                            break;
                    }
                    cellIdx++;
                }
                etudiants.add(etudiant);
            }
            workbook.close();
            return etudiants;
        } catch (IOException e) {
            throw new RuntimeException("fail to parse Excel file: " + e.getMessage());
        }
    }

    private static String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: 
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf((long)cell.getNumericCellValue());
                }
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA: return cell.getCellFormula();
            default: return "";
        }
    }
}
