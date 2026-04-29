package com.sky.ai.service;

import com.sky.dto.AiChatDTO;
import com.sky.vo.*;

import java.util.List;

public interface AiService {

    List<AiRecommendVO> recommend(Long userId);

    AiDailyVO getDailyRecommend();

    AiChatVO chat(Long userId, String message, List<AiChatDTO.ChatMessage> history);

    AiSalesAnalysisVO getSalesAnalysis(Integer days);

    AiMenuSuggestionVO getMenuSuggestion();

    List<String> generateDishDescription(String name, String categoryName, List<String> ingredients);
}
