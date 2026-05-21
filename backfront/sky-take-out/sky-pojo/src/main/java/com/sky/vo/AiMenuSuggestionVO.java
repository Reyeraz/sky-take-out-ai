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
@Schema(description = "AI菜单优化建议")
public class AiMenuSuggestionVO implements Serializable {

    @Schema(description = "应推广的菜品名称列表")
    private List<String> promoteList;

    @Schema(description = "建议下架的菜品名称列表")
    private List<String> demoteList;

    @Schema(description = "建议新增的品类方向")
    private List<String> newCategoryIdeas;

    @Schema(description = "总结建议")
    private String summary;
}
