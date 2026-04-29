package com.sky.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI对话回复")
public class AiChatVO implements Serializable {

    @Schema(description = "AI回复内容")
    private String reply;

    @Schema(description = "推荐的菜品ID列表")
    private List<Long> suggestedDishIds;

    @Schema(description = "推荐的菜品名称列表")
    private List<String> suggestedDishNames;
}
