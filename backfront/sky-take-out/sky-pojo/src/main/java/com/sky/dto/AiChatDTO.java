package com.sky.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "AI对话请求")
public class AiChatDTO implements Serializable {

    @Schema(description = "用户消息")
    private String message;

    @Schema(description = "对话历史")
    private List<ChatMessage> history;

    @Data
    @Schema(description = "对话消息")
    public static class ChatMessage implements Serializable {
        @Schema(description = "角色: user/assistant")
        private String role;

        @Schema(description = "消息内容")
        private String content;
    }
}
