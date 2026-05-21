package com.sky.ai.service.impl;

import com.sky.ai.service.AiService;
import com.sky.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiAdminServiceImpl {

    @Autowired
    @Qualifier("aiRecommendServiceImpl")
    private AiService aiService;

    public AiSalesAnalysisVO getSalesAnalysis(Integer days) {
        return aiService.getSalesAnalysis(days);
    }

    public AiMenuSuggestionVO getMenuSuggestion() {
        return aiService.getMenuSuggestion();
    }

    public List<String> generateDishDescription(String name, String categoryName, List<String> ingredients) {
        return aiService.generateDishDescription(name, categoryName, ingredients);
    }
}
