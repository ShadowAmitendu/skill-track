package com.project.api.ai.dto;

import java.time.LocalDateTime;

public class ChatResponseDto {

    private String reply;
    private LocalDateTime timestamp;

    public ChatResponseDto() {
        this.timestamp = LocalDateTime.now();
    }

    public ChatResponseDto(String reply) {
        this.reply = reply;
        this.timestamp = LocalDateTime.now();
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
