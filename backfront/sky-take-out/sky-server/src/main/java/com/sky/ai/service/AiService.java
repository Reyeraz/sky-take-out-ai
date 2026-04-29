package com.sky.ai.service;

import com.sky.dto.AiChatDTO;
import com.sky.vo.*;
import reactor.core.publisher.Flux;

import java.util.List;

public interface AiService {

    List<AiRecommendVO> recommend(Long userId);

    AiDailyVO getDailyRecommend();

    AiChatVO chat(Long userId, String message, List<AiChatDTO.ChatMessage> history);

    Flux<String> chatStream(Long userId, String message, List<AiChatDTO.ChatMessage> history);

    AiChatVO parseChatResponse(String response);

    AiSalesAnalysisVO getSalesAnalysis(Integer days);

    AiMenuSuggestionVO getMenuSuggestion();

    List<String> generateDishDescription(String name, String categoryName, List<String> ingredients);
}
