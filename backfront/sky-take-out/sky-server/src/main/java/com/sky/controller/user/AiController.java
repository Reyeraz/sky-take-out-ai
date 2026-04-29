package com.sky.controller.user;

import com.sky.ai.service.AiService;
import com.sky.context.BaseContext;
import com.sky.dto.AiChatDTO;
import com.sky.result.Result;
import com.sky.vo.AiChatVO;
import com.sky.vo.AiDailyVO;
import com.sky.vo.AiRecommendVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user/ai")
@Tag(name = "C端AI智能接口")
@Slf4j
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/recommend")
    @Operation(summary = "AI智能推荐")
    public Result<List<AiRecommendVO>> recommend() {
        Long userId = BaseContext.getCurrentId();
        log.info("AI智能推荐, userId: {}", userId);
        List<AiRecommendVO> result = aiService.recommend(userId);
        return Result.success(result);
    }

    @GetMapping("/daily")
    @Operation(summary = "今日AI推荐")
    public Result<AiDailyVO> daily() {
        log.info("获取今日AI推荐");
        AiDailyVO result = aiService.getDailyRecommend();
        return Result.success(result);
    }

    @PostMapping("/chat")
    @Operation(summary = "AI点餐助手对话")
    public Result<AiChatVO> chat(@RequestBody AiChatDTO aiChatDTO) {
        Long userId = BaseContext.getCurrentId();
        log.info("AI对话, userId: {}, message: {}", userId, aiChatDTO.getMessage());
        AiChatVO result = aiService.chat(userId, aiChatDTO.getMessage(), aiChatDTO.getHistory());
        return Result.success(result);
    }
}
