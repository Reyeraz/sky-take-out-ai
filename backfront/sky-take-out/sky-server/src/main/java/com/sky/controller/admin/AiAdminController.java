package com.sky.controller.admin;

import com.sky.ai.service.impl.AiAdminServiceImpl;
import com.sky.dto.AiDishDescriptionDTO;
import com.sky.result.Result;
import com.sky.vo.AiMenuSuggestionVO;
import com.sky.vo.AiSalesAnalysisVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/ai")
@Tag(name = "管理端AI智能接口")
@Slf4j
public class AiAdminController {

    @Autowired
    private AiAdminServiceImpl aiAdminService;

    @GetMapping("/sales-analysis")
    @Operation(summary = "AI销售分析报告")
    public Result<AiSalesAnalysisVO> salesAnalysis(@RequestParam(defaultValue = "7") Integer days) {
        log.info("AI销售分析, days: {}", days);
        AiSalesAnalysisVO result = aiAdminService.getSalesAnalysis(days);
        return Result.success(result);
    }

    @GetMapping("/menu-suggestion")
    @Operation(summary = "AI菜单优化建议")
    public Result<AiMenuSuggestionVO> menuSuggestion() {
        log.info("AI菜单优化建议");
        AiMenuSuggestionVO result = aiAdminService.getMenuSuggestion();
        return Result.success(result);
    }

    @PostMapping("/dish-description")
    @Operation(summary = "AI生成菜品描述")
    public Result<List<String>> dishDescription(@RequestBody AiDishDescriptionDTO dto) {
        log.info("AI生成菜品描述, name: {}", dto.getName());
        List<String> result = aiAdminService.generateDishDescription(
                dto.getName(), dto.getCategoryName(), dto.getIngredients());
        return Result.success(result);
    }
}
