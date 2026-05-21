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
@Schema(description = "今日AI推荐")
public class AiDailyVO implements Serializable {

    @Schema(description = "推荐日期")
    private String date;

    @Schema(description = "推荐标语")
    private String slogan;

    @Schema(description = "推荐菜品列表")
    private List<AiRecommendVO> recommendations;
}
