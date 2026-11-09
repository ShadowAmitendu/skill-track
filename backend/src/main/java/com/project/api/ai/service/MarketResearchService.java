package com.project.api.ai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
public class MarketResearchService {

    private static final Logger log = LoggerFactory.getLogger(MarketResearchService.class);
    private static final Path RESEARCH_DIR = Paths.get("docs", "market-research");

    public MarketResearchService() {
        try {
            if (!Files.exists(RESEARCH_DIR)) {
                Files.createDirectories(RESEARCH_DIR);
            }
        } catch (IOException e) {
            log.warn("Could not initialize market research directory: {}", e.getMessage());
        }
    }

    public List<String> listResearchDocuments() {
        List<String> fileNames = new ArrayList<>();
        if (!Files.exists(RESEARCH_DIR)) return fileNames;

        try (Stream<Path> stream = Files.list(RESEARCH_DIR)) {
            stream.filter(Files::isRegularFile)
                    .map(p -> p.getFileName().toString())
                    .forEach(fileNames::add);
        } catch (IOException e) {
            log.error("Failed to list research documents: {}", e.getMessage());
        }
        return fileNames;
    }

    public String readDocument(String fileName) {
        Path filePath = RESEARCH_DIR.resolve(fileName);
        if (!Files.exists(filePath)) {
            return "Document not found: " + fileName;
        }
        try {
            return Files.readString(filePath);
        } catch (IOException e) {
            return "Failed to read document: " + e.getMessage();
        }
    }

    public void saveMarketResearchDocument(String title, String content) {
        String sanitizedTitle = title.toLowerCase().replaceAll("[^a-z0-9_-]", "_") + ".md";
        Path filePath = RESEARCH_DIR.resolve(sanitizedTitle);
        String fullContent = "# " + title + "\nUpdated: " + LocalDateTime.now() + "\n\n" + content;
        try {
            Files.writeString(filePath, fullContent);
            log.info("Market research document saved: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to save market research document: {}", e.getMessage());
        }
    }
}
