package com.sky.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "AI推荐菜品")
public class AiRecommendVO implements Serializable {

    @Schema(description = "菜品ID")
    private Long dishId;

    @Schema(description = "菜品名称")
    private String dishName;

    @Schema(description = "菜品图片")
    private String image;

    @Schema(description = "价格")
    private BigDecimal price;

    @Schema(description = "推荐理由")
    private String reason;

    @Schema(description = "分类名称")
    private String categoryName;
}
