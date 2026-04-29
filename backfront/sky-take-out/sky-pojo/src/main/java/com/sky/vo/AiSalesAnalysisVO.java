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
@Schema(description = "AI销售分析报告")
public class AiSalesAnalysisVO implements Serializable {

    @Schema(description = "分析周期")
    private String period;

    @Schema(description = "总结摘要")
    private String summary;

    @Schema(description = "亮点数据")
    private List<String> highlights;

    @Schema(description = "预警信息")
    private List<String> warnings;

    @Schema(description = "优化建议")
    private List<String> suggestions;

    @Schema(description = "趋势描述")
    private String trendDescription;
}
