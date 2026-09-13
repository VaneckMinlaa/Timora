package com.iusjc.timora.room.util;

import com.iusjc.timora.room.entity.EtatEquipement;
import com.iusjc.timora.room.entity.Equipement;
import com.iusjc.timora.room.entity.Salle;
import com.iusjc.timora.room.entity.TypeSalle;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class ExcelHelper {

    public static final String EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static boolean hasExcelFormat(MultipartFile file) {
        return EXCEL_TYPE.equals(file.getContentType());
    }

    // Salles
    /**
     * Parse an Excel sheet into Salle entities.
     * Expected columns: nom | capacite | ecole | typeSalle (AMPHI/TD/LABORATOIRE/COURS)
     */
    public static List<Salle> excelToSalles(InputStream is) {
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<Salle> salles = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // skip header

                Salle salle = new Salle();
                salle.setNomsalle(getCellString(row.getCell(0)));
                String capaciteStr = getCellString(row.getCell(1));
                if (!capaciteStr.isBlank()) {
                    try { salle.setCapacite(Integer.parseInt(capaciteStr.trim())); }
                    catch (NumberFormatException ignored) {}
                }
                
                salle.setEcole(getCellString(row.getCell(2)));

                String type = getCellString(row.getCell(3)).trim().toUpperCase();
                try { salle.setTypeSalle(TypeSalle.valueOf(type)); }
                catch (IllegalArgumentException e) { salle.setTypeSalle(TypeSalle.COURS); }

                if (!salle.getNomsalle().isBlank()) salles.add(salle);
            }
            return salles;
        } catch (IOException e) {
            throw new RuntimeException("Impossible de lire le fichier Excel: " + e.getMessage());
        }
    }

    // Equipements
    /**
     * Parse an Excel sheet into Equipement entities.
     * Expected columns: nom | categorie | statut (DISPONIBLE/EN_MAINTENANCE/DEFECTUEUX/EN_COUR_D_UTILISATION) | salleId
     */
    public static List<Equipement> excelToEquipements(InputStream is) {
        try (Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            List<Equipement> equipements = new ArrayList<>();

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue; // skip header

                Equipement e = new Equipement();
                e.setNom(getCellString(row.getCell(0)));
                
                String cat = getCellString(row.getCell(1)).trim();
                e.setCategorie(cat.isEmpty() ? "Autre" : cat);

                String statutStr = getCellString(row.getCell(2)).trim().toUpperCase();
                try { e.setStatut(EtatEquipement.valueOf(statutStr)); }
                catch (IllegalArgumentException ex) { e.setStatut(EtatEquipement.DISPONIBLE); }
                
                e.setSalleId(getCellString(row.getCell(3)));

                if (!e.getNom().isBlank()) equipements.add(e);
            }
            return equipements;
        } catch (IOException e) {
            throw new RuntimeException("Impossible de lire le fichier Excel: " + e.getMessage());
        }
    }

    // Helper

    private static String getCellString(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> DateUtil.isCellDateFormatted(cell)
                    ? cell.getDateCellValue().toString()
                    : String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
}
