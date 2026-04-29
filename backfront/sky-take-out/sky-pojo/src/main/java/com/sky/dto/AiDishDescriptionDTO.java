package com.sky.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "AI生成菜品描述请求")
public class AiDishDescriptionDTO implements Serializable {

    @Schema(description = "菜品名称")
    private String name;

    @Schema(description = "分类名称")
    private String categoryName;

    @Schema(description = "食材列表")
    private List<String> ingredients;
}
