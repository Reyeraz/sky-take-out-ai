package com.sky.ai.service.impl;

import com.alibaba.cloud.ai.graph.NodeOutput;
import com.sky.ai.service.AiService;
import com.sky.dto.AiChatDTO;
import com.sky.vo.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;

@Service
public class AiChatServiceImpl {

    @Autowired
    @Qualifier("aiRecommendServiceImpl")
    private AiService aiService;

    public AiChatVO chat(Long userId, String message, List<AiChatDTO.ChatMessage> history) {
        return aiService.chat(userId, message, history);
    }

    public Flux<NodeOutput> chatStream(Long userId, String message, List<AiChatDTO.ChatMessage> history) {
        return aiService.chatStream(userId, message, history);
    }
}
